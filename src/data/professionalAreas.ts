export interface ProfessionalArea {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  i18n: {
    title: string;       // detail page heading (e.g., 'craft.pm.title')
    cardTitle: string;    // homepage card title (e.g., 'craft.pm')
    cardDesc: string;     // homepage card description (e.g., 'craft.pm.desc')
  };
}

export const professionalAreas: ProfessionalArea[] = [
  {
    slug: 'product-marketing',
    title: 'Product Marketing',
    subtitle: 'Nailed the positioning. Then the product pivoted.',
    description: "Kun Li's product marketing work: strategy, go-to-market, and growth.",
    color: 'var(--color-pm)',
    i18n: {
      title: 'craft.pm.title',
      cardTitle: 'craft.pm',
      cardDesc: 'craft.pm.desc',
    },
  },
  {
    slug: 'data-science',
    title: 'Data Science',
    subtitle: 'Presented findings to leadership. They went with their gut.',
    description: "Kun Li's data science portfolio: analytics, modeling, and insights.",
    color: 'var(--color-ds)',
    i18n: {
      title: 'craft.ds.title',
      cardTitle: 'craft.ds',
      cardDesc: 'craft.ds.desc',
    },
  },
  {
    slug: 'visual-design',
    title: 'Visual Design',
    subtitle: 'After spending 3 hours adjusting a gradient. The client said, "looks the same." It was not.',
    description: "Kun Li's visual design work: UI, branding, and creative direction.",
    color: 'var(--color-visual)',
    i18n: {
      title: 'craft.visual.title',
      cardTitle: 'craft.visual',
      cardDesc: 'craft.visual.desc',
    },
  },
];
