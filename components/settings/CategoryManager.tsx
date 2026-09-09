"use client";

import { useState, useTransition } from "react";
import { deleteCategory, updateCategory } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DEFAULT_EMOJI, EmojiPicker } from "@/components/ui/EmojiPicker";
import { Sheet } from "@/components/ui/Sheet";
import { SWATCH_COUNT } from "@/db/defaults";

export type CategoryRow = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  parentId: string | null;
};

const SWATCHES = Array.from({ length: SWATCH_COUNT }, (_, i) => `swatch-${i + 1}`);

/**
 * Renaming a category rewrites history: everything already filed under it
 * reads the new name. That is the point of editing rather than replacing, and
 * it is why deleting is the destructive one — it takes its subgroups with it.
 */
export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<CategoryRow | null>(null);

  const parents = categories.filter((c) => c.parentId === null);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  return (
    <>
      <Card>
        <ul className="divide-y divide-ink-600">
          {parents.map((parent) => (
            <li key={parent.id} className="py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => setEditing(parent)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--color-${parent.color})` }}
                />
                <span className="text-lg">{parent.emoji}</span>
                <span className="flex-1 truncate text-sm text-sky-100">
                  {parent.name}
                </span>
              </button>

              {childrenOf(parent.id).length > 0 && (
                <div className="mt-2 ml-9 flex flex-wrap gap-2">
                  {childrenOf(parent.id).map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setEditing(child)}
                      className="rounded-full bg-ink-700 px-3 py-1.5 text-xs text-sky-200"
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <CategorySheet
        category={editing}
        onClose={() => setEditing(null)}
        onSave={(row) => startTransition(() => updateCategory(row))}
        onDelete={(id) => startTransition(() => deleteCategory(id))}
      />
    </>
  );
}

type SheetProps = {
  category: CategoryRow | null;
  onClose: () => void;
  onSave: (row: { id: string; name: string; emoji: string; color: string }) => void;
  onDelete: (id: string) => void;
};

function CategorySheet({ category, onClose, onSave, onDelete }: SheetProps) {
  return (
    <Sheet open={category !== null} onClose={onClose} title="Edit category">
      {category && (
        <CategoryForm
          key={category.id}
          category={category}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </Sheet>
  );
}

function CategoryForm({
  category,
  onClose,
  onSave,
  onDelete,
}: Omit<SheetProps, "category"> & { category: CategoryRow }) {
  const [name, setName] = useState(category.name);
  const [emoji, setEmoji] = useState(category.emoji || DEFAULT_EMOJI);
  const [color, setColor] = useState(category.color);
  const [confirming, setConfirming] = useState(false);

  const isSubgroup = category.parentId !== null;

  return (
    <div className="flex flex-col gap-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={30}
        aria-label="Name"
        className="min-h-11 rounded-2xl bg-ink-700 px-4 text-sm text-sky-100 focus:outline-none"
      />

      <EmojiPicker value={emoji} onChange={setEmoji} />

      {/* A subgroup follows its parent's swatch, so there is nothing to choose. */}
      {!isSubgroup && (
        <div>
          <p className="mb-2 text-xs tracking-[0.15em] text-sky-300 uppercase">Colour</p>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={swatch}
                aria-pressed={swatch === color}
                onClick={() => setColor(swatch)}
                className={`size-9 shrink-0 rounded-full ${
                  swatch === color ? "ring-2 ring-paper ring-offset-2 ring-offset-ink-800" : ""
                }`}
                style={{ backgroundColor: `var(--color-${swatch})` }}
              />
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={() => {
          onSave({ id: category.id, name: name.trim(), emoji, color });
          onClose();
        }}
        className={name.trim() ? "" : "pointer-events-none opacity-40"}
      >
        Save
      </Button>

      {confirming ? (
        <div className="rounded-2xl border border-umber-500 p-4">
          <p className="text-sm text-gold-300">
            Delete {category.name}?
            {!isSubgroup && " Its subgroups go with it."}
          </p>
          <p className="mt-1 text-xs text-umber-300">
            Anything already logged against it stops the delete, so your history
            is never quietly rewritten.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onDelete(category.id);
                onClose();
              }}
              className="min-h-11 flex-1 rounded-2xl bg-umber-500 text-sm font-semibold text-gold-300"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-11 flex-1 rounded-2xl bg-ink-700 text-sm text-sky-200"
            >
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="min-h-11 text-sm font-semibold text-umber-300"
        >
          Delete category
        </button>
      )}
    </div>
  );
}
