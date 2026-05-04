import type { z } from "zod";
import type { accountActivityParamsSchema, reportPeriodQuerySchema } from "./reports.schemas.js";

export type AccountActiviyParams = z.infer<typeof accountActivityParamsSchema>;
export type ReportPeriodQuery = z.infer<typeof reportPeriodQuerySchema>;