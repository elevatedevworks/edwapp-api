import bcrypt from "bcrypt";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../db/schema";
import type {CreateUserInput, UpdateUserInput} from "./users.types";
import {UsersRepository} from "./users.repository";
import { toSafeUser } from "./users.utils";

type DbClient = NodePgDatabase<typeof schema>;

const SALT_ROUNDS = 10;

export class UsersService {
    private readonly repository: UsersRepository;

    constructor(orm: DbClient) {
        this.repository = new UsersRepository(orm);
    }

    async listUsers() {
        const users = await this.repository.findAll();
        return users.map(user => toSafeUser(user));
    }

    async getUserById(id: string) {
        const user = await this.repository.findById(id);

        if (!user) {
            throw new Error("User not found");
        }

        return toSafeUser(user);
    }

    async createUser(data: CreateUserInput) {
        const existingUser = await this.repository.findByEmail(data.email);

        if (existingUser) {
            throw new Error("User email already exists");
        }

        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        const user = await this.repository.create({
            email: data.email,
            passwordHash,
            name: data.name,
            role: data.role ?? "internal",
            isActive: data.isActive ?? true
        })

        return toSafeUser(user);
    }

    async updateUser(id: string, data: UpdateUserInput){
        const existingUser = await this.repository.findById(id);

        if(!existingUser){
            throw new Error("User not found");
        }

        if (data.email && data.email != existingUser.email){
            const emailOwner = await this.repository.findByEmail(data.email);

            if(emailOwner && emailOwner.id !== id) {
                throw new Error("User email already exists");
            }
        }

        let passwordHash: string | undefined;

        if(data.password){
            passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
        }

        const updatedUser = await this.repository.update(id, {
            ...(data.email !== undefined ? {email: data.email}: {}),
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.role !== undefined ? { role: data.role } : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
            ...(passwordHash !== undefined ? { passwordHash } : {}),
        });

        if(!updatedUser) {
            throw new Error("User update failed");
        }

        return toSafeUser(updatedUser);
    }
}