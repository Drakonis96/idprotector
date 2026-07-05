<p align="center">
  <img src="public/assets/favicon.svg" alt="IDprotector logo" width="84" height="84" />
</p>

<h1 align="center">IDprotector</h1>

<p align="center">
  <strong>English</strong> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.pt.md">Português</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.it.md">Italiano</a>
</p>

<p align="center">
  <a href="https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml"><img src="https://github.com/Drakonis96/idprotector/actions/workflows/docker-publish.yml/badge.svg" alt="Publish Docker image" /></a>
  <a href="https://hub.docker.com/r/drakonis96/idprotector"><img src="https://img.shields.io/docker/pulls/drakonis96/idprotector?logo=docker" alt="Docker Hub" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-informational.svg" alt="License: MIT" /></a>
</p>

**Prepare your ID and documents before sending them.** Cover the information you'd
rather not show and add a watermark stating the authorized use. All processing
happens **inside your browser**: your files are never uploaded to any server.

A **self-hostable** app with Docker, designed to protect personal identifiers
(IDs, passports, permits) in a fully private way.

## Features

- 🖌️ **Redact data** — a brush that draws **straight bars** (never crooked) at
  any angle, with several thicknesses, zoom for precision and undo. What you
  cover is really gone (pages are rasterized on export, no hidden text remains
  underneath).
- 💧 **Optional, configurable watermark** — use/recipient text, automatic
  patterns or a draggable **Manual** mode, plus **opacity**, **size**, **color**,
  angle and footer adjustments.
- ⚖️ **Configurable legal footer** — adds a bottom strip to the download with the
  EU GDPR, the national data protection authority picked from a dropdown
  (EU/EEA, United Kingdom and Switzerland), an editable legal notice and an
  optional contact email and phone.
- 👀 **Multi-page preview** — arrows to review how the watermark looks on each
  PDF page or each uploaded image before exporting.
- 🌍 **Multilingual interface** — Spanish, English, French, Portuguese, German
  and Italian from the language selector.
- 🌑 **Optional grayscale** — convert the document (image or PDF) to black and
  white with a toggle.
- 🖼️ **Images and PDF** — PNG, JPG, WebP… and single- or multi-page PDF.
- 🗂️ **Several files at once** — upload e.g. front and back together; they are
  combined into a single protected document.
- 📤 **Download as PDF or image** — choose the format on download (a multi-page
  image is delivered as a `.zip`). You can also share via the system sheet when
  available.
- 🔒 **100% local and private** — no uploads, no database, no analytics. Works
  **offline** once loaded.

## Privacy by design

- No backend: the container is only a static file server (nginx). There is no
  endpoint able to receive or store your documents.
- The libraries (`pdf.js`, `pdf-lib`) are **bundled locally** in
  `public/vendor/`; the app relies on no CDN and makes no external requests.
- The `Content-Security-Policy` blocks any outbound connection
  (`connect-src 'self'`), iframe embedding and third-party resources.
- The container starts in `read_only` mode, with no volumes or environment
  variables.

## Getting started (Docker)

### Option A — from Docker Hub (recommended, no need to download the code)

Published image: [`drakonis96/idprotector`](https://hub.docker.com/r/drakonis96/idprotector)
(multi-arch: `amd64` and `arm64`).

With Docker Compose, using the dedicated compose file:

```bash
curl -O https://raw.githubusercontent.com/Drakonis96/idprotector/main/docker-compose.hub.yml
docker compose -f docker-compose.hub.yml up -d
```

Or directly with `docker run`:

```bash
docker run -d --name idprotector -p 8683:8683 --restart unless-stopped drakonis96/idprotector:latest
```

Open **http://localhost:8683**.

### Option B — building from source

```bash
git clone https://github.com/Drakonis96/idprotector.git
cd idprotector
docker compose up -d --build
```

To stop it:

```bash
docker compose down
```

## Automatic publishing (CI/CD)

Every push to `main` and every `vX.Y.Z` release triggers the
[`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml)
workflow, which builds the multi-arch image and publishes it to Docker Hub.

It only requires **one secret** in the repository
(*Settings › Secrets and variables › Actions*):

- `DOCKERHUB_TOKEN` — a Docker Hub *Access Token* with write permission
  (Docker Hub › *Account Settings › Security › New Access Token*).

The user (`drakonis96`) is hard-coded in the workflow itself.

### Local development (without Docker)

Serve the `public/` folder with any static server, for example:

```bash
cd public && python3 -m http.server 8683
```

> Note: open it via `http://…`, not as `file://`, so the `pdf.js` worker works.

## How to use

1. **Upload** an image, several images or a PDF (drag and drop, or click to choose).
2. **Redact** the sensitive data by sliding the brush; adjust the size and use
   zoom for precision.
3. **Watermark** (optional): type the authorized use and adjust pattern, opacity,
   size and color. In Manual mode, drag the mark to the position you prefer and
   review every page with the preview arrows.
4. **Download or share** the protected document.

## Structure

```
public/
  index.html          # UI (single page, step by step)
  css/styles.css
  js/
    watermark.js       # watermark patterns
    editor.js          # redaction brush (canvas, zoom, undo)
    app.js             # orchestration, file loading, export
  vendor/              # pdf.js + pdf-lib (bundled, no CDN)
Dockerfile
docker-compose.yml     # single service, port 8683
nginx.conf             # privacy headers + strict CSP
```

## License

MIT — see [LICENSE](LICENSE).
