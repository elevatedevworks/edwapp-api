import type {FastifyPluginAsync} from "fastify";
import authRoutes from "./auth/auth.routes";
import usersRoutes from "./users/users.routes";

const coreRoutes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(authRoutes);
    await fastify.register(usersRoutes);
}

export default coreRoutes;