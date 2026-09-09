ALTER TABLE "events" ADD COLUMN "cutoff" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring" ADD COLUMN "pay_on_day" integer;--> statement-breakpoint
ALTER TABLE "upcoming" ADD COLUMN "cutoff" integer DEFAULT 1 NOT NULL;