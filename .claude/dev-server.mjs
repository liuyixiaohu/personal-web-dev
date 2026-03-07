import { cli } from '../node_modules/astro/dist/cli/index.js';
process.argv = ['node', 'astro', 'dev', '--port', '4321'];
await cli(process.argv);
