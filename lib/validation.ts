import { DocumentRole } from "@prisma/client";
import { z } from "zod";
import { MAX_RICH_TEXT_CHARS, MAX_SYNC_EVENT_BYTES, MAX_SYNC_EVENTS_PER_REQUEST } from "@/lib/constants";

const base64Pattern = /^[A-Za-z0-9+/=]*$/;

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(128),
});

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(120).default("Untitled document"),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

const syncUpdateSchema = z.object({
  clientUpdateId: z.string().trim().min(8).max(120),
  update: z
    .string()
    .min(1)
    .max(Math.ceil((MAX_SYNC_EVENT_BYTES * 4) / 3))
    .regex(base64Pattern, "Update must be valid base64"),
  createdAt: z.string().datetime(),
});

export const syncRequestSchema = z.object({
  updates: z.array(syncUpdateSchema).max(MAX_SYNC_EVENTS_PER_REQUEST),
  plainText: z.string().max(MAX_RICH_TEXT_CHARS),
  html: z.string().max(MAX_RICH_TEXT_CHARS * 2),
  revision: z.number().int().positive(),
});

export const versionCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const memberUpsertSchema = z.object({
  email: z.string().trim().email().max(120),
  role: z.nativeEnum(DocumentRole).refine((role) => role !== DocumentRole.OWNER, {
    message: "Only one owner is supported through the members API",
  }),
});

export const memberRoleSchema = z.object({
  memberId: z.string().trim().min(1),
  role: z.nativeEnum(DocumentRole).refine((role) => role !== DocumentRole.OWNER, {
    message: "Use ownership transfer flow for owner role",
  }),
});

export const aiRequestSchema = z.object({
  action: z.enum(["summarize", "improve", "grammar", "continue"]),
  content: z.string().trim().min(1).max(MAX_RICH_TEXT_CHARS),
});
