import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const ids = ['jiaozhou', 'shouguang', 'qingdao', 'madison', 'fairfield', 'berkeley'];
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

for (const id of ids) {
  const path = `src/content/journey/${id}.mdx`;
  assert(existsSync(join(root, path)), `${path} is missing`);
  if (!existsSync(join(root, path))) continue;

  const mdx = read(path);
  assert(/^---\n[\s\S]*?\n---/.test(mdx), `${path} is missing frontmatter`);
  assert(/^title:\s*".+"/m.test(mdx), `${path} is missing title`);
  assert(/^summary:\s*".+"/m.test(mdx), `${path} is missing summary`);
  assert(/^##\s+\S+/m.test(mdx), `${path} needs at least one ## chapter`);
}

const detailPage = 'src/pages/life-journey/[id].astro';
assert(existsSync(join(root, detailPage)), `${detailPage} is missing`);
if (existsSync(join(root, detailPage))) {
  const source = read(detailPage);
  assert(source.includes('getStaticPaths'), `${detailPage} must define getStaticPaths`);
  assert(source.includes('render(entry)'), `${detailPage} must render MDX content`);
}

const indexPage = read('src/pages/life-journey.astro');
assert(indexPage.includes('journey-tooltip'), 'Journey page needs a hover/focus tooltip');
assert(!indexPage.includes('story-modal'), 'Journey page should not render the old story modal');
assert(!existsSync(join(root, 'src/data/journeyStories.ts')), 'Old journeyStories.ts should be removed');
assert(!existsSync(join(root, 'src/utils/journey/modal.ts')), 'Old journey modal utility should be removed');

if (failures.length) {
  console.error(`Journey MDX verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Journey MDX verification passed.');
