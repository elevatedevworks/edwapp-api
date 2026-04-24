import { and, eq } from "drizzle-orm";
import { bills, users } from "../../src/db/schema/index.js";
import {db} from "../../src/db/index.js";
import { TEST_BILLS, TEST_USERS } from "./fixtures.js";
import { ensureTestUser } from "./users.js";

type TestUserKey = keyof typeof TEST_USERS;
type TestBillKey = keyof typeof TEST_BILLS;

export async function ensureTestBill(
    userKey: TestUserKey,
    billKey: TestBillKey
){
    const user = await ensureTestUser(userKey);
    const bill = TEST_BILLS[billKey];

    if(!user){
        throw new Error("Test user setup failed")
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
                vendor: bill.vendor,
                amountDueCents: bill.amountDueCents,
                dueDate: bill.dueDate,
                dueDayOfMonth: bill.dueDayOfMonth,
                frequency: bill.frequency,
                status: bill.status,
                autopay: bill.autopay,
                notes: bill.notes,
                isActive: bill.isActive,
                updatedAt: new Date()
            })
            .where(eq(bills.id, existing[0].id));

        return existing[0];
    }

    const inserted = await db
        .insert(bills)
        .values({
            name: bill.name,
            vendor: bill.vendor,
            amountDueCents: bill.amountDueCents,
            dueDate: bill.dueDate,
            dueDayOfMonth: bill.dueDayOfMonth,
            frequency: bill.frequency,
            status: bill.status,
            autopay: bill.autopay,
            notes: bill.notes,
            isActive: bill.isActive,
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