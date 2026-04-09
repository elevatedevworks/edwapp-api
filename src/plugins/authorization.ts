import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

type AppRole = "admin" | "internal" | "client";

const authoriztaionPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorate(
        "requireRoles",
        function requireRoles(allowedRoles: AppRole[]){
            return async function authorize(
                request: FastifyRequest,
                reply: FastifyReply
            ) : Promise<void> {
                if (!request.user){
                    return reply.status(401).send({
                        error: "Unauthorized"
                    })
                }

                if(!allowedRoles.includes(request.user.role)){
                    return reply.status(403).send({
                        error: "Forbidden"
                    })
                }
            }
        }
    )
}

export default fp(authoriztaionPlugin);