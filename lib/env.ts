import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  AI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsedEnv = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  AI_API_KEY: process.env.AI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

export const env = parsedEnv;

export function assertSafeJwtSecret() {
  if (
    env.NODE_ENV === "production" &&
    env.JWT_SECRET === "change-this-super-secret-jwt-key"
  ) {
    throw new Error("JWT_SECRET must be changed before running in production");
  }
}
