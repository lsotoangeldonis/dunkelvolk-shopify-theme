# Dunkelvolk Shopify Theme

E-commerce theme for **Dunkelvolk Perú** (`dunkelvolk-peru.myshopify.com`).
Heavily customized vintage Shopify theme (originally based on "TheBox" theme by an agency) with a 2026 homepage redesign on top.

## Quick start

```bash
pnpm install              # installs Shopify CLI as a local devDependency
pnpm dev                  # starts theme dev server (uses store from shopify.theme.toml)
# or, if shopify.theme.toml is missing or you want to force the store:
pnpm dev:store
```

First run on a new machine will open a browser to log into Shopify. You need **collaborator/staff access** to `dunkelvolk-peru.myshopify.com` or a Theme Access password for that store.

Prerequisites:
- **Node.js 18+** (LTS recommended)
- **pnpm 10+** — `corepack enable && corepack prepare pnpm@latest --activate` if not installed
- Permissions on `dunkelvolk-peru.myshopify.com` (collaborator account, staff, or Theme Access)

The Shopify CLI is installed locally via `pnpm install` (no global install needed). Scripts in [package.json](package.json):

| Command | What it does |
|---|---|
| `pnpm dev` | Theme dev server with hot reload. Reads store from [shopify.theme.toml](shopify.theme.toml). |
| `pnpm dev:store` | Same, but with `--store dunkelvolk-peru.myshopify.com` explicit. Use if config drifted. |
| `pnpm pull` | Pulls the **live theme** down to disk. ⚠️ Overwrites local files. |
| `pnpm push:unpublished` | Pushes to a development (unpublished) theme. Safe. Default for testing. |
| `pnpm push:live` | Pushes to the **live theme**. ⚠️ Only with explicit human approval. |
| `pnpm check` | Runs Shopify Theme Check (Liquid linter). |

> **First time on this repo?** The project is not under version control yet. After cloning/copying:
>
> ```bash
> git init && git add . && git commit -m "Initial import"
> pnpm install   # generates pnpm-lock.yaml — commit it for reproducibility
> ```

## Tech stack

| Layer | What it is |
|---|---|
| Theme engine | Shopify Liquid (Online Store 2.0 partial — `index.liquid` uses `content_for_index`, but PDP/PLP templates are still `.liquid` not `.json`) |
| CSS | Inline `<style>` blocks per section + global `theme.scss.liquid` (~8 K lines, legacy) + Bootstrap grid leftovers |
| JS | Vanilla per-section + jQuery + Slick slider (legacy from TheBox) + lazysizes |
| Apps wired in | Boost-PFS (filter/search), Enorm (carousel), Mercado Pago Antifraud, Avada SEO, Bundler, BSS Store Locator, Labeler product labels |

## Project structure

```
.
├── assets/              # CSS, JS, fonts, images served via asset_url
│   ├── FatFrank_Heavy.otf
│   ├── avenir_{0,2,6,8}.woff2     # 400, 800, 300, 500 weights
│   ├── theme.scss.liquid          # legacy 8 K-line stylesheet (don't touch lightly)
│   ├── theme.js                   # legacy entry point
│   └── dunk-*.{jpg,png}           # home banners (referenced via asset_filename)
├── config/
│   ├── settings_data.json         # current theme settings + content_for_index
│   └── settings_schema.json
├── layout/
│   ├── theme.liquid               # base layout (includes dunk-fonts + dunk-home-overrides)
│   ├── password.liquid            # maintenance / countdown page (already live)
│   └── gift_card.liquid
├── locales/
├── sections/
│   ├── header.liquid              # 1400+ lines, contains both legacy + Dunk header v2
│   ├── footer.liquid              # black bg, newsletter disabled
│   ├── slideshow-tbx-v2.liquid    # hero slider (supports image_picker, asset_filename, video)
│   ├── feature-columns-dunk.liquid     # EXPLORE / MOVE / CONNECT / QUALITY
│   ├── image-quote-split.liquid        # 50/50 OR single full-width image
│   ├── art-of-journey.liquid           # title + 2 portrait images + body + CTA
│   ├── full-bleed-image.liquid         # generic full-width image
│   ├── pima-tee-grid.liquid            # 4-column product grid with Shop Now CTAs
│   ├── logo-banner-dunk.liquid         # centered logo on white bg
│   ├── dunk-explorers-club.liquid      # newsletter (email + phone + benefits)
│   └── *.liquid                        # ~50 legacy sections (kept for inner pages)
├── snippets/
│   ├── dunk-fonts.liquid          # @font-face + font-family overrides (loaded on every page)
│   ├── dunk-home-overrides.liquid # home-only layout overrides (loaded conditionally)
│   └── ...                         # ~80 legacy snippets
├── templates/
│   ├── index.liquid               # just {{ content_for_index }} — homepage editable in admin
│   ├── product.liquid             # legacy
│   ├── collection.liquid          # legacy (uses Boost-PFS)
│   ├── password.liquid            # countdown / coming-soon page
│   └── *.liquid
├── .shopifyignore                 # excludes /sources, /fonts, *.tmp.*, etc. from upload
├── shopify.theme.toml             # store binding
└── package.json
```

## Homepage redesign (2026)

The homepage is composed in [config/settings_data.json:content_for_index](config/settings_data.json) from these sections, in order:

1. **Slideshow hero** (`slideshow-tbx-v2`) — full-width, ~80vh, overlaid by transparent header
2. **Feature columns** (`feature-columns-dunk`) — EXPLORE / MOVE / CONNECT / QUALITY
3. **Image quote split** (`image-quote-split`) — currently `single` mode with full-width banner
4. **The Art of Journey** (`art-of-journey`) — text + 2 portrait images
5. **Full-bleed image** (`full-bleed-image`) — placeholder for editorial photo
6. **Pima Tee grid** (`pima-tee-grid`) — 4 product cards with Shop Now CTAs
7. **Logo banner** (`logo-banner-dunk`) — centered logo divider
8. **Dunk Explorers Club** (`dunk-explorers-club`) — newsletter signup with email + phone

The legacy sections (`hero-2`, `enorm-product-carousel`, `video-thebox`, `rich-text`, the various image-bars) are still in `settings_data.json` but **not in `content_for_index`**, so they don't render. They're kept for safe rollback.

## Fonts

| Variable | Family | Loaded weights |
|---|---|---|
| `--font-display` | FatFrank | 800/900 (single weight, used only for mega-display: DUNKELVOLK wordmark, THE ART OF JOURNEY title) |
| `--font-body` | Avenir | 300 Light, 400 Book, 500 Medium, 800 Black |

Total ≈ 215 KB. All in `/assets/` served via `asset_url`. Declared in [snippets/dunk-fonts.liquid](snippets/dunk-fonts.liquid).

If you need additional FatFrank weights (Regular, Medium), drop them in `/assets/` and add `@font-face` blocks in `dunk-fonts.liquid`.

## Header layout ("Dunk Header v2")

Custom layout enabled via `enable_dunk_header: true` in the header settings.

- Top utility row: `Tiendas` (far left) · `Move. Explore. Connect` · **NEW LAUNCH COMING SOON** pill (centered) · `Lima - Perú · Since 1996`
- Main row: `Tiendas` link · `main_linklist` · `LOGO` (centered) · `secondary_linklist` · search + account + cart icons (backpack PNG)
- On home: **transparent overlay** on the hero, becomes solid white + sticky on scroll past 60 px
- Mobile: only the centered pill + (☰, logo, icons) row

The legacy `<header>` is still in DOM (its `<h1>` is preserved for SEO via clip-path), with its visible main row hidden via CSS. Don't remove it — the mobile drawer + search drawer JS still depend on it.

## `asset_filename` pattern

Several sections accept either an **`image_picker`** (uploaded to Shopify Files) or an **`asset_filename`** text input (refers to a file in `/assets/`). The `asset_filename` takes priority when set.

Sections that support this pattern:
- `slideshow-tbx-v2` — per slide
- `feature-columns-dunk` — per column
- `image-quote-split` — `asset_filename_left` + `asset_filename_right`
- `pima-tee-grid` — per card

Use this when you want to commit hero/banner assets to the repo (versionable, no admin upload step). Use `image_picker` when the merchant should be able to swap images from the customizer.

## Maintenance page (countdown)

[layout/password.liquid](layout/password.liquid) + [sections/password-*.liquid](sections/) handle the "SOMETHING NEW IS COMING" countdown that's currently live. Not touched by the homepage redesign.

## Deployment

```bash
# Push to live theme (requires explicit confirmation)
shopify theme push --live

# Push to a development theme (safer — review in admin before publishing)
shopify theme push --unpublished
```

Always test in an `--unpublished` theme first. The store has live checkout + apps wired in; pushing broken code to `--live` is high-risk.

## Known limitations

- **Avenir.ttc** original was removed; Chrome/Edge now correctly use the per-weight `.woff2` files. Safari/Firefox were the only browsers that supported the previous `.ttc`.
- **Header has duplicate DOM**: new Dunk header + legacy header coexist (legacy is visually hidden). Clean removal of the legacy is a separate PR — currently left for safety.
- **`theme.scss.liquid` is huge** (~8 K lines, legacy Bootstrap grid). Avoid touching it unless absolutely necessary. New styles go in section-scoped `<style>` blocks or in `snippets/dunk-*-overrides.liquid`.
- **Inner pages still legacy**: only the homepage uses the new section system. PDP/PLP/cart use the original TheBox templates.

## What to do next (suggestions for the next dev)

1. **Migrate the customer's images** from `assets/dunk-*.jpg` to Shopify Files via admin, then swap `asset_filename` for `image_picker` in `settings_data.json` so the merchant can edit them from the customizer.
2. **Create the secondary menu** in *Online Store > Navigation* (handle `secondary-menu`) with `About Us`, `The Pima Journey`, `Explorer's Club` — then assign it in *Customize > Header > Right-side menu*.
3. **Build the "The Pima Journey" content page** (storytelling pages 8–12 of the mobile design). Suggested template: `templates/page.the-pima-journey.liquid` using new sections.
4. **Optimize the `dunk-*.jpg` assets**: re-export at ~800 × 1200 max, JPEG baseline (not progressive) or `.webp`. Currently some are 6 MB+.
5. **Clean removal of the legacy header block** once the Dunk header is validated in production.
6. **Consider a long-term migration to Horizon (Shopify OS 2.0 reference theme)** — but that's a separate, multi-week project. See `CLAUDE.md` for tradeoff notes.

## See also

- [CLAUDE.md](CLAUDE.md) — context for Claude Code sessions
- [AI.md](AI.md) — generic AI assistant guidelines
