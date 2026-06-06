import React from "react";
import { Box, Text } from "ink";
import type { ProfileImportResult } from "../../tools/profileImport";

export function ProfileImportScreen({ result }: { result: ProfileImportResult }) {
  return (
    <Box flexDirection="column">
      <Text bold color="green">
        Profile imported
      </Text>
      <Text>Workspace: {result.workspace}</Text>
      <Text>Experience: {result.imported.experience}</Text>
      <Text>Projects: {result.imported.projects}</Text>
      <Text>Skills: {result.imported.skills}</Text>
      <Text>Evidence claims: {result.imported.evidenceClaims}</Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Written</Text>
        {result.written.map((file) => (
          <Text key={file}>- {file}</Text>
        ))}
      </Box>
    </Box>
  );
}
