import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  date,
} from "drizzle-orm/pg-core";
import { users } from "../core/index.js";
import { bills } from "./bills.js";

export const billInstanceStatusEnum = pgEnum("bill_instance_status", [
  "unpaid",
  "partial",
  "paid",
  "overdue",
]);

export const billInstances = pgTable(
  "bill_instances",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    billId: uuid("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),

    periodYear: integer("period_year").notNull(),
    periodMonth: integer("period_month").notNull(),

    dueDate: date("due_date").notNull(),

    amountDueCents: integer("amount_due_cents").notNull(),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),

    status: billInstanceStatusEnum("status").notNull().default("unpaid"),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    billPeriodUnique: unique("bill_instances_bill_id_period_unique").on(
      table.billId,
      table.periodYear,
      table.periodMonth
    ),
  })
);