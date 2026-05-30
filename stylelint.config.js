/**
 * Design-system lint — guards adherence to /design-system, not formatting
 * (Prettier owns formatting). Deliberately minimal: only rules that catch
 * design drift, so it stays low-noise.
 *
 *  - Colors must come from tokens (var(--color-*) / var(--bg) / …), not literal
 *    hex or named colors. rgba()/rgb()/gradients (functions) and the keywords
 *    below are allowed — they cover one-off overlays/dividers with no token.
 *  - One typeface: no monospace font stacks (see Design System v0.6).
 *
 * Token DEFINITIONS in global.css (`--color-pm: #9a6868`) are custom-property
 * declarations, not `color:` declarations, so they're not flagged.
 */
export default {
  plugins: ['stylelint-declaration-strict-value'],
  overrides: [
    { files: ['**/*.astro'], customSyntax: 'postcss-html' },
    { files: ['**/*.svelte'], customSyntax: 'postcss-html' },
    // The design-system catalog legitimately displays raw hex (the color
    // palette swatches) — it documents the tokens, so it's exempt from the
    // "use a token, not a literal" colour rule. The monospace rule still applies.
    {
      files: ['**/design-system.astro'],
      rules: { 'scale-unlimited/declaration-strict-value': null },
    },
  ],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      // Enforce on color longhands (color, background-color, border-color, …)
      // + svg fill/stroke. The `background` SHORTHAND is intentionally NOT
      // enforced — it legitimately mixes url()/gradients/keywords (e.g. an
      // inline SVG underline), which aren't single tokens.
      ['/color$/', 'fill', 'stroke'],
      {
        ignoreValues: [
          'transparent',
          'currentColor',
          'inherit',
          'initial',
          'unset',
          'none',
          // pure black / white are universal primitives, not brand palette colors
          '#fff',
          '#ffffff',
          'white',
          '#000',
          '#000000',
          'black',
        ],
        message:
          'Use a design token (e.g. var(--color-pm), var(--bg)) instead of a literal color — see /design-system.',
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
