// Filtrage des missions par année, sur le DOM statique (progressive enhancement).
// La chip « Tout » n'a pas de data-year ; les autres portent data-year="2025", etc.
// Chaque .mission porte data-years="2025 2024 …" (toutes les années couvertes).
const filterEl = document.querySelector('.year-filter');
const missions = [...document.querySelectorAll('.mission')];
let activeYear = null;

if (filterEl) {
  filterEl.addEventListener('click', e => {
    const btn = e.target.closest('.year-chip');
    if (!btn) return;
    activeYear = btn.dataset.year || null;

    filterEl.querySelectorAll('.year-chip')
      .forEach(b => b.classList.toggle('on', (b.dataset.year || null) === activeYear));

    missions.forEach(m => {
      const years = (m.dataset.years || '').split(' ');
      m.classList.toggle('hidden', !!activeYear && !years.includes(activeYear));
    });
  });
}
