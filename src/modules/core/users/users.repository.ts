import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema";
import {users} from "../../../db/schema";

type DbClient = NodePgDatabase<typeof schema>;

type CreateUserRecord = {
    email: string;
    passwordHash: string;
    name: string;
    role?: "admin" | "internal" | "client";
    isActive?: boolean;
}

type UpdateUserRecord = {
    email?: string;
    passwordHash?: string;
    name?: string;
    role?: "admin" | "internal" | "client";
    isActive?: boolean;
};

export class UsersRepository {
    constructor(private readonly orm: DbClient){}

    async findAll() {
        return this.orm.select().from(users).orderBy(users.createdAt);
    }

    async findById(id: string) {
        const results = await this.orm.select().from(users).where(eq(users.id, id)).limit(1);

        return results[0] ?? null;
    }

    async findByEmail(email: string) {
        const results = await this.orm.select().from(users).where(eq(users.email, email)).limit(1);

        return results[0] ?? null;
    }

    async create(data: CreateUserRecord) {
        const results = await this.orm
            .insert(users)
            .values({
                email: data.email,
                passwordHash: data.passwordHash,
                name: data.name,
                role: data.role ?? "internal",
                isActive: data.isActive ?? true
            })
            .returning();

        const user = results[0];

        if (!user) {
            throw new Error("User create failed");
        }

        return user;
    }

    async update(id: string, data: UpdateUserRecord){
    const results = await this.orm
      .update(users)
      .set({
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

      return results[0] ?? null
    }
}