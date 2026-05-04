import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import { BillsRepository } from "../bills/bills.repository.js";
import { RemindersRepository } from "../reminders/reminders.repository.js";
import { PaymentsRepository } from "../payments/payments.repository.js";
import { AccountsRepository } from "../accounts/accounts.repository.js";

type DbClient = NodePgDatabase<typeof schema>;

type UpcomingBillItem = {
    id: string;
    name: string;
    vendor: string | null;
    amountDueCents: number;
    frequency: string;
    status: string;
    effectiveDueDate: string | null;
};

type UpcomingReminderItem = {
    id: string;
    title: string;
    mode: string;
    status: string;
    billId: string | null;
    effectiveRemindAt: string | null;
}

export class ReportService {
    private readonly billsRepository: BillsRepository;
    private readonly remindersRepository: RemindersRepository;
    private readonly paymentsRepository: PaymentsRepository;
    private readonly accountsRepository: AccountsRepository

    constructor(orm: DbClient){
        this.billsRepository = new BillsRepository(orm);
        this.remindersRepository = new RemindersRepository(orm);
        this.paymentsRepository = new PaymentsRepository(orm);
        this.accountsRepository = new AccountsRepository(orm);
    }

    private formatDateOnly(date: Date){
        return date.toISOString().slice(0,10);
    }

    private formateDateTime(date: Date){
        return date.toISOString();
    }

    private startOfToday(){
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    private addDays(date: Date, days: number){
        const next = new Date(date);
        next.setDate(next.getDate() + days);
        return next;
    }

    private subtractDays(date: Date, days: number){
        const next = new Date(date);
        next.setDate(next.getDate() - days);
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

    private getMonthlyDueDate(dayOfMonth: number, baseDate = new Date()){
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();

        const thisMonth = new Date(year, month, dayOfMonth);

        if(thisMonth >= this.startOfToday()){
            return thisMonth;
        }

        return new Date(year, month + 1, dayOfMonth);
    }

    private getBillEffectiveDueDate(bill: {
        frequency: string;
        dueDate: string | null;
        dueDayOfMonth: number | null;
        isActive: boolean;
        status: string;
    }){
        if(!bill.isActive || bill.status !== "active"){
            return null;
        }
        if(bill.frequency === "one_time"){
            if(!bill.dueDate) return null;
            return new Date(`${bill.dueDate}T00:00:00Z`);
        }

        if(bill.frequency === "monthly"){
            if(bill.dueDayOfMonth == null) return null;
            return this.getMonthlyDueDate(bill.dueDayOfMonth);
        }

        return null;
    }

    private getReminderEffectiveDate(
        reminder: {
            mode: string;
            remindAt: Date | string | null;
            offsetDays: number | null;
            billId: string | null;
        },
        billDueDate: Date | null
    ){
        if(reminder.mode === "absolute"){
            if(!reminder.remindAt) return null;
            return reminder.remindAt instanceof Date
                ? reminder.remindAt
                : new Date(reminder.remindAt)
        }

        if(reminder.mode === "bill_offset"){
            if(!billDueDate || reminder.offsetDays == null) return null;
            return this.subtractDays(billDueDate, reminder.offsetDays);
        }

        return null;
    }

    private async getReportData(ownerUserId: string) {
        const [accounts, bills, payments, reminders] = await Promise.all([
            this.accountsRepository.findAllForUser(ownerUserId),
            this.billsRepository.findAllForUser(ownerUserId),
            this.paymentsRepository.findAllForUser(ownerUserId),
            this.remindersRepository.findAllForUser(ownerUserId),
        ]);

        return { accounts, bills, payments, reminders };
    }

    async getOverview(ownerUserId: string, month?: number, year?: number){

        const {accounts, bills, payments, reminders} = await this.getReportData(ownerUserId);

        const today = this.startOfToday();
        const next7Days = this.addDays(today, 7);
        const {start, end, month: resolvedMonth, year: resolvedYear} = this.getMonthRange(month, year);

        const totalBalanceCents = accounts.reduce((sum, account) => sum + account.currentBalanceCents, 0)

        const activeBills = bills.filter(bill => bill.isActive && bill.status === "active");

        const monthlyTotalCents = activeBills
            .filter(bill => bill.frequency === "monthly")
            .reduce((sum, bill) => sum + bill.amountDueCents, 0); 

        const billsWithDates = activeBills
            .map(bill => {
                const effectiveDueDate = this.getBillEffectiveDueDate(bill);
                return {
                    ...bill,
                    effectiveDueDate
                }
            })
            .filter(bill => bill.effectiveDueDate !== null);

        const overdueCount = billsWithDates.filter(bill => bill.effectiveDueDate! < today).length;

        const upcomingCount = billsWithDates
            .filter(bill => 
                bill.effectiveDueDate! >= today && bill.effectiveDueDate! <= next7Days)
            .length;

        const pendingReminders = reminders.filter(reminder => reminder.status === "pending");
        
        const upcomingReminderCount = pendingReminders
            .map(reminder => {
                const linkedBill = 
                reminder.billId != null
                    ? billsWithDates.find(bill => bill.id === reminder.billId) ?? null
                    : null;

                return this.getReminderEffectiveDate(reminder, linkedBill?.effectiveDueDate ?? null)
            })
            .filter(
                effectiveRemindAt => 
                    effectiveRemindAt !== null &&
                    effectiveRemindAt >= today &&
                    effectiveRemindAt <= next7Days
            ).length;

        const periodPayments = payments.filter(payment => {
            const paymentDate = new Date(`${payment.paymentDate}T00:00:00Z`)
            return paymentDate >= start && paymentDate < end;
        });

        const inflowCents = periodPayments
            .filter(payment => payment.direction === "inflow")
            .reduce((sum, payments) => sum + payments.amountCents, 0);

        const outflowCents = periodPayments
            .filter(payment => payment.direction === "outflow")
            .reduce((sum, payment) => sum + payment.amountCents, 0)

        const netCents = inflowCents - outflowCents;

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
                overdueCount,
                upcomingCount,
                monthlyTotalCents
            },
            reminders: {
                pendingCount: pendingReminders.length,
                upcomingCount: upcomingReminderCount
            },
            cashFlow: {
                inflowCents,
                outflowCents,
                netCents
            }
        }
    }

    async getUpcoming(ownerUserId: string){
        const [bills, reminders] = await Promise.all([
            this.billsRepository.findAllForUser(ownerUserId),
            this.remindersRepository.findAllForUser(ownerUserId)
        ])

        const today = this.startOfToday();
        const next7Days = this.addDays(today, 7);

        const billsWithDates = bills
            .map(bill => {
                const effectiveDueDate = this.getBillEffectiveDueDate(bill);

                return {...bill, effectiveDueDate};
            })
            .filter(bill => bill.effectiveDueDate !== null);

        const overdueBills: UpcomingBillItem[] = billsWithDates
            .filter(bill => bill.effectiveDueDate! < today)
            .sort(
                (a, b) => a.effectiveDueDate!.getTime() - b.effectiveDueDate!.getTime()
            )
            .map(bill => ({
                id: bill.id,
                name: bill.name,
                vendor: bill.vendor,
                amountDueCents: bill.amountDueCents,
                frequency: bill.frequency,
                status: bill.status,
                effectiveDueDate: this.formatDateOnly(bill.effectiveDueDate!)
            }))

        const upcomingBills: UpcomingBillItem[] = billsWithDates
            .filter(
                bill =>
                    bill.effectiveDueDate! >= today && bill.effectiveDueDate!.getTime()
            )
            .sort(
                (a, b) => a.effectiveDueDate!.getTime() - b.effectiveDueDate!.getTime()
            )
            .map(bill => ({
                id: bill.id,
                name: bill.name,
                vendor: bill.vendor,
                amountDueCents: bill.amountDueCents,
                frequency: bill.frequency,
                status: bill.status,
                effectiveDueDate: this.formatDateOnly(bill.effectiveDueDate!)
            }))

        const upcomingReminders: UpcomingReminderItem[] = reminders
            .filter(reminder => reminder.status === "pending")
            .map(reminder => {
                const linkedBill = reminder.billId
                    ? billsWithDates.find(bill => bill.id === reminder.billId) ?? null
                    : null;

                const effectiveRemindAt = this.getReminderEffectiveDate(
                    reminder,
                    linkedBill?.effectiveDueDate ?? null
                );

                return {
                    id: reminder.id,
                    title: reminder.title,
                    mode: reminder.mode,
                    status: reminder.status,
                    billId: reminder.billId,
                    effectiveRemindAt
                };
            })
            .filter(reminder => 
                reminder.effectiveRemindAt !== null &&
                reminder.effectiveRemindAt >= today &&
                reminder.effectiveRemindAt <= next7Days
            )
            .sort(
                (a, b) => a.effectiveRemindAt!.getTime() - b.effectiveRemindAt!.getTime()
            )
            .slice(0,10)
            .map(reminder => ({
                id: reminder.id,
                title: reminder.title,
                mode: reminder.mode,
                status: reminder.status,
                billId: reminder.billId,
                effectiveRemindAt: this.formateDateTime(reminder.effectiveRemindAt!)
            }));

        return {
            bills: {
                overdue: overdueBills,
                upcoming: upcomingBills,
            },
            reminders: {
                upcoming: upcomingReminders
            }
        }

    }

    async getCashFlow(ownerUserId: string, month?: number, year?: number){
        const payments = await this.paymentsRepository.findAllForUser(ownerUserId);

        const {start, end, month: resolvedMonth, year: resolvedYear} = this.getMonthRange(month, year);

        const thisMonthPayments = payments.filter(payment => {
            const paymentDate = new Date(`${payment.paymentDate}T00:00:00Z`);
            return paymentDate >= start && paymentDate < end;
        });

        console.log("This months payments", month);

        const inflowCents = thisMonthPayments
            .filter(payment => payment.direction === "inflow")
            .reduce((sum, payment) => sum + payment.amountCents, 0);

        const outflowCents = thisMonthPayments
            .filter(payment => payment.direction === "outflow")
            .reduce((sum, payment) => sum + payment.amountCents, 0);

        const netCents = inflowCents - outflowCents;

        const byMethod = thisMonthPayments.reduce<Record<string, number>>(
            (acc, payment) => {
                acc[payment.method] = (acc[payment.method] ?? 0) + payment.amountCents;
                return acc;
            },{}
        );

        return {
            period: {
                month: resolvedMonth,
                year: resolvedYear,
                startDate: start.toISOString().slice(0, 10),
                endDate: new Date(end.getTime() - 1).toISOString().slice(0, 10)
            },
            totals: {
                inflowCents,
                outflowCents,
                netCents
            },
            counts: {
                payments: thisMonthPayments.length
            },
            breakdown: {
                byMethod
            },
            recent: [...thisMonthPayments]
                .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
                .slice(0, 10)
        }
    };

    async getAccountActivity(
        ownerUserId: string,
        accountId: string,
        month?: number,
        year?: number
    ){
        const account = await this.accountsRepository.findByIdForUser(
            accountId,
            ownerUserId
        )

        if(!account){
            throw new Error("Account not found");
        }

        const {start, end, month: resolvedMonth, year: resolvedYear} = 
            this.getMonthRange(month, year);

        const [payments, bills] = await Promise.all([
            this.paymentsRepository.findAllForUser(ownerUserId),
            this.billsRepository.findAllForUser(ownerUserId)
        ]);

        const accountPayments = payments.filter(payment => payment.accountId === accountId);

        const periodPayments = accountPayments.filter(payment => {
            const paymentDate = new Date(`${payment.paymentDate}T00:00:00Z`);
            return paymentDate >= start && paymentDate < end;
        });

        const inflowCents = periodPayments
            .filter(payment => payment.direction === "inflow")
            .reduce((sum, payment) => sum + payment.amountCents, 0)

        const outflowCents = periodPayments
            .filter(payment => payment.direction === "outflow")
            .reduce((sum, payment) => sum + payment.amountCents, 0)

        const netCents = inflowCents - outflowCents;

        const linkedActiveBills = bills
            .filter(bill => 
                bill.accountId === accountId &&
                bill.isActive &&
                bill.status === "active"
            )
            .map(bill => ({
                id: bill.id,
                name: bill.name,
                vendor: bill.vendor,
                amountDueCents: bill.amountDueCents,
                frequency: bill.frequency,
                dueDate: bill.dueDate,
                dueDayofMonth: bill.dueDayOfMonth,
                status: bill.status
            }));

        const recentPayments = [...accountPayments]
            .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
            .slice(0, 10);

        return {
            account: {
                id: account.id,
                name: account.name,
                type: account.type,
                institution: account.institution,
                currentBalanceCents: account.currentBalanceCents,
                isActive: account.isActive,
            },
            period: {
                month: resolvedMonth,
                year: resolvedYear,
                startDate: start.toISOString().slice(0, 10),
                endDate: new Date(end.getTime() - 1).toISOString().slice(0, 10),
            },
            totals: {
                inflowCents,
                outflowCents,
                netCents,
            },
            payments: {
                recent: recentPayments,
            },
            bills: {
                linkedActive: linkedActiveBills,
            },
        };
    }


}
