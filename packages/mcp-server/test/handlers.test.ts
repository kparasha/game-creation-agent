import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tools, handleTool } from '../src/handlers';
import pack from '@forge/genre-wave-survival';

test('exposes the expected tool names', () => {
  const names = tools.map((t) => t.name);
  for (const n of [
    'list_templates',
    'load_template',
    'get_blueprint_schema',
    'validate_blueprint',
    'repair_blueprint',
    'build_game',
    'generate_game',
  ]) {
    assert.ok(names.includes(n), `missing tool ${n}`);
  }
});

test('list_templates returns the genre templates', async () => {
  const res = (await handleTool('list_templates', {})) as { id: string }[];
  assert.ok(res.some((t) => t.id === 'garden-defense'));
});

test('validate_blueprint flags an empty upgrade pool; repair_blueprint fixes it', async () => {
  const bp = structuredClone(pack.templates[0]!.blueprint);
  bp.spec.upgrades = [];
  const v = (await handleTool('validate_blueprint', { blueprint: bp })) as { findings: { code: string }[] };
  assert.ok(v.findings.some((f) => f.code === 'UPG_EMPTY'));

  const r = (await handleTool('repair_blueprint', { blueprint: bp })) as {
    changed: boolean;
    blueprint: typeof bp;
  };
  assert.equal(r.changed, true);
  assert.ok(r.blueprint.spec.upgrades.length > 0);
});

test('build_game returns playable HTML with the spec embedded', async () => {
  const out = (await handleTool('build_game', { blueprint: pack.templates[0]!.blueprint })) as {
    html: string;
  };
  assert.match(out.html, /window\.__SPEC__ =/);
  assert.match(out.html, /<canvas id="game">/);
});

test('generate_game without a key throws a helpful error', async () => {
  const prev = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  await assert.rejects(() => handleTool('generate_game', { prompt: 'x' }), /OPENROUTER_API_KEY/);
  if (prev !== undefined) process.env.OPENROUTER_API_KEY = prev;
});

test('validate_blueprint reports a missing spec as a finding (does not throw)', async () => {
  const malformed = { genre: 'wave-survival', schemaVersion: 1, meta: { title: 'x', createdWith: 'server' } };
  const v = (await handleTool('validate_blueprint', { blueprint: malformed })) as {
    findings: { code: string }[];
  };
  assert.ok(v.findings.some((f) => f.code === 'SCHEMA_NO_SPEC'));
});
