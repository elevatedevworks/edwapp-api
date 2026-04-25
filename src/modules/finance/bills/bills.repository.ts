import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import {bills} from "../../../db/schema/finance/bills.js";
import { and, eq } from "drizzle-orm";
import type { CreateBillDbRecord, UpdateBillDbRecord } from "./bills.types.js";

type DbClient = NodePgDatabase<typeof schema>;

export class BillsRepository {
    constructor(private readonly orm:DbClient){}

    async findAllForUser(ownerUserId: string){
        return this.orm
            .select()
            .from(bills)
            .where(eq(bills.ownerUserId, ownerUserId))
            .orderBy(bills.createdAt)
    }

    async findByIdForUser(id: string, ownerUserId: string){
        const results = await this.orm
            .select()
            .from(bills)
            .where(
                and(
                    eq(bills.id, id),
                    eq(bills.ownerUserId, ownerUserId)
                )
            ).limit(1)

        return results[0] ?? null;
    }

    async findByExactNameForUser(name:string, ownerUserId: string){
        const results = await this.orm
            .select()
            .from(bills)
            .where(
                and(
                    eq(bills.name, name),
                    eq(bills.ownerUserId, ownerUserId)
                )
            )
            .limit(1);

        return results[0] ?? null;
    }

    async create(data: CreateBillDbRecord){
        const results = await this.orm
            .insert(bills)
            .values(data)
            .returning();

        const bill = results[0];

        if(!bill){
            throw new Error("Bill create failed");
        }

        return bill;
    }

    async updateForUser(id: string, ownerUserId: string, data: UpdateBillDbRecord){
        const results = await this.orm
            .update(bills)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(bills.id, id),
                    eq(bills.ownerUserId, ownerUserId)
                )
            )
            .returning();

        return results[0] ?? null;
    }
}