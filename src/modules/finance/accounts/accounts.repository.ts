import {eq, and} from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/finance/index.js";
import { accounts } from "../../../db/schema/finance/index.js";
import type { CreateAcountDbRecord, UpdateAccountDbRecord } from "./accounts.types.js";

type DbClient = NodePgDatabase<typeof schema>;

export class AccountsRepository {
    constructor(private readonly orm:DbClient){}

    async findAllForUser(ownerUserId: string) {
        return this.orm
            .select()
            .from(accounts)
            .where(eq(accounts.ownerUserId, ownerUserId))
            .orderBy(accounts.createdAt);
    }

    async findByIdForUser(id: string, ownerUserId: string) {
        const results = await this.orm
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.id, id),
                    eq(accounts.ownerUserId, ownerUserId)
                )
            ).limit(1);
        return results[0] ?? null;
    }

    async findByExactNameForUser(name: string, ownerUserId: string){
        const results = await this.orm
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.name, name),
                    eq(accounts.ownerUserId, ownerUserId)
                )
            ).limit(1);
        return results[0] ?? null;
    }

    async create(data: CreateAcountDbRecord){
        const results = await this.orm
            .insert(accounts)
            .values(data)
            .returning();

        const account = results[0];

        if(!account){
            throw new Error("Account create failed");
        }

        return account;
    }

    async updateForUser(id: string, ownerUserId: string, data: UpdateAccountDbRecord){
        const results = await this.orm
            .update(accounts)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(
                and(
                    eq(accounts.id, id),
                    eq(accounts.ownerUserId, ownerUserId)
                )
            )
            .returning();

        return results[0] ?? null;
    }
    
}