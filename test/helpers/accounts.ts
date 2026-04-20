import {and, eq} from "drizzle-orm";
import {db} from "../../src/db/index.js";
import {accounts, users} from "../../src/db/schema/index.js";
import { TEST_ACCOUNTS, TEST_USERS } from "./fixtures";
import { ensureTestUser } from "./users.js";

type TestUserKey = keyof typeof TEST_USERS;
type TestAccountKey = keyof typeof TEST_ACCOUNTS;

export async function ensureTestAccount(
    userKey: TestUserKey,
    accountKey: TestAccountKey
) {
    const user = await ensureTestUser(userKey);
    const account = TEST_ACCOUNTS[accountKey];

    if (!user) {
        throw new Error("Test user setup failed")
    }

    const existing = await db
        .select()
        .from(accounts)
        .where(
            and(
                eq(accounts.ownerUserId, user.id),
                eq(accounts.name, account.name)
            )
        )
        .limit(1);

    if (existing[0]){
        await db
            .update(accounts)
            .set({
                type: account.type,
                institution: account.institution,
                currentBalanceCents: account.currentBalanceCents,
                isActive: account.isActive,
                notes: account.notes,
                updatedAt: new Date()
            })
            .where (eq(accounts.id, existing[0].id))

        return existing[0];
    }

    const inserted = await db
        .insert(accounts)
        .values({
            name: account.name,
            type: account.type,
            institution: account.institution,
            currentBalanceCents: account.currentBalanceCents,
            isActive: account.isActive,
            notes: account.notes,
            ownerUserId: user.id,
        })
        .returning();

    return inserted[0];
}

export async function deleteTestAccountsForUser(userEmail: string){
    const foundUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

    const user = foundUser[0];

    if(!user) return;
    
    await db.delete(accounts).where(eq(accounts.ownerUserId, user.id));
}