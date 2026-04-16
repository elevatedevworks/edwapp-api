import { FastifyPluginAsync } from "fastify";

const accountsRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.get("/accounts", async () => {
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



export default accountsRoutes;