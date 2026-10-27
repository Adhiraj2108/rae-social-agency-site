# Migration: Webflow → Astro

**Status: complete.** Both published pages are rebuilt and verified. Open decisions are listed in "Needs you" below.

- **Source:** Webflow site "Rae Social Agency" (`6abe0e27763529229eb860de`), published at `rae-social-agency.webflow.io`.
- **Snapshot:** the publish of **27 Oct 2026, 20:27 UTC**. The site was republished during the migration. Later edits were deliberately left out (see Remainder).

## What the site is

| Template | URL | Source | Status |
|---|---|---|---|
| Home | `/` | static page + 5 CMS collections | ✅ rebuilt, verified |
| 404 | any unknown URL | static page | ✅ rebuilt, verified |
| Password (401) | — | Webflow site-password feature | ❌ not applicable, see Remainder |
| CMS template pages (projects, services, campaigns, testimonials, client-logos) | — | **not published** in Webflow (all return 404) | not built, matching the live site |
| Style guide | `/style-guide` | new; renders the design tokens | ✅ noindex, excluded from sitemap |

**Breakpoints** come from the site's own stylesheet:
- `max-width: 991px`, `767px`, `479px`
- one `min-width: 768px` query
- the slider embed also uses `480–767` and `768–991`

## What was carried over

- **Layout / markup.** Every element on both pages, split into Astro components. Class names and data attributes are unchanged because the CSS and scripts depend on them.
- **Styles, variables, tokens.** The compiled Webflow stylesheet is in `public/css/webflow.css`. All 146 Webflow variables are in its `:root`: colours, fluid type scale, spacing, grid, components. Page and site custom CSS is kept in `HeadCode.astro`, `HomeHead.astro` and `CustomCode.astro`.
- **Animations.**
  - The IX3 interaction "Stagger Children" (scroll-triggered, on `[data-animate="stagger-children"]`) runs from the self-hosted Webflow runtime it was compiled into.
  - Custom GSAP code is carried over as-is:
    - hero loader (CustomEase "osmo")
    - line reveal (SplitText)
    - image/reel reveal
    - hero + footer parallax
    - sticky testimonials
    - sticky scale
    - project drawer
  - CSS animations are carried over too: marquee, accordion, modal, tabs.
  - Lenis smooth scroll is kept.
- **Assets.** Every file the site loaded from Webflow's CDN, jsDelivr, unpkg and CloudFront is now in `public/` (82 files):
  - images, including every responsive `srcset` size
  - fonts
  - CSS
  - JS (Webflow runtime, GSAP, jQuery, Mast, Swiper, Lenis, hls.js, Phosphor icons)
  - the 7 custom scripts
  - Runtime-loaded files (GSAP CustomEase, the GSAP 3.13 files `linereveal` pulls in) are self-hosted too.
  - The only third-party host the site still calls is Bunny Stream, for the videos.
- **CMS.** All 5 collections, 24 items, with every field, are in `src/content/*.json`. They are typed in `src/content.config.ts` and rendered with the same markup as Webflow, including Webflow's empty-field behaviour (`w-dyn-bind-empty`). List order is preserved exactly. Webflow ordered some lists by hand, so there is an explicit `order` field.
- **SEO.**
  - Titles, descriptions, OG/Twitter tags and the `ProfessionalService` JSON-LD are carried over.
  - `og:image` is now an absolute URL.
  - Added: `sitemap-index.xml` and `robots.txt`. The webflow.io robots blocked everything because it is a staging domain.

## How it was verified

The live site was frozen as a local snapshot and compared against the Astro build in Chromium.

1. **Markup.** I compared every element, attribute and text node of the built HTML against the original, with asset URLs rewritten to local paths.
   - Result: the page body is identical: Home 2,149 nodes, 404 116 nodes, 0 differences.
   - The `<head>` and footer scripts differ only in the intended ways listed below.
2. **Layout and computed style, JS off.** I compared the position, size and 21 computed style properties of all 1,001 elements at 10 widths: 1920, 1440, 1280, 992, 991, 768, 767, 480, 479 and 375.
   - Result: **100% match at every width**, page heights identical.
   - Excluded as timing-dependent: the continuously scrolling marquee and the spinning video loaders.
3. **Layout, JS on, after scrolling the page.** Tested at 1920, 1440, 991, 767, 479 and 375. Worst case was 99.64%.
   - Page heights are identical.
   - The remaining differences are timing: a video started playing on one side and not the other, and a text line was mid-animation. One of these flipped direction between two runs.
4. **Behaviour.**
   - The loader plays and releases the page.
   - The project drawer opens with deep link and title, and closes on Escape.
   - The accordion opens.
   - Videos reach the same player states.
   - SplitText produces the same line count.
   - Everything matched the original at 1440 and 375.
   - The local build makes no requests to Webflow or other CDNs.
5. `astro check`: 0 errors.

**Intended differences from the original:**
- no Webflow badge
- no `generator` meta tag
- no Webflow CDN preconnect or SRI hashes, since the files are self-hosted
- the Odyn editor live-reload socket is removed; the project-drawer code from that bundle is kept as `js/site/project-drawer.js`
- the large inline scripts moved to `js/site/loader-controller.js` and `js/site/home.js`, unchanged and in the same order

Not covered by these numbers:
- **Hover and focus states:** the CSS is identical, but I did not measure them separately.
- **Real devices:** everything was tested in headless Chromium only.

## Remainder — what did not come across

1. **Changes published after 27 Oct 20:27 UTC.** The site was being edited during the migration, and those edits are left out as requested. Example: the hero "scroll down" link gained `data-underline-link`. To pick them up, re-export or apply them by hand.
2. **Webflow's visual CMS editor.** Content is now JSON in the repo. See "Needs you".
3. **Password page (401).** This is a Webflow hosting feature. If a page needs protecting, use Cloudflare Access.
4. **Webflow hosting features:** form handling (the site has no forms), site search, and the Webflow Editor are not reproduced.
5. **`project-more_flag`** in the drawer's "More from" slides is bound to a field the Webflow API does not expose. It is always empty on the live site and renders empty here.
6. **Videos** still stream from the client's Bunny Stream library (`vz-a9787108-ab4.b-cdn.net`). That's intended: it's their video host, not Webflow's.
7. **Mast scripts** were loaded from `@latest` on jsDelivr. The copies taken on 28 Oct 2026 are now pinned locally.

**Carried over as-is (not "fixed", so they read as faithful):**
- the Webflow default favicon and webclip
- a JS error that exists on the live site: `handleSkipLink is not defined`, from the nav embed's skip-link backup
- the footer typo "Site desing & dev by"

## Needs you

| Decision | Recommendation |
|---|---|
| Where content lives | Keep JSON in the repo for now; it's 24 items. If non-developers need to edit, connect a headless CMS (e.g. Sanity) and keep the same schema. |
| Production domain | `https://www.raesocialagency.com` is set in `astro.config.mjs` and `src/data/seo.ts`. Change it if that's wrong. |
| Favicon | Replace the Webflow default icons in `public/images/` with brand ones. |
| `handleSkipLink` error and footer typo | Fix both: a two-line change each. Left alone until approved. |
| Font licences | Geist and Geist Mono are OFL. Apfel Grotezk is free for commercial use under Collletttivo's licence; confirm the licence covers self-hosting. |
