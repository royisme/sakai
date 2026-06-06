import { readFile } from "node:fs/promises";
import path from "node:path";
import { ZodError, type ZodType } from "zod";
import { evidenceSchema, preferencesSchema, profileSchema } from "../lib/schemas";

export type ProfileLintOptions = {
  cwd: string;
  workspacePath: string;
};

export type ProfileLintIssue = {
  file: string;
  path: string;
  severity: "error";
  message: string;
};

export type ProfileLintResult = {
  ok: boolean;
  workspace: string;
  issues: ProfileLintIssue[];
};

function resolveWorkspace(cwd: string, workspacePath: string): string {
  return path.isAbsolute(workspacePath)
    ? workspacePath
    : path.resolve(cwd, workspacePath);
}

async function validateJsonFile(
  workspace: string,
  relativePath: string,
  schema: ZodType
): Promise<ProfileLintIssue[]> {
  const filePath = path.join(workspace, relativePath);

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    schema.parse(parsed);
    return [];
  } catch (error) {
    if (error instanceof ZodError) {
      return error.issues.map((issue) => ({
        file: relativePath,
        path: issue.path.join(".") || "$",
        severity: "error",
        message: issue.message,
      }));
    }

    const message = error instanceof Error ? error.message : String(error);
    return [
      {
        file: relativePath,
        path: "$",
        severity: "error",
        message,
      },
    ];
  }
}

export async function lintProfileWorkspace(options: ProfileLintOptions): Promise<ProfileLintResult> {
  const workspace = resolveWorkspace(options.cwd, options.workspacePath);
  const checks = [
    validateJsonFile(workspace, "profile/profile.json", profileSchema),
    validateJsonFile(workspace, "profile/preferences.json", preferencesSchema),
    validateJsonFile(workspace, "profile/evidence.json", evidenceSchema),
  ];
  const issues = (await Promise.all(checks)).flat();

  return {
    ok: issues.length === 0,
    workspace,
    issues,
  };
}
