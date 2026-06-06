import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";
import { initWorkspace } from "../tools/initWorkspace";
import { lintProfileWorkspace } from "../tools/profileLint";

describe("initWorkspace", () => {
  test("creates a lintable workspace", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-test-"));

    const result = await initWorkspace({ cwd, workspacePath: "workspace" });

    expect(result.created).toContain("workspace/profile/profile.json");
    expect(result.created).toContain("workspace/profile/evidence.json");
    expect(result.created).toContain(".gitignore");

    const lint = await lintProfileWorkspace({ cwd, workspacePath: "workspace" });
    expect(lint.ok).toBe(true);
  });

  test("does not overwrite existing files", async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "sakai-test-"));
    await initWorkspace({ cwd, workspacePath: "workspace" });
    await initWorkspace({ cwd, workspacePath: "workspace" });

    const gitignore = await readFile(path.join(cwd, ".gitignore"), "utf8");
    expect(gitignore.trim().split(/\r?\n/).filter((line) => line === "workspace/")).toHaveLength(1);
    expect(gitignore.trim().split(/\r?\n/).filter((line) => line === "node_modules/")).toHaveLength(1);
  });
});
