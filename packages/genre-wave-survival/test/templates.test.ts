import { test } from 'node:test';
import assert from 'node:assert/strict';
import pack from '@forge/genre-wave-survival';
import type { ControlGroup } from '@forge/core';

test('every shipped template passes schema + gameplay validators with no errors', async () => {
  for (const t of pack.templates) {
    const schema = pack.validateBlueprint(t.blueprint);
    const gameplay = (await Promise.all(pack.validators.map((v) => v.check(t.blueprint)))).flat();
    const errors = [...schema, ...gameplay].filter((f) => f.severity === 'error');
    assert.equal(errors.length, 0, `template '${t.id}' has errors: ${JSON.stringify(errors)}`);
  }
});

test('every manifest control path resolves to a value in the template spec', () => {
  const spec = pack.templates[0]!.blueprint.spec as unknown as Record<string, unknown>;
  const paths: string[] = [];
  const walk = (g: ControlGroup): void => {
    for (const c of g.controls) paths.push(c.path);
    for (const sub of g.groups ?? []) walk(sub);
  };
  for (const g of pack.manifest.groups) walk(g);

  for (const p of paths) {
    const value = p
      .split('.')
      .reduce<unknown>((o, k) => (o == null ? o : (o as Record<string, unknown>)[k]), spec);
    assert.notEqual(value, undefined, `manifest path '${p}' does not resolve in the spec`);
  }
});
