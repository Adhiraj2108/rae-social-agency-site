# Rae Social Agency site — notes for agents

Astro 7 static site, migrated 1:1 from Webflow. See README.md (run/deploy) and MIGRATION.md (what was carried over).

## Rules

- **Do not rename classes or data attributes in markup.** `public/css/webflow.css` and the scripts in `public/js/` select on them.
  - Classes: `.section`, `.container`, `.row`, `.col`, `cc-*` combo classes, `u-*` utilities.
  - Data attributes: `data-reveal`, `data-tst`, `data-drawer-*`, `data-player-*`, `data-loader`, `data-animate`, `data-hero-parallax`, `data-footer-parallax*`, `data-reel-in`, `data-accordion-*`.
- **Keep `data-wf-page` / `data-wf-site` on `<html>`.** The Webflow runtime (`public/js/webflow/`) uses them to run the IX3 "Stagger Children" interaction.
- **Every `<script>` and `<style>` carried over from Webflow uses `is:inline`.** Script order in `BaseLayout.astro` matters:
  - jQuery → Webflow → GSAP → Lenis → loader controller → page scripts → copyemail → video scripts.
- **CMS markup mirrors Webflow:**
  - Use `bindClass()` from `src/lib/cms.ts` on any element bound to an optional field. It adds `w-dyn-bind-empty`, which CSS uses to hide empty rows.
  - The drawer always renders 5 "More from" slots.
- **Put new styles in a new stylesheet**, not in `webflow.css`; that keeps `webflow.css` a clean copy of the original.
- Markup may be freely re-indented. Astro's `compressHTML` drops newline-only whitespace between tags. Don't put meaningful spaces at tag boundaries on new lines.

## Design tokens (from `:root` in public/css/webflow.css; rendered at /style-guide)

**Colour**

| Token | Value | Role |
|---|---|---|
| `--_color---neutral--black` | `#1b1815` | text (`--primary--text`) |
| `--_color---neutral--white` | `white` | background (`--primary--background`) |
| `--_color---neutral--light-gray` | `#f0eee6` | loader cover |
| `--_color---neutral--mid-gray-1` | `#cccabf` | borders (`--primary--border`) |
| `--_color---neutral--mid-gray-2` | `#474641` | |
| `--_color---neutral--dark-gray` | `#292825` | |
| `--_color---primary--pale-blue` | `#d4dae2` | accent (`--primary--accent`) |
| `--_color---primary--burgundy` | `#2b181a` | dark accent (`--primary--accent-dark`) |

**Type**
- Primary font: "Apfel Grotezk" (400 / 500 / 600 / 700), used for headings and buttons.
- Secondary font: Geist (variable), used for body.
- Mono: Geist Mono (variable), used for `.eyebrow`.
- h1–h6, the paragraph sizes and `.eyebrow` are fluid: they scale between min and max rem across 20rem → 90rem viewports (`--_layout---fluid--min/max`).

**Layout**
- Container max width: 90rem, with a 6vw gutter.
- 12-column grid.
- Gaps: 40px main, 20px md, 8px sm.
- Section padding is fluid (`--_components---section--padding`).
- Nav height: 48px.
- Radii: 0.5rem for buttons, cards and inputs.

**Breakpoints** (desktop-first, Webflow): 991px, 767px, 479px.

**Motion**
- GSAP ease "osmo" = `cubic-bezier(0.625, 0.05, 0, 1)` (CustomEase `M0,0 C0.625,0.05 0,1 1,1`).
- Lenis smooth scroll.
- Respects `prefers-reduced-motion`.
