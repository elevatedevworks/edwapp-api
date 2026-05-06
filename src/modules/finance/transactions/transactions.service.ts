import type * as schema from "../../../db/schema/index.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AccountsRepository } from "../accounts/accounts.repository.js";
import { BillsRepository } from "../bills/bills.repository.js";
import { TransactionsRepository} from "./transactions.repository.js";
import type { CreateTransactionInput, TransactionKind } from "./transactions.types.js";


type DbClient = NodePgDatabase<typeof schema>;

type AccountRecord = Awaited<ReturnType<AccountsRepository["findByIdForUser"]>>;

export class TransactionsService{
    private readonly orm: DbClient;
    private readonly repository: TransactionsRepository;
    private readonly accountsRepository: AccountsRepository;
    private readonly billsRepository: BillsRepository;

    constructor(orm: DbClient){
        this.orm = orm;
        this.repository = new TransactionsRepository(orm);
        this.accountsRepository = new AccountsRepository(orm);
        this.billsRepository = new BillsRepository(orm);
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
        const [primaryAccount, counterpartyAccount, linkedBill] = await Promise.all([
            this.accountsRepository.findByIdForUser(data.accountId, ownerUserId),
            data.counterpartyAccountId
                ? this.accountsRepository.findByIdForUser(data.counterpartyAccountId, ownerUserId)
                : Promise.resolve(null),
            data.linkedBillId
                ? this.billsRepository.findByIdForUser(data.linkedBillId, ownerUserId)
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

        this.validateTransactionKindState(data, primaryAccount, counterpartyAccount);

        return this.orm.transaction(async(tx) => {
            const accountsRepository = new AccountsRepository(tx);
            const transactionsRepository = new TransactionsRepository(tx);

            const transaction = await transactionsRepository.create({
                ownerUserId,
                kind: data.kind,
                accountId: data.accountId,
                counterpartyAccountId: data.counterpartyAccountId ?? null,
                linkedBillId: data.linkedBillId ?? null,
                amountCents: data.amountCents,
                transactionDate: data.transactionDate,
                description: data.description,
                notes: data.notes ?? null
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

                return transaction;
            }

            const nextBalance = this.applySingleAccountEffect(
                primaryAccount,
                data.amountCents,
                data.kind
            )

            await accountsRepository.updateForUser(primaryAccount.id, ownerUserId, {
                currentBalanceCents: nextBalance
            })

            return transaction;
        })
    }
}