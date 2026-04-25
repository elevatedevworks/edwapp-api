import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import {payments} from "../../../db/schema/finance/payments.js";
import {and,eq} from "drizzle-orm";
import type { CreatePaymentDbRecord } from "./payments.types.js";

type DbClient = NodePgDatabase<typeof schema>;

export class PaymentsRepository {
    constructor(private readonly orm:DbClient){}

    async findAllForUser(ownerUserId: string){
        return this.orm
            .select()
            .from(payments)
            .where(eq(payments.ownerUserId, ownerUserId))
            .orderBy(payments.createdAt)
    }

    async findByIdForUser(id: string, ownerUserId: string){
        const results = await this.orm
            .select()
            .from(payments)
            .where(
                and(
                    eq(payments.id, id),
                    eq(payments.ownerUserId, ownerUserId)
                )
            )
            .limit(1);

        return results[0] ?? null;
    }

    async create(data: CreatePaymentDbRecord){
        const results = await this.orm
            .insert(payments)
            .values(data)
            .returning();

        const payment = results[0];

        if(!payment){
            throw new Error("Payment create failed");
        }

        return payment;
    }
}