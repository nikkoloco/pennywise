CREATE TABLE "api_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" integer NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_attempts" ADD CONSTRAINT "api_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;