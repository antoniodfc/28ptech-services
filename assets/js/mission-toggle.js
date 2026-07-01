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

    // Indicateur visuel (label + chevron) — non interactif : c'est la carte qui est cliquable.
    const hint = document.createElement('span');
    hint.className = 'mission-toggle';
    hint.textContent = t.more(n);
    ul.parentNode.insertBefore(hint, ul);

    // Toute la carte devient le bouton
    mission.classList.add('is-toggle');
    mission.setAttribute('role', 'button');
    mission.tabIndex = 0;
    mission.setAttribute('aria-expanded', 'false');
    mission.setAttribute('aria-controls', id);

    const toggle = () => {
      const opening = ul.hidden;
      ul.hidden = !opening;
      mission.classList.toggle('open', opening);
      hint.classList.toggle('open', opening);
      mission.setAttribute('aria-expanded', String(opening));
      hint.textContent = opening ? t.less() : t.more(n);
    };

    mission.addEventListener('click', toggle);
    mission.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
})();
