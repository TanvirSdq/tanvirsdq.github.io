#!/usr/bin/env python3
"""
build.py
Reads data.yaml and statically pre-renders content into index.html and projects.html.
Ensures zero-JS scrapers, search crawlers, and AI bots can immediately access all
portfolio text, projects, credentials, and links without breaking client-side interactivity.
"""

import os
import sys
import html
import re
import yaml
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
YAML_PATH = os.path.join(ROOT_DIR, "data.yaml")
INDEX_PATH = os.path.join(ROOT_DIR, "index.html")
PROJECTS_PATH = os.path.join(ROOT_DIR, "projects.html")

def esc(text):
    if text is None:
        return ""
    return html.escape(str(text))

def humanize_key(key):
    return " ".join(w.capitalize() for w in key.split("_"))

def boldify(text):
    escaped = esc(text)
    return re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", escaped)

def today_dateline():
    return datetime.now().strftime("%B %d, %Y")

# -----------------------------------------------------------------------------
# Section Builders (matching script.js)
# -----------------------------------------------------------------------------

def build_about(data):
    hero = data.get("hero", {})
    status_html = ""
    if hero.get("status_badge"):
        status_html = f'<span class="divider"></span>\n        <span class="badge badge--accent">{esc(hero["status_badge"])}</span>'
    
    tech_stack_html = "\n        ".join(
        f'<span class="badge">{esc(t)}</span>' for t in hero.get("tech_stack", [])
    )

    return f"""  <header class="site-header wrap reveal" id="about">
      <h1 class="masthead__name">{esc(hero.get("name", ""))}</h1>
      <div class="masthead__subline">
        <span>{esc(hero.get("alias", ""))}</span>
        {status_html}
      </div>
      <p class="hero__headline">{esc(hero.get("headline", ""))}</p>
      <p class="hero__bio">{esc(hero.get("bio", ""))}</p>
      <div class="tech-stack">
        {tech_stack_html}
      </div>
      <div style="margin-top: 32px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <a class="badge badge--accent" href="./MasterCV.pdf" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; font-weight: bold; font-size: 12px; transition: transform 0.2s ease, background 0.2s ease;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download Master CV (PDF)
        </a>
        <a class="badge" href="./cv.html" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; font-size: 12px;">
          View Master CV <span aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </header>"""

def build_impact(data):
    metrics = data.get("impact_metrics", [])
    if not metrics:
        return ""
    items = []
    for m in metrics:
        items.append(f"""        <div class="ledger__item">
          <div class="ledger__number">{esc(m.get("number", ""))}</div>
          <div class="ledger__label">{esc(m.get("label", ""))}</div>
        </div>""")
    items_html = "\n".join(items)
    return f"""  <section class="section wrap reveal" id="impact">
      <div class="eyebrow">By the numbers</div>
      <h2 class="section-title sr-only">Key Impact Metrics</h2>
      <div class="ledger">
{items_html}
      </div>
    </section>"""

def build_achievements(data):
    items = data.get("achievements", [])
    if not items:
        return ""
    lis = "\n".join(f"        <li>{boldify(text)}</li>" for text in items)
    return f"""  <section class="section wrap reveal" id="achievements">
      <div class="eyebrow">Recognition</div>
      <h2 class="section-title">Achievements</h2>
      <ul class="timeline__bullets">
{lis}
      </ul>
    </section>"""

def build_skills(data):
    skills = data.get("skills", {})
    if not any(isinstance(v, list) and v for v in skills.values()):
        return ""
    cols = []
    for key, items in skills.items():
        if not items:
            continue
        li_html = "\n".join(f"            <li>{esc(item)}</li>" for item in items)
        cols.append(f"""        <div class="column">
          <div class="column__head">{esc(humanize_key(key))}</div>
          <ul class="column__list">
{li_html}
          </ul>
        </div>""")
    cols_html = "\n".join(cols)
    return f"""  <section class="section wrap reveal" id="skills">
      <div class="eyebrow">Toolkit</div>
      <h2 class="section-title">Skills &amp; areas of focus</h2>
      <div class="columns">
{cols_html}
      </div>
    </section>"""

def build_projects(data):
    all_projects = data.get("projects", []) or data.get("featured_projects", [])
    featured = [p for p in all_projects if p.get("featured", True) is not False]
    if not featured:
        return ""
    cards = []
    for p in featured:
        tags = p.get("tags", [])
        tags_badges = []
        if p.get("category"):
            tags_badges.append(f'<span class="badge badge--accent">{esc(p["category"])}</span>')
        tags_badges.extend(f'<span class="badge">{esc(t)}</span>' for t in tags)
        tags_html = "".join(tags_badges)

        links = []
        if p.get("github"):
            links.append(f"""          <a class="project-card__link project-card__link--primary" href="{esc(p['github'])}" target="_blank" rel="noopener noreferrer">
            View on GitHub <span aria-hidden="true">&#8599;</span>
          </a>""")
        if p.get("demo"):
            is_second = bool(p.get("github"))
            cls = "project-card__link project-card__link--secondary" if is_second else "project-card__link project-card__link--primary"
            label = p.get("demo_label", "Live Demo")
            links.append(f"""          <a class="{cls}" href="{esc(p['demo'])}" target="_blank" rel="noopener noreferrer">
            {esc(label)} <span aria-hidden="true">&#8599;</span>
          </a>""")
        if p.get("streamlit") and p.get("streamlit") != p.get("demo"):
            label = p.get("streamlit_label", "Streamlit Dashboard")
            links.append(f"""          <a class="project-card__link project-card__link--secondary" href="{esc(p['streamlit'])}" target="_blank" rel="noopener noreferrer">
            {esc(label)} <span aria-hidden="true">&#8599;</span>
          </a>""")
        if p.get("apk"):
            label = p.get("apk_label", "Android APK Release")
            links.append(f"""          <a class="project-card__link project-card__link--secondary" href="{esc(p['apk'])}" target="_blank" rel="noopener noreferrer">
            {esc(label)} <span aria-hidden="true">&#8599;</span>
          </a>""")
        links_html = "\n".join(links)

        cards.append(f"""      <article class="project-card">
        <div class="project-card__tags">
          {tags_html}
        </div>
        <h3 class="project-card__title">{esc(p.get("title", ""))}</h3>
        <p class="project-card__desc">{esc(p.get("description", ""))}</p>
        <div style="display: flex; flex-direction: column; width: 100%;">
{links_html}
        </div>
      </article>""")

    cards_html = "\n".join(cards)
    return f"""  <section class="section wrap reveal" id="projects">
      <div class="eyebrow">Featured work</div>
      <h2 class="section-title">Selected Projects</h2>
      <div class="projects">
{cards_html}
      </div>
      <div style="margin-top: 36px; text-align: center;">
        <a class="cta-link-btn" href="projects.html">
          Explore All Projects &amp; Systems Archive ({len(all_projects)}) <span aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </section>"""

def build_experience(data):
    exp = data.get("professional_experience", [])
    if not exp:
        return ""
    items = []
    for e in exp:
        bullets = e.get("bullets", [])
        bullets_html = ""
        if bullets:
            b_lis = "".join(f"<li>{esc(b)}</li>" for b in bullets)
            bullets_html = f'<ul class="timeline__bullets">{b_lis}</ul>'
        items.append(f"""        <div class="timeline__item">
          <div class="timeline__period">{esc(e.get("period", ""))}</div>
          <div class="timeline__content">
            <div class="timeline__role">{esc(e.get("role", ""))}</div>
            <div class="timeline__org">{esc(e.get("organization", ""))}</div>
            {bullets_html}
          </div>
        </div>""")
    items_html = "\n".join(items)
    return f"""  <section class="section wrap reveal" id="experience">
      <div class="eyebrow">Track record</div>
      <h2 class="section-title">Professional Experience</h2>
      <div class="timeline">
{items_html}
      </div>
    </section>"""

def build_open_source(data):
    items = data.get("open_source_contributions", [])
    if not items:
        return ""
    tl_items = []
    for e in items:
        bullets = e.get("bullets", [])
        bullets_html = ""
        if bullets:
            b_lis = "".join(f"<li>{esc(b)}</li>" for b in bullets)
            bullets_html = f'<ul class="timeline__bullets">{b_lis}</ul>'
        tl_items.append(f"""        <div class="timeline__item">
          <div class="timeline__period">{esc(e.get("period", ""))}</div>
          <div class="timeline__content">
            <div class="timeline__role">{esc(e.get("role", ""))}</div>
            <div class="timeline__org">{esc(e.get("organization", ""))}</div>
            {bullets_html}
          </div>
        </div>""")
    items_html = "\n".join(tl_items)
    return f"""  <section class="section wrap reveal" id="open_source">
      <div class="eyebrow">Ecosystem</div>
      <h2 class="section-title">Open Source Contributions</h2>
      <div class="timeline">
{items_html}
      </div>
    </section>"""

def build_education(data):
    degrees = data.get("education", {}).get("degrees", [])
    if not degrees:
        return ""
    items = []
    for d in degrees:
        details_html = f'<p class="degree-item__details">{esc(d.get("details", ""))}</p>' if d.get("details") else ""
        items.append(f"""        <div class="degree-item">
          <div class="degree-item__period">{esc(d.get("period", ""))}</div>
          <div>
            <div class="degree-item__degree">{esc(d.get("degree", ""))}</div>
            <div class="degree-item__institution">{esc(d.get("institution", ""))}</div>
            {details_html}
          </div>
        </div>""")
    items_html = "\n".join(items)
    return f"""  <section class="section wrap reveal" id="education">
      <div class="eyebrow">Academia</div>
      <h2 class="section-title">Academic Background</h2>
      <div class="education__group">
{items_html}
      </div>
    </section>"""

def build_extracurricular(data):
    activities = data.get("extracurricular_activities", [])
    if not activities:
        return ""
    items = []
    for e in activities:
        bullets = e.get("bullets", [])
        bullets_html = ""
        if bullets:
            b_lis = "".join(f"<li>{esc(b)}</li>" for b in bullets)
            bullets_html = f'<ul class="timeline__bullets">{b_lis}</ul>'
        items.append(f"""        <div class="timeline__item">
          <div class="timeline__period">{esc(e.get("period", ""))}</div>
          <div class="timeline__content">
            <div class="timeline__role">{esc(e.get("role", ""))}</div>
            <div class="timeline__org">{esc(e.get("organization", ""))}</div>
            {bullets_html}
          </div>
        </div>""")
    items_html = "\n".join(items)
    return f"""  <section class="section wrap reveal" id="extracurricular">
      <div class="eyebrow">Campus &amp; Community</div>
      <h2 class="section-title">Extracurricular Activities</h2>
      <div class="timeline">
{items_html}
      </div>
    </section>"""

def build_courses(data):
    courses = data.get("courses", [])
    if not courses:
        return ""
    badges = []
    has_ongoing = False
    for c in courses:
        is_ongoing = c.get("status") == "ongoing"
        if is_ongoing:
            has_ongoing = True
        grade_suffix = f" ({c.get('grade')})" if c.get('grade') else ""
        ongoing_suffix = " †" if is_ongoing else ""
        label = f"{c.get('name', '')}{ongoing_suffix}{grade_suffix}"
        badges.append(f'<span class="badge">{esc(label)}</span>')
    legend_html = '\n      <div class="courses__legend">† Ongoing</div>' if has_ongoing else ""
    badges_html = "\n        ".join(badges)
    return f"""  <section class="section wrap reveal" id="courses">
      <div class="eyebrow">Coursework</div>
      <h2 class="section-title">Courses</h2>
      <div class="tech-stack">
        {badges_html}
      </div>{legend_html}
    </section>"""

def build_certifications(data):
    certs = data.get("certifications", [])
    if not certs:
        return ""
    items = []
    for c in certs:
        meta = " — ".join([x for x in [c.get("issuer"), str(c.get("year", "")) if c.get("year") else None] if x])
        items.append(f"""      <div class="cert-item">
        <span class="cert-item__name">{esc(c.get("name", ""))}</span>
        <span class="cert-item__meta">{esc(meta)}</span>
      </div>""")
    items_html = "\n".join(items)
    return f"""  <section class="section wrap reveal" id="certifications">
      <div class="eyebrow">Credentials</div>
      <h2 class="section-title">Certifications</h2>
{items_html}
    </section>"""

def build_research(data):
    interests = data.get("research_interests", {})
    if not interests.get("category") and not interests.get("title") and not interests.get("description"):
        return ""
    return f"""  <section class="section wrap reveal" id="research">
      <div class="colophon">
        <div class="eyebrow" style="justify-content:center;">{esc(interests.get("category", ""))}</div>
        <h2 class="colophon__title">{esc(interests.get("title", ""))}</h2>
        <p class="colophon__desc">{esc(interests.get("description", ""))}</p>
        <div style="margin-top: 24px; text-align: center;">
          <a class="cta-link-btn" href="{esc(interests.get("link", "research.html"))}">
            Read Research Statement &amp; Notes <span aria-hidden="true">&#8599;</span>
          </a>
        </div>
      </div>
    </section>"""

def build_contact(data):
    contact = data.get("contact", {})
    socials = contact.get("socials", [])
    dev_profiles = contact.get("developer_profiles", [])

    email_html = ""
    if contact.get("email"):
        email = contact["email"]
        email_html = f"""      <div class="contact__email-row">
        <a class="contact__email" href="mailto:{esc(email)}">{esc(email)}</a>
        <button type="button" class="copy-email-btn" id="copy-email-btn" data-email="{esc(email)}" aria-label="Copy email address">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span id="copy-email-text" aria-live="polite">Copy</span>
        </button>
      </div>\n"""

    social_lis = []
    for s in socials:
        social_lis.append(f"""        <li>
          <a href="{esc(s.get("url", "#"))}" target="_blank" rel="noopener noreferrer">
            <span>{esc(s.get("label", ""))}</span><span class="arrow" aria-hidden="true">&#8599;</span>
          </a>
        </li>""")
    social_html = "\n".join(social_lis)

    dev_html = ""
    if dev_profiles:
        chips = []
        for p in dev_profiles:
            chips.append(f"""            <a class="dev-chip" href="{esc(p.get("url", "#"))}" target="_blank" rel="noopener noreferrer">
              <span>{esc(p.get("label", ""))}</span>
              <span class="arrow" style="font-size:10px; color:var(--text-secondary);" aria-hidden="true">&#8599;</span>
            </a>""")
        chips_html = "\n".join(chips)
        dev_html = f"""\n      <div class="dev-footprint">
        <div class="dev-footprint__title">Developer &amp; Knowledge Footprint</div>
        <div class="dev-footprint__grid">
{chips_html}
        </div>
      </div>"""

    return f"""  <section class="section wrap reveal" id="contact">
      <div class="eyebrow">Get in touch</div>
      <h2 class="section-title">Contact</h2>
{email_html}      <ul class="social-list">
{social_html}
      </ul>{dev_html}
    </section>"""

def build_footer(data):
    site = data.get("site", {})
    hero = data.get("hero", {})
    year = datetime.now().year
    return f"""  <footer class="site-footer">
    <div class="site-footer__group">
      <span>{esc(site.get("version", ""))}</span>
      <span>{esc(site.get("location", ""))}</span>
    </div>
    <div class="site-footer__group">
      <span>Updated {esc(today_dateline())}</span>
      <span>&copy; {year} {esc(hero.get("name", ""))}</span>
    </div>
  </footer>"""

BUILDERS = {
    "about": build_about,
    "impact": build_impact,
    "achievements": build_achievements,
    "skills": build_skills,
    "projects": build_projects,
    "experience": build_experience,
    "open_source": build_open_source,
    "education": build_education,
    "extracurricular": build_extracurricular,
    "courses": build_courses,
    "certifications": build_certifications,
    "research": build_research,
    "contact": build_contact,
}

# -----------------------------------------------------------------------------
# Pre-render index.html
# -----------------------------------------------------------------------------

def prerender_index(data):
    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Build active sections and rail
    nav = data.get("nav", [])
    sections = []
    active_nav = []

    for item in nav:
        sec_id = item.get("id")
        builder = BUILDERS.get(sec_id)
        if not builder:
            continue
        rendered = builder(data)
        if rendered:
            sections.append(rendered)
            active_nav.append(item)

    sections.append(build_footer(data))
    full_sections_html = "\n\n".join(sections)

    # Build side rail list items
    rail_lis = []
    for i, item in enumerate(active_nav):
        idx = f"{i + 1:02d}"
        rail_lis.append(f'      <li><a href="#{esc(item["id"])}" data-nav-target="{esc(item["id"])}"><span class="side-rail__index">{idx}</span><span>{esc(item.get("label", ""))}</span></a></li>')
    rail_html = "\n".join(rail_lis)

    # In index.html, inject into side rail and app-root
    # 1. Side rail list
    rail_pattern = r'(<ol class="side-rail__list" id="side-rail-list">)(.*?)(</ol>)'
    if re.search(rail_pattern, content, re.DOTALL):
        content = re.sub(rail_pattern, rf'\1\n{rail_html}\n  \3', content, flags=re.DOTALL)

    # 2. Main app-root
    app_root_pattern = r'(<main id="app-root">)(.*?)(</main>)'
    app_root_replacement = rf"""\1
    <noscript>
      <style>
        .reveal {{ opacity: 1 !important; transform: none !important; }}
      </style>
    </noscript>
{full_sections_html}
  \3"""

    if re.search(app_root_pattern, content, re.DOTALL):
        content = re.sub(app_root_pattern, app_root_replacement, content, flags=re.DOTALL)

    tmp_index = INDEX_PATH + ".tmp"
    with open(tmp_index, "w", encoding="utf-8") as f:
        f.write(content)
    os.replace(tmp_index, INDEX_PATH)

    print(f"Pre-rendered {INDEX_PATH} with {len(active_nav)} sections.")

# -----------------------------------------------------------------------------
# Pre-render projects.html
# -----------------------------------------------------------------------------

def prerender_projects(data):
    if not os.path.exists(PROJECTS_PATH):
        return

    with open(PROJECTS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    projects = data.get("projects", [])
    categories = []
    for p in projects:
        cat = p.get("category")
        if cat and cat not in categories:
            categories.append(cat)

    # Filter buttons
    filter_btns = ['    <button type="button" class="filter-btn is-active" data-filter="all" aria-pressed="true">All Projects</button>']
    for cat in categories:
        filter_btns.append(f'    <button type="button" class="filter-btn" data-filter="{esc(cat)}" aria-pressed="false">{esc(cat)}</button>')
    filters_html = "\n".join(filter_btns)

    filter_pattern = r'(<nav class="filter-bar" id="filter-bar" aria-label="Project category filters">)(.*?)(</nav>)'
    if re.search(filter_pattern, content, re.DOTALL):
        content = re.sub(filter_pattern, rf'\1\n{filters_html}\n  \3', content, flags=re.DOTALL)

    # Meta
    meta_text = " &bull; ".join(categories)
    meta_pattern = r'(<div class="sop-meta" id="archive-meta">)(.*?)(</div>)'
    if re.search(meta_pattern, content, re.DOTALL):
        content = re.sub(meta_pattern, rf'\1{meta_text}\3', content, flags=re.DOTALL)

    # Project cards
    cards = []
    for p in projects:
        tags = p.get("tags", [])
        tags_badges = []
        for i, t in enumerate(tags):
            cls = "badge badge--accent" if i == 0 else "badge"
            tags_badges.append(f'<span class="{cls}">{esc(t)}</span>')
        tags_html = "".join(tags_badges)

        links = []
        if p.get("github"):
            links.append(f'<a class="project-card__link project-card__link--primary" href="{esc(p["github"])}" target="_blank" rel="noopener noreferrer">View on GitHub <span aria-hidden="true">&#8599;</span></a>')
        if p.get("demo"):
            is_second = bool(p.get("github"))
            cls = "project-card__link project-card__link--secondary" if is_second else "project-card__link project-card__link--primary"
            label = p.get("demo_label", "Live Demo")
            links.append(f'<a class="{cls}" href="{esc(p["demo"])}" target="_blank" rel="noopener noreferrer">{esc(label)} <span aria-hidden="true">&#8599;</span></a>')
        if p.get("streamlit") and p.get("streamlit") != p.get("demo"):
            label = p.get("streamlit_label", "Streamlit Dashboard")
            links.append(f'<a class="project-card__link project-card__link--secondary" href="{esc(p["streamlit"])}" target="_blank" rel="noopener noreferrer">{esc(label)} <span aria-hidden="true">&#8599;</span></a>')
        if p.get("apk"):
            label = p.get("apk_label", "Android APK Release")
            links.append(f'<a class="project-card__link project-card__link--secondary" href="{esc(p["apk"])}" target="_blank" rel="noopener noreferrer">{esc(label)} <span aria-hidden="true">&#8599;</span></a>')
        links_html = "\n      ".join(links)

        featured_badge = ""
        if p.get("featured"):
            featured_badge = '<span class="badge badge--accent" style="margin-left:8px;font-size:10px;vertical-align:middle;">Featured</span>'

        cat_attr = esc(p.get("category", ""))
        cards.append(f"""    <article class="project-card" data-category="{cat_attr}">
      <div class="project-card__tags">
        {tags_html}
      </div>
      <h3 class="project-card__title">{esc(p.get("title", ""))}{featured_badge}</h3>
      <p class="project-card__desc">{esc(p.get("description", ""))}</p>
      <div style="display: flex; flex-direction: column; width: 100%;">
      {links_html}
      </div>
    </article>""")

    cards_html = "\n".join(cards)
    grid_pattern = r'(<div class="projects" id="projects-grid">)(.*?)(</div>)'
    if re.search(grid_pattern, content, re.DOTALL):
        content = re.sub(grid_pattern, rf'\1\n{cards_html}\n  \3', content, flags=re.DOTALL)

    tmp_projects = PROJECTS_PATH + ".tmp"
    with open(tmp_projects, "w", encoding="utf-8") as f:
        f.write(content)
    os.replace(tmp_projects, PROJECTS_PATH)

    print(f"Pre-rendered {PROJECTS_PATH} with {len(projects)} projects.")

def main():
    if not os.path.exists(YAML_PATH):
        print(f"Error: {YAML_PATH} not found.")
        sys.exit(1)

    with open(YAML_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    prerender_index(data)
    prerender_projects(data)

    if "--cv" in sys.argv or "--all" in sys.argv:
        try:
            import generate_cv
            print("Compiling CV and MasterCV.pdf from data.yaml...")
            generate_cv.main()
        except Exception as e:
            print(f"CV compilation note: {e}")

    print("Pre-rendering completed successfully.")

if __name__ == "__main__":
    main()
