#!/usr/bin/env node
// Pré-génère le blog : transforme blog/posts/*.md en pages HTML statiques
// (contenu indexable, URLs propres /blog/<slug>/, OG par article) + sitemap.xml.
// Aucune dépendance npm : marked est vendorisé dans assets/js/vendor.
//
// Usage : node build.js

const fs   = require('fs');
const path = require('path');
const { marked } = require('./assets/js/vendor/marked.min.js');

const ROOT      = __dirname;
const SITE      = 'https://antoniodafonseca.com';
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const BLOG_DIR  = path.join(ROOT, 'blog');
const OG_IMAGE  = `${SITE}/assets/og-image.png`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">`;

const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const fmtDate = iso => new Date(iso + 'T00:00:00')
  .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const readingTime = md =>
  `${Math.max(1, Math.round(md.trim().split(/\s+/).length / 200))} min de lecture`;

// Ouvre les liens externes dans un nouvel onglet.
const externalize = html =>
  html.replace(/<a href="(https?:)/g, '<a target="_blank" rel="noopener" href="$1');

function head({ title, desc, canonical, prefix, ogType = 'website', extra = '' }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="${ogType}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="Antonio Da Fonseca">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${OG_IMAGE}">${extra ? '\n  ' + extra : ''}
  ${FONTS}
  <link rel="stylesheet" href="${prefix}assets/css/base.css">
  <link rel="stylesheet" href="${prefix}assets/css/blog.css">
</head>
<body>`;
}

const nav = prefix => `
<nav>
  <div class="nav-inner">
    <a href="${prefix}index.html" class="nav-logo">Antonio Da Fonseca</a>
    <div class="nav-links">
      <a href="${prefix}vibers.html" class="hide-mobile">Vibe Coders</a>
      <a href="${prefix}freelance.html" class="hide-mobile">Entreprises</a>
      <a href="${prefix}blog/" class="hide-mobile">Blog</a>
      <a href="mailto:antonio.dafonseca.pro@gmail.com" class="nav-cta"><span class="nav-cta-inner"><span class="nav-dot"></span>Prendre contact</span></a>
    </div>
  </div>
</nav>`;

const footer = prefix => `
<footer>
  <div class="footer-inner">
    <a href="${prefix}index.html" class="footer-logo"><span class="logo-top">28<span class="p">C</span></span><span class="logo-bot">tech</span></a>
    <nav class="footer-nav">
      <a href="${prefix}index.html">Accueil</a>
      <a href="${prefix}vibers.html">Vibe Coders</a>
      <a href="${prefix}freelance.html">Missions</a>
      <a href="${prefix}blog/">Blog</a>
    </nav>
    <div class="footer-links">
      <a href="mailto:antonio.dafonseca.pro@gmail.com">Email</a>
      <a href="https://github.com/antoniodfc" target="_blank" rel="noopener">GitHub</a>
      <a href="https://www.linkedin.com/in/antonio-da-fonseca-pro/" target="_blank" rel="noopener">LinkedIn</a>
    </div>
    <span class="footer-copy">© 2026 Antonio Da Fonseca</span>
  </div>
</footer>
</body>
</html>`;

function renderArticle(post) {
  const md = fs.readFileSync(path.join(POSTS_DIR, `${post.slug}.md`), 'utf8');

  const sourcesIdx = md.search(/\n-{3,}\s*\n+#{1,2}\s+Sources/i);
  const mainMd    = sourcesIdx === -1 ? md : md.slice(0, sourcesIdx);
  const sourcesMd = sourcesIdx === -1 ? '' : md.slice(sourcesIdx).replace(/^\s*\n?-{3,}\s*\n+/, '');

  const mainHtml    = externalize(marked(mainMd));
  const sourcesHtml = sourcesMd ? externalize(marked(sourcesMd)) : '';
  const canonical   = `${SITE}/blog/${post.slug}/`;
  const prefix      = '../../';

  const jsonld = `<script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || '',
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Person', name: 'Antonio Da Fonseca', url: `${SITE}/` },
    image: OG_IMAGE,
    mainEntityOfPage: canonical,
    keywords: (post.tags || []).join(', ')
  })}
  </script>`;

  const tags = (post.tags || []).map(t => `<span class="mtag">${esc(t)}</span>`).join('');

  // FAQ : contenu riche en mots-clés + balisage FAQPage (résultats enrichis Google)
  const faq = post.faq || [];
  const faqHtml = faq.length ? `
    <section class="article-faq">
      <h2>Questions fréquentes</h2>
      ${faq.map(i => `<div class="faq-item"><h3>${esc(i.q)}</h3><p>${esc(i.a)}</p></div>`).join('\n      ')}
    </section>` : '';
  const faqExtra = faq.length ? `\n  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(i => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } }))
  })}
  </script>` : '';

  // Maillage interne : les autres articles
  const related = posts.filter(p => p.slug !== post.slug).slice(0, 2);
  const relatedHtml = related.length ? `
  <aside class="article-related">
    <h2>À lire aussi</h2>
    <div class="related-list">
      ${related.map(r => `<a class="related-card" href="../${esc(r.slug)}/"><span class="related-title">${esc(r.title)}</span><span class="related-date">${fmtDate(r.date)}</span></a>`).join('\n      ')}
    </div>
  </aside>` : '';

  return head({
    title: `${post.title} — Antonio Da Fonseca`,
    desc: post.excerpt || '',
    canonical, prefix, ogType: 'article', extra: jsonld + faqExtra
  }) + nav(prefix) + `
<main>
  <article>
    <header class="article-head">
      <a href="${prefix}blog/" class="article-back">← Tous les articles</a>
      <div class="article-meta"><span>${fmtDate(post.date)}</span><span class="dot"></span><span>${readingTime(md)}</span></div>
      <h1>${esc(post.title)}</h1>
      ${tags ? `<div class="article-tags">${tags}</div>` : ''}
    </header>

    <div class="prose">${mainHtml}</div>
${faqHtml}
    <footer class="article-byline">Écrit par <strong>Antonio Da Fonseca</strong><span class="dot"></span>${fmtDate(post.date)}</footer>
    ${sourcesHtml ? `\n    <div class="prose">${sourcesHtml}</div>` : ''}
  </article>
${relatedHtml}
</main>
` + footer(prefix);
}

function renderIndex(posts) {
  const counts = {};
  posts.forEach(p => (p.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
  const filterBtns = Object.keys(counts).sort((a, b) => a.localeCompare(b)).map(t =>
    `<button type="button" class="tag-chip" data-tag="${esc(t)}">${esc(t)} <span class="count">${counts[t]}</span></button>`
  ).join('\n      ');

  const cards = posts.map(p => {
    const tags = (p.tags || []).map(t => `<span class="post-tag">${esc(t)}</span>`).join('');
    return `<a class="post-card" data-tags="${esc((p.tags || []).join('|'))}" href="${esc(p.slug)}/">
        <h2>${esc(p.title)}</h2>
        <div class="post-card-date">${fmtDate(p.date)}</div>
        <p>${esc(p.excerpt || '')}</p>
        ${tags ? `<div class="post-card-tags">${tags}</div>` : ''}
      </a>`;
  }).join('\n      ');

  const prefix = '../';
  return head({
    title: 'Blog — Antonio Da Fonseca',
    desc: "Blog d'Antonio Da Fonseca — illettrisme numérique, accès à l'IA, littératie et fracture des compétences.",
    canonical: `${SITE}/blog/`, prefix
  }) + nav(prefix) + `
<main>
  <section class="blog-hero">
    <h1>Blog</h1>
    <p>Tous les articles, du plus récent au plus ancien.</p>
  </section>

  <div class="tag-filter">
      ${filterBtns}
  </div>

  <div class="post-grid">
      ${cards}
  </div>
</main>

<script src="${prefix}assets/js/blog-filter.js"></script>
` + footer(prefix);
}

function sitemap(posts) {
  const urls = [
    `${SITE}/`,
    `${SITE}/freelance.html`,
    `${SITE}/vibers.html`,
    `${SITE}/en/`,
    `${SITE}/en/freelance.html`,
    `${SITE}/en/vibers.html`,
    `${SITE}/pt/`,
    `${SITE}/pt/freelance.html`,
    `${SITE}/pt/vibers.html`,
    `${SITE}/blog/`,
    ...posts.map(p => `${SITE}/blog/${p.slug}/`)
  ];
  const lastmod = {};
  posts.forEach(p => { lastmod[`${SITE}/blog/${p.slug}/`] = p.date; });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u}</loc>${lastmod[u] ? `<lastmod>${lastmod[u]}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
}

// --- Exécution ---
const posts = JSON.parse(fs.readFileSync(path.join(POSTS_DIR, 'posts.json'), 'utf8'))
  .sort((a, b) => b.date.localeCompare(a.date));

let count = 0;
for (const post of posts) {
  const dir = path.join(BLOG_DIR, post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), renderArticle(post, posts));
  count++;
}

fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), renderIndex(posts));
const sm = sitemap(posts);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm);

console.log(`✓ ${count} article(s) généré(s) dans blog/<slug>/`);
console.log(`✓ blog/index.html`);
console.log(`✓ sitemap.xml (${(sm.match(/<loc>/g) || []).length} URLs)`);
