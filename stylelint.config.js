/**
 * Design-system lint — guards adherence to /design-system, not formatting
 * (Prettier owns formatting). Deliberately minimal: only rules that catch
 * design drift, so it stays low-noise.
 *
 *  - Colors, type sizes, radii, shadows, and font stacks must come from tokens.
 *    rgba()/rgb()/gradients (functions) and the semantic keywords below remain
 *    available for one-off overlays and inherited values.
 *  - Monospace remains limited to the explicitly suppressed code treatment.
 *
 * Token DEFINITIONS in global.css (`--color-pm: #9a6868`) are custom-property
 * declarations, not `color:` declarations, so they're not flagged.
 */
export default {
  plugins: ['stylelint-declaration-strict-value'],
  overrides: [
    { files: ['**/*.astro'], customSyntax: 'postcss-html' },
    { files: ['**/*.svelte'], customSyntax: 'postcss-html' },
  ],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      // Enforce on color longhands (color, background-color, border-color, …)
      // + svg fill/stroke. The `background` SHORTHAND is intentionally NOT
      // enforced — it legitimately mixes url()/gradients/keywords (e.g. an
      // inline SVG underline), which aren't single tokens.
      ['/color$/', 'fill', 'stroke', 'font-size', '/border.*radius$/', 'box-shadow', 'font-family'],
      {
        ignoreValues: [
          'transparent',
          'currentColor',
          'inherit',
          'initial',
          'unset',
          'none',
          '#fff',
          '#ffffff',
          'white',
          '#000',
          '#000000',
          'black',
        ],
        message:
          'Use a documented design token instead of a literal value — see workbench.kunli.co/design-system.',
      },
    ],
    'declaration-property-value-disallowed-list': [
      { 'font-family': ['/mono/i'] },
      {
        message:
          'Use the one brand typeface (var(--font-body)); no monospace — see /design-system.',
      },
    ],
  },
};
