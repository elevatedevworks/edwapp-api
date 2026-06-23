import {
	index,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "../../../db/schema";

export const gigProviderEnum = pgEnum("gig_provider", [
	"uber",
	"doordash",
	"lyft",
	"instacart",
	"mixed",
	"other",
]);

export const drivingSessionStatusEnum = pgEnum("driving_session_status", [
	"active",
	"completed",
	"cancelled",
]);

export const gigDrivingSessions = pgTable(
	"gig_driving_sessions",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		ownerUserId: uuid("owner_user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		provider: gigProviderEnum("provider").default("uber").notNull(),

		status: drivingSessionStatusEnum("status").default("active").notNull(),

		startedAt: timestamp("started_at", {
			withTimezone: true,
		}).notNull(),

		endedAt: timestamp("ended_at", {
			withTimezone: true,
		}),

		startOdometerMiles: numeric("start_odometer_miles", {
			precision: 10,
			scale: 1,
		}).notNull(),

		endOdometerMiles: numeric("end_odometer_miles", {
			precision: 10,
			scale: 1,
		}),

		totalMiles: numeric("total_miles", {
			precision: 10,
			scale: 1,
		}),

		notes: text("notes"),

		startLocationLabel: varchar("start_location_label", { length: 150 }),
		endLocationLabel: varchar("end_location_label", { length: 150 }),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		ownerUserIdIdx: index("idx_gig_driving_sessions_owner_user_id").on(
			table.ownerUserId,
		),
		startedAtIdx: index("idx_gig_driving_sessions_started_at").on(
			table.startedAt,
		),
		providerIdx: index("idx_gig_driving_sessions_provider").on(
			table.provider,
		),
		statusIdx: index("idx_gig_driving_sessions_status").on(table.status),
	}),
);
