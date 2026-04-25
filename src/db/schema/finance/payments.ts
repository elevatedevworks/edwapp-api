import { pgTable, uuid, integer, date, pgEnum, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "../core/users.js";
import { accounts } from "./accounts.js";
import { bills } from "./bills";

export const paymentDirectionEnum = pgEnum("direction", ["outflow", "inflow"]);
export const paymentMethodEnum = pgEnum("method", ["bank_transfer", "card", "cash", "check", "autopay", "other"]);

export const payments = pgTable("payments", {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, {onDelete: "cascade"}),
    accountId: uuid("account_id").references(() => accounts.id, {onDelete: "cascade"}),
    billId: uuid("bill_id").references(() => bills.id, {onDelete: "set null"}),
    amountCents: integer("amount_cents").notNull(),
    paymentDate: date("payment_date").notNull(),
    direction: paymentDirectionEnum("direction").notNull().default("outflow"),
    method: paymentMethodEnum("method").notNull().default("other"),
    reference: text("reference"),
    notes: text("notes"),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow()
})