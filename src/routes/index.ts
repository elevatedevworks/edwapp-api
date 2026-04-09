import type {FastifyPluginAsync} from "fastify" ;
import healthRoutes from "./health.routes.js";
import clientsRoutes from "../modules/clients/clients.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";

const routes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(healthRoutes);
    await fastify.register(clientsRoutes);
    await fastify.register(usersRoutes)
    await fastify.register(authRoutes);
}

export default routes;