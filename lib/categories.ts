import type { CategoryOption } from "@/components/keypad/LogSheet";

type Row = { id: string; name: string; emoji: string; parentId: string | null };

/**
 * Top-level categories with their subgroups hung off them, as the keypad
 * offers them: a group is picked first, a subgroup only once it has been.
 */
export function categoryGroups(categories: Row[]): CategoryOption[] {
  return categories
    .filter((c) => c.parentId === null)
    .map((parent) => ({
      id: parent.id,
      name: parent.name,
      emoji: parent.emoji,
      children: categories
        .filter((c) => c.parentId === parent.id)
        .map((child) => ({ id: child.id, name: child.name })),
    }));
}
