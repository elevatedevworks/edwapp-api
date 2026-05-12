import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import { transactions } from "../../../db/schema/index.js";
import type {CreateTransactionDbRecord} from "./transactions.types.js";
import { and, desc, eq, sql } from "drizzle-orm";

type DbClient = NodePgDatabase<typeof schema>;

export class TransactionsRepository {
    constructor(private readonly orm:DbClient){}

    async findAllForUser(ownerUserId: string){
        return this.orm
            .select()
            .from(transactions)
            .where(eq(transactions.ownerUserId, ownerUserId))
            .orderBy(desc(transactions.transactionDate))
    }

    async findByIdForUser(id: string, ownerUserId: string){
        const results = await this.orm
            .select()
            .from(transactions)
            .where(
                and(
                    eq(transactions.id, id),
                    eq(transactions.ownerUserId, ownerUserId)
                )
            ).limit(1)

        return results[0] ?? null;
    }

    async getPaidTotalForBillInstance(ownerUserId: string, billInstanceId: string){
        const results = await this.orm
            .select({
                totalPaidCents: sql<number>`coalesce(sum(${transactions.amountCents}), 0)`
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.ownerUserId, ownerUserId),
                    eq(transactions.linkedBillInstanceId, billInstanceId)
                )
            )

        return Number(results[0]?.totalPaidCents ?? 0);
    }

    async create(data: CreateTransactionDbRecord){
        const results = await this.orm
            .insert(transactions)
            .values(data)
            .returning();

        const transaction = results[0];

        if(!transaction){
            throw new Error("Transaction create failed");
        }

        return transaction;
    }
}