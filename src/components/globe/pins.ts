// ============================================
// Pin Data for Kun's Life Journey Globe
// Each pin marks a place on the globe
// Titles, summaries, and stories live in src/content/journey/*.mdx
// ============================================

export interface PinData {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  color: string;
  year: number;
}

export const pins: PinData[] = [
  { id: 'jiaozhou', lat: 36.28, lng: 120.00, city: 'Jiaozhou', country: 'Shandong, China', color: '#D9797B', year: 1996 },
  { id: 'shouguang', lat: 36.86, lng: 118.73, city: 'Shouguang', country: 'Shandong, China', color: '#D9797B', year: 2014 },
  { id: 'qingdao', lat: 36.07, lng: 120.38, city: 'Qingdao', country: 'Shandong, China', color: '#D9797B', year: 2018 },
  { id: 'madison', lat: 43.07, lng: -89.40, city: 'Madison', country: 'Wisconsin, USA', color: '#D9797B', year: 2021 },
  { id: 'fairfield', lat: 38.25, lng: -122.04, city: 'Fairfield', country: 'California, USA', color: '#D9797B', year: 2023 },
  { id: 'berkeley', lat: 37.87, lng: -122.27, city: 'Berkeley', country: 'California, USA', color: '#D9797B', year: 2025 },
];
