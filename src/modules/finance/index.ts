import type {FastifyPluginAsync} from "fastify";
import accountsRoutes from "./accounts/accounts.routes";
import billsRoutes from "./bills/bills.routes";

const financeModule: FastifyPluginAsync = async (fastify)=> {
    await fastify.register(accountsRoutes);
    await fastify.register(billsRoutes);
}

export default financeModule;