# bamasa.github.io — personal site

One page. Plain HTML, CSS and a small script — no build step, no framework, no dependencies.

```
index.html          all content lives here, section by section
assets/styles.css   design tokens at the top, then base / layout / components
assets/main.js      theme toggle, accordions, scroll reveal, nav highlight
assets/img/         portrait, favicons
files/              CV.pdf (linked from the page), CV-2024-en.pdf (older English CV, not linked)
```

## Editing

Everything is hand-editable HTML. The repeating blocks:

* **A project or teaching entry** — a `<details class="item">` with a `<summary>` (title, org,
  year) and an `.item-body > .item-inner` that holds the expanded text. Copy an existing one.
* **An experience or education row** — an `<li>` inside `<ol class="cv">` with
  `.cv-year`, `.cv-role`, `.cv-org`.
* **A publication** — an `<li>` inside `<ol class="papers">`; numbering is automatic.

Section labels (`01 — Selected work`, …) are plain text in each `<h2 class="label">`.

## Colours and type

All colours are CSS custom properties at the top of `styles.css`, defined three times:
light on `:root`, dark under `prefers-color-scheme`, dark again under `[data-theme="dark"]`
so the toggle wins in both directions. Change `--accent` to reskin the whole page.

Fonts come from Google Fonts: Instrument Serif (display), Inter (body), JetBrains Mono (meta).

## Deploying to GitHub Pages

Copy the contents of this folder into the root of the `bamasa/bamasa.github.io` repository,
replacing the old Hugo output, and push to `master`. Nothing needs to be built.

## Notes

* The availability line is deliberately worded as consulting and collaboration, not
  job seeking. Location, work format, languages and the CV file are intentionally absent.
* Client names are anonymised on purpose ("Medical technology startup",
  "Trading, crypto and market infrastructure", "Independent clients").
* Numbers behind the quantitative work are given on request, not on the page.
