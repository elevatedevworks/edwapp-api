import Fastify from "fastify";
import { env } from "./config/env.js";
import dbPlugin from "./plugins/db.js";
import routes from "./routes/index.js";

export async function buildApp() {
    const app = Fastify({
        logger: {
            level: env.LOG_LEVEL
        }
    })

    await app.register(dbPlugin);
    await app.register(routes);

    return app;
}