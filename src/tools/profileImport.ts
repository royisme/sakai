import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { evidenceSchema, profileSchema } from "../lib/schemas";

export type ProfileImportOptions = {
  cwd: string;
  workspacePath: string;
  sourceFile: string;
};

export type ProfileImportResult = {
  ok: boolean;
  workspace: string;
  sourceFile: string;
  written: string[];
  imported: {
    experience: number;
    projects: number;
    education: number;
    skills: number;
    evidenceClaims: number;
  };
};

type JsonRecord = Record<string, unknown>;

function resolveWorkspace(cwd: string, workspacePath: string): string {
  return path.isAbsolute(workspacePath)
    ? workspacePath
    : path.resolve(cwd, workspacePath);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function compactStrings(values: unknown[]): string[] {
  return values.filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function sourceFileAbsolute(cwd: string, sourceFile: string): string {
  return path.isAbsolute(sourceFile) ? sourceFile : path.resolve(cwd, sourceFile);
}

function flattenSkills(skills: unknown, baseline: unknown): string[] {
  const result: string[] = [];

  for (const value of Object.values(asRecord(skills))) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          result.push(item);
        } else if (isRecord(item)) {
          result.push(asString(item.name));
          result.push(asString(item.language));
        }
      }
    }
  }

  for (const category of asArray(asRecord(baseline).technical_skills_categories)) {
    const skillsText = asString(asRecord(category).skills);
    if (skillsText.length > 0) {
      result.push(...skillsText.split(","));
    }
  }

  return unique(result);
}

function importProfile(source: JsonRecord) {
  const personal = asRecord(source.personal);
  const location = asRecord(personal.location);
  const summary = asRecord(source.summary);
  const baseline = asRecord(source.resume_baseline);
  const links = compactStrings([personal.linkedin, personal.github, personal.portfolio, personal.website]);

  return profileSchema.parse({
    version: "0.1",
    identity: {
      name: asString(personal.name),
      headline: asString(summary.tagline) || asString(summary.career_level),
      location: asString(location.display),
      links,
    },
    summary: asString(baseline.professional_summary) || asString(summary.bio),
    experience: asArray(source.experience),
    projects: [...asArray(source.projects), ...asArray(source.open_source)],
    education: asArray(source.education),
    skills: flattenSkills(source.skills, baseline),
  });
}

function claimId(prefix: string, sourceId: string, index: number): string {
  const safeSourceId = sourceId.replace(/[^a-zA-Z0-9_-]+/g, "_");
  return `${prefix}_${safeSourceId}_${index + 1}`;
}

function buildEvidence(source: JsonRecord) {
  const claims = [];

  for (const item of asArray(source.experience)) {
    const experience = asRecord(item);
    const sourceId = asString(experience.id) || asString(experience.company) || "experience";
    for (const [index, highlight] of compactStrings(asArray(experience.highlights)).entries()) {
      claims.push({
        id: claimId("claim", sourceId, index),
        claim: highlight,
        strength: "strong",
        sources: [{ type: "experience", ref: sourceId }],
        allowed_uses: ["resume", "cover_letter", "interview"],
      });
    }
  }

  for (const item of [...asArray(source.projects), ...asArray(source.open_source)]) {
    const project = asRecord(item);
    const sourceId = asString(project.id) || asString(project.name) || "project";
    for (const [index, highlight] of compactStrings(asArray(project.highlights)).entries()) {
      claims.push({
        id: claimId("claim", sourceId, index),
        claim: highlight,
        strength: "strong",
        sources: [{ type: "project", ref: sourceId }],
        allowed_uses: ["resume", "cover_letter", "interview"],
      });
    }
  }

  return evidenceSchema.parse({
    version: "0.1",
    claims,
  });
}

export async function importResumeSystemProfile(
  options: ProfileImportOptions
): Promise<ProfileImportResult> {
  const workspace = resolveWorkspace(options.cwd, options.workspacePath);
  const sourcePath = sourceFileAbsolute(options.cwd, options.sourceFile);
  const raw = await readFile(sourcePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("Resume-system profile must be a JSON object.");
  }

  const profile = importProfile(parsed);
  const evidence = buildEvidence(parsed);
  const profileDirectory = path.join(workspace, "profile");
  const profilePath = path.join(profileDirectory, "profile.json");
  const evidencePath = path.join(profileDirectory, "evidence.json");
  const sourceSnapshotPath = path.join(profileDirectory, "import-source.resume-system.json");

  await mkdir(profileDirectory, { recursive: true });
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  await writeFile(sourceSnapshotPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");

  return {
    ok: true,
    workspace,
    sourceFile: sourcePath,
    written: [
      path.relative(options.cwd, profilePath),
      path.relative(options.cwd, evidencePath),
      path.relative(options.cwd, sourceSnapshotPath),
    ],
    imported: {
      experience: profile.experience.length,
      projects: profile.projects.length,
      education: profile.education.length,
      skills: profile.skills.length,
      evidenceClaims: evidence.claims.length,
    },
  };
}
