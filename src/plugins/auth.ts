import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

const authPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorate(
        "authenticate",
        async function authenticate(request, reply): Promise<void> {
            try {
                await request.jwtVerify();
            } catch (error) {

                fastify.log.error({error}, "JWT verification failed");
                reply.status(401).send({
                    error: "Unauthorized"
                })
            }
        }
    )
}

export default fp(authPlugin);