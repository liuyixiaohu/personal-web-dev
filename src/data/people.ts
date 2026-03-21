export interface Person {
  slug: string;
  name: string;
  subtitle: string;
  color: string;
  linkedin?: string;
  comingDate?: string;
}

export const people: Person[] = [
  { slug: 'joanne-goldberg', name: 'JoAnne Goldberg', subtitle: 'A Serendipity. A ray of sunshine.', color: 'var(--color-ds)', linkedin: 'https://www.linkedin.com/in/joannegoldbergmba/', comingDate: '3.18' },
  { slug: 'zach-beasley', name: 'Zach Beasley', subtitle: 'My "Andrew Ng" in Visual Design', color: 'var(--color-visual)', linkedin: 'https://www.linkedin.com/in/zachbeasley/', comingDate: '3.20' },
  { slug: 'yan-zhang', name: 'Yan Zhang', subtitle: 'The woman has always been behind me.', color: 'var(--color-pm)', comingDate: '3.22' },
];
