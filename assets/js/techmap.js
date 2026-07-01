// Techmap : carte radiale interactive des technologies (progressive enhancement).
// Sans JS ou sur petit écran, la grille .stack-grid reste affichée telle quelle.
(function () {
  const map = document.querySelector('.techmap');
  if (!map) return;

  const NS = 'http://www.w3.org/2000/svg';
  const mq = window.matchMedia('(min-width: 760px)');

  const data = [...map.querySelectorAll('.stack-row')].map((row) => ({
    label: row.querySelector('.stack-lbl').textContent.trim(),
    items: [...row.querySelectorAll('.pill')].map((p) => p.textContent.trim()),
  }));
  if (!data.length) return;

  const N = data.length;
  let stage, svg, center;
  const spokes = [], poles = [], branches = [], pills = [];
  let openIndex = null, built = false;

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

    center = document.createElement('div');
    center.className = 'techmap-center';
    center.textContent = map.dataset.center || 'Stack';
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
    const poleR = size * 0.30;
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

  // >8 items → deux anneaux concentriques
  function placeItems(idx) {
    const list = pills[idx];
    const n = list.length;
    const size = stage.clientWidth;
    const r1 = size * 0.14, r2 = size * 0.215;
    if (n > 8) {
      const c = Math.ceil(n / 2);
      placeRing(list.slice(0, c), poles[idx], r1);
      placeRing(list.slice(c), poles[idx], r2);
    } else {
      placeRing(list, poles[idx], r1);
    }
  }

  // éventail vers l'extérieur (autour de la direction centre→pôle)
  function placeRing(list, pole, r) {
    const k = list.length;
    if (!k) return;
    const spread = (Math.min(150, 30 * k) * Math.PI) / 180;
    const step = k > 1 ? spread / (k - 1) : 0;
    list.forEach((pill, j) => {
      const ang = pole._a + (j - (k - 1) / 2) * step;
      const ix = pole._x + r * Math.cos(ang);
      const iy = pole._y + r * Math.sin(ang);
      pill.style.left = ix + 'px';
      pill.style.top = iy + 'px';
      pill._line.setAttribute('x1', pole._x); pill._line.setAttribute('y1', pole._y);
      pill._line.setAttribute('x2', ix); pill._line.setAttribute('y2', iy);
    });
  }

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
