CREATE TYPE "public"."transaction_kind" AS ENUM('expense', 'income', 'transfer', 'adjustment', 'credit_card_purchase');--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"kind" "transaction_kind" NOT NULL,
	"account_id" uuid NOT NULL,
	"counterparty_account_id" uuid,
	"linked_bill_id" uuid,
	"amount_cents" integer NOT NULL,
	"transaction_date" date NOT NULL,
	"description" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_counterparty_account_id_accounts_id_fk" FOREIGN KEY ("counterparty_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_linked_bill_id_bills_id_fk" FOREIGN KEY ("linked_bill_id") REFERENCES "public"."bills"("id") ON DELETE set null ON UPDATE no action;