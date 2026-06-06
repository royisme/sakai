import React from "react";
import { Box, Text } from "ink";
import type { ProfileLintResult } from "../../tools/profileLint";

export function ProfileLintScreen({ result }: { result: ProfileLintResult }) {
  return (
    <Box flexDirection="column">
      <Text bold color={result.ok ? "green" : "red"}>
        Profile lint {result.ok ? "passed" : "failed"}
      </Text>
      <Text>Workspace: {result.workspace}</Text>
      {result.issues.length === 0 ? (
        <Text>No issues found.</Text>
      ) : (
        <Box marginTop={1} flexDirection="column">
          {result.issues.map((issue) => (
            <Text key={`${issue.file}:${issue.path}:${issue.message}`}>
              - [{issue.severity}] {issue.file}:{issue.path} {issue.message}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
