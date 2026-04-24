import {
    boolean, pgEnum, text, integer, timestamp, uuid, pgTable, unique, date
} from "drizzle-orm/pg-core";
import { users } from "../core/users.js";
import { accounts } from "./accounts.js";

export const billFrequencyEnum = pgEnum("bill_frequency", ["one_time", "weekly", "monthly", "quarterly", "annual"]);
export const billStatusEnum = pgEnum("bill_status", ["active", "paused", "paid", "archived"])

export const bills = pgTable("bills", {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id").notNull().references(()=> users.id, {onDelete: "cascade"}),
    accountId: uuid("account_id").references(() => accounts.id, {onDelete: "set null"}),
    name: text("name").notNull(),
    vendor: text("vendor"),
    amountDueCents: integer("amount_due_cents").notNull(),
    dueDate: date("due_date"),
    dueDayOfMonth: integer("due_day_of_month"),
    frequency: billFrequencyEnum("frequency").notNull().default("monthly"),
    status: billStatusEnum("status").notNull().default('active'),
    autopay: boolean("autopay").notNull().default(false),
    notes: text("notes"), 
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow()
}, (table) => ({
    ownerUserIdNameUnique: unique("bills_owner_user_id_name_unique").on(
        table.ownerUserId,
        table.name
    )
}))