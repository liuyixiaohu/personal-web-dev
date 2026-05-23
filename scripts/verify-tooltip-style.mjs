import { readFileSync } from 'node:fs';

function readProjectFile(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

const tooltip = readProjectFile('src/components/HintTooltip.astro');
const globalStyles = readProjectFile('src/styles/global.css');
const tooltipStyles = readProjectFile('src/styles/tooltips.css');
const journeyPage = readProjectFile('src/pages/life-journey.astro');

const checks = [
  {
    name: 'global styles import shared tooltip styles',
    test: () => globalStyles.includes("@import './tooltips.css';"),
  },
  {
    name: 'shared tooltip-card class exists',
    test: () => tooltipStyles.includes('.tooltip-card'),
  },
  {
    name: 'home hint popup does not use the Journey card class',
    test: () => !/class="[^"]*\btooltip-card\b[^"]*"/.test(tooltip),
  },
  {
    name: 'home hint popup keeps the lightweight inline popup class',
    test: () => /class="hint-popup"/.test(tooltip),
  },
  {
    name: 'popup supports keyboard focus as well as hover',
    test: () => tooltip.includes('.hint-trigger:is(:hover, :focus-within) .hint-popup'),
  },
  {
    name: 'Journey card background is lighter glass',
    test: () => tooltipStyles.includes('background: rgba(255, 255, 255, 0.58);'),
  },
  {
    name: 'popup width includes padding and border',
    test: () => tooltipStyles.includes('box-sizing: border-box;'),
  },
  {
    name: 'Journey card blur is stronger',
    test: () => tooltipStyles.includes('backdrop-filter: blur(18px) saturate(1.25);'),
  },
  {
    name: 'popup keeps links readable inside the card',
    test: () => tooltipStyles.includes('.tooltip-card a'),
  },
  {
    name: 'shared tooltip styles avoid undefined font tokens',
    test: () => !tooltipStyles.includes('var(--fs-sm)'),
  },
  {
    name: 'home hint popup is not card-width constrained',
    test: () => !tooltip.includes('width: min(19rem, calc(100vw - 2rem));'),
  },
  {
    name: 'Journey tooltip uses the shared tooltip-card class',
    test: () => journeyPage.includes('class="journey-tooltip tooltip-card"'),
  },
];

const failures = checks.filter(({ test }) => !test());

if (failures.length > 0) {
  console.error('Tooltip style verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure.name}`);
  }
  process.exit(1);
}

console.log('Tooltip style verification passed.');
