import { z } from "zod";

export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const connectorSchema = z.object({
  base_url: z.string().url("Invalid URL"),
  username: z.string().min(1, "Username required"),
  secret: z.string().optional().or(z.literal("")),
  project_or_table: z.string().min(1, "Required"),
  sync_interval_seconds: z.coerce.number().int().min(15).max(86400),
  enabled: z.boolean(),
});
export type ConnectorInput = z.infer<typeof connectorSchema>;
