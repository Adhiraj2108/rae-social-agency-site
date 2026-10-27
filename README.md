# Rae Social Agency — website

Astro rebuild of the Rae Social Agency Webflow site (`rae-social-agency.webflow.io`), self-hosted and ready for Cloudflare.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
npm run check      # type-check
```

Requires Node 20+.

## Edit content (the former Webflow CMS)

Each Webflow CMS collection is now a JSON file in `src/content/`, validated by the schema in `src/content.config.ts`. A build fails if an entry does not match the schema.

| Collection | File | Shown in |
|---|---|---|
| Projects | `src/content/projects.json` | "Selected Projects" + the project drawer |
| Services | `src/content/services.json` | Services accordion |
| Testimonials | `src/content/testimonials.json` | Sticky testimonials |
| Campaigns | `src/content/campaigns.json` | Campaign reels (`side`: `Left` / `Right` column) |
| Client Logos | `src/content/client-logos.json` | Logo marquee |

- `id` is the Webflow slug. For projects it is also the drawer deep link (`/#spring-menu`).
- `order` sets the position in the list.
- Rich-text fields (`description`, `credits`, `results`) are HTML strings.
- Videos are Bunny Stream URLs (`…/playlist.m3u8` and `…/thumbnail.jpg`).
- Images go in `public/images/cms/…` and are referenced by path.
- An empty optional field is hidden on the page, as in Webflow.

## Deploy to Cloudflare

**Workers (static assets)**: config is in `wrangler.jsonc`.

```bash
npx wrangler login
npm run deploy
```

**Pages (Git integration)**: connect the repo in the Cloudflare dashboard, then set:
- framework preset: Astro
- build command: `npm run build`
- output directory: `dist`

Either way, `dist/404.html` is served for unknown URLs, and `public/_headers` sets caching.

The canonical domain is set in `astro.config.mjs` (`site`) and `src/data/seo.ts` (`SITE_URL`). It is used for `og:image`, JSON-LD and the sitemap.

## Project layout

```
src/
  pages/            index.astro, 404.astro, style-guide.astro (design tokens, noindex)
  layouts/          BaseLayout.astro — <head>, site-wide scripts
  components/
    global/         Nav, Footer, HeadCode (head custom code), CustomCode (Mast/Swiper embeds)
    home/           one component per home page section + Loader, ProjectDrawer, HomeHead
    BunnyBg.astro   Bunny Stream background video player
  content/          CMS data (JSON)
  lib/cms.ts        collection getters, Webflow empty-field behaviour
  data/seo.ts       titles, descriptions, OG, JSON-LD
public/
  css/webflow.css   the site's stylesheet (all design tokens live in its :root)
  css/vendor/       Lenis, Swiper, Phosphor icons
  fonts/            Apfel Grotezk, Geist, Geist Mono (self-hosted)
  images/           all site images, incl. responsive -p-500…-p-3200 variants
  js/webflow/       Webflow runtime (nav, IX3 "stagger children" interaction)
  js/vendor/        jQuery, GSAP 3.15 (+3.13 used by linereveal), Lenis, Swiper, hls.js, Mast
  js/site/          the site's own scripts (loader, drawer, testimonials, reveals, parallax, video)
```

See `MIGRATION.md` for what was carried over, how it was verified, and what did not come across.
