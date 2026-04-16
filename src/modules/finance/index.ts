import type {FastifyPluginAsync} from "fastify";
import accountsRoutes from "./accounts/accounts.routes";

const financeModule: FastifyPluginAsync = async (fastify)=> {
    await fastify.register(accountsRoutes);
}

export default financeModule;