# Rae Social Agency — website

Astro rebuild of the Rae Social Agency Webflow site (`rae-social-agency.webflow.io`), self-hosted and ready for Cloudflare.

## Run it

```bash
npm install
cp .env.example .env   # optional: defaults already point at the Sanity project
npm run dev        # http://localhost:4321
npm run build      # static site in dist/, with the Studio in dist/studio
npm run preview    # serve dist/ locally
npm run cf:dev     # build, then serve it like Cloudflare does (site + /studio): http://localhost:8787
npm run check      # type-check
```

Requires Node 22.23+ (`.node-version` pins it for Cloudflare builds).

## Edit content: Sanity Studio

Content lives in Sanity (project `khgb3vuz`, dataset `production`). Edit it in the Studio:

- **On the site:** `/studio` (e.g. https://www.raesocialagency.com.au/studio once the site is live). `npm run build` builds the Studio into `dist/studio`, and `worker/index.js` sends Studio deep links (`/studio/structure/...`) to it. Sign in with a Sanity account that's a member of the project. Invite editors at https://www.sanity.io/manage/project/khgb3vuz/members.
- **Locally:** `npm run studio:dev` (http://localhost:3333/studio), or `npm run cf:dev` for the site and Studio together (http://localhost:8787/studio).
- **Allowed origins:** the Studio only signs in from origins listed at https://www.sanity.io/manage/project/khgb3vuz/api (*CORS origins*, with *Allow credentials* on). Add each address you open it from: `http://localhost:8787`, the `*.workers.dev` URL, and the live domain.
- The old hosted Studio (https://raesocialagency.sanity.studio) still works until it's removed with `npx sanity undeploy` in `studio/`.

| Studio list | Shown on the site in |
|---|---|
| Projects | "Selected Projects" + the project drawer |
| Services | Services accordion |
| Testimonials | Sticky testimonials |
| Campaigns | Campaign reels (`Side`: left / right column) |
| Client logos | Logo marquee |

- **Order:** drag items in each list. That order is the order on the site.
- **Project slug:** it's the drawer deep link, e.g. `/#spring-menu`.
- **Videos:** Bunny Stream URLs (`…/playlist.m3u8` and the thumbnail `.jpg`). Videos are not uploaded to Sanity.
- **Empty optional fields** are hidden on the page, as in Webflow.

**When does the site change?** The site is static. It reads published content **at build time**:
- after an edit is published, trigger a new build (see "Rebuild on publish");
- locally, restart `npm run dev`, or type `s` + Enter in the dev server terminal to re-sync content.

The fetch and the checks run in `src/content.config.ts`: the GROQ queries plus a zod schema per type. A build fails rather than shipping malformed content.

The Studio code (schemas, list structure) is in `studio/`. After changing a schema, redeploy the site; the Studio ships with it. The original Webflow export and the one-time import script are in `studio/migrations/`.

### Rebuild on publish

Set this up once the Cloudflare project exists:

1. In Cloudflare, open the project and create a **deploy hook**:
   - **Pages:** *Settings → Builds → Deploy hooks*.
   - **Workers Builds:** *Settings → Build → Deploy hooks*.
   - Copy the URL.
2. In Sanity, open https://www.sanity.io/manage/project/khgb3vuz/api/webhooks and choose *Create webhook*:
   - **URL:** the deploy hook.
   - **Dataset:** `production`.
   - **Trigger on:** create, update, delete.
   - **Filter:** `_type in ["project","service","testimonial","campaign","clientLogo"]`
   - **HTTP method:** POST.

From then on, publishing in the Studio redeploys the site in about a minute.

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

Prefer Workers: Pages ignores `worker/index.js`, so on Pages reloading a Studio page other than `/studio/` gives a 404.

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
  content.config.ts loads each content type from Sanity at build time
  lib/sanity.ts     Sanity client + rich text → HTML
  lib/cms.ts        collection getters, Webflow empty-field behaviour
  data/seo.ts       titles, descriptions, OG, JSON-LD
studio/             Sanity Studio: schemas, list structure, Webflow import
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
