import { z } from "zod";

export const gigDrivingSessionIdSchema = z.object({
	id: z.uuid(),
});

export const gigProviderSchema = z.enum([
	"uber",
	"doordash",
	"lyft",
	"instacart",
	"mixed",
	"other",
]);

export const gigDrivingSessionStatusSchema = z.enum([
	"active",
	"completed",
	"cancelled",
]);

export const startGigDrivingSessionSchema = z.object({
	provider: gigProviderSchema.default("uber"),

	startOdometerMiles: z
		.number()
		.positive("Start odometer mileage must be greater than zero"),

	notes: z.string().trim().optional().nullable(),

	startLocationLabel: z.string().trim().max(150).optional().nullable(),
});

export const endGigDrivingSessionSchema = z.object({
	endOdometerMiles: z
		.number()
		.positive("End odometer mileage must be greater than zero"),

	notes: z.string().trim().optional().nullable(),

	endLocationLabel: z.string().trim().max(150).optional().nullable(),
});

export const updateGigDrivingSessionSchema = z
	.object({
		provider: gigProviderSchema.optional(),

		status: gigDrivingSessionStatusSchema.optional(),

		startOdometerMiles: z
			.number()
			.positive("Start odometer mileage must be greater than zero")
			.optional(),

		endOdometerMiles: z
			.number()
			.positive("End odometer mileage must be greater than zero")
			.optional()
			.nullable(),

		notes: z.string().trim().optional().nullable(),

		startLocationLabel: z.string().trim().max(150).optional().nullable(),

		endLocationLabel: z.string().trim().max(150).optional().nullable(),
	})
	.refine(
		(data) => Object.keys(data).length > 0,
		"At least one field is required",
	);

export const gigDrivingSessionsQuerySchema = z.object({
	provider: gigProviderSchema.optional(),
	status: gigDrivingSessionStatusSchema.optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});
