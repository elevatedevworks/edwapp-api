import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/finance/accounts.js";
import { AccountsRepository } from "./accounts.repository";
import { CreateAccountInput, UpdateAccountDbRecord, UpdateAccountInput } from "./accounts.types.js";

type DbClient = NodePgDatabase<typeof schema>;

export class AccountsService {
    private readonly repository: AccountsRepository;

    constructor(orm: DbClient){
        this.repository = new AccountsRepository(orm);
    }

    async listAccounts(ownerUserId: string) {
        return this.repository.findAllForUser(ownerUserId);
    }

    async getAccountById(id: string, ownerUserId: string){
        const account = await this.repository.findByIdForUser(id, ownerUserId);

        if(!account){
            throw new Error("Account not found");
        }

        return account;
    }

    async createAccount(data: CreateAccountInput, ownerUserId: string){
        const existingAccount = await this.repository.findByExactNameForUser(data.name, ownerUserId);

        if(existingAccount){
            throw new Error("Account name already exists");
        }

        return this.repository.create({
            name: data.name,
            type: data.type,
            institution: data.institution ?? null,
            currentBalanceCents: data.currentBalanceCents ?? 0,
            isActive: data.isActive ?? true,
            notes: data.notes ?? null,
            ownerUserId
        })
    }

    async updateAccount(id: string, ownerUserId: string, data: UpdateAccountInput){
        const existingAccount = await this.repository.findByIdForUser(id, ownerUserId);

        if(!existingAccount){
            throw new Error("Account not found");
        }

        if(data.name && data.name !== existingAccount.name){
            const nameOwner = await this.repository.findByExactNameForUser(data.name, ownerUserId);

            if(nameOwner && nameOwner.id !== id){
                throw new Error("Account name already exists");
            }
        }

        const updateData: UpdateAccountDbRecord = {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.type !== undefined ? { type: data.type } : {}),
            ...(data.institution !== undefined
                ? { institution: data.institution ?? null }
                : {}),
            ...(data.currentBalanceCents !== undefined
                ? { currentBalanceCents: data.currentBalanceCents }
                : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
        };

        const updatedAccount = await this.repository.updateForUser(id, ownerUserId, updateData);

        if(!updatedAccount){
            throw new Error("Account update failed");
        }

        return updatedAccount;
    }
}