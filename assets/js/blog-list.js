// Liste des articles : lit posts/posts.json et génère les cartes.
const listEl = document.getElementById('post-list');

const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'long', year: 'numeric'
});

const escapeHtml = s => s.replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

fetch('posts/posts.json')
  .then(res => { if (!res.ok) throw new Error('posts.json introuvable'); return res.json(); })
  .then(posts => {
    posts.sort((a, b) => b.date.localeCompare(a.date));

    if (!posts.length) {
      listEl.innerHTML = '<div class="blog-empty">Aucun article pour le moment. Bientôt !</div>';
      return;
    }

    listEl.innerHTML = posts.map(p => {
      const tags = (p.tags || [])
        .map(t => `<span class="mtag">${escapeHtml(t)}</span>`).join('');
      return `
        <a class="post-card" href="article.html?slug=${encodeURIComponent(p.slug)}">
          <div class="post-card-meta">
            <span>${fmtDate(p.date)}</span>
            ${p.readingTime ? `<span class="dot"></span><span>${escapeHtml(p.readingTime)}</span>` : ''}
          </div>
          <h2>${escapeHtml(p.title)}</h2>
          <p>${escapeHtml(p.excerpt || '')}</p>
          ${tags ? `<div class="post-card-tags">${tags}</div>` : ''}
        </a>`;
    }).join('');
  })
  .catch(() => {
    listEl.innerHTML = '<div class="blog-error">Impossible de charger les articles.</div>';
  });
