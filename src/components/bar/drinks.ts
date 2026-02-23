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

// === Structured Mix Data (for Bar Menu & Mix Preview Card) ===

export interface Mix {
  id: string;
  drinks: [DrinkId, DrinkId];
  route: string;
  descKey: string;
  titleKey: string;
  subtitleKey: string;
}

export const MIXES: Mix[] = [
  { id: 'pm_ds',     drinks: ['pm', 'ds'],     route: '/professional/quant-insights',    descKey: 'bar.mix.pm_ds.desc',    titleKey: 'professional.quantInsights',     subtitleKey: 'professional.quantSubtitle' },
  { id: 'pm_visual', drinks: ['pm', 'visual'], route: '/professional/brand-narrative',    descKey: 'bar.mix.pm_visual.desc', titleKey: 'professional.brandNarrative',    subtitleKey: 'professional.brandSubtitle' },
  { id: 'ds_visual', drinks: ['ds', 'visual'], route: '/professional/information-design', descKey: 'bar.mix.ds_visual.desc', titleKey: 'professional.informationDesign', subtitleKey: 'professional.infoSubtitle' },
];

export function getMix(a: DrinkId, b: DrinkId): Mix | undefined {
  return MIXES.find(m =>
    (m.drinks[0] === a && m.drinks[1] === b) ||
    (m.drinks[0] === b && m.drinks[1] === a)
  );
}

// === Skill Bottles (Back-Wall Wine Rack) ===
// High-level skill categories displayed as clickable bottles

export interface SkillBottle {
  id: string;
  category: DrinkId;
  label: string;        // English fallback (short, for bottle body)
  labelKey: string;     // i18n key for translated label
  descKey: string;      // i18n key for card description
  tools: string[];      // Specific tools / brand names (no translation)
}

export const BOTTLES: SkillBottle[] = [
  { id: 'strategy',  category: 'pm',     label: 'Strategy',  labelKey: 'bar.bottle.strategy',  descKey: 'bar.bottle.strategy.desc',  tools: ['Salesforce', 'HubSpot'] },
  { id: 'analytics', category: 'pm',     label: 'Analytics', labelKey: 'bar.bottle.analytics', descKey: 'bar.bottle.analytics.desc', tools: ['GA4', 'Optimizely'] },
  { id: 'coding',    category: 'ds',     label: 'Coding',    labelKey: 'bar.bottle.coding',    descKey: 'bar.bottle.coding.desc',    tools: ['Python', 'SQL'] },
  { id: 'ml',        category: 'ds',     label: 'ML & Viz',  labelKey: 'bar.bottle.ml',        descKey: 'bar.bottle.ml.desc',        tools: ['Tableau', 'Jupyter'] },
  { id: 'design',    category: 'visual', label: 'Design',    labelKey: 'bar.bottle.design',    descKey: 'bar.bottle.design.desc',    tools: ['Figma', 'Adobe CC'] },
  { id: '3d',        category: 'visual', label: '3D & Web',  labelKey: 'bar.bottle.3d',        descKey: 'bar.bottle.3d.desc',        tools: ['Blender', 'Three.js'] },
];
