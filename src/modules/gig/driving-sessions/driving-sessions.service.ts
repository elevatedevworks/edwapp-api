import type * as schema from "../../../db/schema/index.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DrivingSessionsRepository } from "./driving-sessions.repository.js";
import type {
	CreateGigDrivingSessionDbRecord,
	EndGigDrivingSessionInput,
	GigDrivingSessionsQuery,
	StartGigDrivingSessionInput,
	UpdateGigDrivingSessionDbRecord,
	UpdateGigDrivingSessionInput,
} from "./driving-sessions.types.js";

type DbClient = NodePgDatabase<typeof schema>;

export class DrivingSessionsService {
	private readonly orm: DbClient;
	private readonly repository: DrivingSessionsRepository;

	constructor(orm: DbClient) {
		this.orm = orm;
		this.repository = new DrivingSessionsRepository(orm);
	}

	private toMileageString(value: number | null | undefined) {
		return value == null ? null : value.toFixed(1);
	}

	private toRequiredMileageString(value: number) {
		return value.toFixed(1);
	}

	private fromNumericString(value: string | number | null | undefined) {
		if (value == null) return null;

		const numberValue = Number(value);

		if (Number.isNaN(numberValue)) {
			return null;
		}

		return numberValue;
	}

	async findAllForUser(ownerUserId: string, query: GigDrivingSessionsQuery) {
		return this.repository.findAllForUser(ownerUserId, query);
	}

	async findByIdForUser(id: string, ownerUserId: string) {
		return this.repository.findByIdForUser(id, ownerUserId);
	}

	async findActiveForUser(ownerUserId: string) {
		return this.repository.findActiveForUser(ownerUserId);
	}

	async startForUser(
		ownerUserId: string,
		input: StartGigDrivingSessionInput,
	) {
		const activeSession =
			await this.repository.findActiveForUser(ownerUserId);

		if (activeSession) {
			throw new Error("You already have an active driving session.");
		}

		const data: CreateGigDrivingSessionDbRecord = {
			ownerUserId,
			provider: input.provider ?? "uber",
			status: "active",
			startedAt: new Date(),

			startOdometerMiles: this.toRequiredMileageString(
				input.startOdometerMiles,
			),
			endOdometerMiles: null,
			totalMiles: null,

			notes: input.notes ?? null,
			startLocationLabel: input.startLocationLabel ?? null,
			endLocationLabel: null,
		};

		return this.repository.create(data);
	}

	async endForUser(
		id: string,
		ownerUserId: string,
		input: EndGigDrivingSessionInput,
	) {
		const session = await this.repository.findByIdForUser(id, ownerUserId);

		if (!session) {
			return null;
		}

		if (session.status !== "active") {
			throw new Error("Only active driving sessions can be ended.");
		}

		const startOdometerMiles = this.fromNumericString(
			session.startOdometerMiles,
		);

		if (startOdometerMiles == null) {
			throw new Error(
				"Driving session is missing a start odometer value.",
			);
		}

		if (input.endOdometerMiles < startOdometerMiles) {
			throw new Error(
				"End odometer mileage cannot be less than start odometer mileage.",
			);
		}

		const totalMiles = input.endOdometerMiles - startOdometerMiles;

		const updateData: UpdateGigDrivingSessionDbRecord = {
			status: "completed",
			endedAt: new Date(),
			endOdometerMiles: this.toMileageString(input.endOdometerMiles),
			totalMiles: this.toMileageString(totalMiles),
			endLocationLabel: input.endLocationLabel ?? null,
		};

		if (input.notes !== undefined) {
			updateData.notes = input.notes;
		}

		return this.repository.updateForUser(id, ownerUserId, updateData);
	}

	async updateForUser(
		id: string,
		ownerUserId: string,
		input: UpdateGigDrivingSessionInput,
	) {
		const updateData = this.toUpdateDbRecord(input);

		const updatedSession = await this.repository.updateForUser(
			id,
			ownerUserId,
			updateData,
		);

		return updatedSession;
	}

	async deleteForUser(id: string, ownerUserId: string) {
		return this.repository.deleteForUser(id, ownerUserId);
	}

	private toUpdateDbRecord(
		input: UpdateGigDrivingSessionInput,
	): UpdateGigDrivingSessionDbRecord {
		const data: UpdateGigDrivingSessionDbRecord = {};

		if (input.provider !== undefined) {
			data.provider = input.provider;
		}

		if (input.status !== undefined) {
			data.status = input.status;
		}

		if (input.startOdometerMiles !== undefined) {
			data.startOdometerMiles = this.toRequiredMileageString(
				input.startOdometerMiles,
			);
		}

		if (input.endOdometerMiles !== undefined) {
			data.endOdometerMiles = this.toMileageString(
				input.endOdometerMiles,
			);
		}

		if (input.notes !== undefined) {
			data.notes = input.notes;
		}

		if (input.startLocationLabel !== undefined) {
			data.startLocationLabel = input.startLocationLabel;
		}

		if (input.endLocationLabel !== undefined) {
			data.endLocationLabel = input.endLocationLabel;
		}

		return data;
	}
}
