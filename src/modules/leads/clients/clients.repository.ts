import {eq} from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "../../../db/schema/index.js";
import {clients} from "../../../db/schema/index.js";
import type {CreateClientInput, UpdateClientInput} from "./clients.types.js";

type DbClient = NodePgDatabase<typeof schema>

export class ClientsRepository {
    constructor(private readonly orm: DbClient) {}

    async findAll() {
        return this.orm.select().from(clients).orderBy(clients.createdAt);
    }

    async findById(id: string) {
        const results = await this.orm.select().from(clients).where(eq(clients.id, id)).limit(1);

        return results[0] ?? null;
    }

    async findBySlug(slug: string) {
        const results = await this.orm.select().from(clients).where(eq(clients.slug,slug)).limit(1);
    
        return results[0] ?? null;
    }

    async create(data:CreateClientInput) {
        const results = await this.orm.insert(clients).values({
            name: data.name,
            slug: data.slug,
            companyType: data.companyType ?? null,
            primaryContactName: data.primaryContactName ?? null,
            primaryContactEmail: data.primaryContactEmail ?? null,
            primaryContactPhone: data.primaryContactPhone ?? null,
            websiteUrl: data.websiteUrl ?? null,
            status: data.status ?? "lead",
            notes: data.notes ?? null
        })
        .returning();

        const client = results[0];

        if (!client){
          throw new Error("Client create failed");
        }
        
        return client;
    }

  async update(id: string, data: UpdateClientInput) {
    const results = await this.orm
      .update(clients)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.companyType !== undefined ? { companyType: data.companyType } : {}),
        ...(data.primaryContactName !== undefined
          ? { primaryContactName: data.primaryContactName }
          : {}),
        ...(data.primaryContactEmail !== undefined
          ? { primaryContactEmail: data.primaryContactEmail }
          : {}),
        ...(data.primaryContactPhone !== undefined
          ? { primaryContactPhone: data.primaryContactPhone }
          : {}),
        ...(data.websiteUrl !== undefined ? { websiteUrl: data.websiteUrl } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();

    return results[0] ?? null;
  }
}