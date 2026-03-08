export interface Person {
  slug: string;
  name: string;
  subtitle: string;
  color: string;
}

export const people: Person[] = [
  { slug: 'joanne-goldberg', name: 'JoAnne Goldberg', subtitle: 'A Serendipity. A ray of sunshine.', color: 'var(--color-ds)' },
  { slug: 'zach-beasley', name: 'Zach Beasley', subtitle: 'My "Andrew Ng" in Visual Design', color: 'var(--color-visual)' },
  { slug: 'yan-zhang', name: 'Yan Zhang', subtitle: 'The woman has always been behind me.', color: 'var(--color-pm)' },
];
