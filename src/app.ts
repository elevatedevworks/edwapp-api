import Fastify from "fastify";
import { env } from "./config/env.js";
import dbPlugin from "./plugins/db.js";
import jwtPlugin from './plugins/jwt.js';
import authPlugin from './plugins/auth.js';
import authorizationPlugin from './plugins/authorization.js';
import routes from "./routes/index.js";

export async function buildApp() {
    const app = Fastify({
        logger: {
            level: env.LOG_LEVEL
        }
    })

    await app.register(dbPlugin);
    await app.register(jwtPlugin)
    await app.register(authPlugin);
    await app.register(authorizationPlugin);
    await app.register(routes);

    return app;
}