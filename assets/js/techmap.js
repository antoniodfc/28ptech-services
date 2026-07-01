// Techmap : carte radiale interactive des technologies (progressive enhancement).
// Sans JS ou sur petit écran, la grille .stack-grid reste affichée telle quelle.
(function () {
  const map = document.querySelector('.techmap');
  if (!map) return;

  const NS = 'http://www.w3.org/2000/svg';
  const mq = window.matchMedia('(min-width: 1000px)');

  const data = [...map.querySelectorAll('.stack-row')].map((row) => ({
    label: row.querySelector('.stack-lbl').textContent.trim(),
    items: [...row.querySelectorAll('.pill')].map((p) => p.textContent.trim()),
  }));
  if (!data.length) return;

  const N = data.length;
  let stage, svg, center;
  const spokes = [], poles = [], branches = [], pills = [];
  let built = false, catsOpen = false;

  function build() {
    if (built) return;
    built = true;

    stage = document.createElement('div');
    stage.className = 'techmap-stage';

    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'techmap-links');
    stage.appendChild(svg);

    data.forEach(() => {
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('class', 'techmap-spoke');
      svg.appendChild(l);
      spokes.push(l);
    });

    center = document.createElement('button');
    center.type = 'button';
    center.className = 'techmap-center';
    center.textContent = map.dataset.center || 'Stack';
    center.setAttribute('aria-expanded', 'false');
    center.addEventListener('click', toggleCats);
    stage.appendChild(center);

    data.forEach((cat, i) => {
      const pole = document.createElement('button');
      pole.type = 'button';
      pole.className = 'techmap-pole';
      pole.textContent = cat.label;
      pole.setAttribute('aria-expanded', 'false');
      pole._pinned = false; pole._hover = false;
      pole.addEventListener('click', () => toggle(i));
      pole.addEventListener('mouseenter', () => hoverOn(i));
      pole.addEventListener('mouseleave', () => hoverOff(i));
      stage.appendChild(pole);
      poles.push(pole);

      const branch = document.createElement('div');
      branch.className = 'techmap-branch';
      stage.appendChild(branch);
      branches.push(branch);

      pills.push(cat.items.map((txt) => {
        const line = document.createElementNS(NS, 'line');
        line.setAttribute('class', 'techmap-link-item');
        svg.appendChild(line);
        const pill = document.createElement('span');
        pill.className = 'techmap-pill';
        pill.textContent = txt;
        pill._line = line;
        pill.addEventListener('mouseenter', () => hoverOn(i));
        pill.addEventListener('mouseleave', () => hoverOff(i));
        branch.appendChild(pill);
        return pill;
      }));
    });

    map.appendChild(stage);
    map.classList.add('is-enhanced');

    stage.addEventListener('click', (e) => {
      if (e.target === stage || e.target === svg) closeAllItems();
    });
    window.addEventListener('resize', layout);
    layout();

    // Recalcule une fois les polices chargées : sinon les pills sont mesurées avec la
    // police de secours (plus étroite) et se chevauchent quand DM Mono les élargit.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

    // Déploiement automatique des catégories à l'arrivée, en laissant jouer
    // l'état "fermé" une frame pour que la cascade d'apparition s'anime.
    requestAnimationFrame(() => requestAnimationFrame(() => { if (!catsOpen) toggleCats(); }));
  }

  function layout() {
    const size = stage.clientWidth;
    stage.style.height = size + 'px';
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    const cx = size / 2, cy = size / 2;
    const poleR = size * 0.32;
    center.style.left = cx + 'px';
    center.style.top = cy + 'px';
    poles.forEach((pole, i) => {
      const a = (-90 + (i * 360) / N) * Math.PI / 180;
      const px = cx + poleR * Math.cos(a);
      const py = cy + poleR * Math.sin(a);
      pole._x = px; pole._y = py; pole._a = a;
      pole.style.left = px + 'px';
      pole.style.top = py + 'px';
      spokes[i].setAttribute('x1', cx); spokes[i].setAttribute('y1', cy);
      spokes[i].setAttribute('x2', px); spokes[i].setAttribute('y2', py);
    });
    poles.forEach((p, i) => { if (p.classList.contains('open')) placeItems(i); });
  }

  // Éventail vers l'extérieur : chaque pill occupe une largeur angulaire = f(largeur réelle),
  // débordement réparti sur des anneaux concentriques → aucune collision tangentielle.
  function placeItems(idx) {
    const list = pills[idx];
    const pole = poles[idx];
    const size = stage.clientWidth;
    const gap = 14;
    const maxArc = (120 * Math.PI) / 180;          // fan étroit : chaque catégorie tient dans son secteur
    const ringBase = size * 0.115;                 // rayon (depuis le pôle) du 1er anneau
    const ringStep = size * 0.052;                 // écart radial entre anneaux (généré à la volée)

    // répartition sur autant d'anneaux que nécessaire, sans collision tangentielle.
    // Largeur angulaire basée sur la CORDE : 2·asin(largeur / 2R) → la distance en ligne
    // droite entre deux pills voisines vaut exactement leur largeur (+ gap). Une pill trop
    // large pour un anneau est repoussée vers un anneau plus grand où l'angle se réduit.
    const groups = [];
    let ri = 0, acc = 0;
    list.forEach((pill) => {
      const w = pill.offsetWidth + gap;
      let R, aw;
      while (true) {
        R = ringBase + ri * ringStep;
        aw = 2 * Math.asin(Math.min(1, w / (2 * R)));
        if (acc === 0) { if (aw <= maxArc || ri >= 24) break; }
        else if (acc + aw <= maxArc) break;
        ri++; acc = 0;                       // anneau suivant : rayon plus grand → angle plus petit
      }
      (groups[ri] || (groups[ri] = [])).push({ pill, aw });
      acc += aw;
    });

    groups.forEach((items, r) => {
      const R = ringBase + r * ringStep;
      const total = items.reduce((s, x) => s + x.aw, 0);
      let ang = pole._a - total / 2;               // arc centré sur la direction centre→pôle
      items.forEach((x) => {
        const mid = ang + x.aw / 2;
        const ix = pole._x + R * Math.cos(mid);
        const iy = pole._y + R * Math.sin(mid);
        x.pill.style.left = ix + 'px';
        x.pill.style.top = iy + 'px';
        x.pill._line.setAttribute('x1', pole._x); x.pill._line.setAttribute('y1', pole._y);
        x.pill._line.setAttribute('x2', ix); x.pill._line.setAttribute('y2', iy);
        ang += x.aw;
      });
    });
  }

  // Niveau 1 : le nœud central affiche / masque toute la carte (catégories + items)
  function toggleCats() {
    catsOpen = !catsOpen;
    center.setAttribute('aria-expanded', String(catsOpen));
    map.classList.toggle('cats-open', catsOpen);
    if (catsOpen) {
      poles.forEach((p, i) => { p.style.transitionDelay = i * 40 + 'ms'; });   // pôles en cascade
    } else {
      poles.forEach((p) => { p.style.transitionDelay = '0ms'; });
      closeAllItems();                                                          // referme tout au repli
    }
  }

  // Niveau 2 : survol = aperçu temporaire, clic = épinglé (reste ouvert)
  function refresh(i) { setCat(i, poles[i]._pinned || poles[i]._hover); }
  function hoverOn(i) { clearTimeout(poles[i]._t); poles[i]._hover = true; refresh(i); }
  function hoverOff(i) {
    clearTimeout(poles[i]._t);                        // délai anti-clignotement pôle → item
    poles[i]._t = setTimeout(() => { poles[i]._hover = false; refresh(i); }, 140);
  }
  function toggle(i) { poles[i]._pinned = !poles[i]._pinned; refresh(i); }

  function setCat(idx, open, baseDelay) {
    const pole = poles[idx];
    if (pole.classList.contains('open') === open && baseDelay == null) return;
    pole.classList.toggle('open', open);
    pole.setAttribute('aria-expanded', String(open));
    const branch = branches[idx];
    if (open) {
      branch.classList.add('show');
      placeItems(idx);
      pills[idx].forEach((pill, j) => {
        const d = (baseDelay || 0) + j * 40 + 'ms';       // cascade ~40ms (+ décalage par catégorie)
        pill.style.transitionDelay = d;
        pill._line.style.transitionDelay = d;
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        pills[idx].forEach((pill) => { pill.classList.add('in'); pill._line.classList.add('in'); });
      }));
    } else {
      branch.classList.remove('show');
      pills[idx].forEach((pill) => {
        pill.classList.remove('in'); pill.style.transitionDelay = '0ms';
        pill._line.classList.remove('in'); pill._line.style.transitionDelay = '0ms';
      });
    }
  }

  function closeAllItems() {
    data.forEach((_, i) => {
      poles[i]._pinned = false; poles[i]._hover = false; clearTimeout(poles[i]._t);
      setCat(i, false);
    });
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllItems(); });

  if (mq.matches) build();
  mq.addEventListener('change', (e) => { if (e.matches) build(); });
})();
