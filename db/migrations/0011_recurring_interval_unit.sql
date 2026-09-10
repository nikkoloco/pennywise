CREATE TYPE "public"."recurring_unit" AS ENUM('week', 'month');--> statement-breakpoint
ALTER TABLE "recurring" ALTER COLUMN "cutoff" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring" ADD COLUMN "every" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring" ADD COLUMN "unit" "recurring_unit" DEFAULT 'month' NOT NULL;--> statement-breakpoint
-- Existing schedules were all counted in months, so the new interval is a copy.
UPDATE "recurring" SET "every" = "every_months";