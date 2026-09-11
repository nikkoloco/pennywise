CREATE TYPE "public"."pay_cadence" AS ENUM('monthly', 'twice_a_month', 'weekly');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pay_cadence" "pay_cadence" DEFAULT 'twice_a_month' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "paydays" integer[] DEFAULT '{10,25}' NOT NULL;