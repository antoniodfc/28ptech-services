# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static personal website for Antonio Da Fonseca (28Ctech) — DevOps Engineer freelance. Three pages in French, no build step, no framework, no package manager.

## Architecture

Pure HTML/CSS/JS, served as static files. No bundler, no dependencies to install.

```
index.html       — landing page (home), mailto CTA
freelance.html   — freelance missions, mailto CTA (no form)
vibers.html      — Vibe Coders offering & Formspree contact form
assets/
  css/
    base.css     — design tokens (CSS vars), reset, shared components
    freelance.css
    index.css
    vibers.css
  js/
    vibers.js    — chip toggles + Formspree form submission
```

`index.html` and `freelance.html` have no contact form — both use a `mailto:` CTA. Only `vibers.html` has a Formspree form, driven by `vibers.js`.

CSS is layered: `base.css` is always loaded first and defines all design tokens (`--bg`, `--text`, `--r`, etc.). Page-specific files extend it. `index.html` and `freelance.html` both load `freelance.css` — they share the same layout styles.

## Running locally

Open any `.html` file directly in a browser, or use a local server to avoid CORS issues:

```bash
npx serve .
# or
python3 -m http.server
```

## Forms

The vibers contact form submits to Formspree (`https://formspree.io/f/mpqnlgqk`) via `fetch` with `Content-Type: application/json`: validate fields, disable the submit button, POST to Formspree, swap form for a success block on `res.ok`, or show an inline error block on failure.

## Chip selectors

`.chip` elements (vibers.html) toggle class `.selected` on click/Enter/Space. The selected values are joined into the `#besoins` hidden input. Note: `base.css` styles `.chip.on`, but `vibers.js`/`vibers.css` use `.selected` — keep them in sync.
