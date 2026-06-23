CREATE TYPE "public"."driving_session_status" AS ENUM('active', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."gig_provider" AS ENUM('uber', 'doordash', 'lyft', 'instacart', 'mixed', 'other');--> statement-breakpoint
CREATE TABLE "gig_driving_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"provider" "gig_provider" DEFAULT 'uber' NOT NULL,
	"status" "driving_session_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"start_odometer_miles" numeric(10, 1) NOT NULL,
	"end_odometer_miles" numeric(10, 1),
	"total_miles" numeric(10, 1),
	"notes" text,
	"start_location_label" varchar(150),
	"end_location_label" varchar(150),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gig_driving_sessions" ADD CONSTRAINT "gig_driving_sessions_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gig_driving_sessions_owner_user_id" ON "gig_driving_sessions" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "idx_gig_driving_sessions_started_at" ON "gig_driving_sessions" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_gig_driving_sessions_provider" ON "gig_driving_sessions" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_gig_driving_sessions_status" ON "gig_driving_sessions" USING btree ("status");