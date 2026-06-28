# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static personal website for Antonio Da Fonseca (28Ctech) — DevOps Engineer freelance, in French. The marketing pages are hand-written static HTML; the **blog is pre-generated** from Markdown by `build.js` (the only build step — no framework, no npm dependencies).

## Architecture

Pure HTML/CSS/JS, served as static files. The blog is built by a small Node script that vendors `marked` (no `npm install` needed).

```
index.html       — landing page (home, FR), mailto CTA, "Écrits" teaser (home-posts.js)
freelance.html   — freelance missions (FR), mailto CTA (no form)
vibers.html      — Vibe Coders offering (FR) & Formspree contact form
en/  pt/         — English & Portuguese versions of the 3 marketing pages (hand-maintained)
build.js         — generates the blog + sitemap.xml from blog/posts/
sitemap.xml      — GENERATED — do not edit by hand
robots.txt
blog/
  index.html     — GENERATED — article list + tag filter
  <slug>/index.html — GENERATED — one static page per article (clean URLs)
  posts/
    posts.json   — article metadata (slug, title, date, excerpt, tags) — SOURCE
    <slug>.md    — article body in Markdown — SOURCE
assets/
  css/    base.css (tokens) · freelance.css · index.css · vibers.css · blog.css
  js/     vibers.js · home-posts.js · blog-filter.js · vendor/marked.min.js
  favicon.svg · og-image.svg → og-image.png (social card, generated via rsvg-convert)
```

Only `blog/posts/*.md` and `posts.json` are authored. Everything under `blog/<slug>/`, `blog/index.html` and `sitemap.xml` is **generated** — never edit those by hand; edit the source and re-run the build.

`index.html` and `freelance.html` have no contact form — both use a `mailto:` CTA. Only `vibers.html` has a Formspree form, driven by `vibers.js`.

CSS is layered: `base.css` is always loaded first and defines all design tokens (`--bg`, `--text`, `--r`, etc.). Page-specific files extend it. `index.html` and `freelance.html` both load `freelance.css`.

## Internationalization (i18n)

The 3 marketing pages exist in FR (root), EN (`/en/`) and PT (`/pt/`). The blog stays FR-only. Translations are **hand-maintained static copies** (no i18n framework) — when you change a marketing page, mirror the change in `en/` and `pt/`. Each page set is linked by `hreflang` (fr/en/pt + x-default→FR) in `<head>` and a `.lang-switch` widget in the nav. EN/PT pages reference shared assets via `../assets/...`. The marketing URLs in all 3 languages are listed manually in `build.js`'s `sitemap()` — add new ones there.

`vibers.js` is shared across the 3 vibers pages: form element IDs are identical in every language; the submit button's label is read from the button's text content and its `data-loading` attribute, so it stays localized per page.

## Adding / editing a blog post

1. Create `blog/posts/<slug>.md` (slug = lowercase letters/digits/hyphens). Optional `## Sources` section after a `---` is split out and rendered below the byline.
2. Add an entry to `blog/posts/posts.json`.
3. Run the build and commit the generated output (the static host does NOT build):

```bash
node build.js   # or: npm run build
```

## Running locally

Serve from the repo root (clean URLs need a server, not `file://`):

```bash
npx serve .
# or
python3 -m http.server
```

## Forms

The vibers contact form submits to Formspree (`https://formspree.io/f/mpqnlgqk`) via `fetch` with `Content-Type: application/json`: validate fields, disable the submit button, POST to Formspree, swap form for a success block on `res.ok`, or show an inline error block on failure.

## Chip selectors

`.chip` elements (vibers.html) toggle class `.selected` on click/Enter/Space. The selected values are joined into the `#besoins` hidden input. Note: `base.css` styles `.chip.on`, but `vibers.js`/`vibers.css` use `.selected` — keep them in sync.
