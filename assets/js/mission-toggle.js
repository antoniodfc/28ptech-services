// Missions repliables : masque les réalisations derrière un bouton (progressive enhancement).
// Scopé à la timeline (#missions) — les cartes restent lisibles sans JS.
(function () {
  const lang = (document.documentElement.lang || 'fr').slice(0, 2);
  const labels = {
    fr: { more: (n) => `Voir les ${n} réalisations`, less: () => 'Masquer les réalisations' },
    en: { more: (n) => `View the ${n} achievements`, less: () => 'Hide achievements' },
    pt: { more: (n) => `Ver as ${n} realizações`, less: () => 'Ocultar realizações' },
  };
  const t = labels[lang] || labels.fr;

  document.querySelectorAll('.timeline .mission').forEach((mission, i) => {
    const ul = mission.querySelector('ul');
    if (!ul) return;

    const n = ul.children.length;
    const id = `mission-more-${i}`;
    ul.id = id;
    ul.hidden = true;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mission-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    btn.textContent = t.more(n);
    ul.parentNode.insertBefore(btn, ul);

    btn.addEventListener('click', () => {
      const opening = ul.hidden;
      ul.hidden = !opening;
      btn.classList.toggle('open', opening);
      btn.setAttribute('aria-expanded', String(opening));
      btn.textContent = opening ? t.less() : t.more(n);
    });
  });
})();
