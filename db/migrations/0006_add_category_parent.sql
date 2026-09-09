ALTER TABLE "categories" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
UPDATE "quick_taps" SET "label" = 'Miscellaneous' WHERE "label" = 'Online Shopping';--> statement-breakpoint
UPDATE "categories" SET
  "name" = 'Miscellaneous',
  "sort_order" = (
    SELECT COALESCE(MAX(c2."sort_order"), 0) + 1
    FROM "categories" c2 WHERE c2."user_id" = "categories"."user_id"
  )
  WHERE "name" = 'Online Shopping';--> statement-breakpoint
UPDATE "quick_taps" SET "label" = 'Clothing' WHERE "label" = 'Clothes';--> statement-breakpoint
UPDATE "categories" SET "name" = 'Clothing' WHERE "name" = 'Clothes';--> statement-breakpoint
UPDATE "categories" AS c SET "parent_id" = f."id"
  FROM "categories" AS f
  WHERE f."name" = 'Food' AND f."user_id" = c."user_id"
    AND c."name" IN ('Groceries', 'Canteen');--> statement-breakpoint
UPDATE "categories" SET "sort_order" = 1 WHERE "name" = 'Groceries';--> statement-breakpoint
UPDATE "categories" SET "sort_order" = 2 WHERE "name" = 'Canteen';--> statement-breakpoint
DELETE FROM "quick_taps" WHERE "category_id" IN (
  SELECT "id" FROM "categories" WHERE "name" IN ('Groceries', 'Canteen', 'Subscriptions')
);--> statement-breakpoint
INSERT INTO "categories" ("user_id", "name", "emoji", "color", "sort_order", "parent_id")
SELECT p."user_id", x."name", p."emoji", p."color", x."ord", p."id"
FROM "categories" p
JOIN (VALUES
  ('Food', 'Food delivery', 3),
  ('Clothing', 'Clothes', 1),
  ('Clothing', 'Shoes', 2),
  ('Sports & Leisure', 'Equipment', 1),
  ('Sports & Leisure', 'Match fee', 2),
  ('Sports & Leisure', 'Supplements', 3),
  ('Transportation', 'Ride-hailing', 1),
  ('Transportation', 'Commute', 2),
  ('Transportation', 'Gas', 3)
) AS x("parent", "name", "ord") ON x."parent" = p."name"
WHERE p."parent_id" IS NULL
ON CONFLICT DO NOTHING;
