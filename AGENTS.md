# Fixtures Agent Guide

This directory contains static fixtures that can be published directly to GitHub Pages **and** served locally (for development, tests, or demos). Everything in this folder must stay portable: no build steps, no server-only features, and no symlinks outside the repo.

## Directory layout
- `iiif/` — canonical IIIF responses and assets. Within this folder, keep the IIIF spec in mind:
  - `presentation/` holds JSON-LD manifests, collections, and other Presentation API payloads.
    - `presentation/3/` is explicitly scoped to the IIIF Presentation API **3.0** spec, so manifests and collections here must follow 3.0 contexts, structures, and property names.
  - `image/` holds level 0 IIIF Image API responses plus the referenced image assets (PNG/JPG). Subfolders should mirror the URL pattern `/{identifier}/{info.json|full/full/0/default.jpg}` so static hosting works.
- `assets/` — any non-IIIF media that must be served next to the fixtures (e.g., thumbnails, docs, supplemental JSON). Prefer keeping raw binaries small (<1 MB) so the repo stays light.

## Serving locally
1. Install dependencies once with `npm install` (installs `express`).
2. Run `npm run dev` to start `server.js` (defaults to port `5002`). The server rewrites every IIIF `id` so local responses return `http://localhost:5002/...` instead of the GitHub Pages URLs stored in the JSON.
3. Override behavior with environment variables:
   - `PORT` — change the listening port.
   - `PUBLIC_BASE_URL` — set the ID base emitted to clients (defaults to `http://localhost:<PORT>`).
   - `SOURCE_BASE_URL` — base to replace (defaults to `https://raw.githubusercontent.com/canopy-iiif/fixtures/refs/heads/main`).
4. Visit `http://localhost:5002/iiif/presentation/3/i18n/collection.json` (or use `curl`) to inspect rewritten responses. Static assets (e.g., `/assets`) are served directly.
5. Stop the server with `Ctrl+C` when finished. When adding fixtures, test both Presentation and Image requests locally to guarantee relative URLs resolve through the Node server.

### ID rebasing expectations
- JSON checked into git should use the GitHub Pages base (e.g., `https://raw.githubusercontent.com/...`).
- The local server automatically rebases these `id` values so manifests/collections remain valid when accessed at `http://localhost:5002`.
- If you introduce new directories, prefer relative IDs (`/iiif/...`) inside the files; the server will expand them according to the base URLs above.

## Publishing to GitHub Pages
- Pages will serve the repository contents verbatim, so keep paths stable and reference files with relative URLs.
- Avoid absolute `http://localhost` links inside manifests—use relative paths (e.g., `"@id": "/iiif/presentation/..."`).
- Compress media before committing. For large additions, consider linking out to canonical public URLs instead.

## Conventions
- JSON-LD formatting: 2-space indentation, UTF-8, include `@context` at the top, and validate with `jq` or the IIIF validator.
- Image API fixtures: Provide both `info.json` and at least one `full/full/0/default.jpg` (or equivalent) file per identifier. Record pixel dimensions inside `info.json` so viewers work offline.
- Filenames should remain lowercase, hyphenated, and deterministic (e.g., match dataset slugs or identifiers used in Canopy tests).
- Keep fixtures immutable once referenced by tests; instead, add new versions under a new identifier.

## Adding new fixtures
1. Create folders under `iiif/presentation/` or `iiif/image/` mirroring the future URL.
2. Author the JSON using the IIIF standard, including thumbnails that point to files inside this repo.
3. Drop any supporting binaries under `assets/` if they are not part of the IIIF tree.
4. Serve locally at `:5002` and verify requests.
5. Commit with clear messages (e.g., `add sample book manifest`).

Following these guidelines keeps the fixtures usable for both automated tests and public demos.
