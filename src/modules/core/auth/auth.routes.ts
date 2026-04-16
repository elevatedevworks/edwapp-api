import type { FastifyPluginAsync } from "fastify";
import {z, ZodError} from "zod";
import { loginSchema } from "./auth.schema";
import { AuthService } from "./auth.service";
import {env} from "../../../config/env";

const authRoutes: FastifyPluginAsync = async (fastify) => {
    const authService = new AuthService(fastify.orm);

    fastify.post("/auth/login", async(request,reply) => {
        try {
            const body = loginSchema.parse(request.body);

            const {safeUser, jwtPayload} = await authService.login(
                body.email,
                body.password
            )

            const token = await reply.jwtSign(jwtPayload, {
                sign: {
                    expiresIn: env.JWT_EXPIRES_IN
                }
            })

            return reply.send({
                data: {
                    token,
                    user: safeUser
                }
            })
        } catch (error) {
            if (error instanceof ZodError) {
                return reply.status(400).send({
                    error: "Invalid request body",
                    details: z.treeifyError(error)
                })
            }

            if (error instanceof Error && (error.message === "Invalid credentials" || error.message === "User account is inactive")) {
                return reply.status(401).send({
                    error: error.message
                })
            }

            throw error;
        }
    })

    fastify.get("/auth/me", 
    {
        preHandler: [fastify.authenticate]
    }, 
    async (request, reply) => {
        try{
            const currentUser = await authService.getCurrentUser(request.user.sub);

            return reply.send({
                data: currentUser
            })
        } catch (error) {
            if(error instanceof Error && (error.message === "User not found" || error.message === "User account is inactive")){
                return reply.status(401).send({
                    error: error.message
                })
            }
            throw error;
        }
        
    })
}

export default authRoutes;