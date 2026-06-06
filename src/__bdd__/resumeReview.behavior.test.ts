import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { initWorkspace } from "../tools/initWorkspace";
import { ingestJob } from "../tools/jobIngest";
import { draftResume } from "../tools/resumeDraft";
import { reviewResume } from "../tools/resumeReview";

const targetFixture = path.resolve(
  import.meta.dir,
  "../../fixtures/jobs/recruitcrm-corgta-senior-fullstack-python.md"
);

async function writeBaseline(cwd: string) {
  await writeFile(
    path.join(cwd, "workspace", "profile", "profile.json"),
    JSON.stringify(
      {
        version: "0.1",
        identity: {
          name: "Example Candidate",
          headline: "Full Stack Engineer",
          location: "Toronto, ON",
          links: [],
        },
        summary: "Builds production web applications with Python and React.",
        experience: [],
        projects: [],
        education: [],
        skills: ["Python", "Django", "React", "TypeScript", "unit testing"],
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(
    path.join(cwd, "workspace", "profile", "evidence.json"),
    JSON.stringify(
      {
        version: "0.1",
        claims: [
          {
            id: "claim_python_react",
            claim: "Built production Python and React applications.",
            strength: "strong",
            sources: [{ type: "project", ref: "example-production-app" }],
            allowed_uses: ["resume"],
          },
          {
            id: "claim_aws",
            claim: "AWS cloud infrastructure ownership.",
            strength: "needs_review",
            sources: [],
            allowed_uses: [],
            risk: "No source attached yet.",
          },
        ],
      },
      null,
      2
    ),
    "utf8"
  );
}

describe("Feature: Resume review", () => {
  test("Scenario: Review a resume draft with missing job coverage", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));
    await initWorkspace({ cwd, workspacePath: "workspace" });
    await writeBaseline(cwd);
    const ingest = await ingestJob({
      cwd,
      workspacePath: "workspace",
      sourceFile: targetFixture,
    });
    await draftResume({ cwd, workspacePath: "workspace", jobId: ingest.jobId });

    const result = await reviewResume({
      cwd,
      workspacePath: "workspace",
      jobId: ingest.jobId,
    });

    const jsonReport = JSON.parse(await readFile(result.reportJsonPath, "utf8")) as {
      status: string;
      issues: Array<{ category: string; severity: string }>;
    };
    const markdownReport = await readFile(result.reportMarkdownPath, "utf8");

    expect(result.ok).toBe(true);
    expect(result.status).toBe("needs_revision");
    expect(result.metrics.coveredKeywords).toContain("Python");
    expect(result.metrics.missingKeywords).toContain("AWS");
    expect(result.issues.some((issue) => issue.category === "jd_targeting")).toBe(true);
    expect(result.issues.every((issue) => issue.severity !== "error")).toBe(true);
    expect(jsonReport.status).toBe("needs_revision");
    expect(markdownReport).toContain("Resume Review");
    expect(markdownReport).toContain("needs_revision");
  });

  test("Scenario: Block a resume draft with an unsupported claim", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));
    await initWorkspace({ cwd, workspacePath: "workspace" });
    await writeBaseline(cwd);
    const ingest = await ingestJob({
      cwd,
      workspacePath: "workspace",
      sourceFile: targetFixture,
    });
    const outputDirectory = path.join(cwd, "workspace", "outputs", ingest.jobId);
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(
      path.join(outputDirectory, "resume.md"),
      [
        "# Example Candidate",
        "",
        "Target: Senior FullStack (Python) Developer at CorGTA",
        "",
        "## Summary",
        "",
        "Builds production web applications with Python and React.",
        "",
        "## Matched skills",
        "",
        "- Python",
        "",
        "## Evidence-backed claims",
        "",
        "- AWS cloud infrastructure ownership.",
        "",
        "## Review gaps",
        "",
        "- No unmatched job keywords found.",
        "",
      ].join("\n"),
      "utf8"
    );

    const result = await reviewResume({
      cwd,
      workspacePath: "workspace",
      jobId: ingest.jobId,
    });

    expect(result.status).toBe("blocked");
    expect(result.issues.some((issue) => issue.category === "evidence_integrity")).toBe(true);
    expect(result.issues.some((issue) => issue.severity === "error")).toBe(true);
  });
});
