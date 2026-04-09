import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import jwt from "@fastify/jwt";
import {env} from "../config/env";

const jwtPlugin: FastifyPluginAsync = async(fastify) => {
    await fastify.register(jwt, {
        secret: env.JWT_SECRET
    })
}

export default fp(jwtPlugin);