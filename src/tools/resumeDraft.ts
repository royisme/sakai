import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  evidenceSchema,
  jobSchema,
  profileSchema,
  type Evidence,
  type JobRecord,
  type Profile,
} from "../lib/schemas";

export type ResumeDraftOptions = {
  cwd: string;
  workspacePath: string;
  jobId: string;
};

export type ResumeDraftResult = {
  ok: boolean;
  workspace: string;
  jobId: string;
  outputPath: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  evidenceClaimIds: string[];
};

function resolveWorkspace(cwd: string, workspacePath: string): string {
  return path.isAbsolute(workspacePath)
    ? workspacePath
    : path.resolve(cwd, workspacePath);
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function skillName(skill: unknown): string | undefined {
  if (typeof skill === "string") return skill;
  if (!isRecord(skill)) return undefined;

  for (const key of ["name", "label", "skill"]) {
    const value = skill[key];
    if (typeof value === "string") return value;
  }

  return undefined;
}

function matchKeywords(job: JobRecord, profile: Profile): {
  matchedKeywords: string[];
  missingKeywords: string[];
} {
  const normalizedSkills = profile.skills
    .map(skillName)
    .filter((skill): skill is string => Boolean(skill))
    .map((skill) => normalize(skill));

  const matchedKeywords = job.keywords.filter((keyword) => {
    const normalizedKeyword = normalize(keyword);
    return normalizedSkills.some(
      (skill) => skill === normalizedKeyword || skill.includes(normalizedKeyword) || normalizedKeyword.includes(skill)
    );
  });
  const missingKeywords = job.keywords.filter((keyword) => !matchedKeywords.includes(keyword));

  return { matchedKeywords, missingKeywords };
}

function resumeReadyClaims(evidence: Evidence): Evidence["claims"] {
  return evidence.claims.filter((claim) => {
    return (
      (claim.strength === "strong" || claim.strength === "transferable") &&
      claim.allowed_uses.includes("resume")
    );
  });
}

function selectClaimsForResume(evidence: Evidence, matchedKeywords: string[]): Evidence["claims"] {
  const readyClaims = resumeReadyClaims(evidence);
  const normalizedKeywords = matchedKeywords.map(normalize).filter(Boolean);

  if (normalizedKeywords.length === 0) {
    return readyClaims.slice(0, 5);
  }

  const scoredClaims = readyClaims
    .map((claim, index) => {
      const normalizedClaim = normalize(claim.claim);
      const score = normalizedKeywords.filter((keyword) => normalizedClaim.includes(keyword)).length;
      return { claim, index, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index);

  return scoredClaims.slice(0, 8).map((item) => item.claim);
}

function renderResumeMarkdown(options: {
  profile: Profile;
  job: JobRecord;
  matchedKeywords: string[];
  missingKeywords: string[];
  claims: Evidence["claims"];
}): string {
  const { profile, job, matchedKeywords, missingKeywords, claims } = options;
  const lines = [
    `# ${profile.identity.name || "Unnamed Candidate"}`,
    "",
    `${profile.identity.headline} | ${profile.identity.location}`,
    "",
    `Target: ${job.title} at ${job.company}`,
    job.location ? `Job location: ${job.location}` : undefined,
    "",
    "## Summary",
    "",
    profile.summary || "Add a profile summary before using this resume draft.",
    "",
    "## Matched skills",
    "",
    ...((matchedKeywords.length > 0 ? matchedKeywords : ["No matched job keywords yet."]).map(
      (keyword) => `- ${keyword}`
    )),
    "",
    "## Evidence-backed claims",
    "",
    ...((claims.length > 0 ? claims.map((claim) => claim.claim) : ["No resume-ready claims found."]).map(
      (claim) => `- ${claim}`
    )),
    "",
    "## Review gaps",
    "",
    ...((missingKeywords.length > 0
      ? missingKeywords.map((keyword) => `Missing or unproven job keyword: ${keyword}`)
      : ["No unmatched job keywords found."]).map((gap) => `- ${gap}`)),
    "",
  ];

  return `${lines.filter((line): line is string => line !== undefined).join("\n")}\n`;
}

export async function draftResume(options: ResumeDraftOptions): Promise<ResumeDraftResult> {
  const workspace = resolveWorkspace(options.cwd, options.workspacePath);
  const jobPath = path.join(workspace, "jobs", options.jobId, "job.json");
  const profilePath = path.join(workspace, "profile", "profile.json");
  const evidencePath = path.join(workspace, "profile", "evidence.json");
  const job = jobSchema.parse(await readJsonFile(jobPath));
  const profile = profileSchema.parse(await readJsonFile(profilePath));
  const evidence = evidenceSchema.parse(await readJsonFile(evidencePath));
  const { matchedKeywords, missingKeywords } = matchKeywords(job, profile);
  const claims = selectClaimsForResume(evidence, matchedKeywords);
  const outputDirectory = path.join(workspace, "outputs", options.jobId);
  const outputPath = path.join(outputDirectory, "resume.md");

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    outputPath,
    renderResumeMarkdown({ profile, job, matchedKeywords, missingKeywords, claims }),
    "utf8"
  );

  return {
    ok: true,
    workspace,
    jobId: options.jobId,
    outputPath,
    matchedKeywords,
    missingKeywords,
    evidenceClaimIds: claims.map((claim) => claim.id),
  };
}
