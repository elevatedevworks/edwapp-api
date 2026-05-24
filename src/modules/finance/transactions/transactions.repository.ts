import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import { transactions } from "../../../db/schema/index.js";
import type {CreateTransactionDbRecord} from "./transactions.types.js";
import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";

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

    async findForAccountForPeriod(
        ownerUserId: string,
        accountId: string,
        startDate: string,
        endDate: string
    ){
        return this.orm
            .select()
            .from(transactions)
            .where(
                and(
                    eq(transactions.ownerUserId, ownerUserId),
                    or(
                        eq(transactions.accountId, accountId),
                        eq(transactions.counterpartyAccountId, accountId)
                    ),
                    gte(transactions.transactionDate, startDate),
                    lte(transactions.transactionDate, endDate)
                )
            )
            .orderBy(
                desc(transactions.transactionDate),
                desc(transactions.createdAt)                
            );
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

    async getCashFlowForPeriod(ownerUserId: string, startDate: string, endDate: string){
        const results = await this.orm
            .select({
                incomeCents: sql<number>`
                    coalesce(sum(
                        case
                            when ${transactions.kind} = 'income'
                            then ${transactions.amountCents}
                            else 0
                        end
                    ), 0)
                `,
                expenseCents: sql<number>`
                    coalesce(sum(
                        case
                            when ${transactions.kind} in ('expense', 'credit_card_purchase')
                            then ${transactions.amountCents}
                            else 0
                        end
                    ), 0)
                `
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.ownerUserId, ownerUserId),
                    gte(transactions.transactionDate, startDate),
                    lte(transactions.transactionDate, endDate),
                    inArray(transactions.kind, [
                        "income",
                        "expense",
                        "credit_card_purchase"
                    ])
                )
            )

        const row = results[0];
        console.log(row);

        const incomeCents = Number(row?.incomeCents ?? 0);
        const expenseCents = Number(row?.expenseCents ?? 0);


        return {
            incomeCents,
            expenseCents,
            netCashFlowCents: incomeCents - expenseCents
        }
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