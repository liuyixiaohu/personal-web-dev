export interface ProfessionalArea {
  slug: string;
  title: string;
  description: string;
  color: string;
  i18nKey: string;
}

export const professionalAreas: ProfessionalArea[] = [
  {
    slug: 'product-marketing',
    title: 'Product Marketing',
    description: "Kun Li's product marketing work: strategy, go-to-market, and growth.",
    color: 'var(--color-pm)',
    i18nKey: 'professional.productMarketing',
  },
  {
    slug: 'data-science',
    title: 'Data Science',
    description: "Kun Li's data science portfolio: analytics, modeling, and insights.",
    color: 'var(--color-ds)',
    i18nKey: 'professional.dataScience',
  },
  {
    slug: 'visual-design',
    title: 'Visual Design',
    description: "Kun Li's visual design work: UI, branding, and creative direction.",
    color: 'var(--color-visual)',
    i18nKey: 'professional.visualDesign',
  },
];
