import type { FastifyPluginAsync } from "fastify";
import { SummaryService } from "./summary.service.js";

const summaryRoutes: FastifyPluginAsync = async(fastify) => {
    const summaryService = new SummaryService(fastify.orm);

    const financeAccess = {
        preHandler: [fastify.authenticate, fastify.requireRoles(["admin", "internal"])]
    }

    fastify.get("/summary", financeAccess, async (request, reply) => {
        const ownerUserId = request.user.sub;
        const summary = await summaryService.getSummary(ownerUserId);

        return reply.send({ data: summary});
    })
}

export default summaryRoutes;