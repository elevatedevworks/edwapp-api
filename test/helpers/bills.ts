import { and, eq } from "drizzle-orm";
import { bills, users } from "../../src/db/schema/index.js";
import {db} from "../../src/db/index.js";
import { TEST_BILLS, TEST_USERS } from "./fixtures.js";
import { ensureTestUser } from "./users.js";

type TestUserKey = keyof typeof TEST_USERS;
type TestBillKey = keyof typeof TEST_BILLS;

type EnsureTestBillOverrides = Partial<{
    name: string;
    vendor: string | null;
    accountId: string | null;
    amountDueCents: number;
    dueDate: string | null;
    dueDayOfMonth: number | null;
    frequency: "one_time" | "weekly" | "monthly" | "quarterly" | "annual";
    status: "active" | "paused" | "paid" | "archived";
    autopay: boolean;
    notes: string | null;
    isActive: boolean;
}>;

export async function ensureTestBill(
    userKey: TestUserKey,
    billKey: TestBillKey,
    overrides: EnsureTestBillOverrides = {}
){
    const user = await ensureTestUser(userKey);
    const bill = TEST_BILLS[billKey];

    if(!user){
        throw new Error("Test user setup failed")
    }

    const billData = {
        name: overrides.name ?? bill.name,
        vendor: overrides.vendor ?? bill.vendor,
        accountId: overrides.accountId ?? null,
        amountDueCents: overrides.amountDueCents ?? bill.amountDueCents,
        dueDate: overrides.dueDate ?? bill.dueDate,
        dueDayOfMonth: overrides.dueDayOfMonth ?? bill.dueDayOfMonth,
        frequency: overrides.frequency ?? bill.frequency,
        status: overrides.status ?? bill.status,
        autopay: overrides.autopay ?? bill.autopay,
        notes: overrides.notes ?? bill.notes,
        isActive: overrides.isActive ?? bill.isActive
    }

    const existing = await db
        .select()
        .from(bills)
        .where(
            and(
                eq(bills.ownerUserId, user.id),
                eq(bills.name, bill.name)
            )
        )
        .limit(1);

    if(existing[0]){
        await db
            .update(bills)
            .set({
                vendor: billData.vendor,
                amountDueCents: billData.amountDueCents,
                dueDate: billData.dueDate,
                dueDayOfMonth: billData.dueDayOfMonth,
                frequency: billData.frequency,
                status: billData.status,
                autopay: billData.autopay,
                notes: billData.notes,
                isActive: billData.isActive,
                updatedAt: new Date()
            })
            .where(eq(bills.id, existing[0].id));

        const refreshed = await db
            .select()
            .from(bills)
            .where(eq(bills.id, existing[0].id))
            .limit(1);

        return refreshed[0];
    }

    const inserted = await db
        .insert(bills)
        .values({
            name: billData.name,
            vendor: billData.vendor,
            amountDueCents: billData.amountDueCents,
            dueDate: billData.dueDate,
            dueDayOfMonth: billData.dueDayOfMonth,
            frequency: billData.frequency,
            status: billData.status,
            autopay: billData.autopay,
            notes: billData.notes,
            isActive: billData.isActive,
            ownerUserId: user.id
        })
        .returning();

    return inserted[0];
}

export async function deleteTestBillsForUser(userEmail: string){
    const foundUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

    const user = foundUser[0];

    if(!user) return;

    await db.delete(bills).where(eq(bills.ownerUserId, user.id));
}