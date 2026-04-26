import {eq, and} from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import {reminders} from "../../../db/schema/index.js";
import type { CreateReminderDbRecord, UpdateReminderDbRecord } from "./reminders.types.js";

type DbClient = NodePgDatabase<typeof schema>;

export class RemindersRepository {
    constructor(private readonly orm:DbClient){}

    async findAllForUser(ownerUserId: string) {
        return this.orm
            .select()
            .from(reminders)
            .where(eq(reminders.ownerUserId, ownerUserId))
            .orderBy(reminders.createdAt);
    }

    async findByIdForUser(id: string, ownerUserId: string){
        const results = await this.orm
            .select()
            .from(reminders)
            .where(
                and(
                    eq(reminders.id, id),
                    eq(reminders.ownerUserId, ownerUserId)
                )
            )
            .limit(1);
        return results[0] ?? null;
    }

    async create(data: CreateReminderDbRecord){
        const results = await this.orm
            .insert(reminders)
            .values(data)
            .returning();

        const reminder = results[0];

        if(!reminder){
            throw new Error("Reminder create failed");
        }

        return reminder;
    }

    async updateForUser(id: string, ownerUserId: string, data: UpdateReminderDbRecord){
        const results = await this.orm
            .update(reminders)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(reminders.id, id),
                    eq(reminders.ownerUserId, ownerUserId)
                )
            )
            .returning();

        return results[0] ?? null;
    }
}