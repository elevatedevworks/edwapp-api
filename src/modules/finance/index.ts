import type {FastifyPluginAsync} from "fastify";
import accountsRoutes from "./accounts/accounts.routes";
import billsRoutes from "./bills/bills.routes";
import paymentsRoutes from "./payments/payments.routes";
import reminderRoutes from "./reminders/reminders.routes";
import summaryRoutes from "./summary/summary.routes";
import reportRoutes from "./reports/reports.routes";

const financeModule: FastifyPluginAsync = async (fastify)=> {
    await fastify.register(accountsRoutes);
    await fastify.register(billsRoutes);
    await fastify.register(paymentsRoutes);
    await fastify.register(reminderRoutes);
    await fastify.register(summaryRoutes);
    await fastify.register(reportRoutes);
}

export default financeModule;