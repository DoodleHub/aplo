/**
 * On-device storage for the journal (IndexedDB): an outbox of writes that haven't reached
 * Supabase yet, and a snapshot of the last known journal so it can be read offline.
 * Everything here is best-effort — if IndexedDB is unavailable (e.g. some private
 * windows), reads come back empty and writes are skipped.
 */
import type { Category, Entry } from "@/lib/types";

export type Table = "entries" | "categories" | "profiles";

export type WriteOp = { opId: string; userId: string; table: Table } & (
  | { kind: "upsert"; row: Record<string, unknown> & { id: string } }
  | { kind: "update"; key: string; patch: Record<string, unknown> }
  | { kind: "delete"; key: string }
);

export type Snapshot = {
  userId: string;
  /** Server time of the newest server data this snapshot includes. */
  basedOn: string;
  categories: Category[];
  entries: Entry[];
};

const DB_NAME = "aplo";
const OUTBOX = "outbox";
const SNAPSHOTS = "snapshots";

let dbPromise: Promise<IDBDatabase | null> | undefined;

function openDb() {
  dbPromise ??= new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        // Auto-incrementing key keeps the outbox in the order writes were made.
        db.createObjectStore(OUTBOX, { keyPath: "seq", autoIncrement: true }).createIndex("userId", "userId");
        db.createObjectStore(SNAPSHOTS, { keyPath: "userId" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

async function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return undefined;
  return new Promise((resolve) => {
    const transaction = db.transaction(store, mode);
    const request = run(transaction.objectStore(store));
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = transaction.onabort = () => resolve(undefined);
  });
}

type StoredOp = WriteOp & { seq?: number };

export async function loadOutbox(userId: string): Promise<WriteOp[]> {
  const ops = await tx<StoredOp[]>(OUTBOX, "readonly", (s) => s.index("userId").getAll(userId));
  return (ops ?? []).sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

/** Adds or replaces an op (matched by opId, keeping its original position). */
export async function saveOp(op: WriteOp) {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const transaction = db.transaction(OUTBOX, "readwrite");
    const store = transaction.objectStore(OUTBOX);
    const cursor = store.index("userId").openCursor(op.userId);
    cursor.onsuccess = () => {
      const current = cursor.result;
      if (!current) {
        store.add(op);
      } else if ((current.value as StoredOp).opId === op.opId) {
        current.update({ ...op, seq: (current.value as StoredOp).seq });
      } else {
        current.continue();
      }
    };
    transaction.oncomplete = transaction.onerror = transaction.onabort = () => resolve();
  });
}

export async function removeOp(op: WriteOp) {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const transaction = db.transaction(OUTBOX, "readwrite");
    const cursor = transaction.objectStore(OUTBOX).index("userId").openCursor(op.userId);
    cursor.onsuccess = () => {
      const current = cursor.result;
      if (!current) return;
      if ((current.value as StoredOp).opId === op.opId) current.delete();
      else current.continue();
    };
    transaction.oncomplete = transaction.onerror = transaction.onabort = () => resolve();
  });
}

export async function loadSnapshot(userId: string) {
  return tx<Snapshot | undefined>(SNAPSHOTS, "readonly", (s) => s.get(userId));
}

export async function saveSnapshot(snapshot: Snapshot) {
  await tx(SNAPSHOTS, "readwrite", (s) => s.put(snapshot));
}

/**
 * Removes the readable copy of a user's journal from this device: the snapshot and the
 * service worker's cached pages. Unsynced writes in the outbox are kept so they can still
 * be sent next time the same person signs in.
 */
export async function clearDeviceCopy(userId: string) {
  await tx(SNAPSHOTS, "readwrite", (s) => s.delete(userId));
  if ("caches" in window) {
    await Promise.all([caches.delete("aplo-pages"), caches.delete("aplo-rsc")]);
  }
}

/** Applies queued writes on top of server data, so unsynced changes show after a reload. */
export function applyOps(
  data: { categories: Category[]; entries: Entry[] },
  ops: WriteOp[],
): { categories: Category[]; entries: Entry[] } {
  let { categories, entries } = data;
  for (const op of ops) {
    if (op.table === "profiles") {
      continue;
    } else if (op.table === "entries") {
      entries = applyOp(entries, op);
    } else {
      categories = applyOp(categories, op);
      if (op.kind === "delete") {
        entries = entries.map((e) => (e.category_id === op.key ? { ...e, category_id: null } : e));
      }
    }
  }
  return { categories, entries };
}

function applyOp<T extends { id: string }>(rows: T[], op: WriteOp): T[] {
  switch (op.kind) {
    case "upsert":
      return [...rows.filter((r) => r.id !== op.row.id), op.row as unknown as T];
    case "update":
      return rows.map((r) => (r.id === op.key ? { ...r, ...op.patch } : r));
    case "delete":
      return rows.filter((r) => r.id !== op.key);
  }
}
