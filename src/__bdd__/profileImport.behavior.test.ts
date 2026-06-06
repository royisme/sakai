import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { initWorkspace } from "../tools/initWorkspace";
import { importResumeSystemProfile } from "../tools/profileImport";
import { lintProfileWorkspace } from "../tools/profileLint";

const sourceFixture = path.resolve(
  import.meta.dir,
  "../../fixtures/profile-import/resume-system-profile.json"
);

describe("Feature: Profile import", () => {
  test("Scenario: Import a resume-system profile", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));
    await initWorkspace({ cwd, workspacePath: "workspace" });

    const result = await importResumeSystemProfile({
      cwd,
      workspacePath: "workspace",
      sourceFile: sourceFixture,
    });
    const lint = await lintProfileWorkspace({ cwd, workspacePath: "workspace" });
    const profile = JSON.parse(
      await readFile(path.join(cwd, "workspace", "profile", "profile.json"), "utf8")
    ) as { identity: { name: string }; skills: string[] };
    const evidence = JSON.parse(
      await readFile(path.join(cwd, "workspace", "profile", "evidence.json"), "utf8")
    ) as { claims: Array<{ claim: string; allowed_uses: string[] }> };

    expect(result.ok).toBe(true);
    expect(result.written).toContain("workspace/profile/profile.json");
    expect(result.written).toContain("workspace/profile/evidence.json");
    expect(lint.ok).toBe(true);
    expect(profile.identity.name).toBe("Example Candidate");
    expect(profile.skills).toContain("Python");
    expect(profile.skills).toContain("React");
    expect(evidence.claims.some((claim) => claim.claim.includes("Python and React"))).toBe(true);
    expect(evidence.claims.every((claim) => claim.allowed_uses.includes("resume"))).toBe(true);
  });
});
