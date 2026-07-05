import pack, {
  deterministicRepairer,
  waveSurvivalPlanner,
  type WaveSurvivalSpec,
} from '@forge/genre-wave-survival';
import webCanvasAdapter from '@forge/adapter-web-canvas';
import {
  runInnerLoop,
  type Blueprint,
  type Executor,
  type Judge,
  type JudgeReport,
  type TargetAdapter,
  type ValidationFinding,
} from '@forge/core';
import { openRouterProvider, createModelRouter } from '@forge/providers';

/**
 * Tool implementations, kept transport-agnostic + pure so they're unit-testable without spawning a
 * stdio process (index.ts wires these onto the MCP Server).
 *
 * Design: on a host that is itself a model (Claude/Cursor), the HOST does the planning — it calls
 * get_blueprint_schema, authors a Blueprint, then validate/repair/build. No API key needed (dogfood
 * path, you = user #1). generate_game is the one-shot fallback for non-model hosts (needs a key).
 */
type Spec = WaveSurvivalSpec;
type BP = Blueprint<Spec>;

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const blueprintArg = {
  type: 'object',
  description: 'A wave-survival Blueprint: { genre, schemaVersion, meta, spec }.',
};

export const tools: ToolDef[] = [
  {
    name: 'list_templates',
    description: 'List starting templates for the wave-survival genre.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'load_template',
    description: 'Get the full Blueprint for a template id (to remix).',
    inputSchema: { type: 'object', properties: { templateId: { type: 'string' } }, required: ['templateId'] },
  },
  {
    name: 'get_blueprint_schema',
    description:
      'Get the JSON schema + guidance for authoring a wave-survival Blueprint spec. Use this to construct a Blueprint yourself, then validate_blueprint and build_game.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'validate_blueprint',
    description: 'Run deterministic validators on a Blueprint; returns findings (errors + warnings).',
    inputSchema: { type: 'object', properties: { blueprint: blueprintArg }, required: ['blueprint'] },
  },
  {
    name: 'repair_blueprint',
    description:
      'Deterministically fix common Blueprint issues (empty upgrades, no escalation, too-hard balance, …). Returns the repaired Blueprint.',
    inputSchema: { type: 'object', properties: { blueprint: blueprintArg }, required: ['blueprint'] },
  },
  {
    name: 'build_game',
    description: 'Compile a Blueprint into a self-contained, playable HTML5 game. Returns the HTML.',
    inputSchema: { type: 'object', properties: { blueprint: blueprintArg }, required: ['blueprint'] },
  },
  {
    name: 'generate_game',
    description:
      'One-shot: prompt → validated, playable game via a server model (requires OPENROUTER_API_KEY). On a model host (e.g. Claude), prefer get_blueprint_schema → validate_blueprint → build_game.',
    inputSchema: { type: 'object', properties: { prompt: { type: 'string' } }, required: ['prompt'] },
  },
];

async function findingsFor(bp: BP): Promise<ValidationFinding[]> {
  const schema = pack.validateBlueprint(bp);
  // Gate: gameplay validators assume a well-formed spec, so skip them when the shape is invalid
  // (also honors the Validator interface's async return — unlike a synchronous flatMap cast).
  if (schema.some((x) => x.severity === 'error')) return schema;
  const gameplay = (await Promise.all(pack.validators.map((v) => v.check(bp)))).flat();
  return [...schema, ...gameplay];
}

const executor: Executor<Spec> = { build: (bp, adapter) => adapter.build(bp) };
const judge: Judge<Spec> = {
  async judge(bp) {
    const findings = await findingsFor(bp);
    return { passed: findings.every((x) => x.severity !== 'error'), findings };
  },
};

export async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'list_templates':
      return pack.templates.map((t) => ({ id: t.id, name: t.name, description: t.description }));

    case 'load_template': {
      const t = pack.templates.find((x) => x.id === args.templateId);
      if (!t) throw new Error(`unknown template: ${String(args.templateId)}`);
      return t.blueprint;
    }

    case 'get_blueprint_schema':
      return {
        genre: pack.id,
        schemaVersion: pack.schemaVersion,
        jsonSchema: pack.planning.jsonSchema,
        guidance: pack.planning.systemPrompt,
      };

    case 'validate_blueprint':
      return { findings: await findingsFor(args.blueprint as BP) };

    case 'repair_blueprint': {
      const bp = args.blueprint as BP;
      const report: JudgeReport = { passed: false, findings: await findingsFor(bp) };
      return deterministicRepairer.repair(bp, report, pack, null as never);
    }

    case 'build_game': {
      const out = await webCanvasAdapter.build(args.blueprint as BP);
      return { entry: out.entry, html: out.files[out.entry] };
    }

    case 'generate_game': {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) {
        throw new Error(
          'generate_game needs OPENROUTER_API_KEY. On a model host (Claude), use get_blueprint_schema → validate_blueprint → build_game instead.',
        );
      }
      const models = createModelRouter({
        server: openRouterProvider({ apiKey: key, model: process.env.OPENROUTER_MODEL }),
      });
      const res = await runInnerLoop<Spec>(
        { prompt: String(args.prompt), tier: 'server' },
        {
          pack,
          adapter: webCanvasAdapter as TargetAdapter<Spec>,
          models,
          planner: waveSurvivalPlanner,
          executor,
          judge,
          repairer: deterministicRepairer,
        },
      );
      return {
        status: res.status,
        repairs: res.repairs,
        blueprint: res.blueprint,
        error: res.error?.message,
        entry: res.build?.entry,
        html: res.build ? res.build.files[res.build.entry] : undefined,
      };
    }

    default:
      throw new Error(`unknown tool: ${name}`);
  }
}
