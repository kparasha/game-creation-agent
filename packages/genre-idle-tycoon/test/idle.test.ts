import { test } from 'node:test';
import assert from 'node:assert/strict';
import pack, { deterministicRepairer, validators, type IdleTycoonBlueprint } from '@forge/genre-idle-tycoon';
import type { ControlGroup, JudgeReport, ValidationFinding } from '@forge/core';

const errorsOf = (bp: IdleTycoonBlueprint): ValidationFinding[] =>
  validators.flatMap((v) => v.check(bp) as ValidationFinding[]).filter((f) => f.severity === 'error');

test('every template passes schema + economy validators', () => {
  for (const t of pack.templates) {
    const schema = pack.validateBlueprint(t.blueprint);
    const gameplay = validators.flatMap((v) => v.check(t.blueprint) as ValidationFinding[]);
    const errs = [...schema, ...gameplay].filter((f) => f.severity === 'error');
    assert.equal(errs.length, 0, `template '${t.id}': ${JSON.stringify(errs)}`);
  }
});

test('every manifest control path resolves in the template spec', () => {
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
    assert.notEqual(value, undefined, `manifest path '${p}' does not resolve`);
  }
});

test('detects a soft-lock (no click income + no affordable generator)', () => {
  const bp = structuredClone(pack.templates[0]!.blueprint);
  bp.spec.clickPower = 0;
  bp.spec.currency.start = 0; // cheapest generator costs 10
  assert.ok(errorsOf(bp).some((f) => f.code === 'SOFTLOCK_NO_INCOME'));
});

test('repairer fixes a soft-lock', async () => {
  const bp = structuredClone(pack.templates[0]!.blueprint);
  bp.spec.clickPower = 0;
  bp.spec.currency.start = 0;
  const report: JudgeReport = {
    passed: false,
    findings: validators.flatMap((v) => v.check(bp) as ValidationFinding[]),
  };
  const r = await deterministicRepairer.repair(bp, report, pack, null as never);
  assert.equal(r.changed, true);
  assert.equal(errorsOf(r.blueprint as IdleTycoonBlueprint).length, 0);
});

test('flags an upgrade that targets an unknown generator', () => {
  const bp = structuredClone(pack.templates[0]!.blueprint);
  bp.spec.upgrades.push({
    id: 'x',
    label: 'bad',
    cost: 100,
    effect: { target: 'nope', kind: 'rate', mul: 2 },
  });
  assert.ok(errorsOf(bp).some((f) => f.code === 'UPG_BAD_TARGET'));
});
