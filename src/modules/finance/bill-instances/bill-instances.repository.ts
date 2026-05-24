import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import {billInstances, bills} from "../../../db/schema/index.js";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
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

    async findByPeriodForUser(
        ownerUserId: string,
        periodYear: number,
        periodMonth: number
        ) {
        return this.orm
            .select()
            .from(billInstances)
            .where(
            and(
                eq(billInstances.ownerUserId, ownerUserId),
                eq(billInstances.periodYear, periodYear),
                eq(billInstances.periodMonth, periodMonth)
            )
        );
    }

    async findUnpaidOrPartialDueBefore(
        ownerUserId: string,
        endDate: string
    ) {
        return this.orm
            .select({
                id: billInstances.id,
                billId: billInstances.billId,
                billName: bills.name,
                dueDate: billInstances.dueDate,
                amountDueCents: billInstances.amountDueCents,
                amountPaidCents: billInstances.amountPaidCents,
                status: billInstances.status,
                periodYear: billInstances.periodYear,
                periodMonth: billInstances.periodMonth,
            })
            .from(billInstances)
            .innerJoin(bills, eq(billInstances.billId, bills.id))
            .where(
                and(
                    eq(billInstances.ownerUserId, ownerUserId),
                    eq(bills.ownerUserId, ownerUserId),
                    lte(billInstances.dueDate, endDate),
                    inArray(billInstances.status, ["unpaid", "partial"])
                )
            )
            .orderBy(asc(billInstances.dueDate));
    }

    async findForUserDueBetween(
        ownerUserId: string,
        startDate: string,
        endDate: string
    ) {
        return this.orm
            .select()
            .from(billInstances)
            .where(
                and(
                    eq(billInstances.ownerUserId, ownerUserId),
                    gte(billInstances.dueDate, startDate),
                    lte(billInstances.dueDate, endDate)
                )
            );
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

    async findForBill(ownerUserId: string, billId: string){
        return this.orm
            .select()
            .from(billInstances)
            .where(
                and(
                    eq(billInstances.ownerUserId, ownerUserId),
                    eq(billInstances.billId, billId)
                )
                
            )
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

    async delete(id: string, ownerUserId: string){
        return await this.orm
            .delete(billInstances)
            .where(
                and(
                    eq(billInstances.id, id),
                    eq(billInstances.ownerUserId, ownerUserId)
                )
            )
    }
}