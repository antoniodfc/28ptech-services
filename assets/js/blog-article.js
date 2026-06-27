// Page article : lit ?slug=, retrouve les métadonnées dans posts.json,
// charge le Markdown correspondant et le rend via marked.
const params  = new URLSearchParams(location.search);
const slug    = params.get('slug') || '';
const titleEl = document.getElementById('article-title');
const metaEl  = document.getElementById('article-meta');
const tagsEl  = document.getElementById('article-tags');
const bodyEl  = document.getElementById('article-content');

const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'long', year: 'numeric'
});

const escapeHtml = s => s.replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const readingTime = md => {
  const words = md.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min de lecture`;
};

const notFound = msg => {
  titleEl.textContent = 'Article introuvable';
  bodyEl.innerHTML = `<p>${msg} <a href="index.html">Retour au blog →</a></p>`;
};

// Slug attendu : lettres/chiffres/tirets uniquement (évite de charger un chemin arbitraire).
if (!/^[a-z0-9-]+$/.test(slug)) {
  notFound('Aucun article demandé.');
} else {
  fetch('posts/posts.json')
    .then(res => res.json())
    .then(posts => {
      const meta = posts.find(p => p.slug === slug);
      if (!meta) { notFound('Cet article n\'existe pas (ou plus).'); return; }

      // Métadonnées d'en-tête
      document.title = `${meta.title} — Antonio Da Fonseca`;
      titleEl.textContent = meta.title;
      tagsEl.innerHTML = (meta.tags || [])
        .map(t => `<span class="mtag">${escapeHtml(t)}</span>`).join('');

      return fetch(`posts/${slug}.md`).then(res => {
        if (!res.ok) throw new Error('md introuvable');
        return res.text();
      }).then(md => {
        metaEl.innerHTML =
          `<span>${fmtDate(meta.date)}</span><span class="dot"></span><span>${readingTime(md)}</span>`;

        // Sépare le corps de l'article de la section "Sources" (si présente),
        // pour insérer la signature entre les deux.
        const sourcesIdx = md.search(/\n-{3,}\s*\n+#{1,2}\s+Sources/i);
        const mainMd    = sourcesIdx === -1 ? md : md.slice(0, sourcesIdx);
        const sourcesMd = sourcesIdx === -1 ? '' : md.slice(sourcesIdx).replace(/^\s*\n?-{3,}\s*\n+/, '');

        bodyEl.innerHTML = marked.parse(mainMd);
        document.getElementById('article-byline').innerHTML =
          `Écrit par <strong>Antonio Da Fonseca</strong><span class="dot"></span>${fmtDate(meta.date)}`;
        document.getElementById('article-sources').innerHTML = sourcesMd ? marked.parse(sourcesMd) : '';
      });
    })
    .catch(() => notFound('Impossible de charger cet article.'));
}
