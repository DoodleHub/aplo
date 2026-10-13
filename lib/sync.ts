/**
 * The outbox: sends journal writes to Supabase one at a time, in order. Each write is saved
 * on the device before it's sent and removed once the server has answered, so writes made
 * offline survive a reload or the app being closed, and are sent when the connection
 * returns. Writes can't overtake each other (an edit never lands before the entry it edits).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { removeOp, saveOp, type WriteOp } from "@/lib/local-db";

type Result = { error: unknown; status: number };

/** What a caller learns about its write: sent, or safely queued on the device for later. */
export type WriteResult = { error: unknown; queued: boolean };

export type NewOp = WriteOp extends infer T ? (T extends WriteOp ? Omit<T, "opId" | "userId"> : never) : never;

export type SyncQueue = {
  /**
   * Queues a write. Resolves once the server has answered, or as soon as the write is
   * waiting offline (`queued: true`). A queued write that the server later rejects is
   * reported to `onLateError` listeners instead.
   */
  run: (op: NewOp) => Promise<WriteResult>;
  /** Resumes writes left in the outbox by an earlier visit. */
  resume: (ops: WriteOp[]) => void;
  /** Number of writes queued or in flight. */
  pending: () => number;
  subscribe: (listener: () => void) => () => void;
  onLateError: (listener: (op: WriteOp, error: unknown) => void) => () => void;
};

const RETRY_DELAY_MS = 3000;

// No connection, an expired session that's being refreshed, or the gateway being briefly
// unreachable: worth waiting and trying again. Anything else is a real answer.
const isTransient = (status: number) => status === 0 || status === 401 || status >= 502;

function waitForConnection() {
  return new Promise<void>((resolve) => {
    const done = () => {
      window.removeEventListener("online", done);
      clearTimeout(timer);
      resolve();
    };
    // `online` is fast but unreliable (it stays true on a captive portal), so also poll.
    const timer = setTimeout(done, navigator.onLine ? RETRY_DELAY_MS : RETRY_DELAY_MS * 10);
    window.addEventListener("online", done);
  });
}

function execute(supabase: SupabaseClient, op: WriteOp): PromiseLike<Result> {
  const table = supabase.from(op.table);
  switch (op.kind) {
    // Upsert, not insert: resending a create whose reply was lost must not fail as a duplicate.
    case "upsert":
      return table.upsert(op.row);
    case "update":
      return table.update(op.patch).eq("id", op.key);
    case "delete":
      return table.delete().eq("id", op.key);
  }
}

type Job = {
  op: WriteOp;
  /** Resolves once the latest version of `op` is in the outbox. */
  saved: Promise<void>;
  settle: Array<(result: WriteResult) => void>;
};

const queued = (job: Job) => job.settle.splice(0).forEach((settle) => settle({ error: null, queued: true }));

export function createSyncQueue(supabase: SupabaseClient, userId: string): SyncQueue {
  const jobs: Job[] = [];
  let draining = false;
  let waiting = false;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const errorListeners = new Set<(op: WriteOp, error: unknown) => void>();

  async function drain() {
    if (draining) return;
    draining = true;
    while (jobs.length) {
      const job = jobs[0];
      await job.saved;
      let result = await execute(supabase, job.op);
      while (isTransient(result.status)) {
        // Let callers carry on: their writes are on the device and will be sent later.
        waiting = true;
        jobs.forEach(queued);
        await waitForConnection();
        result = await execute(supabase, job.op);
      }
      waiting = false;
      jobs.splice(jobs.indexOf(job), 1);
      await job.saved;
      await removeOp(job.op);
      if (job.settle.length) {
        job.settle.forEach((settle) => settle({ error: result.error, queued: false }));
      } else if (result.error) {
        errorListeners.forEach((listener) => listener(job.op, result.error));
      }
      notify();
    }
    draining = false;
  }

  /** Folds an update into the previous write to the same row, if it hasn't been sent yet. */
  function merge(op: NewOp): Job | undefined {
    if (op.kind !== "update") return;
    const last = jobs.at(-1);
    if (!last || (draining && jobs.length === 1)) return;
    const prev = last.op;
    if (prev.table !== op.table) return;
    if (prev.kind === "update" && prev.key === op.key) {
      last.op = { ...prev, patch: { ...prev.patch, ...op.patch } };
      return last;
    }
    if (prev.kind === "upsert" && prev.row.id === op.key) {
      last.op = { ...prev, row: { ...prev.row, ...op.patch } };
      return last;
    }
  }

  return {
    async run(newOp) {
      let job = merge(newOp);
      if (job) {
        const op = job.op;
        job.saved = job.saved.then(() => saveOp(op));
      } else {
        const op = { ...newOp, opId: crypto.randomUUID(), userId } as WriteOp;
        job = { op, saved: saveOp(op), settle: [] };
        jobs.push(job);
      }
      const result = new Promise<WriteResult>((resolve) => job.settle.push(resolve));
      notify();
      void drain();
      await job.saved;
      if (waiting) queued(job);
      return result;
    },
    resume(ops) {
      const known = new Set(jobs.map((job) => job.op.opId));
      const resumed = ops
        .filter((op) => !known.has(op.opId))
        .map((op) => ({ op, saved: Promise.resolve(), settle: [] }));
      // Older than anything queued this visit, so they go first (after a write already in flight).
      jobs.splice(draining ? 1 : 0, 0, ...resumed);
      notify();
      void drain();
    },
    pending: () => jobs.length,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onLateError(listener) {
      errorListeners.add(listener);
      return () => errorListeners.delete(listener);
    },
  };
}
