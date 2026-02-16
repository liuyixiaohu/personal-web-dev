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
