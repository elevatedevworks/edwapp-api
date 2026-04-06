/// <reference path="../types/fastify.d.ts" />

import type { FastifyPluginAsync } from "fastify";

const healthRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get("/health", async () => {
        const dbResult = await fastify.db.query("SELECT NOW() as now");

        return {
            ok: true,
            app: "edwapp-api",
            status: "healthy",
            database: "connected",
            timestamp: dbResult.rows[0]?.now ?? null
        }
    })
}

export default healthRoutes;