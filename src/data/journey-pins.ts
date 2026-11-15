// ============================================
// Journey stations, in the order they were lived.
// Titles, summaries, and stories live in src/content/journey/*.mdx
// ============================================

export interface PinData {
  id: string;
  city: string;
  year: number;
}

export const pins: PinData[] = [
  {
    id: 'jiaozhou',
    city: 'Jiaozhou',
    year: 1996,
  },
  {
    id: 'shouguang',
    city: 'Shouguang',
    year: 2014,
  },
  {
    id: 'qingdao',
    city: 'Qingdao',
    year: 2018,
  },
  {
    id: 'madison',
    city: 'Madison',
    year: 2021,
  },
  {
    id: 'fairfield',
    city: 'Fairfield',
    year: 2023,
  },
  {
    id: 'berkeley',
    city: 'Berkeley',
    year: 2025,
  },
];
