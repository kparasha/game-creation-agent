import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { EventSink, AgentEvent } from '@forge/core';

/**
 * Node-only telemetry sink: appends one JSON object per line (JSONL). Zero infra — the first rung of
 * the docs/07 ladder (JSONL → SQLite → Postgres/ClickHouse). Truncates the file on creation so each
 * run starts clean.
 */
export function jsonlSink(filePath: string): EventSink {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, '');
  return {
    emit(event: AgentEvent) {
      appendFileSync(filePath, JSON.stringify(event) + '\n');
    },
  };
}
