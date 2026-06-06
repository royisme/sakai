import { mkdir, mkdtemp, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { initWorkspace } from "../tools/initWorkspace";
import { ingestJob } from "../tools/jobIngest";
import { draftResume } from "../tools/resumeDraft";
import { reviewResume } from "../tools/resumeReview";
import { renderResume } from "../tools/resumeRender";

const targetFixture = path.resolve(
  import.meta.dir,
  "../../fixtures/jobs/recruitcrm-corgta-senior-fullstack-python.md"
);

async function writeReadyBaseline(cwd: string) {
  await writeFile(
    path.join(cwd, "workspace", "profile", "profile.json"),
    JSON.stringify(
      {
        version: "0.1",
        identity: {
          name: "Example Candidate",
          headline: "Full Stack Engineer",
          location: "Toronto, ON",
          links: ["https://example.com/in/candidate"],
        },
        summary: "Builds production web applications with Python, React, TypeScript, AWS, and agile delivery.",
        experience: [],
        projects: [],
        education: [],
        skills: [
          "Node.js",
          "TypeScript",
          "Python",
          "Django",
          "React",
          "Next.js",
          "AWS",
          "software architecture",
          "unit testing",
          "Agile",
        ],
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
            id: "claim_fullstack",
            claim:
              "Built production Python, Django, React, Next.js, TypeScript, Node.js, AWS, unit testing, Agile, and software architecture workflows.",
            strength: "strong",
            sources: [{ type: "project", ref: "example-production-app" }],
            allowed_uses: ["resume"],
          },
        ],
      },
      null,
      2
    ),
    "utf8"
  );
}

async function prepareReadyWorkspace() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));
  await initWorkspace({ cwd, workspacePath: "workspace" });
  await writeReadyBaseline(cwd);
  const ingest = await ingestJob({
    cwd,
    workspacePath: "workspace",
    sourceFile: targetFixture,
  });
  await draftResume({ cwd, workspacePath: "workspace", jobId: ingest.jobId });
  const review = await reviewResume({ cwd, workspacePath: "workspace", jobId: ingest.jobId });

  return { cwd, jobId: ingest.jobId, reviewStatus: review.status };
}

describe("Feature: Resume render", () => {
  test("Scenario: Render a ready resume draft to DOCX", async () => {
    const { cwd, jobId, reviewStatus } = await prepareReadyWorkspace();

    const result = await renderResume({
      cwd,
      workspacePath: "workspace",
      jobId,
      format: "docx",
    });
    const outputStat = await stat(result.outputPath);

    expect(reviewStatus).toBe("ready");
    expect(result.ok).toBe(true);
    expect(result.format).toBe("docx");
    expect(result.reviewStatus).toBe("ready");
    expect(result.outputPath.endsWith("resume.docx")).toBe(true);
    expect(outputStat.size).toBeGreaterThan(1000);
  });

  test("Scenario: Block rendering when review is not ready", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));
    await initWorkspace({ cwd, workspacePath: "workspace" });
    await writeReadyBaseline(cwd);
    const ingest = await ingestJob({
      cwd,
      workspacePath: "workspace",
      sourceFile: targetFixture,
    });
    const outputDirectory = path.join(cwd, "workspace", "outputs", ingest.jobId);
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(
      path.join(outputDirectory, "resume.md"),
      "# Example Candidate\n\n## Evidence-backed claims\n\n- Unsupported claim.\n",
      "utf8"
    );
    const review = await reviewResume({ cwd, workspacePath: "workspace", jobId: ingest.jobId });

    await expect(
      renderResume({
        cwd,
        workspacePath: "workspace",
        jobId: ingest.jobId,
        format: "docx",
      })
    ).rejects.toThrow("Resume review status is blocked");
    expect(review.status).toBe("blocked");
  });
});
