// Filtrage des articles par tag, sur le DOM statique pré-généré (progressive enhancement).
const filterEl = document.querySelector('.tag-filter');
const cards    = [...document.querySelectorAll('.post-card')];
let activeTag  = null;

if (filterEl) {
  filterEl.addEventListener('click', e => {
    const btn = e.target.closest('.tag-chip');
    if (!btn) return;
    const t = btn.dataset.tag;
    activeTag = (activeTag === t) ? null : t;

    filterEl.querySelectorAll('.tag-chip')
      .forEach(b => b.classList.toggle('on', b.dataset.tag === activeTag));

    cards.forEach(c => {
      const tags = (c.dataset.tags || '').split('|');
      c.classList.toggle('hidden', !!activeTag && !tags.includes(activeTag));
    });
  });
}
