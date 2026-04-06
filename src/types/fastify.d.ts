import "fastify";
import type {Pool} from "pg";
import type {NodePgDatabase} from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema/index.js"

declare module "fastify" {
    interface FasifyInstance {
        db: Pool
        orm: NodePgDatabase<typeof schema>;
    }
}