import { fastify, type FastifyPluginAsync } from "fastify";
import drivingSessionsRoutes from "./driving-sessions/driving-sessions.routes";

const gigModule: FastifyPluginAsync = async (fastify) => {
	await fastify.register(drivingSessionsRoutes, {
		prefix: "/driving-sessions",
	});
};

export default gigModule;
