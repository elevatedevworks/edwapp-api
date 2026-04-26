import { pgEnum, pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import {users} from "../core/index.js";
import { bills } from "./bills.js";

export const reminderStatusEnum = pgEnum("reminder_status", ["pending", "sent", "dismissed"]);

export const reminderModeEnum = pgEnum("reminder_mode", ["absolute", "bill_offset"]);

export const reminders = pgTable("reminders", {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, {onDelete: "cascade"}),
    billId: uuid("bill_id").references(() => bills.id, {onDelete: "set null"}),
    title: text("title").notNull(),
    mode: reminderModeEnum("mode").notNull().default("absolute"),
    remindAt: timestamp("remind_at", {withTimezone: true, mode:"string"}),
    offsetDays: integer("offset_days"),
    status: reminderStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).notNull().defaultNow()
});