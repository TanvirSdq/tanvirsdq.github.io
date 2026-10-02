#!/usr/bin/env node
/**
 * build.js — Fast, zero-dependency Node.js Pre-rendering Engine
 * Reads data.yaml and synchronously injects pre-rendered HTML into
 * index.html and projects.html between safe marker comments.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const YAML_PATH = path.join(__dirname, 'data.yaml');
const INDEX_PATH = path.join(__dirname, 'index.html');
const PROJECTS_PATH = path.join(__dirname, 'projects.html');

function esc(text) {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function boldify(text) {
  const safe = esc(text);
  return safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function humanizeKey(key) {
  return String(key)
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function todayDateline() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function replaceBetweenMarkers(content, startMarker, endMarker, replacement) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1) return null;

  return (
    content.slice(0, startIndex + startMarker.length) +
    '\n' + replacement + '\n' +
    content.slice(endIndex)
  );
}

// -----------------------------------------------------------------------------
// Section Builders
// -----------------------------------------------------------------------------

function buildAbout(data) {
  const hero = data.hero || {};
  const sublineParts = [`<span>${esc(hero.alias || '')}</span>`];
  if (hero.status_badge) {
    sublineParts.push('<span class="divider"></span>');
    sublineParts.push(`<span class="badge badge--accent">${esc(hero.status_badge)}</span>`);
  }
  const sublineHtml = sublineParts.join('\n        ');

  const techBadges = (hero.tech_stack || [])
    .map(t => `<span class="badge">${esc(t)}</span>`)
    .join('\n        ');

  return `  <header class="site-header wrap reveal" id="about">
      <h1 class="masthead__name">${esc(hero.name || '')}</h1>
      <div class="masthead__subline">
        ${sublineHtml}
      </div>
      <p class="hero__headline">${esc(hero.headline || '')}</p>
      <p class="hero__bio">${esc(hero.bio || '')}</p>
      <div class="tech-stack">
        ${techBadges}
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
    </header>`;
}

function buildImpact(data) {
  const metrics = data.impact_metrics || [];
  if (!metrics.length) return '';
  const items = metrics.map(m => {
    const num = esc(m.number || '');
    const label = esc(m.label || '');
    const rawNumber = String(m.number || '').replace(/[^0-9]/g, '');
    const suffix = String(m.number || '').includes('+') ? '+' : '';
    if (m.url) {
      return `        <a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer" class="ledger__item">
          <div class="ledger__number" data-count-target="${rawNumber}" data-suffix="${suffix}">${num}</div>
          <div class="ledger__label">${label}</div>
        </a>`;
    }
    return `        <div class="ledger__item">
          <div class="ledger__number" data-count-target="${rawNumber}" data-suffix="${suffix}">${num}</div>
          <div class="ledger__label">${label}</div>
        </div>`;
  }).join('\n');

  return `  <section class="section wrap reveal" id="impact" aria-label="Impact Metrics">
    <div class="eyebrow">By the numbers</div>
    <div class="ledger">
${items}
    </div>
  </section>`;
}

function buildAchievements(data) {
  const items = data.achievements || [];
  if (!items.length) return '';
  const lis = items.map(text => `        <li>${boldify(text)}</li>`).join('\n');
  return `  <section class="section wrap reveal" id="achievements">
      <div class="eyebrow">Recognition</div>
      <h2 class="section-title">Achievements</h2>
      <ul class="timeline__bullets">
${lis}
      </ul>
    </section>`;
}

function buildSkills(data) {
  const skills = data.skills || {};
  const populated = Object.values(skills).some(v => Array.isArray(v) && v.length > 0);
  if (!populated) return '';

  const cols = Object.entries(skills).map(([key, items]) => {
    if (!Array.isArray(items) || !items.length) return '';
    const lis = items.map(i => `            <li>${esc(i)}</li>`).join('\n');
    return `        <div class="column">
          <div class="column__head">${esc(humanizeKey(key))}</div>
          <ul class="column__list">
${lis}
          </ul>
        </div>`;
  }).filter(Boolean).join('\n');

  return `  <section class="section wrap reveal" id="skills">
      <div class="eyebrow">Skills</div>
      <h2 class="section-title">Skills</h2>
      <div class="columns">
${cols}
      </div>
    </section>`;
}

function buildProjects(data) {
  const allProjects = data.projects || data.featured_projects || [];
  const featured = allProjects.filter(p => p.featured !== false);
  if (!featured.length) return '';

  const cards = featured.map(p => {
    const tags = p.tags || [];
    const badges = [];
    if (p.category) {
      badges.push(`<span class="badge badge--accent">${esc(p.category)}</span>`);
    }
    if (p.status) {
      badges.push(`<span class="badge badge--status">${esc(p.status)}</span>`);
    }
    badges.push(...tags.map(t => `<span class="badge">${esc(t)}</span>`));
    const tagsHtml = badges.join('');

    const links = [];
    if (p.github) {
      links.push(`          <a class="project-card__link project-card__link--primary" href="${esc(p.github)}" target="_blank" rel="noopener noreferrer">
            View on GitHub <span aria-hidden="true">&#8599;</span>
          </a>`);
    }
    if (p.demo) {
      const isSecond = Boolean(p.github);
      const cls = isSecond ? 'project-card__link project-card__link--secondary' : 'project-card__link project-card__link--primary';
      const label = p.demo_label || 'Live Demo';
      links.push(`          <a class="${cls}" href="${esc(p.demo)}" target="_blank" rel="noopener noreferrer">
            ${esc(label)} <span aria-hidden="true">&#8599;</span>
          </a>`);
    }
    if (p.streamlit && p.streamlit !== p.demo) {
      const label = p.streamlit_label || 'Streamlit Dashboard';
      links.push(`          <a class="project-card__link project-card__link--secondary" href="${esc(p.streamlit)}" target="_blank" rel="noopener noreferrer">
            ${esc(label)} <span aria-hidden="true">&#8599;</span>
          </a>`);
    }
    if (p.apk) {
      const label = p.apk_label || 'Android APK Release';
      links.push(`          <a class="project-card__link project-card__link--secondary" href="${esc(p.apk)}" target="_blank" rel="noopener noreferrer">
            ${esc(label)} <span aria-hidden="true">&#8599;</span>
          </a>`);
    }
    const linksHtml = links.join('\n');

    return `      <article class="project-card">
        <div class="project-card__tags">
          ${tagsHtml}
        </div>
        <h3 class="project-card__title">${esc(p.title || '')}</h3>
        <p class="project-card__desc">${esc(p.description || '')}</p>
        <div style="display: flex; flex-direction: column; width: 100%;">
${linksHtml}
        </div>
      </article>`;
  }).join('\n');

  return `  <section class="section wrap reveal" id="projects">
      <div class="eyebrow">Projects</div>
      <h2 class="section-title">Projects</h2>
      
      <div class="index-search" style="margin-bottom: 24px;">
        <input type="search" id="index-project-search" placeholder="Search projects..." aria-label="Search projects" class="clean-search-input">
      </div>
      <div class="projects" id="index-projects-grid">
${cards}
      </div>
      <div style="margin-top: 36px; text-align: center;">
        <a class="cta-link-btn" href="projects.html">
          Explore All Projects &amp; Systems Archive (${allProjects.length}) <span aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </section>`;
}

function buildOpenSource(data) {
  const items = data.open_source_contributions || [];
  if (!items.length) return '';
  const tlItems = items.map(e => {
    const bullets = e.bullets || [];
    const bLis = bullets.map(b => `<li>${esc(b)}</li>`).join('');
    const bulletsHtml = bullets.length ? `<ul class="timeline__bullets">${bLis}</ul>` : '';
    return `        <div class="timeline__item">
          <div class="timeline__period">${esc(e.period || '')}</div>
          <div class="timeline__content">
            <div class="timeline__role">${esc(e.role || '')}</div>
            <div class="timeline__org">${esc(e.organization || '')}</div>
            ${bulletsHtml}
          </div>
        </div>`;
  }).join('\n');

  return `  <section class="section wrap reveal" id="open_source">
      <div class="eyebrow">Ecosystem</div>
      <h2 class="section-title">Open Source Contributions</h2>
      <div class="timeline">
${tlItems}
      </div>
    </section>`;
}

function buildEducation(data) {
  const degrees = data.education?.degrees || [];
  if (!degrees.length) return '';
  const items = degrees.map(d => {
    const detailsHtml = d.details ? `<p class="degree-item__details">${esc(d.details)}</p>` : '';
    return `        <div class="degree-item">
          <div class="degree-item__period">${esc(d.period || '')}</div>
          <div>
            <div class="degree-item__degree">${esc(d.degree || '')}</div>
            <div class="degree-item__institution">${esc(d.institution || '')}</div>
            ${detailsHtml}
          </div>
        </div>`;
  }).join('\n');

  return `  <section class="section wrap reveal" id="education">
      <div class="eyebrow">Education</div>
      <h2 class="section-title">Education</h2>
      <div class="education__group">
${items}
      </div>
    </section>`;
}

function buildExtracurricular(data) {
  const activities = data.extracurricular_activities || [];
  if (!activities.length) return '';
  const items = activities.map(e => {
    const bullets = e.bullets || [];
    const bLis = bullets.map(b => `<li>${esc(b)}</li>`).join('');
    const bulletsHtml = bullets.length ? `<ul class="timeline__bullets">${bLis}</ul>` : '';
    return `        <div class="timeline__item">
          <div class="timeline__period">${esc(e.period || '')}</div>
          <div class="timeline__content">
            <div class="timeline__role">${esc(e.role || '')}</div>
            <div class="timeline__org">${esc(e.organization || '')}</div>
            ${bulletsHtml}
          </div>
        </div>`;
  }).join('\n');

  return `  <section class="section wrap reveal" id="extracurricular">
      <div class="eyebrow">Campus &amp; Community</div>
      <h2 class="section-title">Extracurricular Activities</h2>
      <div class="timeline">
${items}
      </div>
    </section>`;
}

function buildCourses(data) {
  const courses = data.courses || [];
  if (!courses.length) return '';
  let hasOngoing = false;
  const badges = courses.map(c => {
    const isOngoing = c.status === 'ongoing';
    if (isOngoing) hasOngoing = true;
    const gradeSuffix = c.grade ? ` (${c.grade})` : '';
    const ongoingSuffix = isOngoing ? ' †' : '';
    const label = `${c.name || ''}${ongoingSuffix}${gradeSuffix}`;
    return `<span class="badge">${esc(label)}</span>`;
  }).join('\n        ');

  const legendHtml = hasOngoing ? '\n      <div class="courses__legend">† Ongoing</div>' : '';
  return `  <section class="section wrap reveal" id="courses">
      <div class="eyebrow">Coursework</div>
      <h2 class="section-title">Courses</h2>
      <div class="tech-stack">
        ${badges}
      </div>${legendHtml}
    </section>`;
}

function buildResearch(data) {
  const interests = data.research_interests || {};
  if (!interests.category && !interests.title && !interests.description) return '';
  return `  <section class="section wrap reveal" id="research">
      <div class="colophon">
        <div class="eyebrow" style="justify-content:center;">${esc(interests.category || '')}</div>
        <h2 class="colophon__title">${esc(interests.title || '')}</h2>
        <p class="colophon__desc">${esc(interests.description || '')}</p>
        <div style="margin-top: 24px; text-align: center;">
          <a class="cta-link-btn" href="${esc(interests.link || 'research.html')}">
            Read Research Statement &amp; Notes <span aria-hidden="true">&#8599;</span>
          </a>
        </div>
      </div>
    </section>`;
}

function buildContact(data) {
  const contact = data.contact || {};
  const socials = contact.socials || [];
  const devProfiles = contact.developer_profiles || [];

  let emailHtml = '';
  if (contact.email) {
    const email = contact.email;
    emailHtml = `      <div class="contact__email-row">
        <a class="contact__email" href="mailto:${esc(email)}">${esc(email)}</a>
        <button type="button" class="copy-email-btn" id="copy-email-btn" data-email="${esc(email)}" aria-label="Copy email address">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span id="copy-email-text" aria-live="polite">Copy</span>
        </button>
      </div>\n`;
  }

  const socialLis = socials.map(s => `        <li>
          <a href="${esc(s.url || '#')}" target="_blank" rel="noopener noreferrer">
            <span>${esc(s.label || '')}</span><span class="arrow" aria-hidden="true">&#8599;</span>
          </a>
        </li>`).join('\n');

  let devHtml = '';
  if (devProfiles.length) {
    const chips = devProfiles.map(p => `            <a class="dev-chip" href="${esc(p.url || '#')}" target="_blank" rel="noopener noreferrer">
              <span>${esc(p.label || '')}</span>
              <span class="arrow" style="font-size:10px; color:var(--text-secondary);" aria-hidden="true">&#8599;</span>
            </a>`).join('\n');
    devHtml = `\n      <div class="dev-footprint">
        <div class="dev-footprint__title">Developer &amp; Knowledge Footprint</div>
        <div class="dev-footprint__grid">
${chips}
        </div>
      </div>`;
  }

  return `  <section class="section wrap reveal" id="contact">
      <div class="eyebrow">Get in touch</div>
      <h2 class="section-title">Contact</h2>
${emailHtml}      <ul class="social-list">
${socialLis}
      </ul>${devHtml}
    </section>`;
}

function buildFooter(data) {
  const site = data.site || {};
  const hero = data.hero || {};
  const year = new Date().getFullYear();
  return `  <footer class="site-footer">
    <div class="site-footer__group">
      <span>${esc(site.version || '')}</span>
      <span>${esc(site.location || '')}</span>
    </div>
    <div class="site-footer__group">
      <span>Updated ${esc(todayDateline())}</span>
      <span>&copy; ${year} ${esc(hero.name || '')}</span>
    </div>
  </footer>`;
}

const BUILDERS = {
  about: buildAbout,
  impact: buildImpact,
  achievements: buildAchievements,
  skills: buildSkills,
  projects: buildProjects,
  open_source: buildOpenSource,
  education: buildEducation,
  extracurricular: buildExtracurricular,
  courses: buildCourses,
  research: buildResearch,
  contact: buildContact
};

// -----------------------------------------------------------------------------
// Pre-render Execution
// -----------------------------------------------------------------------------

function prerenderIndex(data) {
  if (!fs.existsSync(INDEX_PATH)) return;
  let content = fs.readFileSync(INDEX_PATH, 'utf-8');

  const nav = data.nav || [];
  const sections = [];
  const activeNav = [];

  for (const item of nav) {
    const builder = BUILDERS[item.id];
    if (!builder) continue;
    const rendered = builder(data);
    if (rendered) {
      sections.push(rendered);
      activeNav.push(item);
    }
  }

  sections.push(buildFooter(data));
  const fullSectionsHtml = sections.join('\n\n');

  // Side rail
  const railLis = activeNav.map((item, i) => {
    const idx = String(i + 1).padStart(2, '0');
    return `      <li><a href="#${esc(item.id)}" data-nav-target="${esc(item.id)}"><span class="side-rail__index">${idx}</span><span>${esc(item.label || '')}</span></a></li>`;
  }).join('\n');

  const updatedRail = replaceBetweenMarkers(
    content,
    '<!-- SIDE_RAIL_START -->',
    '<!-- SIDE_RAIL_END -->',
    railLis
  );
  if (updatedRail) content = updatedRail;

  // App root
  const appRootContent = `    <noscript>
      <style>
        .reveal { opacity: 1 !important; transform: none !important; }
      </style>
    </noscript>\n${fullSectionsHtml}`;

  const updatedRoot = replaceBetweenMarkers(
    content,
    '<!-- APP_ROOT_START -->',
    '<!-- APP_ROOT_END -->',
    appRootContent
  );
  if (updatedRoot) content = updatedRoot;

  fs.writeFileSync(INDEX_PATH, content, 'utf-8');
  console.log(`Pre-rendered ${INDEX_PATH} with ${activeNav.length} sections.`);
}

function prerenderProjects(data) {
  if (!fs.existsSync(PROJECTS_PATH)) return;
  let content = fs.readFileSync(PROJECTS_PATH, 'utf-8');

  const projects = data.projects || [];
  const categories = [];
  for (const p of projects) {
    if (p.category && !categories.includes(p.category)) {
      categories.push(p.category);
    }
  }

  // Filter buttons
  const filterBtns = ['    <button type="button" class="filter-btn is-active" data-filter="all" aria-pressed="true">All Projects</button>'];
  for (const cat of categories) {
    filterBtns.push(`    <button type="button" class="filter-btn" data-filter="${esc(cat)}" aria-pressed="false">${esc(cat)}</button>`);
  }
  const filtersHtml = filterBtns.join('\n');

  // Meta text
  const metaText = categories.map(c => esc(c)).join(' &bull; ');

  // Project cards
  const cards = projects.map(p => {
    const tags = p.tags || [];
    const badges = [];
    if (p.category) {
      badges.push(`<span class="badge badge--accent">${esc(p.category)}</span>`);
    }
    if (p.status) {
      badges.push(`<span class="badge badge--status">${esc(p.status)}</span>`);
    }
    badges.push(...tags.map(t => `<span class="badge">${esc(t)}</span>`));
    const tagsHtml = badges.join('');

    const links = [];
    if (p.github) {
      links.push(`      <a class="project-card__link project-card__link--primary" href="${esc(p.github)}" target="_blank" rel="noopener noreferrer">View on GitHub <span aria-hidden="true">&#8599;</span></a>`);
    }
    if (p.demo) {
      const isSecond = Boolean(p.github);
      const cls = isSecond ? 'project-card__link project-card__link--secondary' : 'project-card__link project-card__link--primary';
      const label = p.demo_label || 'Live Demo';
      links.push(`      <a class="${cls}" href="${esc(p.demo)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">&#8599;</span></a>`);
    }
    if (p.streamlit && p.streamlit !== p.demo) {
      const label = p.streamlit_label || 'Streamlit Dashboard';
      links.push(`      <a class="project-card__link project-card__link--secondary" href="${esc(p.streamlit)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">&#8599;</span></a>`);
    }
    if (p.apk) {
      const label = p.apk_label || 'Download Android APK';
      links.push(`      <a class="project-card__link project-card__link--secondary" href="${esc(p.apk)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">&#8599;</span></a>`);
    }
    const linksHtml = links.join('\n');

    const featuredBadge = p.featured
      ? '<span class="badge badge--accent" style="margin-left:8px;font-size:10px;vertical-align:middle;">Featured</span>'
      : '';

    return `    <article class="project-card" data-category="${esc(p.category || '')}">
      <div class="project-card__tags">${tagsHtml}</div>
      <h2 class="project-card__title">${esc(p.title || '')}${featuredBadge}</h2>
      <p class="project-card__desc">${esc(p.description || '')}</p>
      <div style="display:flex;flex-direction:column;width:100%;gap:8px;">
        ${linksHtml}
      </div>
    </article>`;
  }).join('\n');

  const updatedMeta = replaceBetweenMarkers(content, '<!-- ARCHIVE_META_START -->', '<!-- ARCHIVE_META_END -->', metaText);
  if (updatedMeta) content = updatedMeta;

  const updatedFilters = replaceBetweenMarkers(content, '<!-- FILTER_BUTTONS_START -->', '<!-- FILTER_BUTTONS_END -->', filtersHtml);
  if (updatedFilters) content = updatedFilters;

  const updatedCards = replaceBetweenMarkers(content, '<!-- PROJECT_CARDS_START -->', '<!-- PROJECT_CARDS_END -->', cards);
  if (updatedCards) content = updatedCards;

  fs.writeFileSync(PROJECTS_PATH, content, 'utf-8');
  console.log(`Pre-rendered ${PROJECTS_PATH} with ${projects.length} project cards.`);
}

function main() {
  if (!fs.existsSync(YAML_PATH)) {
    console.error(`Error: ${YAML_PATH} not found.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(YAML_PATH, 'utf-8');
  const data = load(raw);

  prerenderIndex(data);
  prerenderProjects(data);

  console.log('✅ Static build and pre-rendering completed successfully with Node.js.');
}

main();
