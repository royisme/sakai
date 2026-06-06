import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { initWorkspace } from "../tools/initWorkspace";
import { lintProfileWorkspace } from "../tools/profileLint";

describe("Feature: Workspace initialization", () => {
  test("Scenario: Initialize a new workspace", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));

    const init = await initWorkspace({ cwd, workspacePath: "workspace" });
    const lint = await lintProfileWorkspace({ cwd, workspacePath: "workspace" });
    const gitignore = await readFile(path.join(cwd, ".gitignore"), "utf8");

    expect(init.created).toContain("workspace/profile/profile.json");
    expect(init.created).toContain("workspace/profile/preferences.json");
    expect(init.created).toContain("workspace/profile/evidence.json");
    expect(init.created).toContain("workspace/presets/backend-engineer.json");
    expect(gitignore).toContain("workspace/");
    expect(lint.ok).toBe(true);
  });

  test("Scenario: Re-run init without overwriting files", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));
    await initWorkspace({ cwd, workspacePath: "workspace" });

    const profilePath = path.join(cwd, "workspace", "profile", "profile.json");
    await writeFile(profilePath, '{"custom":true}\n', "utf8");

    await initWorkspace({ cwd, workspacePath: "workspace" });

    const profile = await readFile(profilePath, "utf8");
    const gitignore = await readFile(path.join(cwd, ".gitignore"), "utf8");
    expect(profile).toBe('{"custom":true}\n');
    expect(gitignore.split(/\r?\n/).filter((line) => line === "workspace/")).toHaveLength(1);
  });
});

describe("Feature: Profile lint", () => {
  test("Scenario: Lint a valid workspace profile", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));
    await initWorkspace({ cwd, workspacePath: "workspace" });

    const lint = await lintProfileWorkspace({ cwd, workspacePath: "workspace" });

    expect(lint.ok).toBe(true);
    expect(lint.issues).toHaveLength(0);
  });

  test("Scenario: Lint an invalid workspace profile", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-bdd-"));
    await initWorkspace({ cwd, workspacePath: "workspace" });
    await writeFile(
      path.join(cwd, "workspace", "profile", "profile.json"),
      JSON.stringify({ version: "0.1" }, null, 2),
      "utf8"
    );

    const lint = await lintProfileWorkspace({ cwd, workspacePath: "workspace" });

    expect(lint.ok).toBe(false);
    expect(lint.issues.some((issue) => issue.path === "identity")).toBe(true);
  });
});
