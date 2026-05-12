import type * as schema from "../../../db/schema/index.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AccountsRepository } from "../accounts/accounts.repository.js";
import { BillsRepository } from "../bills/bills.repository.js";
import { TransactionsRepository} from "./transactions.repository.js";
import type { CreateTransactionInput, TransactionKind } from "./transactions.types.js";
import { BillInstancesRepository } from "../bill-instances/bill-instances.repository.js";


type DbClient = NodePgDatabase<typeof schema>;

type AccountRecord = Awaited<ReturnType<AccountsRepository["findByIdForUser"]>>;

export class TransactionsService{
    private readonly orm: DbClient;
    private readonly repository: TransactionsRepository;
    private readonly accountsRepository: AccountsRepository;
    private readonly billsRepository: BillsRepository;
    private readonly billInstancesRepository: BillInstancesRepository;

    constructor(orm: DbClient){
        this.orm = orm;
        this.repository = new TransactionsRepository(orm);
        this.accountsRepository = new AccountsRepository(orm);
        this.billsRepository = new BillsRepository(orm);
        this.billInstancesRepository = new BillInstancesRepository(orm);
    }

    private validateTransactionKindState(
        data: CreateTransactionInput, 
        primaryAccount: NonNullable<AccountRecord>,
        counterpartyAccount: AccountRecord
    ){
        if ((data.kind === "expense" || data.kind === "adjustment" || data.kind === "income" || data.kind === "credit_card_purchase") && data.counterpartyAccountId){
            throw new Error("counterpartyAccountId must be null when transaction kind is expense, adjustment, income, or credit_card_purchase");
        }

        if (data.kind === "transfer") {
            if (!data.counterpartyAccountId){
                throw new Error("counterpartyAccountId is required when transaction kind is transfer");
            }

            if (data.counterpartyAccountId === data.accountId){
                throw new Error("counterpartyAccoutId cannot be the same as accountId");
            }

            if (!counterpartyAccount){
                throw new Error("Linked account not found")
            }
        }

        if (data.kind === "credit_card_purchase" && primaryAccount.type !== "credit_card"){
            throw new Error("Selected account is not a credit card account");
        }

    }

    private applySingleAccountEffect(
        account: NonNullable<AccountRecord>,
        amountCents: number,
        kind: Exclude<TransactionKind, "transfer">
    ) {
        switch(kind){
            case "income":
                return account.currentBalanceCents + amountCents;
            case "expense":
                return account.currentBalanceCents - amountCents;
            case "adjustment":
                return account.currentBalanceCents - amountCents;
            case "credit_card_purchase":
                if(account.type !== "credit_card"){
                    throw new Error("Selected account is not a credit card account");
                }
                return account.currentBalanceCents + amountCents;
            default:
                return account.currentBalanceCents;
        }
    }

    private applyTransferEffect(
        sourceAccount: NonNullable<AccountRecord>,
        destinationAccount: NonNullable<AccountRecord>,
        amountCents: number
    ){
        const nextSourceBalance = 
            sourceAccount.type === "credit_card"
                ? sourceAccount.currentBalanceCents + amountCents
                : sourceAccount.currentBalanceCents - amountCents;

        const nextDestinationBalance = 
            destinationAccount.type === "credit_card"
                ? destinationAccount.currentBalanceCents - amountCents
                : destinationAccount.currentBalanceCents + amountCents;

        return {
            nextSourceBalance,
            nextDestinationBalance
        }
    }

    private getBillInstanceStatus(amountDueCents: number, amountPaidCents: number){
        if(amountPaidCents <= 0){
            return "unpaid";
        }

        if(amountPaidCents < amountDueCents){
            return "partial";
        }

        return "paid"
    }

    async listTransactions(ownerUserId: string){
        return this.repository.findAllForUser(ownerUserId);
    }

    async getTransactionById(id: string, ownerUserId: string){
        const transaction = await this.repository.findByIdForUser(id, ownerUserId);

        if(!transaction){
            throw new Error("Transaction not found");
        }

        return transaction;
    }

    async createTransaction(data: CreateTransactionInput, ownerUserId: string){
        const [primaryAccount, counterpartyAccount, linkedBill, linkedBillInstance] = await Promise.all([
            this.accountsRepository.findByIdForUser(data.accountId, ownerUserId),
            data.counterpartyAccountId
                ? this.accountsRepository.findByIdForUser(data.counterpartyAccountId, ownerUserId)
                : Promise.resolve(null),
            data.linkedBillId
                ? this.billsRepository.findByIdForUser(data.linkedBillId, ownerUserId)
                : Promise.resolve(null),
            data.linkedBillInstanceId
                ? this.billInstancesRepository.findByIdForUser(data.linkedBillInstanceId, ownerUserId)
                : Promise.resolve(null)
        ]);

        if(!primaryAccount){
            throw new Error("Linked account not found");
        }

        if(data.counterpartyAccountId && !counterpartyAccount){
            throw new Error("Linked account not found");
        }

        if(data.linkedBillId && !linkedBill){
            throw new Error("Linked bill not found");
        }

        if (data.linkedBillInstanceId) {
            if(!["expense", "transfer"].includes(data.kind)){
                throw new Error("Only expense or transfer transactions can be linked to bill instances");
            }
            
            if(!linkedBillInstance){
                throw new Error("Bill instance not found");
            }

            if (
                data.linkedBillId &&
                data.linkedBillId !== linkedBillInstance.billId
            ) {
                throw new Error("linkedBillId does not match the bill instance billId");
            }
        }

        const resolvedLinkedBillId = linkedBillInstance
            ? linkedBillInstance.billId
            : data.linkedBillId ?? null;

        this.validateTransactionKindState(data, primaryAccount, counterpartyAccount);

        return this.orm.transaction(async(tx) => {
            const accountsRepository = new AccountsRepository(tx);
            const transactionsRepository = new TransactionsRepository(tx);
            const billInstancesRepository = new BillInstancesRepository(tx);

            const transaction = await transactionsRepository.create({
                ownerUserId,
                kind: data.kind,
                accountId: data.accountId,
                counterpartyAccountId: data.counterpartyAccountId ?? null,
                linkedBillId: resolvedLinkedBillId,
                amountCents: data.amountCents,
                transactionDate: data.transactionDate,
                description: data.description,
                notes: data.notes ?? null,
                linkedBillInstanceId: data.linkedBillInstanceId ?? null
            });

            if(data.kind === "transfer"){
                if(!counterpartyAccount){
                    throw new Error("Linked account not found");
                }

                const {nextSourceBalance, nextDestinationBalance} = 
                    this.applyTransferEffect(primaryAccount, counterpartyAccount, data.amountCents);

                await accountsRepository.updateForUser(primaryAccount.id, ownerUserId, {
                    currentBalanceCents: nextSourceBalance
                });

                await accountsRepository.updateForUser(counterpartyAccount.id, ownerUserId, {
                    currentBalanceCents: nextDestinationBalance
                })

            } else {
                const nextBalance = this.applySingleAccountEffect(
                    primaryAccount,
                    data.amountCents,
                    data.kind
                )

                await accountsRepository.updateForUser(primaryAccount.id, ownerUserId, {
                    currentBalanceCents: nextBalance
                })
            }

            if(transaction.linkedBillInstanceId){
                const billInstance = await billInstancesRepository.findByIdForUser(transaction.linkedBillInstanceId, ownerUserId);

                if(!billInstance) {
                    throw new Error("Bill instance not found");
                }

                const amountPaidCents = 
                    await transactionsRepository.getPaidTotalForBillInstance(ownerUserId, transaction.linkedBillInstanceId);

                const status = this.getBillInstanceStatus(billInstance.amountDueCents, amountPaidCents);

                await billInstancesRepository.updateForUser(
                    transaction.linkedBillInstanceId,
                    ownerUserId,
                    {
                        amountPaidCents,
                        status
                    }
                )
            }

            return transaction;
        })
    }
}