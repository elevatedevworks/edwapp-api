import type * as schema from "../../../db/schema/index.js";
import { AccountsRepository } from "../accounts/accounts.repository.js";
import { BillsRepository } from "../bills/bills.repository.js";
import { PaymentsRepository } from "./payments.repository.js";
import type { CreatePaymentInput } from "./payments.types.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

type DbClient = NodePgDatabase<typeof schema>;

export class PaymentsService{
    private readonly orm: DbClient;
    private readonly repository: PaymentsRepository;
    private readonly accountsRepository: AccountsRepository;
    private readonly billsRepository: BillsRepository

    constructor(orm: DbClient){
        this.orm = orm;
        this.repository = new PaymentsRepository(orm);
        this.accountsRepository = new AccountsRepository(orm);
        this.billsRepository = new BillsRepository(orm);
    }

    private async validateBillOwnership(
        billId: string | null | undefined,
        ownerUserId: string
    ) {
        if (!billId) return;

        const bill = await this.billsRepository.findByIdForUser(billId, ownerUserId);

        if(!bill){
            throw new Error("Linked bill not found");
        }
    }

    private calculateNewBalance(currentBalanceCents: number, amountCents: number, direction: "inflow" | "outflow") {
        return direction === "inflow"
            ? currentBalanceCents + amountCents 
            : currentBalanceCents - amountCents;
    }

    async listPayments(ownerUserId: string){
        return this.repository.findAllForUser(ownerUserId);
    }

    async getPaymentById(id: string, ownerUserId: string){
        const payment = await this.repository.findByIdForUser(id, ownerUserId);

        if(!payment) {
            throw new Error("Payment not found");
        };

        return payment;
    }

    async createPayment(data: CreatePaymentInput, ownerUserId: string){

        await this.validateBillOwnership(data.billId, ownerUserId);

        const account = await this.accountsRepository.findByIdForUser(data.accountId, ownerUserId)

        if(!account) {
            throw new Error("Linked account not found")
        }

        return this.orm.transaction(async (tx) => {
            const paymentsRepository = new PaymentsRepository(tx);
            const accountsRepository = new AccountsRepository(tx);

        const payment = await paymentsRepository.create({
            ownerUserId: ownerUserId,
            accountId: data.accountId,
            billId: data.billId ?? null,
            amountCents: data.amountCents,
            paymentDate: data.paymentDate,
            direction: data.direction,
            method: data.method,
            reference: data.reference ?? null,
            notes: data.notes ?? null
        })

        const updateAccountBalance = this.calculateNewBalance(account.currentBalanceCents, data.amountCents, data.direction);
        
        await accountsRepository.updateForUser(account.id, ownerUserId, {
            currentBalanceCents: updateAccountBalance
        })

        return payment;
        })
  

    }
}