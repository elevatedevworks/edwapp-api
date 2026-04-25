import { eq } from "drizzle-orm";
import { payments, users } from "../../src/db/schema/index.js";
import {db} from "../../src/db/index.js";
import { TEST_BILLS, TEST_USERS } from "./fixtures.js";
import { ensureTestUser } from "./users.js";
import { ensureTestAccount } from "./accounts.js";
import { deleteTestBillsForUser, ensureTestBill } from "./bills.js";

type TestUserKey = keyof typeof TEST_USERS;
type TestBillKey = keyof typeof TEST_BILLS;

type createTestPaymentsArgs = {
    ownerUserId: string;
    accountId: string;
    billId?: string | null;
    amountCents?: number;
    paymentDate?: string;
    direction?: "outflow" | "inflow";
    method?: "bank_transfer" | "card" | "cash" | "check" | "autopay" | "other";
    reference?: string | null;
    notes?: string | null;
}

type EnsureTestPaymentsScenarioOptions = {
    includeBill?: boolean;
    accountFixtureKey?: "checking" | "savings";
    billFixtureKey?: TestBillKey;
    amountCents?: number;
    paymentDate?: string;
    direction?: "outflow" | "inflow";
    method?: "bank_transfer" | "card" | "cash" | "check" | "autopay" | "other";
    reference?: string | null;
    notes?: string | null;
}

export async function deleteTestPaymentForUser(userEmail: string){
    const foundUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

    const user = foundUser[0];

    if(!user) return;

    await db.delete(payments).where(eq(payments.ownerUserId, user.id));
}

export async function createTestPayment({
    ownerUserId,
    accountId,
    billId = null,
    amountCents = 500,
    paymentDate = "2026-04-24",
    direction = "outflow",
    method = "cash",
    reference = "Test reference",
    notes = "Test notes"
}: createTestPaymentsArgs) {

    const inserted = await db
        .insert(payments)
        .values({
            ownerUserId,
            accountId,
            billId,
            amountCents,
            paymentDate,
            direction,
            method,
            reference,
            notes
        })
        .returning();

    return inserted[0];
}

export async function ensureTestPaymentScenario(
    userKey: TestUserKey,
    options: EnsureTestPaymentsScenarioOptions = {}
){
    const {
        includeBill = true,
        accountFixtureKey = "checking",
        billFixtureKey = Object.keys(TEST_BILLS)[0] as TestBillKey,
        amountCents = 500,
        paymentDate = "2026-04-24",
        direction = "outflow",
        method = "cash",
        reference = "Test reference",
        notes = "Test notes"
    } = options;

    const user = await ensureTestUser(userKey);
    const account = await ensureTestAccount(userKey, accountFixtureKey);

    await deleteTestPaymentForUser(user.email);

    let bill: Awaited<ReturnType<typeof ensureTestBill>> | null = null;

    if(includeBill){
        await deleteTestBillsForUser(user.email)

        bill = await ensureTestBill(userKey, billFixtureKey, {
            accountId: account.id,
            name: "200 Test for Payments"
        })
    }

    const payment = await createTestPayment({
        ownerUserId: user.id,
        accountId: account.id,
        billId: bill?.id ?? null,
        amountCents,
        paymentDate,
        direction,
        method,
        reference,
        notes
    });

    return {
        user, account, bill, payment
    }
}

