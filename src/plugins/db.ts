import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { pool, db, checkDatabaseConnection} from "../db/index.js";
import {env} from "../config/env.js";

const dbPlugin: FastifyPluginAsync = async (fastify) => {
    await checkDatabaseConnection();

    fastify.decorate("db", pool);
    fastify.decorate("orm", db);

    fastify.addHook("onClose", async () => {
        if (env.NODE_ENV !== "test") {
            await pool.end();
        }
    });
}

export default fp(dbPlugin);