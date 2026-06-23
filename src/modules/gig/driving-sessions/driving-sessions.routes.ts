// src/modules/gig/driving-sessions/driving-sessions.routes.ts

import type { FastifyPluginAsync } from "fastify";
import { DrivingSessionsService } from "./driving-sessions.service.js";
import {
	gigDrivingSessionIdSchema,
	gigDrivingSessionsQuerySchema,
	startGigDrivingSessionSchema,
	endGigDrivingSessionSchema,
	updateGigDrivingSessionSchema,
} from "./driving-sessions.schemas.js";

const drivingSessionsRoutes: FastifyPluginAsync = async (fastify) => {
	const drivingSessionsService = new DrivingSessionsService(fastify.orm);

	const gigAccess = {
		preHandler: [
			fastify.authenticate,
			fastify.requireRoles(["admin", "internal"]),
		],
	};

	fastify.get("/", gigAccess, async (request, reply) => {
		const ownerUserId = request.user.sub;
		const query = gigDrivingSessionsQuerySchema.parse(request.query);

		const sessions = await drivingSessionsService.findAllForUser(
			ownerUserId,
			query,
		);

		return reply.send({
			data: sessions,
		});
	});

	fastify.get("/active", gigAccess, async (request, reply) => {
		const ownerUserId = request.user.sub;

		const activeSession =
			await drivingSessionsService.findActiveForUser(ownerUserId);

		return reply.send({
			data: activeSession,
		});
	});

	fastify.get("/:id", gigAccess, async (request, reply) => {
		const ownerUserId = request.user.sub;
		const { id } = gigDrivingSessionIdSchema.parse(request.params);

		const session = await drivingSessionsService.findByIdForUser(
			id,
			ownerUserId,
		);

		if (!session) {
			return reply.status(404).send({
				message: "Driving session not found",
			});
		}

		return reply.send({
			data: session,
		});
	});

	fastify.post("/start", gigAccess, async (request, reply) => {
		const ownerUserId = request.user.sub;
		const input = startGigDrivingSessionSchema.parse(request.body);

		const session = await drivingSessionsService.startForUser(
			ownerUserId,
			input,
		);

		return reply.status(201).send({
			data: session,
		});
	});

	fastify.post("/:id/end", gigAccess, async (request, reply) => {
		const ownerUserId = request.user.sub;
		const { id } = gigDrivingSessionIdSchema.parse(request.params);
		const input = endGigDrivingSessionSchema.parse(request.body);

		const session = await drivingSessionsService.endForUser(
			id,
			ownerUserId,
			input,
		);

		if (!session) {
			return reply.status(404).send({
				message: "Driving session not found",
			});
		}

		return reply.send({
			data: session,
		});
	});

	fastify.patch("/:id", gigAccess, async (request, reply) => {
		const ownerUserId = request.user.sub;
		const { id } = gigDrivingSessionIdSchema.parse(request.params);
		const input = updateGigDrivingSessionSchema.parse(request.body);

		const session = await drivingSessionsService.updateForUser(
			id,
			ownerUserId,
			input,
		);

		if (!session) {
			return reply.status(404).send({
				message: "Driving session not found",
			});
		}

		return reply.send({
			data: session,
		});
	});

	fastify.delete("/:id", gigAccess, async (request, reply) => {
		const ownerUserId = request.user.sub;
		const { id } = gigDrivingSessionIdSchema.parse(request.params);

		const deletedSession = await drivingSessionsService.deleteForUser(
			id,
			ownerUserId,
		);

		if (!deletedSession) {
			return reply.status(404).send({
				message: "Driving session not found",
			});
		}

		return reply.status(204).send();
	});
};

export default drivingSessionsRoutes;
