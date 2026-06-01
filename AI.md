# AI.md — Guidelines for AI assistants on this project

This file complements [CLAUDE.md](CLAUDE.md) (which is Claude-specific). It captures provider-neutral principles for any AI agent working in this repo — Claude Code, Cursor, Copilot Chat, Aider, Codex, etc.

If you only read one file, read [CLAUDE.md](CLAUDE.md). This file is shorter and covers the **why** behind the rules.

## What this project is

A live Shopify storefront for **Dunkelvolk Perú**. Real customers transact here daily through Mercado Pago checkout. The theme is a **vintage TheBox-derived theme** with a **2026 homepage redesign** layered on top.

Two consequences:

1. **Mistakes affect revenue.** Don't push to `--live` without explicit human authorization.
2. **The legacy code is fragile.** It was built by an agency years ago, has lots of app integrations baked in, and is barely documented. Refactoring without a need is a recipe for regressions.

## The prime directive

**Don't change things that work, even if the code is ugly.** This codebase has accumulated cruft over years. Some of that cruft is load-bearing. When in doubt, ask the user before touching it.

If a file is 1000+ lines and you don't fully understand it (e.g., [sections/header.liquid](sections/header.liquid), [assets/theme.scss.liquid](assets/theme.scss.liquid)), prefer **additive edits with high specificity** over refactors.

## How to add features safely

1. **Read [CLAUDE.md](CLAUDE.md)** — it has the code conventions and gotchas.
2. **Look for an existing pattern.** Most new homepage sections follow the same template: `component_class` scoping, mobile-first CSS, schema with `image_picker` + `asset_filename` fallback. Mimic that pattern rather than inventing a new one.
3. **Validate Liquid + schema JSON** before declaring done. The user catches broken JSON with Shopify error pages.
4. **Test mobile + desktop.** The PDFs the user provides have distinct mobile and desktop designs — both matter equally.
5. **Don't add documentation files** (`.md`, JSDoc, etc.) unless asked. The user explicitly noted: "Don't write a README/comment block I didn't ask for."

## Communication style

The user is a senior dev who likes:

- **Concise updates** between tool calls, not narration of every step.
- **Spanish** for conversation, but accepts English in code and comments.
- **Honest tradeoff explanations** when you propose an approach. "Doing X is faster but has Y downside" works; "I'll just do X" without context doesn't.
- **Direct correction acknowledgement.** When they point out a mistake, say what you'll change and why. Don't gloss over.

They dislike:

- Re-stating their request before answering it.
- Over-explaining what tools you're about to use.
- Marketing language ("blazingly fast", "robust", "best-in-class").
- Asking permission for small, reversible actions on local files.

## Cost / scope discipline

- **One change at a time when the user is iterating on a design.** Don't batch unrelated edits "while you're in the file."
- **Don't refactor adjacent legacy code** unless explicitly asked. The user has called this out: "no entiendes el scope, no toques otras cosas."
- **Don't add new dependencies.** This is Shopify Liquid; there's no `package.json` runtime, no npm modules to install. Everything is vanilla JS, jQuery (legacy), or Liquid.

## What to do on a fresh session

1. Read [CLAUDE.md](CLAUDE.md) and [README.md](README.md) in that order.
2. Run `git status` and `git log -20 --oneline` to get recent context (if it's a git repo — currently not, but might be soon).
3. If the user gives a PDF or screenshot, study it before coding. Pixel fidelity matters.
4. Default to **scoped, additive edits**. Reach for `theme.scss.liquid` or the legacy header only when there's no clean alternative — and ask first.

## Common traps

- **Liquid doesn't support `()` in conditions** → use pre-assigned flags. (See [CLAUDE.md](CLAUDE.md))
- **`img_url` doesn't work on `/assets/` files** → use `asset_url`. The `asset_filename` pattern bridges both.
- **The IDE flags localized `default` objects in section schemas as type errors** → ignore, they're valid Shopify Liquid.
- **Shopify Files vs `/assets/`** → Files is for merchant uploads (image_picker), `/assets/` is for repo-versioned files (asset_url). Pick the right one based on whether the merchant should edit it.
- **Two headers in DOM** → the legacy `<header>` is still rendered (hidden) alongside the new Dunk header for SEO + mobile drawer JS reasons. Don't remove it.

## When you're not sure

Stop and ask. The user prefers a 30-second clarification round over a 30-minute rework. The pattern is:

> Para implementar X tengo dos opciones: A (rápida pero con tradeoff Y) o B (más limpia pero requiere tocar Z). ¿Cuál prefieres?

Then wait for the answer.
