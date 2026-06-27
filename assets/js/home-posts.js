// Accueil : affiche les 3 derniers articles du blog (cartes réutilisant blog.css).
const homeEl = document.getElementById('home-posts');

const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'long', year: 'numeric'
});

const escapeHtml = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

if (homeEl) {
  fetch('blog/posts/posts.json')
    .then(res => { if (!res.ok) throw new Error('posts.json introuvable'); return res.json(); })
    .then(posts => {
      const latest = posts
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3);

      homeEl.innerHTML = latest.map(p => {
        const tags = (p.tags || [])
          .map(t => `<span class="post-tag">${escapeHtml(t)}</span>`).join('');
        return `
          <a class="post-card" href="blog/${encodeURIComponent(p.slug)}/">
            <h2>${escapeHtml(p.title)}</h2>
            <div class="post-card-date">${fmtDate(p.date)}</div>
            <p>${escapeHtml(p.excerpt || '')}</p>
            ${tags ? `<div class="post-card-tags">${tags}</div>` : ''}
          </a>`;
      }).join('');
    })
    .catch(() => {
      // En cas d'échec, on masque la section pour ne pas laisser un bloc vide.
      const section = homeEl.closest('section');
      if (section) section.style.display = 'none';
    });
}
