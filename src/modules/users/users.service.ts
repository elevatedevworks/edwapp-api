import bcrypt from "bcrypt";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../db/schema";
import type {CreateUserInput, UpdateUserInput} from "./users.types";
import {UsersRepository} from "./users.repository";

type DbClient = NodePgDatabase<typeof schema>;

const SALT_ROUNDS = 10;

export class UsersService {
    private readonly repository: UsersRepository;

    constructor(orm: DbClient) {
        this.repository = new UsersRepository(orm);
    }

    private toSafeUser(user: {
        id: string;
        email: string;
        name: string;
        role: "admin" | "internal" | "client";
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
    }

    async listUsers() {
        const users = await this.repository.findAll();
        return users.map(user => this.toSafeUser(user));
    }

    async getUserById(id: string) {
        const user = await this.repository.findById(id);

        if (!user) {
            throw new Error("User not found");
        }

        return this.toSafeUser(user);
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

        return this.toSafeUser(user);
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

        return this.toSafeUser(updatedUser);
    }
}