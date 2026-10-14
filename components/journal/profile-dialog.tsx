"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { useJournal } from "./store";

const PROFILE_EMOJIS = [
  "🌿", "🌙", "🍃", "🌷", "☁️", "🐚", "🦊", "🐢",
  "🌻", "🍄", "🕊️", "🐝", "🦋", "🐌", "🌸", "⭐",
];

export function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="How you appear"
      description="Shown next to the thoughts you share. Your email always stays private."
    >
      {open && <ProfileForm onDone={onClose} />}
    </Dialog>
  );
}

function ProfileForm({ onDone }: { onDone: () => void }) {
  const { profile, updateProfile } = useJournal();
  const [name, setName] = useState(profile.display_name);
  const [emoji, setEmoji] = useState(profile.emoji);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Pick a name, even a made-up one.");
    setSaving(true);
    const ok = await updateProfile({ display_name: name, emoji });
    setSaving(false);
    if (ok) onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* live preview */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-sage-50 p-4">
        <Avatar emoji={emoji} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{name.trim() || "Your pen name"}</p>
          <p className="text-xs text-subtle">just now</p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-name" className="text-sm font-semibold text-ink">
          Pen name
        </label>
        <Input
          id="profile-name"
          autoFocus
          maxLength={40}
          placeholder="e.g. Quiet Fern"
          value={name}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
        />
        {error && <p className="animate-fade-in text-sm text-danger">{error}</p>}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Avatar</legend>
        <div className="grid grid-cols-8 gap-1.5">
          {PROFILE_EMOJIS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setEmoji(option)}
              aria-label={`Use ${option}`}
              aria-pressed={emoji === option}
              className={cn(
                "flex aspect-square items-center justify-center rounded-full text-lg transition-[transform,background-color,box-shadow] duration-200 ease-soft will-change-transform",
                emoji === option ? "scale-105 bg-sage-200 ring-2 ring-sage-400" : "hover:scale-110 hover:bg-sage-50",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

const AVATAR_SIZES = {
  sm: "h-8 w-8 text-base",
  md: "h-9 w-9 text-lg",
  lg: "h-11 w-11 text-xl",
};

export function Avatar({
  emoji,
  size = "md",
  className,
}: {
  emoji: string;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-avatar/70 leading-none",
        AVATAR_SIZES[size],
        className,
      )}
    >
      {emoji}
    </span>
  );
}
