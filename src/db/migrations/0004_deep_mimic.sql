CREATE TYPE "public"."direction" AS ENUM('outflow', 'inflow');--> statement-breakpoint
CREATE TYPE "public"."method" AS ENUM('bank_transfer', 'card', 'cash', 'check', 'autopay', 'other');