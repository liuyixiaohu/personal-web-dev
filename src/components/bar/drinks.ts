// ============================================
// Drink Data for Robot Bar Scene
// Each drink maps to a professional expertise area
// Descriptions live in translations.ts (SSOT)
// ============================================

export type DrinkId = 'pm' | 'ds' | 'visual';

export interface Drink {
  id: DrinkId;
  color: string;
  route: string;
  descKey: string;
}

export const DRINKS: Drink[] = [
  { id: 'pm',     color: '#F0D7D7', route: '/professional/product-marketing', descKey: 'bar.drink.pm.desc' },
  { id: 'ds',     color: '#D6E6F3', route: '/professional/data-science',      descKey: 'bar.drink.ds.desc' },
  { id: 'visual', color: '#DDEEE7', route: '/professional/visual-design',     descKey: 'bar.drink.visual.desc' },
];

export function getDrink(id: DrinkId): Drink {
  const drink = DRINKS.find(d => d.id === id);
  if (!drink) throw new Error(`Unknown drink: ${id}`);
  return drink;
}

// === Mix (Blend) Routes ===
// Mirrors physics.ts COLLISION_ROUTES pattern — both key orderings stored

const MIX_ROUTES: Record<string, string> = {
  'pm+visual':  '/professional/brand-narrative',
  'visual+pm':  '/professional/brand-narrative',
  'pm+ds':      '/professional/quant-insights',
  'ds+pm':      '/professional/quant-insights',
  'ds+visual':  '/professional/information-design',
  'visual+ds':  '/professional/information-design',
};

const MIX_DESC_KEYS: Record<string, string> = {
  'pm+ds':      'bar.mix.pm_ds.desc',
  'ds+pm':      'bar.mix.pm_ds.desc',
  'pm+visual':  'bar.mix.pm_visual.desc',
  'visual+pm':  'bar.mix.pm_visual.desc',
  'ds+visual':  'bar.mix.ds_visual.desc',
  'visual+ds':  'bar.mix.ds_visual.desc',
};

export function getMixRoute(a: DrinkId, b: DrinkId): string | undefined {
  return MIX_ROUTES[`${a}+${b}`];
}

export function getMixDescKey(a: DrinkId, b: DrinkId): string | undefined {
  return MIX_DESC_KEYS[`${a}+${b}`];
}
