/**
 * script.js
 * Fetches data.yaml, parses it with js-yaml, and renders the portfolio
 * entirely from that data — plus theme toggling, sidebar nav generation,
 * and scroll-based active-link tracking.
 */

(function () {
  "use strict";

  const DATA_URL = "data.yaml";

  /* ---------------------------------------------------------------------
   * Utilities
   * ------------------------------------------------------------------- */

  function escapeHtml(str) {
    if (str === undefined || str === null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function humanizeKey(key) {
    return key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function todayDateline() {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /* ---------------------------------------------------------------------
   * Theme
   * ------------------------------------------------------------------- */

  function safeStorage() {
    try {
      const k = "__theme_test__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return localStorage;
    } catch (e) {
      return null; // private browsing / storage disabled — theme just won't persist
    }
  }

  const storage = safeStorage();

  function initThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      if (storage) storage.setItem("theme", next);
    });

    // Follow system changes live, but only until the person picks manually.
    if (!(storage && storage.getItem("theme")) && window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!(storage && storage.getItem("theme"))) {
          document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
        }
      });
    }
  }

  /* ---------------------------------------------------------------------
   * Sidebar nav + scrollspy
   * ------------------------------------------------------------------- */

  function buildSideRail(nav) {
    const list = document.getElementById("side-rail-list");
    if (!list) return;

    list.innerHTML = "";
    nav.forEach((item, i) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${item.id}`;
      a.dataset.navTarget = item.id;
      a.innerHTML = `<span class="side-rail__index">${String(i + 1).padStart(2, "0")}</span><span>${escapeHtml(item.label)}</span>`;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function initScrollspy(nav) {
    const links = Array.from(document.querySelectorAll("[data-nav-target]"));
    const sections = nav
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    if (!("IntersectionObserver" in window) || sections.length === 0) return;

    const setActive = (id) => {
      links.forEach((l) => l.classList.toggle("is-active", l.dataset.navTarget === id));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    setActive(nav[0] && nav[0].id);
  }

  /* ---------------------------------------------------------------------
   * Section builders
   * ------------------------------------------------------------------- */

  function buildAbout(data) {
    const hero = data.hero || {};
    const section = el("header", "site-header wrap reveal");
    section.id = "about";

    section.innerHTML = `
      <h1 class="masthead__name">${escapeHtml(hero.name || "")}</h1>
      <div class="masthead__subline">
        <span>${escapeHtml(hero.alias || "")}</span>
        ${hero.status_badge ? '<span class="divider"></span>' : ""}
        ${hero.status_badge ? `<span class="badge badge--accent">${escapeHtml(hero.status_badge)}</span>` : ""}
      </div>
      <p class="hero__headline">${escapeHtml(hero.headline || "")}</p>
      <p class="hero__bio">${escapeHtml(hero.bio || "")}</p>
      <div class="tech-stack">
        ${(hero.tech_stack || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join("")}
      </div>
      <div style="margin-top: 32px;">
        <a class="badge badge--accent" href="./MasterCV.pdf" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; font-weight: bold; font-size: 12px; transition: transform 0.2s ease, background 0.2s ease;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Download CV
        </a>
      </div>
    `;
    return section;
  }

  function buildImpact(data) {
    const metrics = data.impact_metrics || [];
    if (metrics.length === 0) return null;
    const section = el("section", "section wrap reveal");
    section.id = "impact";
    section.innerHTML = `
      <div class="eyebrow">By the numbers</div>
      <h2 class="section-title sr-only">Key Impact Metrics</h2>
    `;

    const ledger = el("div", "ledger");
    metrics.forEach((m) => {
      ledger.appendChild(
        el(
          "div",
          "ledger__item",
          `<div class="ledger__number">${escapeHtml(m.number)}</div>
           <div class="ledger__label">${escapeHtml(m.label)}</div>`
        )
      );
    });
    section.appendChild(ledger);
    return section;
  }

  function buildSkills(data) {
    const skills = data.skills || {};
    const populatedSkills = Object.values(skills).some((items) => Array.isArray(items) && items.length > 0);
    if (!populatedSkills) return null;
    const section = el("section", "section wrap reveal");
    section.id = "skills";
    section.innerHTML =
      `<div class="eyebrow">Toolkit</div>` +
      `<h2 class="section-title">Skills &amp; areas of focus</h2>`;

    const columns = el("div", "columns");
    Object.keys(skills).forEach((key) => {
      const col = el("div", "column");
      col.innerHTML = `<div class="column__head">${escapeHtml(humanizeKey(key))}</div>`;
      const list = el("ul", "column__list");
      (skills[key] || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      col.appendChild(list);
      columns.appendChild(col);
    });
    section.appendChild(columns);
    return section;
  }

  function buildProjects(data) {
    const allProjects = data.projects || data.featured_projects || [];
    const featured = allProjects.filter((p) => p.featured !== false);
    if (featured.length === 0) return null;

    const section = el("section", "section wrap reveal");
    section.id = "projects";
    section.innerHTML =
      `<div class="eyebrow">Featured work</div>` +
      `<h2 class="section-title">Selected Projects</h2>`;

    const grid = el("div", "projects");
    featured.forEach((p) => {
      const card = el("article", "project-card");
      const tags = p.tags || [];
      
      let linksHTML = '';
      if (p.github) {
        linksHTML += `
          <a class="project-card__link project-card__link--primary" href="${escapeHtml(p.github)}" target="_blank" rel="noopener noreferrer">
            View on GitHub <span aria-hidden="true">&#8599;</span>
          </a>
        `;
      }
      if (p.demo || p.streamlit) {
        const isSecond = Boolean(p.github);
        const linkClass = isSecond ? "project-card__link project-card__link--secondary" : "project-card__link project-card__link--primary";
        linksHTML += `
          <a class="${linkClass}" href="${escapeHtml(p.demo || p.streamlit)}" target="_blank" rel="noopener noreferrer">
            Live Demo <span aria-hidden="true">&#8599;</span>
          </a>
        `;
      }

      card.innerHTML = `
        <div class="project-card__tags">
          ${p.category ? `<span class="badge badge--accent">${escapeHtml(p.category)}</span>` : ""}
          ${tags.map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join("")}
        </div>
        <h3 class="project-card__title">${escapeHtml(p.title || "")}</h3>
        <p class="project-card__desc">${escapeHtml(p.description || "")}</p>
        <div style="display: flex; flex-direction: column; width: 100%;">
          ${linksHTML}
        </div>
      `;
      grid.appendChild(card);
    });
    section.appendChild(grid);

    // Call to action button to full projects archive
    const ctaWrap = el("div", "");
    ctaWrap.style.marginTop = "36px";
    ctaWrap.style.textAlign = "center";
    ctaWrap.innerHTML = `
      <a class="cta-link-btn" href="projects.html">
        Explore All Projects &amp; Systems Archive (${allProjects.length}) <span aria-hidden="true">&#8599;</span>
      </a>
    `;
    section.appendChild(ctaWrap);

    return section;
  }

  function buildExperience(data) {
    const experience = data.professional_experience || [];
    if (experience.length === 0) return null;
    const section = el("section", "section wrap reveal");
    section.id = "experience";
    section.innerHTML =
      `<div class="eyebrow">Track record</div>` +
      `<h2 class="section-title">Professional Experience</h2>`;

    const timeline = el("div", "timeline");
    experience.forEach((e) => {
      const item = el("div", "timeline__item");
      const bullets = e.bullets || [];
      item.innerHTML = `
        <div class="timeline__period">${escapeHtml(e.period || "")}</div>
        <div class="timeline__content">
          <div class="timeline__role">${escapeHtml(e.role || "")}</div>
          <div class="timeline__org">${escapeHtml(e.organization || "")}</div>
          ${bullets.length ? `<ul class="timeline__bullets">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
        </div>
      `;
      timeline.appendChild(item);
    });
    section.appendChild(timeline);
    return section;
  }

  function buildOpenSource(data) {
    const items = data.open_source_contributions || [];
    if (items.length === 0) return null;
    const section = el("section", "section wrap reveal");
    section.id = "open_source";
    section.innerHTML =
      `<div class="eyebrow">Ecosystem</div>` +
      `<h2 class="section-title">Open Source Contributions</h2>`;

    const timeline = el("div", "timeline");
    items.forEach((e) => {
      const item = el("div", "timeline__item");
      const bullets = e.bullets || [];
      item.innerHTML = `
        <div class="timeline__period">${escapeHtml(e.period || "")}</div>
        <div class="timeline__content">
          <div class="timeline__role">${escapeHtml(e.role || "")}</div>
          <div class="timeline__org">${escapeHtml(e.organization || "")}</div>
          ${bullets.length ? `<ul class="timeline__bullets">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
        </div>
      `;
      timeline.appendChild(item);
    });
    section.appendChild(timeline);
    return section;
  }

  function buildEducation(data) {
    const education = data.education || {};
    const degrees = education.degrees || [];
    if (degrees.length === 0) return null;

    const section = el("section", "section wrap reveal");
    section.id = "education";
    section.innerHTML =
      `<div class="eyebrow">Academia</div>` +
      `<h2 class="section-title">Academic Background</h2>`;

    const group = el("div", "education__group");
    degrees.forEach((d) => {
      const item = el("div", "degree-item");
      item.innerHTML = `
        <div class="degree-item__period">${escapeHtml(d.period || "")}</div>
        <div>
          <div class="degree-item__degree">${escapeHtml(d.degree || "")}</div>
          <div class="degree-item__institution">${escapeHtml(d.institution || "")}</div>
          ${d.details ? `<p class="degree-item__details">${escapeHtml(d.details)}</p>` : ""}
        </div>
      `;
      group.appendChild(item);
    });
    section.appendChild(group);

    return section;
  }

  function buildExtracurricular(data) {
    const activities = data.extracurricular_activities || [];
    if (activities.length === 0) return null;

    const section = el("section", "section wrap reveal");
    section.id = "extracurricular";
    section.innerHTML =
      `<div class="eyebrow">Campus &amp; Community</div>` +
      `<h2 class="section-title">Extracurricular Activities</h2>`;

    const timeline = el("div", "timeline");
    activities.forEach((e) => {
      const item = el("div", "timeline__item");
      const bullets = e.bullets || [];
      item.innerHTML = `
        <div class="timeline__period">${escapeHtml(e.period || "")}</div>
        <div class="timeline__content">
          <div class="timeline__role">${escapeHtml(e.role || "")}</div>
          <div class="timeline__org">${escapeHtml(e.organization || "")}</div>
          ${bullets.length ? `<ul class="timeline__bullets">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
        </div>
      `;
      timeline.appendChild(item);
    });
    section.appendChild(timeline);
    return section;
  }

  function buildAchievements(data) {
    const items = data.achievements || [];
    if (items.length === 0) return null;

    const section = el("section", "section wrap reveal");
    section.id = "achievements";
    section.innerHTML =
      `<div class="eyebrow">Recognition</div>` +
      `<h2 class="section-title">Achievements</h2>`;

    const list = el("ul", "timeline__bullets");
    items.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });
    section.appendChild(list);
    return section;
  }

  function buildCourses(data) {
    const courses = data.courses || [];
    if (courses.length === 0) return null;

    const section = el("section", "section wrap reveal");
    section.id = "courses";
    section.innerHTML =
      `<div class="eyebrow">Coursework</div>` +
      `<h2 class="section-title">Courses</h2>`;

    const list = el("div", "tech-stack");
    courses.forEach((course) => {
      const label = `${course.name || ""}${course.status === "ongoing" ? " †" : ""}${course.grade ? ` (${course.grade})` : ""}`;
      list.appendChild(el("span", "badge", escapeHtml(label)));
    });
    section.appendChild(list);
    if (courses.some((course) => course.status === "ongoing")) {
      section.appendChild(el("div", "courses__legend", "† Ongoing"));
    }
    return section;
  }

  function buildCertifications(data) {
    const certifications = data.certifications || [];
    if (certifications.length === 0) return null;

    const section = el("section", "section wrap reveal");
    section.id = "certifications";
    section.innerHTML =
      `<div class="eyebrow">Credentials</div>` +
      `<h2 class="section-title">Certifications</h2>`;
    certifications.forEach((c) => {
      section.appendChild(
        el(
          "div",
          "cert-item",
          `<span class="cert-item__name">${escapeHtml(c.name || "")}</span>
           <span class="cert-item__meta">${escapeHtml([c.issuer, c.year].filter(Boolean).join(" — "))}</span>`
        )
      );
    });
    return section;
  }

  function buildResearch(data) {
    const interests = data.research_interests || {};
    if (!interests.category && !interests.title && !interests.description) return null;
    const section = el("section", "section wrap reveal");
    section.id = "research";
    section.innerHTML = `
      <div class="colophon">
        <div class="eyebrow" style="justify-content:center;">${escapeHtml(interests.category || "")}</div>
        <h2 class="colophon__title">${escapeHtml(interests.title || "")}</h2>
        <p class="colophon__desc">${escapeHtml(interests.description || "")}</p>
        <div style="margin-top: 24px; text-align: center;">
          <a class="cta-link-btn" href="${escapeHtml(interests.link || "research.html")}">
            Read Research Statement &amp; Notes <span aria-hidden="true">&#8599;</span>
          </a>
        </div>
      </div>
    `;
    return section;
  }

  function buildContact(data) {
    const contact = data.contact || {};
    const socials = contact.socials || [];
    const devProfiles = contact.developer_profiles || [];

    const section = el("section", "section wrap reveal");
    section.id = "contact";
    
    let emailHTML = "";
    if (contact.email) {
      emailHTML = `
        <div class="contact__email-row">
          <a class="contact__email" href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>
          <button type="button" class="copy-email-btn" id="copy-email-btn" data-email="${escapeHtml(contact.email)}" aria-label="Copy email address">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span id="copy-email-text" aria-live="polite">Copy</span>
          </button>
        </div>
      `;
    }

    section.innerHTML =
      `<div class="eyebrow">Get in touch</div>` +
      `<h2 class="section-title">Contact</h2>` +
      emailHTML;

    const list = el("ul", "social-list");
    socials.forEach((s) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = s.url || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `<span>${escapeHtml(s.label || "")}</span><span class="arrow" aria-hidden="true">&#8599;</span>`;
      li.appendChild(a);
      list.appendChild(li);
    });
    section.appendChild(list);

    // Extended Developer & Research Footprint
    if (devProfiles.length > 0) {
      const devWrap = el("div", "dev-footprint");
      devWrap.innerHTML = `
        <div class="dev-footprint__title">Developer &amp; Knowledge Footprint</div>
        <div class="dev-footprint__grid">
          ${devProfiles.map((p) => `
            <a class="dev-chip" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">
              <span>${escapeHtml(p.label)}</span>
              <span class="arrow" style="font-size:10px; color:var(--text-secondary);" aria-hidden="true">&#8599;</span>
            </a>
          `).join("")}
        </div>
      `;
      section.appendChild(devWrap);
    }

    return section;
  }

  function buildFooter(data) {
    const site = data.site || {};
    const hero = data.hero || {};
    const footer = el("footer", "site-footer");
    footer.innerHTML = `
      <div class="site-footer__group">
        <span>${escapeHtml(site.version || "")}</span>
        <span>${escapeHtml(site.location || "")}</span>
      </div>
      <div class="site-footer__group">
        <span>Updated ${escapeHtml(todayDateline())}</span>
        <span>&copy; ${new Date().getFullYear()} ${escapeHtml(hero.name || "")}</span>
      </div>
    `;
    return footer;
  }

  /* ---------------------------------------------------------------------
   * Render + reveal-on-scroll
   * ------------------------------------------------------------------- */

  const SECTION_BUILDERS = {
    about: buildAbout,
    impact: buildImpact,
    achievements: buildAchievements,
    skills: buildSkills,
    projects: buildProjects,
    experience: buildExperience,
    open_source: buildOpenSource,
    education: buildEducation,
    extracurricular: buildExtracurricular,
    courses: buildCourses,
    certifications: buildCertifications,
    research: buildResearch,
    contact: buildContact,
  };

  function render(data) {
    const root = document.getElementById("app-root");
    root.innerHTML = "";

    const built = [];
    (data.nav || []).forEach((item) => {
      const build = SECTION_BUILDERS[item.id];
      if (!build) return; // unknown nav id in data.yaml — skip rather than fail
      const element = build(data);
      if (!element) return;
      built.push({ navItem: item, element });
    });

    built.forEach(({ element }) => root.appendChild(element));
    root.appendChild(buildFooter(data));

    const activeNav = built.map((entry) => entry.navItem);
    buildSideRail(activeNav);
    initScrollspy(activeNav);
    initScrollReveal();
    initCopyEmail();
  }

  function initCopyEmail() {
    const btn = document.getElementById("copy-email-btn");
    const textSpan = document.getElementById("copy-email-text");
    if (!btn || !textSpan) return;

    btn.addEventListener("click", () => {
      const email = btn.dataset.email;
      if (!email) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(() => {
          textSpan.textContent = "Copied!";
          btn.style.borderColor = "var(--accent-color)";
          btn.style.color = "var(--accent-color)";
          setTimeout(() => {
            textSpan.textContent = "Copy";
            btn.style.borderColor = "";
            btn.style.color = "";
          }, 2000);
        }).catch(() => {
          fallbackCopyText(email, textSpan, btn);
        });
      } else {
        fallbackCopyText(email, textSpan, btn);
      }
    });
  }

  function fallbackCopyText(text, textSpan, btn) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      textSpan.textContent = "Copied!";
      setTimeout(() => {
        textSpan.textContent = "Copy";
      }, 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
    document.body.removeChild(textArea);
  }

  function initScrollReveal() {
    const targets = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || targets.length === 0) {
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((t) => observer.observe(t));
  }

  function renderError(message) {
    const root = document.getElementById("app-root");
    root.innerHTML = `
      <div class="wrap" style="padding-block:120px; text-align:center; font-family: var(--font-mono);">
        <p style="color: var(--accent-color);">Couldn't load data.yaml</p>
        <p style="color: var(--text-secondary); margin-top:8px; font-size:13px;">${escapeHtml(message)}</p>
      </div>
    `;
  }

  /* ---------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------- */

  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();

    fetch(DATA_URL, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${DATA_URL}`);
        return res.text();
      })
      .then((text) => {
        const data = jsyaml.load(text);
        render(data);
      })
      .catch((err) => {
        console.error(err);
        renderError(err.message);
      });
  });
})();
