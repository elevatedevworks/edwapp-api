import { fastify, type FastifyPluginAsync } from "fastify";
import {z, ZodError} from "zod";
import {userIdParamsSchema, createUserSchema, updateUserSchema} from "./users.schema";
import { UsersService } from "./users.service";
import { request } from "node:http";

const usersRoutes: FastifyPluginAsync = async(fastify) => {
    const usersService = new UsersService(fastify.orm);

    fastify.get("/users", async (_request, reply) => {
        const users = await usersService.listUsers();
        return reply.send({data: users});
    })

    fastify.get("/users/:id", async(request,reply) => {
        try {
            const params = userIdParamsSchema.parse(request.params);
            const user = await usersService.getUserById(params.id);

            return reply.send({data:user});
        } catch (error) {
            if(error instanceof ZodError) {
                return reply.status(400).send({
                    error: "Invalid request parameters",
                    details: z.treeifyError(error)
                })
            }

            if(error instanceof Error && error.message === "User not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            throw error;
        }
    })

    fastify.post("/users", async(request, reply) => {
        try {
            const body = createUserSchema.parse(request.body);
            const user = await usersService.createUser(body);

            return reply.status(201).send({data:user});
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request body",
                    details: z.treeifyError(error)
                })
            }

            if(error instanceof Error && error.message === "User email already exist"){
                return reply.status(409).send({
                    error: error.message
                })
            }

            throw error;
        }
    })

    fastify.patch("/users/:id", async (request, reply) => {
        try {
            const params = userIdParamsSchema.parse(request.params);
            const body = updateUserSchema.parse(request.body);

            const user = await usersService.updateUser(params.id, body);

            return reply.send({data: user});
        } catch (error) {
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request",
                    details: z.treeifyError(error)
                });
            }

            if (error instanceof Error && (error.message === "User not found" || error.message === "User update failed")){
                return reply.status(404).send({
                    error: error.message
                })
            }

            if (error instanceof Error && error.message === "User email already exists"){
                return reply.status(409).send({
                    error: error.message
                });
            }

            throw error;
         }
    })
}

export default usersRoutes;