# WorkBenchMark — Project Website

Static project/dataset page for **WorkBenchMark: A LEGO-Based Assembly Benchmark with an
Assembly-by-Disassembly Baseline for the Smart Manufacturing League**.

No build step. Plain HTML/CSS/JS with Bulma, bulma-carousel, Font Awesome, and Academicons
loaded from CDNs.

## Local preview

```bash
cd website
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

```
index.html            single-page site (all sections)
.nojekyll             tells GitHub Pages to serve static/ verbatim
static/css/index.css  custom styling on top of Bulma
static/js/index.js    navbar, carousel, copy-BibTeX, sortable leaderboard
static/images/        figures (copied from the paper)
static/videos/        drop teaser.mp4 / results.mp4 here (currently empty)
static/pdfs/          drop the paper PDF here
```

The leaderboard numbers live in `leaderboardData` inside `static/js/index.js`
(seeded from Table 3 of the paper). Add new methods there.

## Deploying to GitHub Pages

This is built for a **dedicated user/org site** (`<name>.github.io`), served from the
**repository root** on the `main` branch.

1. Create a repo named `<name>.github.io` (e.g. `workbenchmark.github.io`).
2. Copy the **contents** of this `website/` folder into the repo root (so `index.html` is
   at the top level, not inside `website/`).
3. Push to `main`.
4. Repo **Settings → Pages → Source = `main` / `(root)`**.
5. The site appears at `https://<name>.github.io/`.

`.nojekyll` is required so GitHub Pages does not run Jekyll and serves the `static/`
folder as-is. No custom domain / CNAME is configured.

## Before you publish — checklist

Search `index.html` for `TODO`. Items to fill in:

- [x] Paper PDF / arXiv link → https://arxiv.org/abs/2606.19358 (hero buttons + BibTeX `eprint` + JSON-LD citation)
- [ ] Code repository URL (hero button, leaderboard "how to submit")
- [ ] Results video → `static/videos/results.mp4` (the hero now uses a built-in CSS/JS assembly animation, so no teaser video is needed)
- [ ] Dataset download link (GitHub release)
- [ ] Zenodo DOI link
- [ ] Simulation environment link (TBD button in "Running the simulation")
- [ ] Simulation install + launch commands (TBD code block in "Running the simulation")
- [ ] Dataset license (currently noted as planned CC BY 4.0)
- [ ] Leaderboard submission contact email
- [ ] Author ORCIDs / personal links (some are placeholders)
- [ ] BibTeX entry (update once the proceedings citation is final)

## Notes on content

- **Hero animation & Dataset Explorer** are pure HTML/CSS/JS 3D (shared brick builder
  `wbmMakeCuboid` in `static/js/index.js`). The explorer's per-tier structures (`TIERS`) are
  **representative illustrations**, not exact dataset tasks — swap in real task coordinates if
  you prefer exactness.
- **Real-Robot Track** numbers are from Wenbo's thesis (Table 5.3, UR5; Tier 4 not attempted).
- **Funding** text in the footer is taken from the paper's acknowledgements.

## Logo

The wordmark uses the pixel font **Press Start 2P** (loaded from Google Fonts) with the
three CamelCase segments coloured in LEGO blue / red / green. The brick-stack mark lives at
`static/images/logo.svg` (also the favicon) — edit the SVG to recolour or restyle it. The
colours are defined once in `static/css/index.css` (`.wbm-wordmark .c-blue|.c-red|.c-green`).

## Credits

Template adapted from the
[Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template)
(based on [Nerfies](https://nerfies.github.io)), licensed CC BY-SA 4.0.
