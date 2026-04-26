import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import { RemindersRepository } from "./reminders.repository.js";
import { CreateReminderInput, ReminderModeState, UpdateReminderDbRecord, UpdateReminderInput } from "./reminders.types.js";
import { BillsRepository } from "../bills/bills.repository.js";

type DbClient = NodePgDatabase<typeof schema>;

export class RemindersService {
    private readonly repository: RemindersRepository;
    private readonly billsRepository: BillsRepository;

    constructor(orm: DbClient){
        this.repository = new RemindersRepository(orm);
        this.billsRepository = new BillsRepository(orm);
    }

    private async validateBillOwnership(
        billId: string | null,
        ownerUserId: string
    ) {
        if (!billId) return;

        const bill = await this.billsRepository.findByIdForUser(billId, ownerUserId);

        if(!bill){
            throw new Error("Linked bill not found");
        }
    }

    private validateReminderModeState(data: ReminderModeState){
        if (data.mode === "absolute"){
            if (!data.remindAt) {
                throw new Error("Absolute mode requires remindAt")
            }

            if(data.offsetDays != null){
                throw new Error("Offset days must be null for absolute mode")
            }
        }

        if (data.mode === "bill_offset"){
            if(!data.billId){
                throw new Error("Bill offset mode requires billId");
            }

            if(data.offsetDays == null){
                throw new Error("Bill offset mode requires offsetDays");
            }

            if(data.remindAt != null){
                throw new Error("Remind At must be null for bill offset mode");
            }
        }
    }

    async listReminders(ownerUserId: string){
        return this.repository.findAllForUser(ownerUserId);
    }

    async getReminderById(id: string, ownerUserId: string){
        const reminder = await this.repository.findByIdForUser(id, ownerUserId);

        if(!reminder){
            throw new Error("Reminder not found");
        }

        return reminder;
    }

    async createReminder(data: CreateReminderInput, ownerUserId: string){

        this.validateReminderModeState({
            mode: data.mode ?? "absolute",
            remindAt: data.remindAt ?? null,
            billId: data.billId ?? null,
            offsetDays: data.offsetDays ?? null
        })

        if(data.billId){
            await this.validateBillOwnership(data.billId, ownerUserId);
        }
        
        return await this.repository.create({
            billId: data.billId ?? null,
            title: data.title,
            mode: data.mode ?? "absolute",
            remindAt: data.remindAt ?? null,
            offsetDays: data.offsetDays ?? null,
            status: data.status ?? 'pending',
            notes: data.notes ?? null,
            ownerUserId
        })
    }

    async updateReminder(id: string, ownerUserId: string, data: UpdateReminderInput){
        const existingReminder = await this.repository.findByIdForUser(id, ownerUserId);

        if(!existingReminder){
            throw new Error("Reminder not found");
        }

        const resolvedReminderState = {
            mode: data.mode ?? existingReminder.mode,
            remindAt: data.remindAt !== undefined ? data.remindAt ?? null : existingReminder.remindAt,
            billId: data.billId !== undefined ? data.billId ?? null : existingReminder.billId,
            offsetDays: data.offsetDays !== undefined ? data.offsetDays ?? null : existingReminder.offsetDays
        }

        this.validateReminderModeState(resolvedReminderState);

        await this.validateBillOwnership(resolvedReminderState.billId, ownerUserId);

        const updateData: UpdateReminderDbRecord = {
            ...(data.billId !== undefined ? {billId: data.billId ?? null}: {}),
            ...(data.title !== undefined ? {title: data.title}: {}),
            ...(data.mode !== undefined ? {mode: data.mode}: {}),
            ...(data.remindAt !== undefined ? {remindAt: data.remindAt ?? null}: {}),
            ...(data.offsetDays !== undefined ? {offsetDays: data.offsetDays ?? null}: {}),
            ...(data.status !== undefined ? {status: data.status}: {}),
            ...(data.notes !== undefined ? {notes: data.notes ?? null}: {}),
        }

        const updatedReminder = await this.repository.updateForUser(id, ownerUserId, updateData);

        if(!updatedReminder){
            throw new Error("Reminder update failed");
        }

        return updatedReminder;
    }
}