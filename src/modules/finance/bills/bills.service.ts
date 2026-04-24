import type * as schema from "../../../db/schema";
import { AccountsRepository } from "../accounts/accounts.repository";
import { BillsRepository } from "./bills.repository.js";
import type {CreateBillInput, UpdateBillDbRecord, UpdateBillInput} from "./bills.types.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

type DbClient = NodePgDatabase<typeof schema>;

export class BillsService{
    private readonly repository: BillsRepository;
    private readonly accountsRepository: AccountsRepository;

    constructor(orm: DbClient){
        this.repository = new BillsRepository(orm);
        this.accountsRepository = new AccountsRepository(orm);
    }

    private async validateAccountOwnership(
        accountId: string | null | undefined,
        ownerUserId: string
    ) {
        if(!accountId) return;

        const account = await this.accountsRepository.findByIdForUser(accountId, ownerUserId);

        if (!account){
            throw new Error("Linked account not found");
        }
    }

    private validateBillSchedule(data: {
        frequency? : "one_time" | "weekly" | "monthly" | "quarterly" | "annual";
        dueDate?: string | null;
        dueDayOfMonth?: number | null;
    }){
        if (data.frequency === "one_time" && !data.dueDate){
            throw new Error("One-time bills require a due date");
        }

        if(data.frequency === "monthly"  && data.dueDayOfMonth == null){
            throw new Error("Monthly bills require a due day of month");
        }

        if(data.frequency && data.frequency !== "monthly" && data.dueDayOfMonth != null){
            throw new Error("Due day of month can only be used with monthly bills");
        }
    }

    async listBills(ownerUserId: string){
        return this.repository.findAllForUser(ownerUserId);
    }

    async getBillById(id: string, ownerUserId: string){
        const bill = await this.repository.findByIdForUser(id, ownerUserId);

        if(!bill){
            throw new Error("Bill not found");
        }

        return bill;
    }

    async createBill(data: CreateBillInput, ownerUserId: string){
        const existingBill = await this.repository.findByExactNameForUser(data.name, ownerUserId);

        if(existingBill){
            throw new Error("Bill name already exists");
        }

        if(data.accountId !== undefined){
            await this.validateAccountOwnership(data.accountId, ownerUserId);
        }

        await this.validateBillSchedule({
            frequency: data.frequency,
            dueDate: data.dueDate ?? null,
            dueDayOfMonth: data.dueDayOfMonth ?? null
        })

        return this.repository.create({
            name: data.name,
            vendor: data.vendor ?? null,
            accountId: data.accountId ?? null,
            amountDueCents: data.amountDueCents,
            dueDate: data.dueDate ?? null,
            dueDayOfMonth: data.dueDayOfMonth ?? null,
            frequency: data.frequency,
            status: data.status ?? 'active',
            autopay: data.autopay ?? false,
            notes: data.notes ?? null,
            isActive: data.isActive ?? true,
            ownerUserId
        })
    }

    async updateBill(id: string, ownerUserId: string, data: UpdateBillInput){
        const existingBill = await this.repository.findByIdForUser(id, ownerUserId);

        if(!existingBill){
            throw new Error("Bill not found");
        }

        if(data.name && data.name !== existingBill.name){
            const nameOwner = await this.repository.findByExactNameForUser(data.name, ownerUserId);
    
            if(nameOwner && nameOwner.id !== id){
                throw new Error("Bill name already exists");
            }
        }

        if(data.accountId !== undefined){
            await this.validateAccountOwnership(data.accountId, ownerUserId);
        }

        this.validateBillSchedule({
            frequency: data.frequency ?? existingBill.frequency,
            dueDate: data.dueDate !== undefined ? data.dueDate ?? null : existingBill.dueDate,
            dueDayOfMonth:
                data.dueDayOfMonth !== undefined
                    ? data.dueDayOfMonth ?? null
                    : existingBill.dueDayOfMonth
        });

        const updateData: UpdateBillDbRecord = {
            ...(data.name !== undefined ? {name: data.name}: {}),
            ...(data.vendor !== undefined ? {vendor: data.vendor ?? null}: {}),
            ...(data.accountId !== undefined ? {accountId: data.accountId ?? null}: {}),
            ...(data.amountDueCents !== undefined ? {amountDueCents: data.amountDueCents}: {}),
            ...(data.dueDate !== undefined ? {dueDate: data.dueDate ?? null}: {}),
            ...(data.dueDayOfMonth !== undefined ? {dueDayOfMonth: data.dueDayOfMonth ?? null}: {}),
            ...(data.frequency !== undefined ? {frequency: data.frequency}: {}),
            ...(data.status !== undefined ? {status: data.status}: {}),
            ...(data.autopay !== undefined ? {autopay: data.autopay}: {}),
            ...(data.notes !== undefined ? {notes: data.notes ?? null}: {}),
            ...(data.isActive !== undefined ? {isActive: data.isActive}: {}),
        }

        const updatedBill = await this.repository.updateForUser(id, ownerUserId, updateData);

        if(!updatedBill){
            throw new Error("Bill update failed");
        }

        return updatedBill;
    }
}