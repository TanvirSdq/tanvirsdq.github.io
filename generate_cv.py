#!/usr/bin/env python3
"""
generate_cv.py
Reads data.yaml, generates a standalone, zero-dependency, ATS-optimized cv.html,
and compiles it into MasterCV.pdf using Google Chrome in headless mode.
"""

import os
import sys
import html
import subprocess
import yaml

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
YAML_PATH = os.path.join(ROOT_DIR, "data.yaml")
CV_HTML_PATH = os.path.join(ROOT_DIR, "cv.html")
PDF_PATH = os.path.join(ROOT_DIR, "MasterCV.pdf")
CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def esc(text):
    if text is None:
        return ""
    return html.escape(str(text))

def boldify(text):
    escaped = esc(text)
    # convert **bold** to <strong>bold</strong>
    import re
    return re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", escaped)

def main():
    if not os.path.exists(YAML_PATH):
        print(f"Error: {YAML_PATH} not found.")
        sys.exit(1)

    with open(YAML_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    hero = data.get("hero", {})
    contact = data.get("contact", {})
    socials = contact.get("socials", [])
    edu_degrees = data.get("education", {}).get("degrees", [])
    achievements = data.get("achievements", [])
    skills = data.get("skills", {})
    open_source = data.get("open_source_contributions", [])
    projects = data.get("projects", [])
    activities = data.get("extracurricular_activities", [])
    courses = data.get("courses", [])

    # Contacts line
    contact_parts = []
    if contact.get("email"):
        contact_parts.append(f'<a href="mailto:{esc(contact["email"])}">{esc(contact["email"])}</a>')
    contact_parts.append('<span>Khulna, Bangladesh</span>')
    for s in socials:
        if s.get("label") in ["LinkedIn", "GitHub"]:
            contact_parts.append(f'<a href="{esc(s.get("url"))}" target="_blank">{esc(s.get("label"))}</a>')
    contact_parts.append('<a href="https://siddiquetanvir.github.io/" target="_blank">Portfolio</a>')

    contacts_html = ' <span class="sep">&bull;</span> '.join(contact_parts)

    # Education HTML
    edu_html = ""
    if edu_degrees:
        items = []
        for deg in edu_degrees:
            details_html = f'<div style="font-size:12px; color:#444444; margin-top:2px;">{esc(deg.get("details"))}</div>' if deg.get("details") else ""
            items.append(f"""
            <div class="cv-item">
              <div class="cv-item__header">
                <span class="cv-item__title">{esc(deg.get("institution"))}</span>
                <span class="cv-item__date">{esc(deg.get("period"))}</span>
              </div>
              <div class="cv-item__sub">
                <span>{esc(deg.get("degree"))}</span>
              </div>
              {details_html}
            </div>
            """)
        edu_html = f"""
        <section class="cv-section">
          <h2 class="section-heading">Education</h2>
          {''.join(items)}
        </section>
        """

    # Achievements HTML
    ach_html = ""
    if achievements:
        items = [f"<li>{boldify(a)}</li>" for a in achievements]
        ach_html = f"""
        <section class="cv-section">
          <h2 class="section-heading">Honors &amp; Awards</h2>
          <ul class="cv-bullets">
            {''.join(items)}
          </ul>
        </section>
        """

    # Skills HTML
    core_progs = ", ".join(skills.get("core_programming", []))
    tools = ", ".join(skills.get("automation_and_data", []))
    ops = ", ".join(skills.get("leadership_and_ops", []))
    skills_html = f"""
      <section class="cv-section">
        <h2 class="section-heading">Technical Skills</h2>
        <table class="skills-table">
          <tr>
            <td class="skill-label">Languages</td>
            <td class="skill-val">{esc(core_progs)}</td>
          </tr>
          <tr>
            <td class="skill-label">Frameworks &amp; Tools</td>
            <td class="skill-val">{esc(tools)}</td>
          </tr>
          <tr>
            <td class="skill-label">Ecosystem &amp; Domains</td>
            <td class="skill-val">{esc(ops)}</td>
          </tr>
        </table>
      </section>
    """

    # Open Source & Experience HTML
    exp_html = ""
    if open_source:
        items = []
        for exp in open_source:
            bullets = [f"<li>{esc(b)}</li>" for b in exp.get("bullets", [])]
            bullets_html = f'<ul class="cv-bullets">{"".join(bullets)}</ul>' if bullets else ""
            items.append(f"""
            <div class="cv-item">
              <div class="cv-item__header">
                <span class="cv-item__title">{esc(exp.get("role"))} &bull; {esc(exp.get("organization"))}</span>
                <span class="cv-item__date">{esc(exp.get("period"))}</span>
              </div>
              {bullets_html}
            </div>
            """)
        exp_html = f"""
        <section class="cv-section">
          <h2 class="section-heading">Open Source &amp; Technical Experience</h2>
          {''.join(items)}
        </section>
        """

    # Projects HTML
    proj_html = ""
    if projects:
        items = []
        for p in projects:
            links = []
            if p.get("github"):
                links.append(f'<a href="{esc(p.get("github"))}" target="_blank">Code</a>')
            if p.get("demo"):
                links.append(f'<a href="{esc(p.get("demo"))}" target="_blank">{esc(p.get("demo_label", "Demo"))}</a>')
            if p.get("streamlit") and p.get("streamlit") != p.get("demo"):
                links.append(f'<a href="{esc(p.get("streamlit"))}" target="_blank">{esc(p.get("streamlit_label", "Streamlit"))}</a>')
            if p.get("apk"):
                links.append(f'<a href="{esc(p.get("apk"))}" target="_blank">{esc(p.get("apk_label", "APK"))}</a>')

            link_str = f" [{ ' | '.join(links) }]" if links else ""
            tags_str = ", ".join(p.get("tags", [])[:4])

            items.append(f"""
            <div class="cv-item">
              <div class="cv-item__header">
                <span class="cv-item__title">{esc(p.get("title"))}{link_str}</span>
                <span class="cv-item__date">{esc(tags_str)}</span>
              </div>
              <div style="font-size:12.5px; color:#222222; margin-top:2px;">
                {esc(p.get("description"))}
              </div>
            </div>
            """)
        proj_html = f"""
        <section class="cv-section">
          <h2 class="section-heading">Key Technical Projects</h2>
          {''.join(items)}
        </section>
        """

    # Activities HTML
    act_html = ""
    if activities:
        items = []
        for act in activities:
            bullets = [f"<li>{esc(b)}</li>" for b in act.get("bullets", [])]
            bullets_html = f'<ul class="cv-bullets">{"".join(bullets)}</ul>' if bullets else ""
            items.append(f"""
            <div class="cv-item">
              <div class="cv-item__header">
                <span class="cv-item__title">{esc(act.get("role"))} &bull; {esc(act.get("organization"))}</span>
                <span class="cv-item__date">{esc(act.get("period"))}</span>
              </div>
              {bullets_html}
            </div>
            """)
        act_html = f"""
        <section class="cv-section">
          <h2 class="section-heading">Extracurricular Leadership &amp; Societies</h2>
          {''.join(items)}
        </section>
        """

    # Courses HTML
    courses_html = ""
    if courses:
        items = [f"<li>{esc(c.get('name'))} ({esc(c.get('status'))})</li>" for c in courses]
        courses_html = f"""
        <section class="cv-section">
          <h2 class="section-heading">Relevant Coursework &amp; Training</h2>
          <ul class="cv-bullets">
            {''.join(items)}
          </ul>
        </section>
        """

    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tanvir Siddique — Master Curriculum Vitae</title>
<meta name="description" content="Comprehensive Master Curriculum Vitae of Tanvir Siddique — Education, Experience, Projects, Awards, and Skills.">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

<style>
  :root {{
    --bg-page: #f4f4f6;
    --paper-bg: #ffffff;
    --text-primary: #111111;
    --text-secondary: #444444;
    --text-muted: #666666;
    --rule-color: #222222;
    --link-color: #1a56db;
    --font-heading: 'Cinzel', serif, Georgia;
    --font-body: 'Lora', Georgia, serif;
    --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    background-color: var(--bg-page);
    color: var(--text-primary);
    font-family: var(--font-body);
    font-size: 13.5px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }}

  /* Screen Controls */
  .top-bar {{
    position: sticky;
    top: 0;
    z-index: 100;
    background: #ffffff;
    border-bottom: 1px solid #e0e0e4;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    font-family: var(--font-sans);
  }}

  .top-bar__left {{
    display: flex;
    align-items: center;
    gap: 16px;
  }}

  .top-bar__btn {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 6px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }}

  .btn-primary {{
    background: #111111;
    color: #ffffff;
    border: 1px solid #111111;
  }}

  .btn-primary:hover {{
    background: #333333;
  }}

  .btn-secondary {{
    background: #ffffff;
    color: #222222;
    border: 1px solid #cccccc;
  }}

  .btn-secondary:hover {{
    background: #f0f0f2;
  }}

  .top-bar__note {{
    font-size: 12px;
    color: var(--text-muted);
  }}

  .paper-wrap {{
    max-width: 820px;
    margin: 28px auto 48px;
    padding: 0 16px;
  }}

  .paper {{
    background: var(--paper-bg);
    padding: 44px 50px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-radius: 2px;
  }}

  .cv-header {{
    text-align: center;
    padding-bottom: 14px;
    margin-bottom: 18px;
    border-bottom: 1.5px solid var(--rule-color);
  }}

  .cv-name {{
    font-family: var(--font-heading);
    font-size: 26px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-weight: 700;
    color: #000000;
    margin-bottom: 4px;
  }}

  .cv-subline {{
    font-family: var(--font-sans);
    font-size: 12.5px;
    color: var(--text-secondary);
    margin-bottom: 8px;
    font-weight: 500;
  }}

  .cv-contacts {{
    font-family: var(--font-sans);
    font-size: 11.5px;
    color: var(--text-secondary);
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px 14px;
  }}

  .cv-contacts a {{
    color: #000000;
    text-decoration: underline;
    text-underline-offset: 2px;
  }}

  .cv-contacts span.sep {{
    color: #bbbbbb;
  }}

  .cv-section {{
    margin-bottom: 18px;
    page-break-inside: auto;
  }}

  .section-heading {{
    font-family: var(--font-heading);
    font-size: 13.5px;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    font-weight: 700;
    color: #000000;
    border-bottom: 1px solid #111111;
    padding-bottom: 3px;
    margin-bottom: 10px;
  }}

  .cv-item {{
    margin-bottom: 12px;
    page-break-inside: avoid;
  }}

  .cv-item__header {{
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 13.5px;
  }}

  .cv-item__title {{
    font-weight: 700;
    color: #000000;
  }}

  .cv-item__title a {{
    color: #000000;
    text-decoration: none;
    border-bottom: 1px dotted #666666;
  }}

  .cv-item__title a:hover {{
    color: var(--link-color);
  }}

  .cv-item__date {{
    font-family: var(--font-sans);
    font-size: 11.5px;
    color: #333333;
    font-weight: 600;
    white-space: nowrap;
  }}

  .cv-item__sub {{
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-secondary);
    margin-top: 1px;
    margin-bottom: 4px;
  }}

  .cv-bullets {{
    list-style: disc;
    margin-left: 18px;
    margin-top: 4px;
  }}

  .cv-bullets li {{
    font-size: 12.5px;
    line-height: 1.45;
    color: #222222;
    margin-bottom: 3px;
  }}

  .cv-bullets li a {{
    color: #000000;
    text-decoration: underline;
    text-underline-offset: 2px;
  }}

  .skills-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
  }}

  .skills-table tr {{
    vertical-align: top;
  }}

  .skills-table td {{
    padding: 3px 0;
  }}

  .skills-table td.skill-label {{
    width: 160px;
    font-weight: 700;
    color: #000000;
    font-family: var(--font-sans);
    font-size: 12px;
  }}

  .skills-table td.skill-val {{
    color: #222222;
  }}

  @page {{
    size: letter;
    margin: 0.55in 0.55in 0.55in 0.55in;
  }}

  @media print {{
    body {{
      background: #ffffff !important;
      font-size: 10.5pt;
      line-height: 1.35;
    }}

    .top-bar {{
      display: none !important;
    }}

    .paper-wrap {{
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }}

    .paper {{
      padding: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }}

    a {{
      color: #000000 !important;
      text-decoration: none !important;
    }}

    .cv-item {{
      page-break-inside: avoid;
    }}

    .section-heading {{
      page-break-after: avoid;
    }}
  }}
</style>
</head>
<body>

<header class="top-bar">
  <div class="top-bar__left">
    <a class="top-bar__btn btn-secondary" href="./">
      &larr; Back to Portfolio
    </a>
    <span class="top-bar__note">Master Curriculum Vitae &bull; Built from data.yaml</span>
  </div>
  <div class="top-bar__right" style="display:flex; gap:10px;">
    <button class="top-bar__btn btn-primary" onclick="window.print()" type="button">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      Print / Save as PDF (Cmd + P)
    </button>
    <a class="top-bar__btn btn-secondary" href="./MasterCV.pdf" target="_blank">
      Open Raw MasterCV.pdf
    </a>
  </div>
</header>

<main class="paper-wrap">
  <article class="paper">
    <header class="cv-header">
      <h1 class="cv-name">{esc(hero.get("name", "Tanvir Siddique"))}</h1>
      <div class="cv-subline">Computer Science &amp; Engineering &bull; Khulna University of Engineering &amp; Technology</div>
      <div class="cv-contacts">
        {contacts_html}
      </div>
    </header>

    {edu_html}
    {ach_html}
    {skills_html}
    {exp_html}
    {proj_html}
    {act_html}
    {courses_html}
  </article>
</main>

</body>
</html>
"""

    with open(CV_HTML_PATH, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f"Generated: {CV_HTML_PATH}")

    # Compile to MasterCV.pdf using Google Chrome
    if os.path.exists(CHROME_PATH):
        print("Compiling MasterCV.pdf with headless Chrome...")
        cmd = [
            CHROME_PATH,
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={PDF_PATH}",
            f"file://{CV_HTML_PATH}"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and os.path.exists(PDF_PATH):
            print(f"Successfully generated: {PDF_PATH} ({os.path.getsize(PDF_PATH)} bytes)")
        else:
            print(f"Chrome PDF generation output: {res.stderr}")
    else:
        print("Chrome not found at standard path, skipped PDF compilation.")

if __name__ == "__main__":
    main()
