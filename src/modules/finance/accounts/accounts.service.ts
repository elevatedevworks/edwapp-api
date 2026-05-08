import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import { AccountsRepository } from "./accounts.repository.js";
import { AccountType, CreateAccountInput, UpdateAccountDbRecord, UpdateAccountInput } from "./accounts.types.js";

type DbClient = NodePgDatabase<typeof schema>;

export class AccountsService {
    private readonly repository: AccountsRepository;

    constructor(orm: DbClient){
        this.repository = new AccountsRepository(orm);
    }

    private validateAccountTypeState(data: {
        type: AccountType;
        creditLimitCents?: number | null;
        statementClosingDay?: number | null;
        paymentDueDay?: number | null;
    }) {
        if (data.type === "credit_card") {
            if (data.creditLimitCents == null) {
                throw new Error("Credit card accounts require creditLimitCents");
            }

            if (data.statementClosingDay == null) {
                throw new Error("Credit card accounts require statementClosingDay");
            }

            if (data.paymentDueDay == null) {
                throw new Error("Credit card accounts require paymentDueDay");
            }
        } else {
            if (data.creditLimitCents != null) {
                throw new Error("creditLimitCents is only allowed for credit card accounts");
            }

            if (data.statementClosingDay != null) {
                throw new Error("statementClosingDay is only allowed for credit card accounts");
            }

            if (data.paymentDueDay != null) {
                throw new Error("paymentDueDay is only allowed for credit card accounts");
            }
        }
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

        this.validateAccountTypeState({
            type: data.type, 
            creditLimitCents: data.creditLimitCents ?? null,
            statementClosingDay: data.statementClosingDay ?? null,
            paymentDueDay: data.paymentDueDay ?? null
        });

        return this.repository.create({
            name: data.name,
            type: data.type,
            institution: data.institution ?? null,
            currentBalanceCents: data.currentBalanceCents ?? 0,
            creditLimitCents: data.creditLimitCents ?? null,
            statementClosingDay: data.statementClosingDay ?? null,
            paymentDueDay: data.paymentDueDay ?? null,
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

        const resolvedAccountTypeState = {
            type: data.type ?? existingAccount.type,
            creditLimitCents:
                data.creditLimitCents !== undefined
                    ? data.creditLimitCents ?? null
                    : existingAccount.creditLimitCents,
            statementClosingDay:
                data.statementClosingDay !== undefined
                    ? data.statementClosingDay ?? null
                    : existingAccount.statementClosingDay,
            paymentDueDay:
                data.paymentDueDay !== undefined
                    ? data.paymentDueDay ?? null
                    : existingAccount.paymentDueDay
        };


        this.validateAccountTypeState(resolvedAccountTypeState);

        const updateData: UpdateAccountDbRecord = {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.type !== undefined ? { type: data.type } : {}),
            ...(data.institution !== undefined
                ? { institution: data.institution ?? null }
                : {}),
            ...(data.currentBalanceCents !== undefined
                ? { currentBalanceCents: data.currentBalanceCents }
                : {}),
            ...(data.creditLimitCents !== undefined
                ? { creditLimitCents: data.creditLimitCents ?? null }
                : {}),
            ...(data.statementClosingDay !== undefined
                ? { statementClosingDay: data.statementClosingDay ?? null }
                : {}),
            ...(data.paymentDueDay !== undefined
                ? { paymentDueDay: data.paymentDueDay ?? null }
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