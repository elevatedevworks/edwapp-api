import type {FastifyPluginAsync} from "fastify";
import clientsRoutes from "./clients/clients.routes";

const leadsModule: FastifyPluginAsync = async (fastify) => {
    await fastify.register(clientsRoutes);
}

export default leadsModule;