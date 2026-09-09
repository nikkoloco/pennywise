ALTER TABLE "events" RENAME COLUMN "event_date" TO "event_month";--> statement-breakpoint
DROP INDEX "events_user_date_idx";--> statement-breakpoint
UPDATE "events" SET "event_month" = date_trunc('month', "event_month")::date;--> statement-breakpoint
CREATE INDEX "events_user_month_idx" ON "events" USING btree ("user_id","event_month");