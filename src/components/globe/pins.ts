// ============================================
// Pin Data for Kun's Life Journey Globe
// Each pin marks a place on the globe
// Titles and stories live in translations.ts (SSOT)
// ============================================

export interface PinData {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  color: string;
}

export const pins: PinData[] = [
  { id: 'jiaozhou', lat: 36.28, lng: 120.00, city: 'Jiaozhou', country: 'Shandong, China', color: '#D9797B' },
  { id: 'qingdao', lat: 36.07, lng: 120.38, city: 'Qingdao', country: 'Shandong, China', color: '#D9797B' },
  { id: 'weifang', lat: 36.71, lng: 119.10, city: 'Weifang', country: 'Shandong, China', color: '#D9797B' },
  { id: 'hong-kong', lat: 22.32, lng: 114.17, city: 'Hong Kong', country: 'China', color: '#D9797B' },
  { id: 'bangkok', lat: 13.76, lng: 100.50, city: 'Bangkok', country: 'Thailand', color: '#D9797B' },
  { id: 'dubai', lat: 25.20, lng: 55.27, city: 'Dubai', country: 'UAE', color: '#D9797B' },
  { id: 'chicago', lat: 41.88, lng: -87.63, city: 'Chicago', country: 'USA', color: '#D9797B' },
  { id: 'madison', lat: 43.07, lng: -89.40, city: 'Madison', country: 'Wisconsin, USA', color: '#D9797B' },
  { id: 'fairfield', lat: 38.25, lng: -122.04, city: 'Fairfield', country: 'California, USA', color: '#D9797B' },
  { id: 'benicia', lat: 38.05, lng: -122.16, city: 'Benicia', country: 'California, USA', color: '#D9797B' },
  { id: 'berkeley', lat: 37.87, lng: -122.27, city: 'Berkeley', country: 'California, USA', color: '#D9797B' },
  { id: 'kohler', lat: 43.74, lng: -87.78, city: 'Kohler', country: 'Wisconsin, USA', color: '#D9797B' },
];
