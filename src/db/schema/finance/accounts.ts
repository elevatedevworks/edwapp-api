import {
    boolean, pgEnum, text, integer, timestamp, uuid, pgTable, unique
} from "drizzle-orm/pg-core";
import { users } from "../core";

export const accountTypeEnum = pgEnum("account_type", ["checking", "savings", "credit_card", "cash", "other"]);

export const accounts = pgTable("accounts", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    institution: text("institution"),
    currentBalanceCents: integer("current_balance_cents").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    ownerUserId: uuid("owner_user_id").notNull().references(()=> users.id, {onDelete: "cascade"}),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow()
}, (table) => ({
    ownerUserIdNameUnique: unique("accounts_owner_user_id_name_unique").on(
        table.ownerUserId,
        table.name
    )
}))