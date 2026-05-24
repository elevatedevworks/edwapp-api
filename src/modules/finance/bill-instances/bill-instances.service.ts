import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import { BillsRepository } from "../bills/bills.repository.js";
import { BillInstancesRepository } from "./bill-instances.repository.js";
import type {
  BillInstanceStatus,
  CreateBillInstanceInput,
  CreateBillInstanceDbRecord,
  UpdateBillInstanceDbRecord,
  UpdateBillInstanceInput,
} from "./bill-instances.types.js";

type DbClient = NodePgDatabase<typeof schema>;

export class BillInstancesService {
  private readonly repository: BillInstancesRepository;
  private readonly billsRepository: BillsRepository;

  constructor(orm: DbClient) {
    this.repository = new BillInstancesRepository(orm);
    this.billsRepository = new BillsRepository(orm);
  }

  private computeBillInstanceStatus(data: {
    amountDueCents: number;
    amountPaidCents: number;
    dueDate: string;
  }): BillInstanceStatus {
    if (data.amountPaidCents >= data.amountDueCents) {
      return "paid";
    }

    if (data.amountPaidCents > 0) {
      return "partial";
    }

    const today = new Date();
    const dueDate = new Date(`${data.dueDate}T00:00:00Z`);

    if (dueDate < today) {
      return "overdue";
    }

    return "unpaid";
  }

  async listBillInstances(ownerUserId: string) {
    return this.repository.findAllForUser(ownerUserId);
  }

  async getBillInstanceById(id: string, ownerUserId: string) {
    const billInstance = await this.repository.findByIdForUser(id, ownerUserId);

    if (!billInstance) {
      throw new Error("Bill instance not found");
    }

    return billInstance;
  }

  async createBillInstance(data: CreateBillInstanceInput, ownerUserId: string) {
    const bill = await this.billsRepository.findByIdForUser(data.billId, ownerUserId);

    if (!bill) {
      throw new Error("Linked bill not found");
    }

    const existingBillInstance =
      await this.repository.findByBillAndPeriodForUser(
        data.billId,
        data.periodYear,
        data.periodMonth,
        ownerUserId
      );

    if (existingBillInstance) {
      throw new Error("Bill instance already exists for this period");
    }

    const normalizedPaidCents = data.amountPaidCents ?? 0;

    const createData: CreateBillInstanceDbRecord = {
      ownerUserId,
      billId: data.billId,
      periodYear: data.periodYear,
      periodMonth: data.periodMonth,
      dueDate: data.dueDate,
      amountDueCents: data.amountDueCents,
      amountPaidCents: normalizedPaidCents,
      status: this.computeBillInstanceStatus({
        amountDueCents: data.amountDueCents,
        amountPaidCents: normalizedPaidCents,
        dueDate: data.dueDate,
      }),
      notes: data.notes ?? null,
    };

    return this.repository.create(createData);
  }

  async updateBillInstance(
    id: string,
    ownerUserId: string,
    data: UpdateBillInstanceInput
  ) {
    const existingBillInstance = await this.repository.findByIdForUser(id, ownerUserId);

    if (!existingBillInstance) {
      throw new Error("Bill instance not found");
    }

    const resolvedBillId =
      data.billId !== undefined ? data.billId : existingBillInstance.billId;

    const resolvedPeriodYear =
      data.periodYear !== undefined ? data.periodYear : existingBillInstance.periodYear;

    const resolvedPeriodMonth =
      data.periodMonth !== undefined
        ? data.periodMonth
        : existingBillInstance.periodMonth;

    if (
      resolvedBillId !== existingBillInstance.billId ||
      resolvedPeriodYear !== existingBillInstance.periodYear ||
      resolvedPeriodMonth !== existingBillInstance.periodMonth
    ) {
      const duplicateBillInstance =
        await this.repository.findByBillAndPeriodForUser(
          resolvedBillId,
          resolvedPeriodYear,
          resolvedPeriodMonth,
          ownerUserId
        );

      if (duplicateBillInstance && duplicateBillInstance.id !== id) {
        throw new Error("Bill instance already exists for this period");
      }
    }

    if (data.billId !== undefined && data.billId !== existingBillInstance.billId) {
      const bill = await this.billsRepository.findByIdForUser(data.billId, ownerUserId);

      if (!bill) {
        throw new Error("Linked bill not found");
      }
    }

    const resolvedAmountDueCents =
      data.amountDueCents !== undefined
        ? data.amountDueCents
        : existingBillInstance.amountDueCents;

    const resolvedAmountPaidCents =
      data.amountPaidCents !== undefined
        ? data.amountPaidCents ?? 0
        : existingBillInstance.amountPaidCents;

    const resolvedDueDate =
      data.dueDate !== undefined ? data.dueDate : existingBillInstance.dueDate;

    const updateData: UpdateBillInstanceDbRecord = {
      ...(data.billId !== undefined ? { billId: data.billId } : {}),
      ...(data.periodYear !== undefined ? { periodYear: data.periodYear } : {}),
      ...(data.periodMonth !== undefined ? { periodMonth: data.periodMonth } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
      ...(data.amountDueCents !== undefined
        ? { amountDueCents: data.amountDueCents }
        : {}),
      ...(data.amountPaidCents !== undefined
        ? { amountPaidCents: data.amountPaidCents ?? 0 }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
      status: this.computeBillInstanceStatus({
        amountDueCents: resolvedAmountDueCents,
        amountPaidCents: resolvedAmountPaidCents,
        dueDate: resolvedDueDate,
      }),
    };

    const updatedBillInstance = await this.repository.updateForUser(
      id,
      ownerUserId,
      updateData
    );

    if (!updatedBillInstance) {
      throw new Error("Bill instance update failed");
    }

    return updatedBillInstance;
  }

  async deleteBillInstance(id: string,ownerUserId: string){
    const existingBillInstance = await this.repository.findByIdForUser(id, ownerUserId);

    if (!existingBillInstance) {
      throw new Error("Bill instance not found");
    }
    
    return await this.repository.delete(id, ownerUserId);
  }
}