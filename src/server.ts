import { buildApp } from "./app.js";
import {env} from "./config/env.js";

async function start() {
    try {
        const app = await buildApp();

        await app.listen({
            port: env.PORT,
            host: env.HOST
        })

        app.log.info(
            `${env.APP_NAME} listneing on http://${env.HOST}:${env.PORT}`
        )
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

start();