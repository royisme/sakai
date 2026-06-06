import React from "react";
import { Box, Text } from "ink";
import type { InitWorkspaceResult } from "../../tools/initWorkspace";

export function InitScreen({ result }: { result: InitWorkspaceResult }) {
  return (
    <Box flexDirection="column">
      <Text bold color="green">
        Sakai workspace ready
      </Text>
      <Text>Workspace: {result.workspace}</Text>
      <Text>Created: {result.created.length}</Text>
      <Text>Existing: {result.existing.length}</Text>
      {result.updated.length > 0 && <Text>Updated: {result.updated.length}</Text>}
      <Box marginTop={1} flexDirection="column">
        <Text bold>Next steps</Text>
        {result.nextSteps.map((step) => (
          <Text key={step}>- {step}</Text>
        ))}
      </Box>
    </Box>
  );
}
