import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3005),
    HOST: z.string().min(1).default("127.0.0.1"),
    DATABASE_URL: z.string().min(1),
    LOG_LEVEL: z.string().min(1).default("info"),
    APP_NAME: z.string().min(1).default("edwapp-api")
})

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;