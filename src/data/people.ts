export interface Person {
  slug: string;
  name: string;
  color: string;
}

export const people: Person[] = [
  { slug: 'joanne-goldberg', name: 'JoAnne Goldberg', color: 'var(--color-ds)' },
  { slug: 'zach-beasley', name: 'Zach Beasley', color: 'var(--color-visual)' },
  { slug: 'yan-zhang', name: 'Yan Zhang', color: 'var(--color-pm)' },
];
