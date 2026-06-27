// Liste des articles : grille de cartes + filtres par tag (avec compteurs).
const listEl   = document.getElementById('post-list');
const filterEl = document.getElementById('tag-filter');

let allPosts  = [];
let activeTag = null;

const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'long', year: 'numeric'
});

const escapeHtml = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function card(p) {
  const tags = (p.tags || [])
    .map(t => `<span class="post-tag">${escapeHtml(t)}</span>`).join('');
  return `
    <a class="post-card" href="article.html?slug=${encodeURIComponent(p.slug)}">
      <h2>${escapeHtml(p.title)}</h2>
      <div class="post-card-date">${fmtDate(p.date)}</div>
      <p>${escapeHtml(p.excerpt || '')}</p>
      ${tags ? `<div class="post-card-tags">${tags}</div>` : ''}
    </a>`;
}

function renderList() {
  const posts = activeTag
    ? allPosts.filter(p => (p.tags || []).includes(activeTag))
    : allPosts;

  listEl.innerHTML = posts.length
    ? posts.map(card).join('')
    : '<div class="blog-empty">Aucun article pour ce filtre.</div>';
}

function renderFilters() {
  const counts = {};
  allPosts.forEach(p => (p.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
  const tags = Object.keys(counts).sort((a, b) => a.localeCompare(b));

  filterEl.innerHTML = tags.map(t =>
    `<button type="button" class="tag-chip" data-tag="${escapeHtml(t)}">${escapeHtml(t)} <span class="count">${counts[t]}</span></button>`
  ).join('');

  filterEl.querySelectorAll('.tag-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tag;
      activeTag = (activeTag === t) ? null : t;
      filterEl.querySelectorAll('.tag-chip')
        .forEach(b => b.classList.toggle('on', b.dataset.tag === activeTag));
      renderList();
    });
  });
}

fetch('posts/posts.json')
  .then(res => { if (!res.ok) throw new Error('posts.json introuvable'); return res.json(); })
  .then(posts => {
    allPosts = posts.sort((a, b) => b.date.localeCompare(a.date));
    if (!allPosts.length) {
      listEl.innerHTML = '<div class="blog-empty">Aucun article pour le moment. Bientôt !</div>';
      return;
    }
    renderFilters();
    renderList();
  })
  .catch(() => {
    listEl.innerHTML = '<div class="blog-error">Impossible de charger les articles.</div>';
  });
