document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => chip.classList.toggle('on'));
  chip.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      chip.classList.toggle('on');
    }
  });
});

document.getElementById('submit-btn').addEventListener('click', handleSubmit);

async function handleSubmit() {
  const fname      = document.getElementById('fname');
  const femail     = document.getElementById('femail');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let valid = true;

  if (!fname.value.trim()) {
    fname.classList.add('bad');
    document.getElementById('fname-e').style.display = 'block';
    valid = false;
  } else {
    fname.classList.remove('bad');
    document.getElementById('fname-e').style.display = 'none';
  }

  if (!femail.value.trim() || !emailRegex.test(femail.value)) {
    femail.classList.add('bad');
    document.getElementById('femail-e').style.display = 'block';
    valid = false;
  } else {
    femail.classList.remove('bad');
    document.getElementById('femail-e').style.display = 'none';
  }

  if (!valid) return;

  const btn = document.getElementById('submit-btn');
  btn.disabled  = true;
  btn.textContent = 'Envoi en cours…';

  const chips = [...document.querySelectorAll('.chip.on')]
    .map(c => c.textContent.trim()).join(', ');

  try {
    const res = await fetch('https://formspree.io/f/TODO_FREELANCE_FORM_ID', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        prenom:  fname.value.trim(),
        email:   femail.value.trim(),
        mission: chips || 'Non précisé',
        contexte: document.getElementById('fmsg').value.trim()
      })
    });

    if (res.ok) {
      document.getElementById('cform').style.display    = 'none';
      document.getElementById('csuccess').style.display = 'block';
    } else {
      throw new Error('Formspree error');
    }
  } catch {
    btn.disabled    = false;
    btn.textContent = 'Envoyer →';
    document.getElementById('form-error').style.display = 'block';
  }
}
