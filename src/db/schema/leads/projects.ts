import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  date,
} from "drizzle-orm/pg-core";
import { clients } from "./clients.js";
import { users } from "../core/users.js";

export const projectTypeEnum = pgEnum("project_type", [
  "website",
  "seo",
  "maintenance",
  "app",
  "internal",
  "other",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "planned",
  "active",
  "on_hold",
  "completed",
  "archived",
]);

export const projectPriorityEnum = pgEnum("project_priority", [
  "low",
  "medium",
  "high",
]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  projectType: projectTypeEnum("project_type").notNull().default("internal"),
  status: projectStatusEnum("status").notNull().default("planned"),
  priority: projectPriorityEnum("priority").notNull().default("medium"),
  startDate: date("start_date"),
  targetDate: date("target_date"),
  completedDate: date("completed_date"),
  ownerUserId: uuid("owner_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});