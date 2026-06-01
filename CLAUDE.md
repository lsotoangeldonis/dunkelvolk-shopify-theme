# CLAUDE.md — Project context for Claude Code

You're working on the **Dunkelvolk Perú** Shopify theme (`dunkelvolk-peru.myshopify.com`). Read [README.md](README.md) for the human-facing intro; this file captures the project-specific conventions and gotchas you need to know before editing.

## What this codebase actually is

- A **heavily customized vintage Shopify theme** (based on TheBox by some agency). Many sections are 900–1300 lines with custom CSS/JS inlined; `theme.scss.liquid` is ~8 K lines of legacy SCSS.
- The **homepage was redesigned in 2026** (the "Dunk redesign"). New homepage sections live alongside the legacy ones. The legacy header and many old sections are still in the codebase — **do not delete them without explicit instruction**.
- Inner pages (PDP, PLP, cart) still use the **legacy TheBox templates** and have lots of app integrations baked in (Boost-PFS, Mercado Pago Antifraud, Enorm carousel, BSS Store Locator, etc.). Touching them is high-risk.

## Don't touch unless asked

| File / area | Why it's risky |
|---|---|
| [assets/theme.scss.liquid](assets/theme.scss.liquid) | 8 K-line legacy stylesheet. Used by all inner pages. Edits ripple unpredictably. Prefer scoped section CSS or a `dunk-*-overrides.liquid` snippet. |
| [assets/theme.js](assets/theme.js), `assets/boost-pfs-*.js` | Legacy JS bundles for the TheBox theme + Boost filter. Don't refactor. |
| [sections/collection-template-boost-pfs-original.liquid](sections/collection-template-boost-pfs-original.liquid), `collection-template-dunk.liquid`, etc. | Multiple templates for the same page, each tied to different apps. Confirm which is in use before editing. |
| The mobile-nav-wrapper inside [sections/header.liquid](sections/header.liquid) (lines ~400-470 area) | Drawer for the mobile menu, triggered by `js-mobile-nav-toggle`. New Dunk header reuses this class — removing it breaks mobile navigation. |
| App embed blocks in `config/settings_data.json` (`blocks` map) | Mercado Pago antifraud, Bundler, Labeler — never disable these. |
| `templates/password.liquid` + `sections/password-*.liquid` | The "SOMETHING NEW IS COMING" countdown is already live. Don't touch unless redesigning. |

## The homepage redesign — files of interest

Sections **created for the 2026 redesign** (modern, self-contained, OS 2.0-friendly schemas):

- [sections/feature-columns-dunk.liquid](sections/feature-columns-dunk.liquid) — EXPLORE / MOVE / CONNECT / QUALITY grid
- [sections/image-quote-split.liquid](sections/image-quote-split.liquid) — 50/50 or full-width image. **Caption is baked into the image** in `single` mode (no overlay text rendering needed)
- [sections/art-of-journey.liquid](sections/art-of-journey.liquid) — text block + 2 portrait images, mobile-interleaved
- [sections/full-bleed-image.liquid](sections/full-bleed-image.liquid) — generic editorial banner
- [sections/pima-tee-grid.liquid](sections/pima-tee-grid.liquid) — 4-column product card grid
- [sections/logo-banner-dunk.liquid](sections/logo-banner-dunk.liquid) — centered logo divider
- [sections/dunk-explorers-club.liquid](sections/dunk-explorers-club.liquid) — newsletter with email + phone + benefits

Snippets:

- [snippets/dunk-fonts.liquid](snippets/dunk-fonts.liquid) — `@font-face` declarations + global `font-family` overrides. Loaded on every page from [layout/theme.liquid](layout/theme.liquid).
- [snippets/dunk-home-overrides.liquid](snippets/dunk-home-overrides.liquid) — homepage-only layout overrides (hero height, header overlay, neutralization of legacy `padding-top`). Loaded conditionally only when `request.page_type == 'index'`.

The slideshow ([sections/slideshow-tbx-v2.liquid](sections/slideshow-tbx-v2.liquid)) is legacy but **was modified** to add: a per-slide `button_label`, and the `asset_filename` / `asset_filename_mobile` pattern (see next section).

## Code conventions

### `asset_filename` pattern

The new sections accept **either** an `image_picker` (uploaded to Shopify Files) **or** an `asset_filename` text input (file in `/assets/`). When both are set, `asset_filename` wins. Pattern:

```liquid
{%- assign asset_src = '' -%}
{%- if block.settings.asset_filename != blank -%}
  {%- assign asset_src = block.settings.asset_filename | asset_url -%}
{%- endif -%}

{%- if asset_src != '' -%}
  <img src="{{ asset_src }}" alt="" loading="lazy">
{%- elsif block.settings.image != blank -%}
  <img src="{{ block.settings.image | img_url: '800x' }}" alt="" loading="lazy">
{%- else -%}
  {{ 'lifestyle-1' | placeholder_svg_tag: 'placeholder-svg' }}
{%- endif -%}
```

When adding a new section that takes images, **support both inputs**. Repo-versioned assets use `asset_filename`; merchant-editable images use `image_picker`.

### Section scoping

Each new section uses a `component_class` prefix derived from `section.id` so styles don't bleed:

```liquid
{%- assign component_class = 'feature-columns-dunk__' | append: section.id -%}
<style>
  .{{ component_class }} { ... }
</style>
<section class="{{ component_class }}" ...>
```

All CSS lives in the `<style>` tag at the top of the section file. **Don't put new homepage styles in `theme.scss.liquid`**.

### Fonts

Two CSS variables: `--font-display` (FatFrank Heavy, single weight) and `--font-body` (Avenir 300/400/500/800). Use them via `font-family: var(--font-display, sans-serif)`.

**FatFrank Heavy is only 1 weight**. Reserve it for mega-display elements (DUNKELVOLK wordmark, THE ART OF JOURNEY title). For section titles like "EXPLORE", "MOVE", use `var(--font-body)` with `font-weight: 500` or `800` — those map to actual loaded Avenir files. Other weights (600, 700) trigger browser synthesis and look off.

### Liquid quirks specific to this theme

- **Liquid doesn't support parens in conditions.** `{% if a == 'x' and (b != blank or c != blank) %}` errors at runtime. Use a pre-assigned flag instead: `{% assign has_text = true %}` then `{% if a == 'x' and has_text %}`.
- **`img_url` only works on Shopify-uploaded images** (image_picker output). For files in `/assets/`, use `asset_url`. That's why the `asset_filename` pattern exists.
- The schema files in this repo have **localized `default` objects** (`"default": {"en":"...", "es":"..."}`) — these are valid for Shopify but the IDE's JSON schema linter flags them with "Incorrect type. Expected string/number/boolean". **Ignore those warnings**, they're pre-existing in the original TheBox sections.
- `request.page_type == 'index'` is the canonical home check; the `<body>` class is `template-index`.

### CSS specificity

Some of our overrides need `!important` because [assets/theme.scss.liquid](assets/theme.scss.liquid) sets aggressive `padding-top` on `.main-content` (line ~1346) and other layout properties. Prefer high-specificity selectors (`html body ...` or `body.template-index ...`) instead of `!important` when possible; use `!important` only when fighting `theme.scss.liquid`.

### Branding / language

- Brand voice: bilingual ES/EN. Spanish is primary for the store; English is used for taglines ("EXPLORE", "MOVE", "Shop Now").
- **Always respect capitalization from the design PDFs** — e.g., "The Pima Tee: La prenda con más confort" (not "comfort"). The user has caught this before.
- The countdown page uses the typo "COMING" (corrected from PDF's "COMMING"). Carry corrections like this to other surfaces, but never silently — confirm with the user when you spot a typo.

## What to ask before doing

Before any of the following, **confirm with the user**:

- Removing any section from `content_for_index` in `settings_data.json`
- Editing `theme.scss.liquid` or `theme.js`
- Removing or renaming a file referenced by a legacy section
- Pushing to the live theme (`shopify theme push --live`)
- Modifying app embed blocks
- Removing the legacy `<header>` block from [sections/header.liquid](sections/header.liquid)
- Changing the `password.liquid` countdown page

## Dev workflow

```bash
pnpm dev                    # shopify theme dev with hot reload
shopify theme push --unpublished   # safe: pushes to a dev theme
shopify theme push --live          # ⚠️ requires explicit user authorization
```

Common dev issues:

- **502 errors on file upload** — usually transient Shopify API hiccup. Retry. If persistent, check https://www.shopifystatus.com/.
- **`.tmp.<pid>.<ts>` file upload errors** — IDE atomic-save creates these; they're excluded in [.shopifyignore](.shopifyignore). If they still appear, restart `pnpm dev`.
- **Section settings not appearing in customizer** — check that the section's `{% schema %}` JSON is valid. Use `node -e` to parse it.

## Validation snippet

After editing a `.liquid` section or `settings_data.json`, validate:

```bash
node -e "
const fs=require('fs');
const c=fs.readFileSync('config/settings_data.json','utf8');
try{ JSON.parse(c.replace(/^\s*\/\*[\s\S]*?\*\//,'')); console.log('OK JSON'); }
catch(e){ console.error('INVALID:', e.message); process.exit(1); }
"
```

For a section schema:

```bash
node -e "
const fs=require('fs');
const s=fs.readFileSync('sections/<name>.liquid','utf8');
const m=s.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
try{ JSON.parse(m[1]); console.log('OK'); }catch(e){ console.error(e.message); }
"
```

## Things that aren't done yet

- **The Pima Journey content page** — pages 8-12 of the mobile design PDF are a separate editorial page, not the homepage. Not yet implemented. Suggested template: `templates/page.the-pima-journey.liquid`.
- **Image optimization** — many `dunk-*.jpg` are 1500-2400 px wide and 300 KB-6 MB. Should be re-exported to ~800-1200 px max as baseline JPEG or `.webp`.
- **Migration to Shopify OS 2.0 (Horizon)** — discussed, deferred. Would require rebuilding the entire theme and re-integrating all apps. Not worth doing until there's a separate budget/timeline for it.
- **Image links** — all new sections support per-image links, but the merchant still needs to set them via the customizer for the Pima Tee cards, the feature columns, and the full-bleed image.

## Asking for clarification

The user is direct and gives feedback in Spanish. Match their tone. When they say "no entiendo X" or correct your work, **acknowledge the correction explicitly** and explain what you'll change — don't just silently re-do it. They notice and appreciate the explanation.

When the user pastes a design PDF or screenshot, study the proportions and copy faithfully. They've called out font-weight/spacing/padding mismatches several times — pixel-level fidelity matters here.
