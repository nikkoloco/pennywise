-- Supplies joins the tiles, sitting just before Miscellaneous, which stays last.
INSERT INTO "categories" ("user_id", "name", "emoji", "color", "sort_order")
SELECT
  u."id",
  'Supplies',
  '🧻',
  'swatch-3',
  COALESCE((SELECT MAX(c."sort_order") FROM "categories" c WHERE c."user_id" = u."id"), 0) + 1
FROM "users" u
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "quick_taps" ("user_id", "category_id", "label", "emoji", "amount_minor", "sort_order")
SELECT
  c."user_id",
  c."id",
  c."name",
  c."emoji",
  NULL,
  COALESCE((SELECT MAX(q."sort_order") FROM "quick_taps" q WHERE q."user_id" = c."user_id"), -1) + 1
FROM "categories" c
WHERE c."name" = 'Supplies'
  AND NOT EXISTS (SELECT 1 FROM "quick_taps" q WHERE q."category_id" = c."id");
--> statement-breakpoint
INSERT INTO "categories" ("user_id", "name", "emoji", "color", "sort_order", "parent_id")
SELECT p."user_id", x."name", p."emoji", p."color", x."ord", p."id"
FROM "categories" p
JOIN (VALUES
  ('Household supplies', 1),
  ('Appliances', 2),
  ('Furniture', 3)
) AS x("name", "ord") ON TRUE
WHERE p."name" = 'Supplies' AND p."parent_id" IS NULL
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- A flower never read as perfume. Only replaced where it was still the default,
-- so a deliberate choice is left alone.
UPDATE "categories" SET "emoji" = '🫧'
  WHERE "name" = 'Perfume' AND "emoji" = '🌸';
--> statement-breakpoint
UPDATE "quick_taps" SET "emoji" = '🫧'
  WHERE "label" = 'Perfume' AND "emoji" = '🌸';
