import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import { BillsRepository } from "../bills/bills.repository.js";
import { RemindersRepository } from "../reminders/reminders.repository.js";
import { PaymentsRepository } from "../payments/payments.repository.js";
import { AccountsRepository } from "../accounts/accounts.repository.js";
import { BillInstancesRepository } from "../bill-instances/bill-instances.repository.js";
import { TransactionsRepository } from "../transactions/transactions.repository.js";

type DbClient = NodePgDatabase<typeof schema>;

export class ReportService {
    private readonly billsRepository: BillsRepository;
    private readonly remindersRepository: RemindersRepository;
    private readonly paymentsRepository: PaymentsRepository;
    private readonly accountsRepository: AccountsRepository;
    private readonly billInstancesRepository: BillInstancesRepository;
    private readonly transactionsRepository: TransactionsRepository;

    constructor(orm: DbClient){
        this.billsRepository = new BillsRepository(orm);
        this.remindersRepository = new RemindersRepository(orm);
        this.paymentsRepository = new PaymentsRepository(orm);
        this.accountsRepository = new AccountsRepository(orm);
        this.billInstancesRepository = new BillInstancesRepository(orm);
        this.transactionsRepository = new TransactionsRepository(orm);
    }

    private startOfToday(){
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    private startOfDay(date: Date) {
        const day = new Date(date);
        day.setHours(0, 0, 0, 0);
        return day;
    }

    private toLocalDateOnlyString(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    private addDays(date: Date, days: number){
        const next = new Date(date);
        next.setDate(next.getDate() + days);
        return next;
    }

    private getMonthRange(month?: number, year?: number){
        const now = new Date();

        const resolvedMonth = month ?? now.getMonth() + 1;
        const resolvedYear = year ?? now.getFullYear();

        const start = new Date(resolvedYear, resolvedMonth - 1, 1);
        const end = new Date(resolvedYear, resolvedMonth, 1);

        return {month: resolvedMonth, year: resolvedYear, start, end};
    }

    private getCurrentMonthDateRange() {
    const now = new Date();

    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
        startDate: this.toLocalDateOnlyString(start),
        endDate: this.toLocalDateOnlyString(end),
    };
}


    private getDateForMonthDueDay(
        year: number,
        monthIndex: number,
        dueDay: number
    ) {
        const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
        const safeDay = Math.min(dueDay, lastDayOfMonth);

        return new Date(year, monthIndex, safeDay);
    }

    private getExpectedDueDateWithinWindow(
        dueDay: number,
        today: Date,
        windowEnd: Date
    ) {
        const todayStart = this.startOfDay(today);
        const windowEndStart = this.startOfDay(windowEnd);

        const candidates = [
            this.getDateForMonthDueDay(
                todayStart.getFullYear(),
                todayStart.getMonth(),
                dueDay
            ),
            this.getDateForMonthDueDay(
                todayStart.getFullYear(),
                todayStart.getMonth() + 1,
                dueDay
            ),
        ];

        return (
            candidates.find((candidate) => {
                const candidateStart = this.startOfDay(candidate);

                return (
                    candidateStart >= todayStart &&
                    candidateStart <= windowEndStart
                );
            }) ?? null
        );
    }

    private getOverviewDateRange(){
        const today = this.startOfDay(new Date());
        const next7Days = this.addDays(today, 7);
        const next30Days = this.addDays(today, 30);

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        return {
            today,
            next7Days,
            next30Days,
            todayDateString: this.toLocalDateOnlyString(today),
            next7DaysDateString: this.toLocalDateOnlyString(next7Days),
            next30DaysDateString: this.toLocalDateOnlyString(next30Days),
            monthStartDateString: this.toLocalDateOnlyString(monthStart),
            monthEndDateString: this.toLocalDateOnlyString(monthEnd)
        }
    }

    private getCreditCardTotals(accounts: Array<{
        type: string;
        creditLimitCents: number | null;
        currentBalanceCents: number;
    }>){
        const creditCardAccounts = accounts.filter(account =>
            account.type === "credit_card" &&
            account.creditLimitCents != null
        );

        const totalAvailableCreditCents = creditCardAccounts.reduce(
            (sum, account) => 
                sum + ((account.creditLimitCents ?? 0) - account.currentBalanceCents),
            0
        )

        const totalCurrentCreditBalanceCents = creditCardAccounts.reduce(
            (sum, account) => sum + account.currentBalanceCents,
            0
        )

        const totalCreditLimit = creditCardAccounts.reduce(
            (sum, account) => sum + (account.creditLimitCents ?? 0), 0
        )

        return {
            totalAvailableCreditCents,
            totalCurrentCreditBalanceCents,
            totalCreditLimit
        }
    }

    private mapBillInstanceToUpcomingBillItem(instance: {
        id: string;
        billId: string;
        billName: string;
        dueDate: string;
        amountDueCents: number;
        amountPaidCents: number;
        status: string;
    }){
        return {
            billId: instance.billId,
            billName: instance.billName,
            billInstanceId: instance.id,
            dueDate: instance.dueDate,
            amountDueCents: instance.amountDueCents,
            amountPaidCents: instance.amountPaidCents,
            remainingAmountCents: Math.max(
                instance.amountDueCents - instance.amountPaidCents, 0
            ),
            status: instance.status,
            source: "bill_instance" as const,
        }
    }

    private async getUpcomingBillItems(ownerUserId: string, today: Date, windowEnd: Date){
        const endDateString = this.toLocalDateOnlyString(windowEnd);

        const [unpaidInstances, awaitingStatements] = await Promise.all([
            this.billInstancesRepository.findUnpaidOrPartialDueBefore(ownerUserId, endDateString),
            this.getActiveBillsWithoutInstanceDueSoon(ownerUserId)
        ])

        return [
            ...unpaidInstances.map(instance => this.mapBillInstanceToUpcomingBillItem(instance)),
            ...awaitingStatements
        ].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    }

    private getCreditCardMetrics(account: {
        type: string;
        creditLimitCents: number | null;
        currentBalanceCents: number;
    }) {
        if(account.type !== "credit_card" || account.creditLimitCents == null){
            return {
                availableCreditCents: null,
                utilizationPercent: null,
            }
        }

        const availableCreditCents = account.creditLimitCents - account.currentBalanceCents;

        const utilizationPercent = 
            account.creditLimitCents > 0
                ? Math.round((account.currentBalanceCents / account.creditLimitCents) * 100)
                : null
        return {
            availableCreditCents,
            utilizationPercent
        }
    }

    async getOverview(ownerUserId: string, month?: number, year?: number){
        const range = this.getOverviewDateRange();
        const {start, end, month: resolvedMonth, year: resolvedYear} = this.getMonthRange(month, year);

        const [accounts, bills, reminders, cashFlow, upcomingBills] =
            await Promise.all([
                this.accountsRepository.findAllForUser(ownerUserId),
                this.billsRepository.findAllForUser(ownerUserId),
                this.remindersRepository.findAllForUser(ownerUserId),
                this.transactionsRepository.getCashFlowForPeriod(
                    ownerUserId,
                    range.monthStartDateString,
                    range.monthEndDateString
                ),
                this.getUpcomingBillItems(ownerUserId, range.today, range.next30Days)
            ])

        const totalBalanceCents = accounts
        .filter(account => account.type != "credit_card")
        .reduce((sum, account) => sum + account.currentBalanceCents, 0)



        const activeBills = bills.filter(bill => bill.isActive && bill.status === "active");

        const monthlyTotalCents = activeBills
            .filter(bill => bill.frequency === "monthly")
            .reduce((sum, bill) => sum + bill.amountDueCents, 0); 


        const pendingReminders = reminders.filter(reminder => reminder.status === "pending");

        const creditCards = this.getCreditCardTotals(accounts);

        return {
            period: {
                month: resolvedMonth,
                year: resolvedYear,
                startDate: start.toISOString().slice(0, 10),
                endDate: new Date(end.getTime() - 1).toISOString().slice(0, 10)
            },
            accounts: {
                count: accounts.length,
                totalBalanceCents,
            },
            bills: {
                activeCount: activeBills.length,
                monthlyTotalCents
            },
            reminders: {
                pendingCount: pendingReminders.length,
            },
            cashFlow : 
            {
                inflowCents: cashFlow.incomeCents,
                outflowCents: cashFlow.expenseCents,
                netCents: cashFlow.netCashFlowCents
            },
            creditCards,
            upcomingBills
        }
    }

    async getCashFlow(ownerUserId: string, month?: number, year?: number){
        const {start, end, month: resolvedMonth, year: resolvedYear} = this.getMonthRange(month, year);
        const startDate = this.toLocalDateOnlyString(start);
        const endDate = this.toLocalDateOnlyString(new Date(end.getTime() - 1))

        const cashFlow = await this.transactionsRepository.getCashFlowForPeriod(ownerUserId, startDate, endDate);
        console.log(cashFlow);

        return {
            period: {
                month: resolvedMonth,
                year: resolvedYear,
                startDate: start.toISOString().slice(0, 10),
                endDate: new Date(end.getTime() - 1).toISOString().slice(0, 10)
            },
            totals: cashFlow
        }
    };

    async getAccountActivity(
        ownerUserId: string,
        accountId: string,
        month?: number,
        year?: number
    ){
        const {start, end, month: resolvedMonth, year: resolvedYear} = 
            this.getMonthRange(month, year);

        const startDate = this.toLocalDateOnlyString(start)
        const endDate = this.toLocalDateOnlyString(end)

        const account = await this.accountsRepository.findByIdForUser(
            accountId,
            ownerUserId
        )

        if(!account){
            throw new Error("Account not found");
        }

        const transactions = 
            await this.transactionsRepository.findForAccountForPeriod(
                ownerUserId,
                accountId,
                startDate,
                endDate
            );

        const activity = transactions.map(transaction => {
            const isPrimaryAccount = transaction.accountId === accountId;
            const iscounterpartyAccount = transaction.counterpartyAccountId === accountId;

            let direction: "inflow" | "outflow" | "neutral" = "neutral";

            if (transaction.kind === "income"){
                direction = "inflow";
            }

            if(
                transaction.kind === "expense" ||
                transaction.kind === "credit_card_purchase" ||
                transaction.kind === "adjustment"
            ) {
                direction = "outflow";
            }

            if(transaction.kind === "transfer"){
                direction = isPrimaryAccount ? "outflow" : "inflow"
            }

            return {
                id: transaction.id,
                kind: transaction.kind,
                transactionDate: transaction.transactionDate,
                description: transaction.description,
                notes: transaction.notes,
                amountCents: transaction.amountCents,
                direction,
                accountId: transaction.accountId,
                counterpartyAccountId: transaction.counterpartyAccountId,
                linkedBillId: transaction.linkedBillId,
                linkedBillInstanceId: transaction.linkedBillInstanceId,
                isPrimaryAccount,
                iscounterpartyAccount
            }
        });

        const totals = activity.reduce(
            (acc, item) => {
                if(item.direction === "inflow"){
                    acc.inflowCents += item.amountCents
                }
                if(item.direction === "outflow"){
                    acc.outflowCents += item.amountCents;
                }

                return acc;
            },{
                inflowCents: 0,
                outflowCents: 0
            }

        )

        return {
            period: {
                month: resolvedMonth,
                year: resolvedYear,
                startDate: start.toISOString().slice(0, 10),
                endDate: new Date(end.getTime() - 1).toISOString().slice(0, 10),
            },
            account: {
                id: account.id,
                name: account.name,
                type: account.type,
                currentBalanceCents: account.currentBalanceCents,
            },
            totals: {
                ...totals,
                netCents: totals.inflowCents = totals.outflowCents
            },
            activity
        };
    }

    async getSpendingByAccount(ownerUserId: string, month?: number, year?: number){
        const {start, end, month: resolvedMonth, year: resolvedYear} = this.getMonthRange(month, year);

        const [accounts, payments] = await Promise.all([
            this.accountsRepository.findAllForUser(ownerUserId),
            this.paymentsRepository.findAllForUser(ownerUserId)
        ]);

        const periodPayments = payments.filter(payment => {
            const paymentDate = new Date(`${payment.paymentDate}T00:00:00Z`);
            return paymentDate >= start && paymentDate < end;
        });

        const breakdown = accounts
            .map(account => {
                const accountPayments = periodPayments.filter(payment => payment.accountId === account.id);


                const inflowCents = accountPayments
                    .filter(payment => payment.direction === "inflow")
                    .reduce((sum, payment) => sum + payment.amountCents, 0);

                const outflowCents = accountPayments
                    .filter(payment =>  payment.direction === "outflow")
                    .reduce((sum, payment) => sum + payment.amountCents, 0);

                const netCents = inflowCents - outflowCents;
                const creditCardMetrics = this.getCreditCardMetrics(account);

                return {
                    accountId: account.id,
                    accountName: account.name,
                    accountType: account.type,
                    institution: account.institution,
                    currentBalanceCents: account.currentBalanceCents,
                    creditLimitCents: account.creditLimitCents,
                    statementClosingDay: account.statementClosingDay,
                    paymentDueDay: account.paymentDueDay,
                    ...creditCardMetrics,
                    inflowCents,
                    outflowCents,
                    netCents
                }
            })
            .filter(item => item.inflowCents !== 0 || item.outflowCents !== 0)
            .sort((a, b) => b.outflowCents - a.outflowCents);

        const totals = breakdown.reduce((acc, item) => {
            acc.inflowCents += item.inflowCents;
            acc.outflowCents += item.outflowCents;
            acc.netCents += item.netCents;
            return acc;
        },
        {
            inflowCents: 0,
            outflowCents: 0,
            netCents: 0
        });

        return {
            period: {
                month: resolvedMonth,
                year: resolvedYear,
                startDate: start.toISOString().slice(0,10),
                endDate: new Date(end.getTime() - 1).toISOString().slice(0,10)
            },
            totals,
            accounts: breakdown
        }

    }

    async getBillInstanceReport(ownerUserId: string, month?: number, year?: number){
        const {start, end, month: resolvedMonth, year: resolvedYear} = this.getMonthRange(month, year);

        const [billInstances, bills] = await Promise.all([
            this.billInstancesRepository.findByPeriodForUser(ownerUserId, resolvedYear, resolvedMonth),
            this.billsRepository.findAllForUser(ownerUserId),
        ]);

        const items = billInstances.map(billInstance => {
            const linkedBill = bills.find(bill => bill.id === billInstance.billId) ?? null;

            const remainingCents = Math.max(billInstance.amountDueCents - billInstance.amountPaidCents, 0);

            return {
                id: billInstance.id,
                billId: billInstance.billId,
                billName: linkedBill?.name ?? null,
                vendor: linkedBill?.vendor ?? null,
                periodYear: billInstance.periodYear,
                periodMonth: billInstance.periodMonth,
                dueDate: billInstance.dueDate,
                amountDueCents: billInstance.amountDueCents,
                amountPaidCents: billInstance.amountPaidCents,
                remainingCents,
                status: billInstance.status,
                notes: billInstance.notes
            }
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        const totals = items.reduce((acc, item) => {
            acc.count += 1;
            acc.amountDueCents += item.amountDueCents;
            acc.amountPaidCents += item.amountPaidCents;
            acc.remainingCents += item.remainingCents;
            return acc;
        }, {
            count: 0,
            amountDueCents: 0,
            amountPaidCents: 0,
            remainingCents: 0
        })

        const statusCounts = items.reduce((acc, item) => {
            if(item.status in acc){
                acc[item.status as keyof typeof acc] += 1;
            }
            return acc;
        }, {
            unpaid: 0,
            partial: 0,
            paid: 0,
            overdue: 0
        })

        return {
            period: {
                month: resolvedMonth,
                year: resolvedYear,
                startDate: start.toISOString().slice(0, 10),
                endDate: new Date(end.getTime() - 1).toISOString().slice(0, 10)
            },
            totals,
            statusCounts,
            items
        }
    }

    async getActiveBillsWithoutInstanceDueSoon(ownerUserId: string) {
        const today = this.startOfDay(new Date());
        const windowEnd = this.addDays(today, 30);

        const startDateString = this.toLocalDateOnlyString(today);
        const endDateString = this.toLocalDateOnlyString(windowEnd);

        const [activeBills, existingInstances] = await Promise.all([
            this.billsRepository.findActiveForUser(ownerUserId),
            this.billInstancesRepository.findForUserDueBetween(
                ownerUserId,
                startDateString,
                endDateString
            ),
        ]);

        const awaitingStatements = activeBills
            .map((bill) => {
                if (!bill.dueDayOfMonth) {
                    return null;
                }

                const expectedDueDate = this.getExpectedDueDateWithinWindow(
                    bill.dueDayOfMonth,
                    today,
                    windowEnd
                );

                if (!expectedDueDate) {
                    return null;
                }

                const expectedPeriodYear = expectedDueDate.getFullYear();
                const expectedPeriodMonth = expectedDueDate.getMonth() + 1;

                const hasInstanceForExpectedPeriod = existingInstances.some(
                    (instance) => {
                        return (
                            instance.billId === bill.id &&
                            instance.periodYear === expectedPeriodYear &&
                            instance.periodMonth === expectedPeriodMonth
                        );
                    }
                );

                if (hasInstanceForExpectedPeriod) {
                    return null;
                }

                return {
                    billId: bill.id,
                    billName: bill.name,
                    billInstanceId: null,
                    dueDate: this.toLocalDateOnlyString(expectedDueDate),
                    amountDueCents: bill.amountDueCents ?? null,
                    amountPaidCents: 0,
                    remainingAmountCents: bill.amountDueCents ?? null,
                    status: "awaiting_statement" as const,
                    source: "expected_bill" as const,
                };
            })
            .filter((item) => item !== null);

        return awaitingStatements;
    }
}
