import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { pool, db, checkDatabaseConnection} from "../db/index.js"

const dbPlugin: FastifyPluginAsync = async (fastify) => {
    await checkDatabaseConnection();

    fastify.decorate("db", pool);
    fastify.decorate("orm", db);

    fastify.addHook("onClose", async () => {
        await pool.end();
    });
}

export default fp(dbPlugin);