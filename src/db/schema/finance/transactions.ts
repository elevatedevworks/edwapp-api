import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  date,
} from "drizzle-orm/pg-core";
import { users } from "../core/index.js";
import { accounts } from "./accounts.js";
import { bills } from "./bills.js";

export const transactionKindEnum = pgEnum("transaction_kind", [
  "expense",
  "income",
  "transfer",
  "adjustment",
  "credit_card_purchase",
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),

  ownerUserId: uuid("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  kind: transactionKindEnum("kind").notNull(),

  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),

  counterpartyAccountId: uuid("counterparty_account_id").references(
    () => accounts.id,
    { onDelete: "set null" }
  ),

  linkedBillId: uuid("linked_bill_id").references(() => bills.id, {
    onDelete: "set null",
  }),

  amountCents: integer("amount_cents").notNull(),
  transactionDate: date("transaction_date").notNull(),

  description: text("description").notNull(),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});