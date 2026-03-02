# kunli.co

Personal portfolio website — [kunli.co](https://kunli.co)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Astro](https://astro.build) |
| UI Components | [Svelte 5](https://svelte.dev) |
| 3D Graphics | [Three.js](https://threejs.org) / three-globe |
| Language | TypeScript |
| Data | ExcelJS, XLSX, TopoJSON |
| Sitemap | @astrojs/sitemap |

## Getting Started

```bash
npm install
npm run dev        # localhost:4321
npm run build      # production build → ./dist/
npm run preview    # preview production build locally
```

## Project Structure

```
src/
├── pages/         # Astro page routes
├── components/    # Svelte & Astro components
├── layouts/       # Page layouts
└── assets/        # Static assets
public/            # Served as-is (fonts, images, favicons)
```
