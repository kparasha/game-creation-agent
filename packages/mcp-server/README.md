# @forge/mcp-server

Exposes the wave-survival agent as an **MCP server** (stdio) — callable from Claude Code / Desktop / Cursor.

## Tools

- `list_templates`, `load_template` — starting points to remix.
- `get_blueprint_schema` — JSON schema + guidance for authoring a Blueprint spec.
- `validate_blueprint` — deterministic findings (errors/warnings).
- `repair_blueprint` — deterministic fixes for common issues.
- `build_game` — Blueprint → self-contained playable HTML5.
- `generate_game` — one-shot prompt → game via a server model (**requires `OPENROUTER_API_KEY`**).

## Two ways to drive it

**Model host (Claude/Cursor) — no key needed.** The host is the planner: call
`get_blueprint_schema`, author a Blueprint, then `validate_blueprint` → `repair_blueprint` →
`build_game`. This is the dogfood path.

**Any host with a key.** Set `OPENROUTER_API_KEY` and call `generate_game` (runs the full
prompt → plan → validate → repair → publish loop server-side).

## Register with Claude Code / Cursor

Add to your MCP config (absolute path to this file):

```json
{
  "mcpServers": {
    "forge-wave-survival": {
      "command": "tsx",
      "args": ["/ABSOLUTE/PATH/packages/mcp-server/src/index.ts"]
    }
  }
}
```

Or run directly: `npm -w @forge/mcp-server run start` (from the repo root).
