"use client";

import { useState, type ReactNode } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { Menu } from "@/components/ui/menu";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { HeartIcon, MoreIcon, PencilIcon, TrashIcon } from "@/components/icons";

export function InteractiveDemos() {
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const [open, setOpen] = useState(false);
  const toast = useToast();

  return (
    <>
      <Row label="Segmented">
        <Segmented
          label="Demo filter"
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: "All entries" },
            { value: "favorites", label: "Favorites", icon: <HeartIcon size={16} /> },
          ]}
        />
      </Row>
      <Row label="Fields">
        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
          <Field label="Email">{(p) => <Input {...p} placeholder="you@example.com" />}</Field>
          <Field label="Password">{(p) => <PasswordInput {...p} placeholder="Your password" />}</Field>
          <Field label="With error" error="Please enter a valid email.">
            {(p) => <Input {...p} defaultValue="hello@" />}
          </Field>
        </div>
      </Row>
      <Row label="Overlays">
        <Menu
          align="start"
          items={[
            { label: "Edit corner", icon: <PencilIcon size={17} />, onSelect: () => {} },
            { label: "Delete corner", icon: <TrashIcon size={17} />, tone: "danger", onSelect: () => {} },
          ]}
          trigger={(props) => (
            <IconButton label="Open menu" {...props}>
              <MoreIcon size={20} />
            </IconButton>
          )}
        />
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open dialog
        </Button>
        <Button variant="outline" onClick={() => toast.show("Thought deleted.", { label: "Undo", onClick: () => {} })}>
          Show toast
        </Button>
        <Dialog open={open} onClose={() => setOpen(false)} title="A new little corner" description="A home for a certain kind of thought.">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Create corner</Button>
          </div>
        </Dialog>
      </Row>
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <span className="w-28 shrink-0 font-mono text-xs text-subtle">{label}</span>
      <div className="flex flex-1 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
