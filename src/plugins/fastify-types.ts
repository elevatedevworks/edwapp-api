import "fastify";
import "@fastify/jwt";

import type { Pool } from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema/index.js";

export type AppJwtUser = {
  sub: string;
  email: string;
  role: "admin" | "internal" | "client"
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AppJwtUser;
    user: AppJwtUser;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    db: Pool;
    orm: NodePgDatabase<typeof schema>;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRoles: (
      allowedRoles: Array<"admin" | "internal" | "client">
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export {};