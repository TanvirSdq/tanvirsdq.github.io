# Personal Portfolio Website

A modern, single-source-of-truth portfolio website built with **YAML configuration** and vanilla JavaScript. All content is managed through `data.yaml`, enabling rapid updates, theme customization, and responsive rendering across desktop, tablet, and mobile.

## 🎯 Features

### Core Architecture
- **Data-Driven Design** - Single `data.yaml` file manages all content (projects, skills, education, experience)
- **Vanilla Stack** - Pure HTML, CSS, and JavaScript (no frameworks or build tools required)
- **Theme Support** - Automatic dark/light mode detection with persistent user preference
- **Fully Responsive** - Mobile-first design with adaptive typography and spacing
- **Accessibility First** - Semantic HTML, ARIA labels, keyboard navigation support

### Pages & Sections
- **Homepage (`index.html`)** - Featured projects, impact metrics, skills, education, and contact
- **Projects Archive (`projects.html`)** - Filterable gallery of all projects by category (Automated Bot, WebApp, ML/AI)
- **Research Statement (`research.html`)** - Comprehensive research interests and academic vision
- **Navigation Rail** - Sticky sidebar navigation for quick section access

### Content Management
The `data.yaml` file defines:
- **Navigation sections** (9 configurable sections)
- **Hero content** (name, status, bio, tech stack)
- **Featured projects** (5 projects with categories, tags, GitHub links, and live demos)
- **Skills** (organized by 3 categories)
- **Education & achievements**
- **Professional experience** (ready to enable)
- **Open source contributions** (structure ready)

## 📁 Project Structure

```
.
├── index.html              # Homepage
├── projects.html           # Filterable projects archive
├── research.html           # Research statement/vision
├── data.yaml              # Single source of truth for all content
├── script.js              # Rendering logic & interactivity
├── styles.css             # Complete design system
└── README.md              # This file
```

## 🚀 Getting Started

### No Installation Required
This is a static site with no build step or dependencies. Simply:

1. **Edit `data.yaml`** to update content:
   ```yaml
   projects:
     - title: "My Project"
       category: "WebApp"
       tags: ["Python", "Streamlit"]
       description: "Brief description"
       github: "https://github.com/user/project"
       demo: "https://demo-url.com"
       featured: true
   ```

2. **Save and refresh browser** - Changes appear immediately

3. **Deploy anywhere** - Push to GitHub Pages, Netlify, Vercel, or any static host

### Local Development
```bash
# No build step needed - just open in browser
open index.html

# Or use a local server (Python example)
python3 -m http.server 8000
# Visit http://localhost:8000
```

## 🎨 Customization

### Add/Remove Navigation Sections
In `data.yaml`, uncomment or comment sections in the `nav` array:
```yaml
nav:
  - id: "about"
    label: "About"
  # - id: "achievements"    # Uncomment when ready
  #   label: "Achievements"
```

### Update Projects
Add new projects to the `projects` array:
```yaml
projects:
  - title: "Project Name"
    category: "Automated Bot"  # or "WebApp" or "ML/AI"
    tags: ["Python", "Pywikibot"]
    description: "What this project does"
    github: "https://github.com/..."
    featured: true            # Shows on homepage
```

### Enable Professional Experience
Uncomment the experience section in `nav` and populate `professional_experience` in `data.yaml`

### Styling
Modify CSS variables in `styles.css`:
```css
:root {
  --accent-color: #6366f1;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --bg-color: #ffffff;
}
```

## 📱 Responsive Design

- **Mobile** (≤640px) - Single column, optimized touch targets
- **Tablet** (641-1024px) - Two-column grid for projects
- **Desktop** (≥1025px) - Full layout with sidebar navigation and multi-column grids

## 🌓 Theme Support

- **Auto-detection** - Respects OS dark/light preference on first visit
- **Toggle button** - Users can manually switch themes (persisted in localStorage)
- **CSS variables** - All colors use CSS custom properties for easy theming

## 📄 Content Sections

| Section | Description | Status |
|---------|-------------|--------|
| About | Hero section with intro & tech stack | ✓ Active |
| Impact | Key metrics and achievements | ✓ Active |
| Toolkit | Skills and technical expertise | ✓ Active |
| Projects | Featured work with CTA to archive | ✓ Active |
| Open Source | Contributions and community work | ✓ Ready |
| Education | Degrees and institutions | ✓ Active |
| Activities | Extracurricular and club involvement | ✓ Active |
| Research | Academic inquiries & vision | ✓ Active (dedicated page) |
| Contact | Email and social links | ✓ Active |

## 🔗 Navigation

- **Homepage** - Main portfolio overview with featured projects
- **Projects (`/projects.html`)** - Complete searchable archive with category filters
- **Research (`/research.html`)** - Statement of research interests and academic trajectory

## 🛠️ Technologies

- **HTML5** - Semantic markup, forms, and accessibility
- **CSS3** - Custom properties, flexbox, grid, media queries
- **JavaScript (ES6+)** - DOM manipulation, event listeners, localStorage
- **YAML** - Human-readable data configuration

## 📚 Data Schema

### Project Object
```javascript
{
  title: string,           // Project name
  category: string,        // "WebApp" | "Automated Bot" | "ML/AI"
  tags: string[],         // Technology tags
  description: string,     // Brief description
  github: string,         // GitHub repository URL
  demo?: string,          // Optional live demo URL (Streamlit, etc.)
  featured?: boolean      // Show on homepage (default: false)
}
```

### Navigation Section
```javascript
{
  id: string,    // Unique identifier for section
  label: string  // Display label in nav
}
```

## 🚀 Deployment

### GitHub Pages
```bash
git add .
git commit -m "Update portfolio"
git push origin main
```

### Netlify / Vercel
Connect repository and deploy from `main` branch. No build configuration needed.

### Custom Server
Simply upload all files to your web server.

## 📝 Editing Workflow

1. **Update `data.yaml`** with new content
2. **Test locally** - Open `index.html` in browser
3. **Commit & push** - `git add . && git commit -m "..." && git push`
4. **Site updates automatically** on GitHub Pages / deployment service

## 🎯 Future Enhancements

- [ ] Search functionality for projects
- [ ] Project detail pages
- [ ] Blog integration
- [ ] Analytics tracking
- [ ] Form submission backend

## 📄 License

Personal portfolio - All rights reserved

---
