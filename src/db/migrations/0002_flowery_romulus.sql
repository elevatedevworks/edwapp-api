CREATE TYPE "public"."bill_frequency" AS ENUM('one_time', 'weekly', 'monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."bill_status" AS ENUM('active', 'paused', 'paid', 'archived');--> statement-breakpoint
CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"account_id" uuid,
	"name" text NOT NULL,
	"vendor" text,
	"amount_due_cents" integer DEFAULT 0 NOT NULL,
	"due_date" date,
	"due_day_of_month" integer,
	"frequency" "bill_frequency" DEFAULT 'monthly' NOT NULL,
	"status" "bill_status" DEFAULT 'active' NOT NULL,
	"autopay" boolean DEFAULT false NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bills_owner_user_id_name_unique" UNIQUE("owner_user_id","name")
);
--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;