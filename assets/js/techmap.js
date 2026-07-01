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
  let openIndex = null, built = false, catsOpen = false;

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
      pole.addEventListener('click', () => toggle(i));
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
        branch.appendChild(pill);
        return pill;
      }));
    });

    map.appendChild(stage);
    map.classList.add('is-enhanced');

    stage.addEventListener('click', (e) => {
      if (e.target === stage || e.target === svg) close();
    });
    window.addEventListener('resize', layout);
    layout();
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
    if (openIndex != null) placeItems(openIndex);
  }

  // Éventail vers l'extérieur : chaque pill occupe une largeur angulaire = f(largeur réelle),
  // débordement réparti sur des anneaux concentriques → aucune collision tangentielle.
  function placeItems(idx) {
    const list = pills[idx];
    const pole = poles[idx];
    const size = stage.clientWidth;
    const gap = 10;
    const maxArc = (160 * Math.PI) / 180;
    const rings = [size * 0.12, size * 0.18, size * 0.24];

    const groups = rings.map(() => []);
    let ri = 0, acc = 0;
    list.forEach((pill) => {
      let aw = (pill.offsetWidth + gap) / rings[ri];
      if (acc + aw > maxArc && ri < rings.length - 1) {
        ri++; acc = 0; aw = (pill.offsetWidth + gap) / rings[ri];
      }
      groups[ri].push({ pill, aw });
      acc += aw;
    });

    groups.forEach((items, r) => {
      const R = rings[r];
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

  // Niveau 1 : le nœud central affiche / masque toutes les catégories
  function toggleCats() {
    catsOpen = !catsOpen;
    center.setAttribute('aria-expanded', String(catsOpen));
    map.classList.toggle('cats-open', catsOpen);
    if (catsOpen) {
      poles.forEach((p, i) => { p.style.transitionDelay = i * 40 + 'ms'; });   // apparition en cascade
    } else {
      close();                                                                  // referme un pôle ouvert
      poles.forEach((p) => { p.style.transitionDelay = '0ms'; });
    }
  }

  // Niveau 2 : un pôle affiche / masque ses items
  function toggle(idx) {
    if (openIndex === idx) { close(); return; }
    if (openIndex != null) collapse(openIndex);
    openIndex = idx;
    map.classList.add('has-open');
    poles.forEach((p, i) => p.classList.toggle('dim', i !== idx));
    poles[idx].classList.add('active');
    poles[idx].classList.remove('dim');
    poles[idx].setAttribute('aria-expanded', 'true');
    branches[idx].classList.add('show');
    placeItems(idx);
    pills[idx].forEach((pill, j) => {
      pill.style.transitionDelay = j * 40 + 'ms';       // cascade ~40ms
      pill._line.style.transitionDelay = j * 40 + 'ms';
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      pills[idx].forEach((pill) => { pill.classList.add('in'); pill._line.classList.add('in'); });
    }));
  }

  function collapse(idx) {
    poles[idx].classList.remove('active');
    poles[idx].setAttribute('aria-expanded', 'false');
    branches[idx].classList.remove('show');
    pills[idx].forEach((pill) => {
      pill.classList.remove('in');
      pill.style.transitionDelay = '0ms';
      pill._line.classList.remove('in');
      pill._line.style.transitionDelay = '0ms';
    });
  }

  function close() {
    if (openIndex == null) return;
    collapse(openIndex);
    openIndex = null;
    map.classList.remove('has-open');
    poles.forEach((p) => p.classList.remove('dim'));
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  if (mq.matches) build();
  mq.addEventListener('change', (e) => { if (e.matches) build(); });
})();
