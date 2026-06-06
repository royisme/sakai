import React from "react";
import { Box, Text } from "ink";
import type { JobIngestResult } from "../../tools/jobIngest";

export function JobIngestScreen({ result }: { result: JobIngestResult }) {
  return (
    <Box flexDirection="column">
      <Text bold color="green">
        Job ingested
      </Text>
      <Text>Workspace: {result.workspace}</Text>
      <Text>Job: {result.jobId}</Text>
      <Text>Title: {result.job.title}</Text>
      <Text>Company: {result.job.company}</Text>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Written</Text>
        {result.written.map((file) => (
          <Text key={file}>- {file}</Text>
        ))}
      </Box>
    </Box>
  );
}
