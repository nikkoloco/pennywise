ALTER TABLE "expenses" ADD COLUMN "owed_to" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "due_on" date;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "settled_at" timestamp with time zone;