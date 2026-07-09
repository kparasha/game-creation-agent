import type { EditorControlManifest } from '@forge/core';

/** Design-Mode drawer for idle-tycoon (data-driven; most tweaks are free client-tier edits). */
export const manifest: EditorControlManifest = {
  groups: [
    {
      id: 'economy',
      label: 'Economy',
      icon: '💰',
      controls: [
        {
          id: 'start',
          label: 'Starting Currency',
          type: 'slider',
          path: 'currency.start',
          min: 0,
          max: 1000,
          step: 10,
          tier: 'client-deterministic',
        },
        {
          id: 'click',
          label: 'Click Power',
          type: 'slider',
          path: 'clickPower',
          min: 0,
          max: 100,
          step: 1,
          tier: 'client-deterministic',
        },
      ],
    },
    {
      id: 'first-gen',
      label: 'First Generator',
      icon: '🏭',
      controls: [
        {
          id: 'g0-cost',
          label: 'Base Cost',
          type: 'slider',
          path: 'generators.0.baseCost',
          min: 1,
          max: 1000,
          step: 1,
          tier: 'client-deterministic',
        },
        {
          id: 'g0-rate',
          label: 'Output / sec',
          type: 'slider',
          path: 'generators.0.baseRate',
          min: 0.1,
          max: 100,
          step: 0.1,
          tier: 'client-deterministic',
        },
        {
          id: 'g0-growth',
          label: 'Cost Growth ×/unit',
          type: 'slider',
          path: 'generators.0.costGrowth',
          min: 1,
          max: 2,
          step: 0.01,
          tier: 'client-deterministic',
        },
      ],
    },
    {
      id: 'goal',
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
            { label: 'Reach amount', value: 'reach' },
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
        { id: 'theme-name', label: 'Theme Name', type: 'text', path: 'theme.name', tier: 'on-device' },
      ],
    },
  ],
};
