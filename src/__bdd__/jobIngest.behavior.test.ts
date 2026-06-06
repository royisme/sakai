import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { initWorkspace } from "../tools/initWorkspace";
import { ingestJob } from "../tools/jobIngest";

const targetFixture = path.resolve(
  import.meta.dir,
  "../../fixtures/jobs/recruitcrm-corgta-senior-fullstack-python.md"
);

describe("Feature: Job ingest", () => {
  test("Scenario: Ingest the target RecruitCRM job description", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));
    await initWorkspace({ cwd, workspacePath: "workspace" });

    const result = await ingestJob({
      cwd,
      workspacePath: "workspace",
      sourceFile: targetFixture,
    });

    const jobJson = JSON.parse(await readFile(result.jobPath, "utf8")) as {
      id: string;
      title: string;
      company: string;
      location: string;
      source: { platform: string; external_id: string; url: string };
      description_text: string;
    };
    const source = await readFile(result.sourcePath, "utf8");

    expect(result.ok).toBe(true);
    expect(result.jobId).toBe("corgta-senior-fullstack-python-developer-8331");
    expect(jobJson.title).toBe("Senior FullStack (Python) Developer");
    expect(jobJson.company).toBe("CorGTA");
    expect(jobJson.location).toBe("Hybrid, Toronto");
    expect(jobJson.source.platform).toBe("RecruitCRM");
    expect(jobJson.source.external_id).toBe("8331");
    expect(jobJson.source.url).toBe(
      "https://recruitcrm.io/apply/17805968275340116563lBJ?source=Indeed"
    );
    expect(jobJson.description_text).toContain("Python / Django");
    expect(jobJson.description_text).toContain("React / Next.js");
    expect(source).toContain("Must-Have Traits");
  });
});
