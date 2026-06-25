import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { tools, handleTool } from './handlers';

/**
 * The dogfood surface: exposes the wave-survival agent as an MCP server over stdio, so it's callable
 * from Claude Code / Desktop / Cursor (you = user #1). Logic lives in handlers.ts; this file is the
 * thin transport shim (docs/07: MCP is a ~50-line adapter over the core service).
 */
const server = new Server({ name: 'forge-wave-survival', version: '0.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    const result = await handleTool(req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (e) {
    return { isError: true, content: [{ type: 'text', text: e instanceof Error ? e.message : String(e) }] };
  }
});

await server.connect(new StdioServerTransport());
console.error('forge MCP server (wave-survival) ready on stdio');
