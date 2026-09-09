-- Miscellaneous is the bucket for whatever fits nowhere else, so it belongs at
-- the end of the list. Adding Supplies pushed past it; this puts it back.
UPDATE "categories" SET "sort_order" = (
  SELECT COALESCE(MAX(c2."sort_order"), 0) + 1
  FROM "categories" c2
  WHERE c2."user_id" = "categories"."user_id" AND c2."parent_id" IS NULL
)
WHERE "name" = 'Miscellaneous' AND "parent_id" IS NULL;
