# siddiquetanvir.github.io

Personal portfolio website built with HTML, CSS, JavaScript, and YAML-driven content.

## What this repo contains

- `index.html` — main portfolio page
- `projects.html` — projects archive
- `research.html` — research page
- `cv.html` — CV page
- `data.yaml` — primary content source
- `script.js` — rendering and interactivity
- `styles.css` — styling and theme

## Quick update guide

Most content updates happen in `data.yaml`:

- profile/about text
- project entries
- skills and experience
- links and contact details

After editing, refresh the site to see changes.

## Local preview

No build step is required.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

This site is intended for GitHub Pages.  
Push changes to the repository and GitHub Pages serves the updated static files.

## Usage and content notice

This repository contains personal portfolio content and branding.  
Please do not copy personal text, identity details, or documents without permission.
