import type {FastifyPluginAsync} from "fastify";
import accountsRoutes from "./accounts/accounts.routes";
import billsRoutes from "./bills/bills.routes";
import paymentsRoutes from "./payments/payments.routes";

const financeModule: FastifyPluginAsync = async (fastify)=> {
    await fastify.register(accountsRoutes);
    await fastify.register(billsRoutes);
    await fastify.register(paymentsRoutes);
}

export default financeModule;