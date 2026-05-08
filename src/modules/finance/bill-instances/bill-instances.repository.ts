import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import {billInstances} from "../../../db/schema/index.js";
import { and, eq } from "drizzle-orm";
import { CreateBillInstanceDbRecord, UpdateBillInstanceDbRecord } from "./bill-instances.types.js";

type DbClient = NodePgDatabase<typeof schema>;

export class BillInstancesRepository{
    constructor(private readonly orm:DbClient){}

    async findAllForUser(ownerUserId: string){
        return this.orm
            .select()
            .from(billInstances)
            .where(eq(billInstances.ownerUserId, ownerUserId))
    }

    async findByIdForUser(id: string, ownerUserId: string){
        const results = await this.orm
            .select()
            .from(billInstances)
            .where(
                and(
                    eq(billInstances.id, id),
                    eq(billInstances.ownerUserId, ownerUserId)
                )
            )
            .limit(1)

        return results[0] ?? null;
    }

    async findByBillAndPeriodForUser(
        billId: string,
        periodYear: number,
        periodMonth: number,
        ownerUserId: string
    ) {
        const results = await this.orm
            .select()
            .from(billInstances)
            .where(
                and(
                    eq(billInstances.billId, billId),
                    eq(billInstances.periodYear, periodYear),
                    eq(billInstances.periodMonth, periodMonth),
                    eq(billInstances.ownerUserId, ownerUserId)
                )
            )
        
        return results[0] ?? null;
    }

    async create(data: CreateBillInstanceDbRecord){
        const results = await this.orm
            .insert(billInstances)
            .values(data)
            .returning();

        const billInstance = results[0];

        if(!billInstance){
            throw new Error("Bill instance create failed");
        }

        return billInstance
    }

    async updateForUser(id: string, ownerUserId: string, data: UpdateBillInstanceDbRecord){
        const results = await this.orm
            .update(billInstances)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(billInstances.id, id),
                    eq(billInstances.ownerUserId, ownerUserId)
                )
            )
            .returning();

        return results[0] ?? null;
    }
}