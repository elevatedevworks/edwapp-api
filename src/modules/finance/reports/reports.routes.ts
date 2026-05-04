import type { FastifyPluginAsync } from "fastify";
import { ReportService } from "./reports.service.js";
import {z, ZodError} from "zod";
import { accountActivityParamsSchema, reportPeriodQuerySchema } from "./reports.schemas.js";
import { request } from "node:http";
import { error } from "node:console";

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

    });

    fastify.get("/reports/accounts/:id/activity", financeAccess, async(request,reply) => {
        try {
            const params = accountActivityParamsSchema.parse(request.params);
            const query = reportPeriodQuerySchema.parse(request.query);
            const ownerUserId = request.user.sub;

            const report = await reportsService.getAccountActivity(
                ownerUserId, params.id, query.month, query.year
            )

            return reply.send({data: report});
            
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request",
                    details: z.treeifyError(error)
                })
            }

            if(error instanceof Error && error.message === "Account not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }
        }
    }
    )
}

export default reportRoutes;