# SVG + PNG icon format strategy: choose the format by scenario

SVG icons did not display after deploying to Vercel. Diagnosis revealed two independent problems: (1) the `metadata` in `layout.tsx` did not define an `icons` field, so the tab favicon was missing entirely; (2) the PWA manifest used SVG-format icons, but some browsers (Safari iOS, older Chrome Android) have incomplete SVG support in PWA manifests.

We decided: **SVG for the browser favicon, PNG for the PWA manifest icons and the Apple touch icon**. At the same time, replace the `<text>` elements in the SVGs with `<path>` to remove font dependencies.

## Alternatives considered

- **All SVG**: fewer files and pixel-sharp, but browser support for SVG in PWA manifests is not good enough (MDN marks it as "not Baseline"). iOS Safari does not support SVG-based PWA icons.
- **All PNG**: best compatibility, but the favicon is fixed-resolution and blurry on high-DPI screens, and multiple raster images need maintaining.
- **Generate PNG from SVG at build time**: DRY, but needs an extra build step (sharp/rsvg etc.), and this environment hit a font-less rendering problem that forces the SVGs to use `<path>` instead of `<text>`.
- **SVG for the favicon + PNG for PWA and Apple touch** (chosen): each scenario gets the most suitable format — the favicon stays vector-sharp and the PWA icons get maximum compatibility. The added file count is limited (one PNG each at 192/512/180/32/16).

## Consequences

- The favicon renders as SVG in modern browsers (Chrome/Edge/Firefox/Safari), staying sharp; older browsers fall back to a 32×32 PNG via `<link>`.
- The PWA manifest uses PNG, ensuring cross-browser install compatibility.
- The SVG source files use `<path>` instead of `<text>`, no longer depending on system fonts, so tools like sharp/librsvg can render them directly.
- Added `scripts/generate-icons.mjs`: after editing the SVGs, run `node scripts/generate-icons.mjs` to regenerate all PNGs.
