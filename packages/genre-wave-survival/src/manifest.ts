import type { EditorControlManifest } from '@forge/core';

/**
 * The Design-Mode drawer, declared as DATA. The editor shell renders this however the GTM surface
 * wants (web side-drawer, controller radial, touch sheet) — same manifest. Most controls are
 * 'client-deterministic' → editing them is free (no model call). That is the F2P unlock (docs/05).
 * Nested `groups` model Dreams' sub-drawers (e.g. Waves → Escalation). Kept shallow for v1.
 */
export const manifest: EditorControlManifest = {
  groups: [
    {
      id: 'player',
      label: 'Player',
      icon: '🧍',
      controls: [
        {
          id: 'p-hp',
          label: 'Health',
          type: 'slider',
          path: 'player.hp',
          min: 1,
          max: 500,
          step: 1,
          tier: 'client-deterministic',
        },
        {
          id: 'p-speed',
          label: 'Move Speed',
          type: 'slider',
          path: 'player.speed',
          min: 0.5,
          max: 10,
          step: 0.1,
          tier: 'client-deterministic',
        },
        {
          id: 'p-fire',
          label: 'Fire Rate',
          type: 'slider',
          path: 'player.fireRate',
          min: 0.5,
          max: 20,
          step: 0.1,
          tier: 'client-deterministic',
        },
        {
          id: 'p-dmg',
          label: 'Damage',
          type: 'slider',
          path: 'player.damage',
          min: 1,
          max: 100,
          step: 1,
          tier: 'client-deterministic',
        },
      ],
    },
    {
      id: 'waves',
      label: 'Waves',
      icon: '🌊',
      controls: [
        {
          id: 'w-int',
          label: 'Wave Interval (s)',
          type: 'slider',
          path: 'waves.intervalSec',
          min: 1,
          max: 30,
          step: 0.5,
          tier: 'client-deterministic',
        },
        {
          id: 'w-count',
          label: 'Base Spawn Count',
          type: 'slider',
          path: 'waves.baseCount',
          min: 1,
          max: 50,
          step: 1,
          tier: 'client-deterministic',
        },
      ],
      groups: [
        {
          id: 'escalation',
          label: 'Escalation',
          icon: '📈',
          controls: [
            {
              id: 'e-hp',
              label: 'Enemy HP ×/wave',
              type: 'slider',
              path: 'waves.escalation.hpMul',
              min: 1,
              max: 2,
              step: 0.05,
              tier: 'client-deterministic',
            },
            {
              id: 'e-spd',
              label: 'Enemy Speed ×/wave',
              type: 'slider',
              path: 'waves.escalation.speedMul',
              min: 1,
              max: 2,
              step: 0.05,
              tier: 'client-deterministic',
            },
            {
              id: 'e-cnt',
              label: 'Spawn Count ×/wave',
              type: 'slider',
              path: 'waves.escalation.countMul',
              min: 1,
              max: 2,
              step: 0.05,
              tier: 'client-deterministic',
            },
          ],
        },
      ],
    },
    {
      id: 'win',
      label: 'Goal',
      icon: '🏁',
      controls: [
        {
          id: 'win-mode',
          label: 'Mode',
          type: 'select',
          path: 'win.mode',
          options: [
            { label: 'Endless', value: 'endless' },
            { label: 'Survive timer', value: 'survive' },
          ],
          tier: 'client-deterministic',
        },
      ],
    },
    {
      id: 'theme',
      label: 'Theme',
      icon: '🎨',
      controls: [
        // Renaming/retheming reads better as NL → on-device tier (still free).
        { id: 'theme-name', label: 'Theme Name', type: 'text', path: 'theme.name', tier: 'on-device' },
      ],
    },
  ],
};
