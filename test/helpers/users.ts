import bcrypt from "bcrypt";
import {eq} from "drizzle-orm";
import {db} from "../../src/db";
import {users} from "../../src/db/schema";
import { TEST_USERS } from "./fixtures";

const SALT_ROUNDS = 10;

type TestUserKey = keyof typeof TEST_USERS;

export async function ensureTestUser(key: TestUserKey) {
    const testUser = TEST_USERS[key];

    const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, testUser.email))
        .limit(1);

    const passwordHash = await bcrypt.hash(testUser.password, SALT_ROUNDS);

    if (existing[0]){
        await db
            .update(users)
            .set({
                name: testUser.name,
                passwordHash,
                role: testUser.role,
                isActive: testUser.isActive,
                updatedAt: new Date()
            })
            .where(eq(users.email, testUser.email));
        
        return;
    }

    await db.insert(users).values({
        email: testUser.email,
        passwordHash,
        name: testUser.name,
        role: testUser.role,
        isActive: testUser.isActive
    })
}