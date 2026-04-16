
import type { CreateClientInput, UpdateClientInput } from "./clients.types.js";
import { ClientsRepository } from "./clients.repository.js";
import type * as schema from "../../../db/schema/index.js"
import { NodePgDatabase } from "drizzle-orm/node-postgres";

type DbClient = NodePgDatabase<typeof schema>

export class ClientsService {
    private readonly repository: ClientsRepository;

    constructor(orm: DbClient) {
        this.repository = new ClientsRepository(orm);
    }

    async listClients(){
        return this.repository.findAll();
    }

    async getClientById(id: string) {
        const client = await this.repository.findById(id);

        if (!client) {
            throw new Error("Client not found");
        }

        return client;
    }

    async createClient(data: CreateClientInput) {
        const existingClient = await this.repository.findBySlug(data.slug);

        if(existingClient) {
            throw new Error("Client slug already exists");
        }

        return this.repository.create(data);
    }

    async updateClient(id: string, data: UpdateClientInput) {
        const existingClient = await this.repository.findById(id);

        if (!existingClient) {
            throw new Error("Client not found");
        }

        if (data.slug && data.slug !== existingClient.slug) {
            const slugOwner = await this.repository.findBySlug(data.slug);

            if (slugOwner && slugOwner.id !== id) {
                throw new Error("Client slug already exists");
            }
        }

        const updatedClient  = await this.repository.update(id, data);

        if (!updatedClient) {
            throw new Error("Client update failed");
        }

        return updatedClient;
    }


}