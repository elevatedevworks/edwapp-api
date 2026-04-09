import bcrypt from "bcrypt";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../db/schema";
import { UsersRepository } from "../users/users.repository";
import { toSafeUser } from "../users/users.utils";

type DbClient = NodePgDatabase<typeof schema>;

export class AuthService {
    private readonly usersRepository: UsersRepository;

    constructor(private readonly orm: DbClient) {
        this.usersRepository = new UsersRepository(orm);
    }

    async login(email: string, password: string) {
        const user = await this.usersRepository.findByEmail(email);

        if(!user){
            throw new Error("Invalid credentials");
        }

        if(!user.isActive){
            throw new Error("User account is inactive");
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if(!passwordMatches){
            throw new Error("Invalid credentials");
        }

        return {
            safeUser: toSafeUser(user),
            jwtPayload: {
                sub: user.id,
                email: user.email,
                role: user.role
            }
        }
    }

    async getCurrentUser(userId: string){
        const user = await this.usersRepository.findById(userId);

        if(!user){
            throw new Error("User not found");
        }

        if(!user.isActive){
            throw new Error("User account is inactive");
        }

        return toSafeUser(user);
    }
}