import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { evidenceSchema, jobSchema, type Evidence, type JobRecord } from "../lib/schemas";

export type ResumeReviewOptions = {
  cwd: string;
  workspacePath: string;
  jobId: string;
};

export type ResumeReviewStatus = "ready" | "needs_revision" | "blocked";

export type ResumeReviewIssue = {
  category: "evidence_integrity" | "jd_targeting" | "overclaim" | "resume_quality" | "consistency";
  severity: "error" | "warning";
  rule: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ResumeReviewResult = {
  ok: boolean;
  workspace: string;
  jobId: string;
  status: ResumeReviewStatus;
  reportJsonPath: string;
  reportMarkdownPath: string;
  metrics: {
    coveredKeywords: string[];
    missingKeywords: string[];
    evidenceClaimCount: number;
    unsupportedClaimCount: number;
    forbiddenHits: string[];
    lineCount: number;
  };
  issues: ResumeReviewIssue[];
};

const requiredSections = ["Summary", "Matched skills", "Evidence-backed claims", "Review gaps"];
const forbiddenPhrases = [
  "TODO",
  "TBD",
  "FIXME",
  "lorem ipsum",
  "As an AI",
  "As a language model",
  "Let me know if",
  "Hope this helps",
];

function resolveWorkspace(cwd: string, workspacePath: string): string {
  return path.isAbsolute(workspacePath)
    ? workspacePath
    : path.resolve(cwd, workspacePath);
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sectionBody(markdown: string, heading: string): string | undefined {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  if (start === -1) return undefined;

  const bodyStart = start + marker.length;
  const rest = markdown.slice(bodyStart);
  const nextHeading = rest.search(/\n##\s+/);
  return (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
}

function extractBullets(section: string | undefined): string[] {
  if (!section) return [];

  return section
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+(.+?)\s*$/)?.[1])
    .filter((line): line is string => Boolean(line));
}

function coverageText(markdown: string): string {
  const reviewStart = markdown.indexOf("## Review gaps");
  return reviewStart === -1 ? markdown : markdown.slice(0, reviewStart);
}

function findForbiddenHits(markdown: string): string[] {
  const normalizedMarkdown = markdown.toLowerCase();
  return forbiddenPhrases.filter((phrase) => normalizedMarkdown.includes(phrase.toLowerCase()));
}

function isNoEvidenceBullet(value: string): boolean {
  return normalize(value).startsWith("no resume ready claims found");
}

function isNoGapBullet(value: string): boolean {
  return normalize(value).startsWith("no unmatched job keywords found");
}

function claimAllowsResume(claim: Evidence["claims"][number]): boolean {
  return (
    (claim.strength === "strong" || claim.strength === "transferable") &&
    claim.allowed_uses.includes("resume") &&
    claim.sources.length > 0
  );
}

function keywordCoverage(job: JobRecord, markdown: string): {
  coveredKeywords: string[];
  missingKeywords: string[];
} {
  const normalizedCoverage = normalize(coverageText(markdown));
  const coveredKeywords = job.keywords.filter((keyword) => normalizedCoverage.includes(normalize(keyword)));
  const missingKeywords = job.keywords.filter((keyword) => !coveredKeywords.includes(keyword));

  return { coveredKeywords, missingKeywords };
}

function reviewEvidence(markdown: string, evidence: Evidence): {
  issues: ResumeReviewIssue[];
  evidenceClaimIds: string[];
  evidenceClaimCount: number;
  unsupportedClaimCount: number;
} {
  const issues: ResumeReviewIssue[] = [];
  const evidenceBullets = extractBullets(sectionBody(markdown, "Evidence-backed claims")).filter(
    (bullet) => !isNoEvidenceBullet(bullet)
  );
  const claimsByText = new Map(evidence.claims.map((claim) => [claim.claim, claim]));
  const evidenceClaimIds: string[] = [];
  let unsupportedClaimCount = 0;

  if (evidenceBullets.length === 0) {
    issues.push({
      category: "evidence_integrity",
      severity: "warning",
      rule: "resume_has_evidence_claims",
      message: "Resume draft has no evidence-backed claim bullets.",
    });
  }

  if (evidenceBullets.length > 8) {
    issues.push({
      category: "resume_quality",
      severity: "warning",
      rule: "claim_count_limit",
      message: "Resume draft has more than 8 evidence-backed claim bullets.",
      details: { evidenceClaimCount: evidenceBullets.length },
    });
  }

  for (const [index, bullet] of evidenceBullets.entries()) {
    const claim = claimsByText.get(bullet);

    if (!claim) {
      unsupportedClaimCount += 1;
      issues.push({
        category: "evidence_integrity",
        severity: "error",
        rule: "claim_must_exist_in_evidence_registry",
        message: `Evidence-backed claim #${index + 1} is not present in evidence.json.`,
        details: { claimIndex: index + 1 },
      });
      continue;
    }

    if (!claimAllowsResume(claim)) {
      unsupportedClaimCount += 1;
      issues.push({
        category: "evidence_integrity",
        severity: "error",
        rule: "claim_must_be_resume_ready",
        message: `Evidence-backed claim #${index + 1} is not allowed for resume use or has no source.`,
        details: {
          claimIndex: index + 1,
          claimId: claim.id,
          strength: claim.strength,
          allowedUses: claim.allowed_uses,
          sourceCount: claim.sources.length,
        },
      });
      continue;
    }

    evidenceClaimIds.push(claim.id);
  }

  return {
    issues,
    evidenceClaimIds,
    evidenceClaimCount: evidenceBullets.length,
    unsupportedClaimCount,
  };
}

function reviewOverclaim(markdown: string, evidence: Evidence): ResumeReviewIssue[] {
  const normalizedMarkdown = normalize(markdown);
  const riskyClaims = evidence.claims.filter(
    (claim) => claim.strength === "missing" || claim.strength === "needs_review"
  );

  return riskyClaims
    .filter((claim) => normalizedMarkdown.includes(normalize(claim.claim)))
    .map((claim) => ({
      category: "overclaim" as const,
      severity: "error" as const,
      rule: "weak_claim_must_not_appear_in_resume",
      message: "Resume draft contains a claim marked missing or needs_review.",
      details: { claimId: claim.id, strength: claim.strength },
    }));
}

function reviewQuality(markdown: string, job: JobRecord): ResumeReviewIssue[] {
  const issues: ResumeReviewIssue[] = [];
  const lineCount = markdown.split(/\r?\n/).length;
  const missingSections = requiredSections.filter((section) => !sectionBody(markdown, section));
  const forbiddenHits = findForbiddenHits(markdown);
  const targetLine = `Target: ${job.title} at ${job.company}`;

  for (const section of missingSections) {
    issues.push({
      category: "resume_quality",
      severity: "warning",
      rule: "required_section_present",
      message: `Resume draft is missing the ${section} section.`,
      details: { section },
    });
  }

  if (!markdown.includes(targetLine)) {
    issues.push({
      category: "consistency",
      severity: "warning",
      rule: "target_line_matches_job",
      message: "Resume draft target line does not match the ingested job title and company.",
    });
  }

  if (lineCount < 20) {
    issues.push({
      category: "resume_quality",
      severity: "warning",
      rule: "resume_minimum_length",
      message: "Resume draft is very short and likely needs more baseline material.",
      details: { lineCount },
    });
  }

  if (lineCount > 120) {
    issues.push({
      category: "resume_quality",
      severity: "warning",
      rule: "resume_maximum_length",
      message: "Resume draft is long for a first-pass targeted resume.",
      details: { lineCount },
    });
  }

  if (forbiddenHits.length > 0) {
    issues.push({
      category: "resume_quality",
      severity: "warning",
      rule: "forbidden_phrase_absent",
      message: "Resume draft contains placeholder or AI-flavored wording.",
      details: { forbiddenHits },
    });
  }

  return issues;
}

function reviewTargeting(job: JobRecord, markdown: string): {
  issues: ResumeReviewIssue[];
  coveredKeywords: string[];
  missingKeywords: string[];
} {
  const { coveredKeywords, missingKeywords } = keywordCoverage(job, markdown);
  const reviewGapBullets = extractBullets(sectionBody(markdown, "Review gaps")).filter(
    (bullet) => !isNoGapBullet(bullet)
  );
  const issues: ResumeReviewIssue[] = [];

  if (missingKeywords.length > 0) {
    issues.push({
      category: "jd_targeting",
      severity: "warning",
      rule: "job_keywords_covered_before_review_gaps",
      message: "Resume draft does not cover all ingested job keywords before the review gaps section.",
      details: { missingKeywords },
    });
  }

  if (missingKeywords.length > 0 && reviewGapBullets.length === 0) {
    issues.push({
      category: "consistency",
      severity: "warning",
      rule: "missing_keywords_reported_as_gaps",
      message: "Resume draft has missing job keywords but does not list review gap bullets.",
    });
  }

  return { issues, coveredKeywords, missingKeywords };
}

function statusFromIssues(issues: ResumeReviewIssue[]): ResumeReviewStatus {
  if (issues.some((issue) => issue.severity === "error")) return "blocked";
  if (issues.length > 0) return "needs_revision";
  return "ready";
}

function renderMarkdownReport(result: ResumeReviewResult): string {
  const issueLines =
    result.issues.length === 0
      ? ["- No issues found."]
      : result.issues.map(
          (issue) => `- [${issue.severity}] ${issue.category}/${issue.rule}: ${issue.message}`
        );

  return [
    "# Resume Review",
    "",
    `Status: ${result.status}`,
    `Job: ${result.jobId}`,
    "",
    "## Metrics",
    "",
    `- Covered keywords: ${result.metrics.coveredKeywords.length}`,
    `- Missing keywords: ${result.metrics.missingKeywords.length}`,
    `- Evidence claim bullets: ${result.metrics.evidenceClaimCount}`,
    `- Unsupported claims: ${result.metrics.unsupportedClaimCount}`,
    `- Forbidden phrase hits: ${result.metrics.forbiddenHits.length}`,
    `- Lines: ${result.metrics.lineCount}`,
    "",
    "## Issues",
    "",
    ...issueLines,
    "",
  ].join("\n");
}

export async function reviewResume(options: ResumeReviewOptions): Promise<ResumeReviewResult> {
  const workspace = resolveWorkspace(options.cwd, options.workspacePath);
  const jobPath = path.join(workspace, "jobs", options.jobId, "job.json");
  const evidencePath = path.join(workspace, "profile", "evidence.json");
  const resumePath = path.join(workspace, "outputs", options.jobId, "resume.md");
  const reportDirectory = path.join(workspace, "reports", options.jobId);
  const reportJsonPath = path.join(reportDirectory, "resume-review.json");
  const reportMarkdownPath = path.join(reportDirectory, "resume-review.md");
  const job = jobSchema.parse(await readJsonFile(jobPath));
  const evidence = evidenceSchema.parse(await readJsonFile(evidencePath));
  const markdown = await readFile(resumePath, "utf8");
  const targeting = reviewTargeting(job, markdown);
  const evidenceReview = reviewEvidence(markdown, evidence);
  const qualityIssues = reviewQuality(markdown, job);
  const overclaimIssues = reviewOverclaim(markdown, evidence);
  const issues = [
    ...evidenceReview.issues,
    ...overclaimIssues,
    ...targeting.issues,
    ...qualityIssues,
  ];
  const status = statusFromIssues(issues);
  const result: ResumeReviewResult = {
    ok: true,
    workspace,
    jobId: options.jobId,
    status,
    reportJsonPath,
    reportMarkdownPath,
    metrics: {
      coveredKeywords: targeting.coveredKeywords,
      missingKeywords: targeting.missingKeywords,
      evidenceClaimCount: evidenceReview.evidenceClaimCount,
      unsupportedClaimCount: evidenceReview.unsupportedClaimCount,
      forbiddenHits: findForbiddenHits(markdown),
      lineCount: markdown.split(/\r?\n/).length,
    },
    issues,
  };

  await mkdir(reportDirectory, { recursive: true });
  await writeFile(reportJsonPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await writeFile(reportMarkdownPath, renderMarkdownReport(result), "utf8");

  return result;
}
