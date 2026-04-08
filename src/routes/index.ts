import type {FastifyPluginAsync} from "fastify" ;
import healthRoutes from "./health.routes.js";
import clientsRoutes from "../modules/clients/clients.routes.js";

const routes: FastifyPluginAsync = async (fastify) => {
    await fastify.register(healthRoutes);
    await fastify.register(clientsRoutes);
}

export default routes;