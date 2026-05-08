import type {FastifyPluginAsync} from "fastify";
import accountsRoutes from "./accounts/accounts.routes.js";
import billsRoutes from "./bills/bills.routes.js";
import paymentsRoutes from "./payments/payments.routes.js";
import reminderRoutes from "./reminders/reminders.routes.js";
import summaryRoutes from "./summary/summary.routes.js";
import reportRoutes from "./reports/reports.routes.js";
import transactionsRoutes from "./transactions/transactions.routes.js";
import billInstancesRoutes from "./bill-instances/bill-instances.routes.js";

const financeModule: FastifyPluginAsync = async (fastify)=> {
    await fastify.register(accountsRoutes);
    await fastify.register(billsRoutes);
    await fastify.register(paymentsRoutes);
    await fastify.register(reminderRoutes);
    await fastify.register(summaryRoutes);
    await fastify.register(reportRoutes);
    await fastify.register(transactionsRoutes);
    await fastify.register(billInstancesRoutes)
}

export default financeModule;