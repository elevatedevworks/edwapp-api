import type { FastifyPluginAsync } from "fastify";
import { RemindersService } from "./reminders.service.js";
import { reminderIdParamsSchema, createReminderSchema, updateReminderSchema } from "./reminders.schemas.js";
import {z, ZodError} from "zod";

const reminderRoutes: FastifyPluginAsync = async(fastify) => {
    const remindersService = new RemindersService(fastify.orm);

    const financeAccess = {
        preHandler: [fastify.authenticate, fastify.requireRoles(["admin", "internal"])]
    }

    const badRequestErrors = new Set([
        "Absolute mode requires remindAt",
        "Offset days must be null for absolute mode",
        "Bill offset mode requires billId",
        "Bill offset mode requires offsetDays",
        "Remind At must be null for bill offset mode",
        "Linked bill not found"
    ])

    fastify.get("/reminders", financeAccess, async (request,reply) => {
        const ownerUserId = request.user.sub;
        const reminders = await remindersService.listReminders(ownerUserId);

        return reply.send({data: reminders});
    })

    fastify.get("/reminders/:id", financeAccess, async(request, reply) => {
        try{
            const params = reminderIdParamsSchema.parse(request.params);
            const ownerUserId = request.user.sub;

            const reminder = await remindersService.getReminderById(params.id, ownerUserId);

            return reply.send({data: reminder});
        } catch (error){
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request parameters",
                    details: z.treeifyError(error)
                })
            }
            if(error instanceof Error && error.message === "Reminder not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            throw error;
        }
    })

    fastify.post("/reminders", financeAccess, async(request, reply) => {
        try{
            const body = createReminderSchema.parse(request.body);
            const ownerUserId = request.user.sub;

            const reminder = await remindersService.createReminder(body, ownerUserId);

            return reply.status(201).send({data: reminder})
        } catch (error){
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request body",
                    details: z.treeifyError(error)
                })
            }
            if(error instanceof Error && badRequestErrors.has(error.message)
                ){
                return reply.status(400).send({
                    error: error.message
                })
            }

            throw error;

        }
    })

    fastify.patch("/reminders/:id", financeAccess, async(request, reply) => {
        try{
            const params = reminderIdParamsSchema.parse(request.params);
            const body = updateReminderSchema.parse(request.body);
            const ownerUserId = request.user.sub;

            const reminder = await remindersService.updateReminder(params.id, ownerUserId, body);
            
            return reply.send({data: reminder});
        } catch (error){
            if(error instanceof ZodError){
                return reply.status(400).send({
                    error: "Invalid request",
                    details: z.treeifyError(error)
                })
            }
            if(error instanceof Error && badRequestErrors.has(error.message)
                ){
                return reply.status(400).send({
                    error: error.message
                })
            }
            if(error instanceof Error && error.message === "Reminder not found"){
                return reply.status(404).send({
                    error: error.message
                })
            }

            throw error
        }
    })
}

export default reminderRoutes;