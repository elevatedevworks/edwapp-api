import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import { AccountsRepository } from "../accounts/accounts.repository.js";
import { BillsRepository } from "../bills/bills.repository.js";
import { PaymentsRepository } from "../payments/payments.repository.js";
import { RemindersRepository } from "../reminders/reminders.repository.js";

type DbClient = NodePgDatabase<typeof schema>;

export class SummaryService {
    private readonly accountsRepository: AccountsRepository;
    private readonly billsRepository: BillsRepository;
    private readonly paymentsRepository: PaymentsRepository;
    private readonly remindersRepository: RemindersRepository;

    constructor(orm: DbClient) {
        this.accountsRepository = new AccountsRepository(orm);
        this.billsRepository = new BillsRepository(orm);
        this.paymentsRepository = new PaymentsRepository(orm);
        this.remindersRepository = new RemindersRepository(orm);
    }

    async getSummary(ownerUserId: string){
        const [accounts, bills, payments, reminders] = await Promise.all([
            this.accountsRepository.findAllForUser(ownerUserId),
            this.billsRepository.findAllForUser(ownerUserId),
            this.paymentsRepository.findAllForUser(ownerUserId),
            this.remindersRepository.findAllForUser(ownerUserId)
        ]);

        const totalBalanceCents = accounts.reduce(
            (sum, account) => sum + account.currentBalanceCents, 0);

        const activeBills = bills.filter(bill => bill.isActive ?? bill.status === "active");

        const monthlyTotalCents = activeBills
            .filter(bill => bill.frequency === "monthly")
            .reduce((sum, bill) => sum + bill.amountDueCents, 0);

        const recentPayments = [...payments]
            .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
            .slice(0, 5);

        const upcomingReminders = reminders
            .filter(
                reminder => 
                    reminder.status === "pending" &&
                    reminder.mode === "absolute" &&
                    reminder.remindAt
            )
            .sort((a, b) => a.remindAt!.localeCompare(b.remindAt!))
            .slice(0, 5);

        return {
            accounts: {
                count: accounts.length,
                totalBalanceCents
            },
            bills: {
                activeCount: activeBills.length,
                monthlyTotalCents
            },
            payments: {
                recent: recentPayments
            },
            reminders: {
                upcoming: upcomingReminders
            }
        }
    }
}