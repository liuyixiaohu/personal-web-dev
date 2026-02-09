// ============================================
// Pin Data for Kun's Life Journey Globe
// Each pin marks a place with a story
// ============================================

export interface PinData {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  title: string;
  story: string;
  color: string; // pin head color
}

export const pins: PinData[] = [
  {
    id: 'jiaozhou',
    lat: 36.28,
    lng: 120.00,
    city: 'Jiaozhou',
    country: 'Shandong, China',
    title: 'Where it all began',
    story: 'Placeholder story about Jiaozhou. The roots of a journey, quietly planted in this corner of Shandong.',
    color: '#D9797B',
  },
  {
    id: 'qingdao',
    lat: 36.07,
    lng: 120.38,
    city: 'Qingdao',
    country: 'Shandong, China',
    title: 'Coastal memories',
    story: 'Placeholder story about Qingdao. Sea breeze, red roofs, and the taste of salt in the air.',
    color: '#D9797B',
  },
  {
    id: 'weifang',
    lat: 36.71,
    lng: 119.10,
    city: 'Weifang',
    country: 'Shandong, China',
    title: 'Kite city',
    story: 'Placeholder story about Weifang. A city where the sky is always full of color.',
    color: '#D9797B',
  },
  {
    id: 'hong-kong',
    lat: 22.32,
    lng: 114.17,
    city: 'Hong Kong',
    country: 'China',
    title: 'East meets West',
    story: 'Placeholder story about Hong Kong. Neon-lit streets, dim sum mornings, and a skyline that never sleeps.',
    color: '#D9797B',
  },
  {
    id: 'bangkok',
    lat: 13.76,
    lng: 100.50,
    city: 'Bangkok',
    country: 'Thailand',
    title: 'City of angels',
    story: 'Placeholder story about Bangkok. Golden temples, bustling markets, and the warmth of Thai hospitality.',
    color: '#D9797B',
  },
  {
    id: 'dubai',
    lat: 25.20,
    lng: 55.27,
    city: 'Dubai',
    country: 'UAE',
    title: 'Desert mirage',
    story: 'Placeholder story about Dubai. A city rising from the sand, where ambition touches the clouds.',
    color: '#D9797B',
  },
  {
    id: 'chicago',
    lat: 41.88,
    lng: -87.63,
    city: 'Chicago',
    country: 'USA',
    title: 'The Windy City',
    story: 'Placeholder story about Chicago. Deep-dish pizza, jazz, and the wind off Lake Michigan.',
    color: '#D9797B',
  },
  {
    id: 'madison',
    lat: 43.07,
    lng: -89.40,
    city: 'Madison',
    country: 'Wisconsin, USA',
    title: 'Between the lakes',
    story: 'Placeholder story about Madison. A city cradled between two lakes, full of ideas and energy.',
    color: '#D9797B',
  },
  {
    id: 'fairfield',
    lat: 38.25,
    lng: -122.04,
    city: 'Fairfield',
    country: 'California, USA',
    title: 'Golden state chapter',
    story: 'Placeholder story about Fairfield. Where the Central Valley meets the coastal hills.',
    color: '#D9797B',
  },
  {
    id: 'benicia',
    lat: 38.05,
    lng: -122.16,
    city: 'Benicia',
    country: 'California, USA',
    title: 'By the strait',
    story: 'Placeholder story about Benicia. A small waterfront town with big character.',
    color: '#D9797B',
  },
  {
    id: 'berkeley',
    lat: 37.87,
    lng: -122.27,
    city: 'Berkeley',
    country: 'California, USA',
    title: 'Ideas in bloom',
    story: 'Placeholder story about Berkeley. Where free thinking and the Bay breeze go hand in hand.',
    color: '#D9797B',
  },
  {
    id: 'kohler',
    lat: 43.74,
    lng: -87.78,
    city: 'Kohler',
    country: 'Wisconsin, USA',
    title: 'A village of craft',
    story: 'Placeholder story about Kohler. A small village with an outsized legacy of craft and design.',
    color: '#D9797B',
  },
];
