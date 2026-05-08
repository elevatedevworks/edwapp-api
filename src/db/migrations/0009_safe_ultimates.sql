CREATE TYPE "public"."bill_instance_status" AS ENUM('unpaid', 'partial', 'paid', 'overdue');--> statement-breakpoint
CREATE TABLE "bill_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"bill_id" uuid NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"due_date" date NOT NULL,
	"amount_due_cents" integer NOT NULL,
	"amount_paid_cents" integer DEFAULT 0 NOT NULL,
	"status" "bill_instance_status" DEFAULT 'unpaid' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bill_instances_bill_id_period_unique" UNIQUE("bill_id","period_year","period_month")
);
--> statement-breakpoint
ALTER TABLE "bill_instances" ADD CONSTRAINT "bill_instances_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_instances" ADD CONSTRAINT "bill_instances_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;