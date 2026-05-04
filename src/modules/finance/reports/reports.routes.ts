import type { FastifyPluginAsync } from "fastify";
import { ReportService } from "./reports.service.js";
import {z, ZodError} from "zod";
import { reportPeriodQuerySchema } from "../shared/finance.schemas.js";
import { request } from "node:http";

const reportRoutes: FastifyPluginAsync = async(fastify) => {
    const reportsService = new ReportService(fastify.orm)

    const financeAccess = {
        preHandler: [fastify.authenticate, fastify.requireRoles(["admin", "internal"])]
    }

    fastify.get("/reports/overview", financeAccess, async(request, reply) => {
        try {
            const query = reportPeriodQuerySchema.parse(request.query);

            const ownerUserId = request.user.sub;

            const report = await reportsService.getOverview(ownerUserId, query.month, query.year);

            return reply.send({data: report});
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request query",
                    details: z.treeifyError(error)
                })
            }
        }
    })

    fastify.get("/reports/upcoming", financeAccess, async(request, reply) => {
        const ownerUserId = request.user.sub;
        const report = await reportsService.getUpcoming(ownerUserId);

        return reply.send({data: report});
    });

    fastify.get("/reports/cash-flow", financeAccess, async(request, reply) => {
        try {
            const query = reportPeriodQuerySchema.parse(request.query);

            const ownerUserId = request.user.sub;

            const report = await reportsService.getCashFlow(ownerUserId, query.month, query.year);

            return reply.send({data: report});
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request query",
                    details: z.treeifyError(error)
                })
            }
            throw error;
        }

    })
}

export default reportRoutes;