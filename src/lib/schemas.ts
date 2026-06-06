import { z } from "zod";

export const profileSchema = z.object({
  version: z.string(),
  identity: z.object({
    name: z.string(),
    headline: z.string(),
    location: z.string(),
    links: z.array(z.string()),
  }),
  summary: z.string(),
  experience: z.array(z.unknown()),
  projects: z.array(z.unknown()),
  education: z.array(z.unknown()),
  skills: z.array(z.unknown()),
});

export type Profile = z.infer<typeof profileSchema>;

export const preferencesSchema = z.object({
  target_roles: z.array(z.string()),
  target_locations: z.array(z.string()),
  remote: z.string(),
  deal_breakers: z.array(z.string()),
  notes: z.string(),
});

export const evidenceSchema = z.object({
  version: z.string(),
  claims: z.array(
    z.object({
      id: z.string(),
      claim: z.string(),
      strength: z.enum(["strong", "transferable", "missing", "needs_review"]),
      sources: z.array(z.unknown()).default([]),
      allowed_uses: z.array(z.string()).default([]),
      risk: z.string().optional(),
    })
  ),
});

export type Evidence = z.infer<typeof evidenceSchema>;

export const jobSchema = z.object({
  version: z.string(),
  id: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().default(""),
  employment_type: z.string().optional(),
  compensation: z.string().optional(),
  source: z.object({
    type: z.enum(["file", "url"]),
    platform: z.string().optional(),
    external_id: z.string().optional(),
    url: z.string().optional(),
    file: z.string().optional(),
    captured_at: z.string(),
  }),
  description_text: z.string().min(1),
  keywords: z.array(z.string()).default([]),
  status: z.enum(["ingested", "evaluated", "drafted", "reviewed", "submitted"]).default("ingested"),
});

export type JobRecord = z.infer<typeof jobSchema>;
