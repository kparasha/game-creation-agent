/**
 * Dogfood surface — expose the agent AS an MCP server (we are user #1; docs/02 Tier C-as-internal).
 *
 * This file declares the TOOL CONTRACT so the interface is stable from day one. Transport wiring
 * (@modelcontextprotocol/sdk) is intentionally deferred to the coding phase. Each tool maps onto the
 * Shared Core inner loop / Genre Pack / Target Adapter — no new logic, just an exposure layer.
 * Listing target: Smithery (handles OAuth); ship clean + authed (trust is a differentiator, docs/02).
 */

export interface McpTool {
  name: string;
  description: string;
  inputSchema: unknown;
  /** Which Shared Core capability this tool exposes (for wiring in the coding phase). */
  backedBy: 'pack.templates' | 'inner-loop:plan' | 'on-device:tweak' | 'pack.validators' | 'adapter.build';
}

export const tools: McpTool[] = [
  {
    name: 'list_templates',
    description: 'List seed templates for a genre (templates-first onboarding).',
    backedBy: 'pack.templates',
    inputSchema: { type: 'object', required: ['genre'], properties: { genre: { type: 'string' } } },
  },
  {
    name: 'generate_game',
    description: 'Create a new game Blueprint from a prompt. Server tier / BYOM (spends credits).',
    backedBy: 'inner-loop:plan',
    inputSchema: {
      type: 'object',
      required: ['genre', 'prompt'],
      properties: { genre: { type: 'string' }, prompt: { type: 'string' }, templateId: { type: 'string' } },
    },
  },
  {
    name: 'tweak_game',
    description: 'Apply a natural-language tweak as toggle deltas. On-device tier — free (Design Mode).',
    backedBy: 'on-device:tweak',
    inputSchema: {
      type: 'object',
      required: ['blueprint', 'instruction'],
      properties: { blueprint: { type: 'object' }, instruction: { type: 'string' } },
    },
  },
  {
    name: 'validate_blueprint',
    description: 'Run the genre deterministic validators; returns findings + failure taxonomy.',
    backedBy: 'pack.validators',
    inputSchema: { type: 'object', required: ['blueprint'], properties: { blueprint: { type: 'object' } } },
  },
  {
    name: 'build_for_surface',
    description: 'Build a runnable artifact for a distribution surface (web-canvas, tiktok-mini, ...).',
    backedBy: 'adapter.build',
    inputSchema: {
      type: 'object',
      required: ['blueprint', 'surface'],
      properties: { blueprint: { type: 'object' }, surface: { type: 'string' } },
    },
  },
];

// TODO(coding phase):
//   import { Server } from '@modelcontextprotocol/sdk/server';
//   register each tool above onto runInnerLoop(...) / pack.validators / adapter.build / on-device router.
