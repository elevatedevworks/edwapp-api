import type { FastifyPluginAsync } from "fastify";
import { env } from "node:process";
import coreRoutes from "../modules/core";
import leadsModule from "../modules/leads";
import financeModule from "../modules/finance";
import healthRoutes from "./health.routes";
import gigModule from "../modules/gig";

function isModuleEnabled(moduleName: string) {
	return env.ENABLED_MODULES?.includes(moduleName);
}

const routes: FastifyPluginAsync = async (fastify) => {
	await fastify.register(healthRoutes);
	await fastify.register(coreRoutes);

	if (isModuleEnabled("leads")) {
		await fastify.register(leadsModule, { prefix: "/leads" });
	}

	if (isModuleEnabled("finance")) {
		await fastify.register(financeModule, { prefix: "/finance" });
	}

	if (isModuleEnabled("gig")) {
		await fastify.register(gigModule, { prefix: "gig" });
	}
};

export default routes;
