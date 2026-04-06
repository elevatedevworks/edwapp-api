import { Pool } from "pg";
import { drizzle} from "drizzle-orm/node-postgres";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js"

export const pool = new Pool({
    connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, {schema});

export async function checkDatabaseConnection(): Promise<void> {
    const client = await pool.connect();
    try{
        await client.query("SELECT 1");
    } finally {
        client.release();
    }
}