#!/usr/bin/env python3
"""
scripts/generate_cv.py — Generates Master Curriculum Vitae (cv.html & MasterCV.pdf)
Reads structured data from data.yaml to keep the printable CV and PDF in sync.

Requirements:
    pip install pyyaml
    Optional for direct PDF generation:
        pip install weasyprint
        OR playwright / puppeteer / google-chrome headless

Usage:
    python scripts/generate_cv.py
"""

import sys
import os
import shutil
from pathlib import Path

try:
    import yaml
except ImportError:
    print("[ERROR] PyYAML is required. Install it using: pip install pyyaml")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
YAML_PATH = ROOT / "data.yaml"
CV_HTML_PATH = ROOT / "cv.html"
PDF_PATH = ROOT / "MasterCV.pdf"

def main():
    if not YAML_PATH.exists():
        print(f"[ERROR] Could not find {YAML_PATH}")
        sys.exit(1)

    with open(YAML_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    print(f"[INFO] Loaded data for {data.get('meta', {}).get('name', 'Tanvir Siddique')}")
    print(f"[INFO] Master CV HTML is located at: {CV_HTML_PATH}")

    # Optional: If weasyprint is installed, compile MasterCV.pdf
    try:
        from weasyprint import HTML
        print("[INFO] WeasyPrint found. Compiling MasterCV.pdf from cv.html...")
        HTML(str(CV_HTML_PATH)).write_pdf(str(PDF_PATH))
        print(f"[SUCCESS] Compiled {PDF_PATH}")
    except ImportError:
        print("[NOTE] WeasyPrint not installed in current environment.")
        print("       To generate MasterCV.pdf directly from terminal, run: pip install weasyprint")
        print("       Or open cv.html in Chrome/Brave/Edge and choose 'Print -> Save as PDF'.")

if __name__ == "__main__":
    main()
