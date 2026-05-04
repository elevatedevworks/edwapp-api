import type { z } from "zod";
import type { reportPeriodQuerySchema } from "./finance.schemas.js";

export type ReportPeriodQuery = z.infer<typeof reportPeriodQuerySchema>;