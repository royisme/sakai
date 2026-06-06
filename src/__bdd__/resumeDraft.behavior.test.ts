import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { initWorkspace } from "../tools/initWorkspace";
import { ingestJob } from "../tools/jobIngest";
import { draftResume } from "../tools/resumeDraft";

const targetFixture = path.resolve(
  import.meta.dir,
  "../../fixtures/jobs/recruitcrm-corgta-senior-fullstack-python.md"
);

describe("Feature: Resume draft", () => {
  test("Scenario: Draft a resume against the target RecruitCRM job", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));
    await initWorkspace({ cwd, workspacePath: "workspace" });
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
              id: "claim_unrelated",
              claim: "Produced unrelated internal documentation.",
              strength: "strong",
              sources: [{ type: "project", ref: "example-docs" }],
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
    const ingest = await ingestJob({
      cwd,
      workspacePath: "workspace",
      sourceFile: targetFixture,
    });

    const result = await draftResume({
      cwd,
      workspacePath: "workspace",
      jobId: ingest.jobId,
    });

    const resume = await readFile(result.outputPath, "utf8");

    expect(result.ok).toBe(true);
    expect(result.matchedKeywords).toContain("Python");
    expect(result.matchedKeywords).toContain("React");
    expect(result.missingKeywords).toContain("AWS");
    expect(resume).toContain("# Example Candidate");
    expect(resume).toContain("Target: Senior FullStack (Python) Developer at CorGTA");
    expect(resume).toContain("Python");
    expect(resume).toContain("Built production Python and React applications.");
    expect(resume).toContain("Review gaps");
    expect(resume).toContain("AWS");
    expect(resume).not.toContain("AWS cloud infrastructure ownership.");
    expect(resume).not.toContain("Produced unrelated internal documentation.");
  });
});
