document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => toggleChip(chip));
  chip.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleChip(chip);
    }
  });
});

function toggleChip(el) {
  el.classList.toggle('selected');
  const selected = [...document.querySelectorAll('.chip.selected')]
    .map(c => c.textContent.trim()).join(', ');
  document.getElementById('besoins').value = selected;
}

const submitBtn    = document.getElementById('submit-btn');
const submitLabel  = submitBtn.textContent;                       // libellé d'origine (localisé dans le HTML)
const loadingLabel = submitBtn.dataset.loading || 'Envoi en cours…';
submitBtn.addEventListener('click', handleSubmit);

async function handleSubmit() {
  const nameEl     = document.getElementById('name');
  const emailEl    = document.getElementById('email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let valid = true;

  if (!nameEl.value.trim()) {
    nameEl.classList.add('error');
    document.getElementById('name-err').style.display = 'block';
    valid = false;
  } else {
    nameEl.classList.remove('error');
    document.getElementById('name-err').style.display = 'none';
  }

  if (!emailEl.value.trim() || !emailRegex.test(emailEl.value)) {
    emailEl.classList.add('error');
    document.getElementById('email-err').style.display = 'block';
    valid = false;
  } else {
    emailEl.classList.remove('error');
    document.getElementById('email-err').style.display = 'none';
  }

  if (!valid) return;

  const btn = submitBtn;
  btn.disabled   = true;
  btn.textContent = loadingLabel;

  try {
    const res = await fetch('https://formspree.io/f/mpqnlgqk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name:    nameEl.value.trim(),
        email:   emailEl.value.trim(),
        besoins: document.getElementById('besoins').value || 'Non précisé',
        projet:  document.getElementById('stack').value.trim()
      })
    });

    if (res.ok) {
      document.getElementById('contact-form').style.display = 'none';
      document.getElementById('success').style.display      = 'block';
    } else {
      throw new Error('Formspree error');
    }
  } catch {
    btn.disabled    = false;
    btn.textContent = submitLabel;
    document.getElementById('form-error').style.display = 'block';
  }
}
