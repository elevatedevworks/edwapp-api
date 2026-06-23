// src/modules/gig/driving-sessions/driving-sessions.types.ts

import type { z } from "zod";

import type {
	gigDrivingSessions,
	gigProviderEnum,
	drivingSessionStatusEnum,
} from "../../../db/schema/index.js";

import type {
	endGigDrivingSessionSchema,
	gigDrivingSessionIdSchema,
	gigDrivingSessionsQuerySchema,
	startGigDrivingSessionSchema,
	updateGigDrivingSessionSchema,
} from "./driving-sessions.schemas.js";

export type GigProvider = (typeof gigProviderEnum.enumValues)[number];

export type GigDrivingSessionStatus =
	(typeof drivingSessionStatusEnum.enumValues)[number];

export type GigDrivingSessionIdParams = z.infer<
	typeof gigDrivingSessionIdSchema
>;

export type StartGigDrivingSessionInput = z.infer<
	typeof startGigDrivingSessionSchema
>;

export type EndGigDrivingSessionInput = z.infer<
	typeof endGigDrivingSessionSchema
>;

export type UpdateGigDrivingSessionInput = z.infer<
	typeof updateGigDrivingSessionSchema
>;

export type GigDrivingSessionsQuery = z.infer<
	typeof gigDrivingSessionsQuerySchema
>;

export type GigDrivingSession = typeof gigDrivingSessions.$inferSelect;

export type CreateGigDrivingSessionDbRecord =
	typeof gigDrivingSessions.$inferInsert;

export type UpdateGigDrivingSessionDbRecord = Partial<
	Omit<
		CreateGigDrivingSessionDbRecord,
		"id" | "ownerUserId" | "createdAt" | "updatedAt"
	>
>;
