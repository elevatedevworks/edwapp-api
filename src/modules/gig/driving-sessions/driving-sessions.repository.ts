import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import { gigDrivingSessions } from "../../../db/schema/index.js";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import type {
	GigDrivingSessionsQuery,
	CreateGigDrivingSessionDbRecord,
	UpdateGigDrivingSessionDbRecord,
} from "./driving-sessions.types.js";

type DbClient = NodePgDatabase<typeof schema>;

export class DrivingSessionsRepository {
	constructor(private readonly orm: DbClient) {}

	async findAllForUser(
		ownerUserId: string,
		filters: GigDrivingSessionsQuery = {},
	) {
		const conditions = [eq(gigDrivingSessions.ownerUserId, ownerUserId)];

		if (filters.provider) {
			conditions.push(eq(gigDrivingSessions.provider, filters.provider));
		}

		if (filters.status) {
			conditions.push(eq(gigDrivingSessions.status, filters.status));
		}

		if (filters.startDate) {
			conditions.push(
				gte(gigDrivingSessions.startedAt, filters.startDate),
			);
		}

		if (filters.endDate) {
			conditions.push(lte(gigDrivingSessions.startedAt, filters.endDate));
		}

		return this.orm
			.select()
			.from(gigDrivingSessions)
			.where(and(...conditions))
			.orderBy(desc(gigDrivingSessions.startedAt));
	}

	async findByIdForUser(id: string, ownerUserId: string) {
		const results = await this.orm
			.select()
			.from(gigDrivingSessions)
			.where(
				and(
					eq(gigDrivingSessions.id, id),
					eq(gigDrivingSessions.ownerUserId, ownerUserId),
				),
			)
			.limit(1);

		return results[0] ?? null;
	}

	async findActiveForUser(ownerUserId: string) {
		const results = await this.orm
			.select()
			.from(gigDrivingSessions)
			.where(
				and(
					eq(gigDrivingSessions.ownerUserId, ownerUserId),
					eq(gigDrivingSessions.status, "active"),
				),
			)
			.orderBy(desc(gigDrivingSessions.startedAt))
			.limit(1);

		return results[0] ?? null;
	}

	async create(data: CreateGigDrivingSessionDbRecord) {
		const results = await this.orm
			.insert(gigDrivingSessions)
			.values(data)
			.returning();

		const session = results[0];

		if (!session) {
			throw new Error("Gig driving session create failed");
		}

		return session;
	}

	async updateForUser(
		id: string,
		ownerUserId: string,
		data: UpdateGigDrivingSessionDbRecord,
	) {
		const results = await this.orm
			.update(gigDrivingSessions)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(gigDrivingSessions.id, id),
					eq(gigDrivingSessions.ownerUserId, ownerUserId),
				),
			)
			.returning();

		return results[0] ?? null;
	}

	async deleteForUser(id: string, ownerUserId: string) {
		const results = await this.orm
			.delete(gigDrivingSessions)
			.where(
				and(
					eq(gigDrivingSessions.id, id),
					eq(gigDrivingSessions.ownerUserId, ownerUserId),
				),
			)
			.returning();

		return results[0] ?? null;
	}
}
