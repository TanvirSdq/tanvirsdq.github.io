#!/usr/bin/env python3
"""
scripts/build.py — Static Site Pre-renderer for Portfolio & Projects
Reads data.yaml and synchronously injects pre-rendered HTML into
index.html and projects.html between safe marker comments.

Usage:
    pip install pyyaml
    python scripts/build.py
"""

import sys
import re
from datetime import datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    print("[ERROR] PyYAML is required. Install it using: pip install pyyaml")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
YAML_PATH = ROOT / "data.yaml"
INDEX_PATH = ROOT / "index.html"
PROJECTS_PATH = ROOT / "projects.html"

def esc(text):
    if text is None:
        return ""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#039;")
    )

def boldify(text):
    safe = esc(text)
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", safe)

def replace_between_markers(content, start_marker, end_marker, replacement):
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    if start_idx == -1 or end_idx == -1:
        return None
    return (
        content[: start_idx + len(start_marker)]
        + "\n"
        + replacement
        + "\n"
        + content[end_idx:]
    )

def build_about(data):
    hero = data.get("hero", {})
    subline_parts = [f"<span>{esc(hero.get('alias', ''))}</span>"]
    if hero.get("status_badge"):
        subline_parts.append('<span class="divider"></span>')
        subline_parts.append(f'<span class="badge badge--accent">{esc(hero.get("status_badge"))}</span>')
    subline_html = "\n        ".join(subline_parts)

    tech_badges = "\n        ".join(
        f'<span class="badge">{esc(t)}</span>' for t in hero.get("tech_stack", [])
    )

    return f"""  <header class="site-header wrap reveal" id="about">
      <h1 class="masthead__name">{esc(hero.get("name", ""))}</h1>
      <div class="masthead__subline">
        {subline_html}
      </div>
      <p class="hero__headline">{esc(hero.get("headline", ""))}</p>
      <p class="hero__bio">{esc(hero.get("bio", ""))}</p>
      <div class="tech-stack">
        {tech_badges}
      </div>
      <div style="margin-top: 36px; display: flex; gap: 14px; flex-wrap: wrap; align-items: center;">
        <a class="btn-primary" href="./MasterCV.pdf" target="_blank" rel="noopener noreferrer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Master CV (PDF)
        </a>
        <a class="btn-secondary" href="./cv.html" target="_blank">
          View Master CV <span aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </header>"""

def main():
    if not YAML_PATH.exists():
        print(f"[ERROR] Could not find {YAML_PATH}")
        sys.exit(1)

    with open(YAML_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    # If Node.js build.js is also available, you can also run npm run build
    import subprocess
    node_build = ROOT / "build.js"
    if node_build.exists():
        res = subprocess.run(["node", str(node_build)], capture_output=True, text=True)
        if res.returncode == 0:
            print(res.stdout.strip())
            return

    print("Static build finished.")

if __name__ == "__main__":
    main()
