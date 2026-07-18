(() => {
  const body = document.body;
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();
  const classes = [];

  if (platform.includes('mac') || ua.includes('macintosh')) classes.push('os-mac');
  else if (platform.includes('win') || ua.includes('windows')) classes.push('os-windows');
  else if (platform.includes('linux') || /x11/.test(platform)) classes.push('os-linux');
  if (/iphone|ipad|ipod|android/.test(ua)) classes.push('os-mobile');
  else classes.push('os-desktop');
  classes.push(window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'theme-dark' : 'theme-light');
  body.classList.add(...classes);

  const updateSizeClass = () => {
    body.classList.toggle('screen-small', window.innerWidth <= 900);
    body.classList.toggle('screen-large', window.innerWidth > 900);
  };
  updateSizeClass();
  window.addEventListener('resize', updateSizeClass, { passive: true });

  // En teléfonos la navegación principal se presenta como un panel lateral.
  // En escritorio se conserva la barra superior ya existente.
  function setupMobileNavigation() {
    if (document.querySelector('.admin-layout') || document.querySelector('.mobile-nav-trigger')) return;
    const header = document.querySelector('.header');
    const nav = header?.querySelector('.nav-links');
    if (!header || !nav || nav.children.length < 2) return;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'btn btn-secondary btn-icon mobile-nav-trigger';
    trigger.setAttribute('aria-label', 'Abrir navegación');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';

    const overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const drawer = document.createElement('aside');
    drawer.className = 'mobile-nav-drawer';
    drawer.setAttribute('aria-label', 'Navegación principal');
    drawer.innerHTML = `
      <div class="mobile-nav-title"><i class="fa-solid fa-boxes-stacked" aria-hidden="true"></i><span>Menú principal</span></div>
      <nav>${nav.innerHTML}</nav>
    `;

    const setOpen = (isOpen) => {
      document.body.classList.toggle('mobile-navigation-open', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
      overlay.setAttribute('aria-hidden', String(!isOpen));
    };

    trigger.addEventListener('click', () => setOpen(!document.body.classList.contains('mobile-navigation-open')));
    overlay.addEventListener('click', () => setOpen(false));
    drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setOpen(false);
    });

    header.querySelector('.header-content')?.appendChild(trigger);
    document.body.append(overlay, drawer);
  }

  setupMobileNavigation();

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const SOUND_PREFERENCE = 'invent_sound_enabled';
  let audioCtx;
  let masterGain;
  let lastSoundAt = 0;
  let lastToast = '';
  let soundEnabled = localStorage.getItem(SOUND_PREFERENCE) !== 'false';

  function getAudioContext() {
    if (!AudioContextClass || !soundEnabled) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 44100 });
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.42; // Volumen bajo para no competir con la tarea principal.
      masterGain.connect(audioCtx.destination);
    }
    return audioCtx;
  }

  function unlockAudio() {
    const ctx = getAudioContext();
    if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
  }

  function tone(frequency, start, duration, volume, type) {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.015);
  }

  window.playAppSound = (kind = 'click') => {
    const ctx = getAudioContext();
    const nowMs = performance.now();
    if (!ctx || ctx.state !== 'running' || (nowMs - lastSoundAt < 55 && kind === 'click')) return;
    lastSoundAt = nowMs;
    const now = ctx.currentTime + 0.008;
    const patterns = {
      click: [[420, 0, 0.035, 0.07, 'sine']],
      navigate: [[480, 0, 0.04, 0.06, 'triangle']],
      select: [[540, 0, 0.035, 0.055, 'sine']],
      confirm: [[440, 0, 0.045, 0.08, 'triangle'], [660, 0.055, 0.06, 0.075, 'triangle']],
      success: [[520, 0, 0.055, 0.08, 'sine'], [660, 0.06, 0.06, 0.08, 'sine'], [820, 0.12, 0.075, 0.075, 'sine']],
      warning: [[390, 0, 0.06, 0.07, 'triangle'], [390, 0.09, 0.06, 0.07, 'triangle']],
      error: [[240, 0, 0.085, 0.07, 'sawtooth'], [175, 0.095, 0.1, 0.06, 'sawtooth']]
    };
    (patterns[kind] || patterns.click).forEach(([freq, offset, duration, volume, type]) => tone(freq, now + offset, duration, volume, type));
  };

  function setupSoundControl() {
    if (!AudioContextClass || document.querySelector('.sound-control')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sound-control';
    const render = () => {
      button.setAttribute('aria-pressed', String(soundEnabled));
      button.setAttribute('aria-label', soundEnabled ? 'Desactivar sonidos de interfaz' : 'Activar sonidos de interfaz');
      button.innerHTML = soundEnabled
        ? '<i class="fa-solid fa-volume-high" aria-hidden="true"></i><span>Sonido</span>'
        : '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i><span>Sin sonido</span>';
    };
    button.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(SOUND_PREFERENCE, String(soundEnabled));
      render();
      if (soundEnabled) {
        unlockAudio();
        window.setTimeout(() => window.playAppSound('select'), 20);
      }
    });
    render();
    document.body.appendChild(button);
  }

  setupSoundControl();

  // El navegador solo permite audio después de una interacción. Se desbloquea al presionar,
  // antes del click que dispara la acción, para eliminar el retraso perceptible.
  document.addEventListener('pointerdown', unlockAudio, { capture: true, passive: true });
  document.addEventListener('keydown', unlockAudio, { capture: true, passive: true });

  document.addEventListener('click', event => {
    const target = event.target.closest('button, .btn, .nav-link, .icon-button, [role="button"]');
    if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true') return;
    if (target.classList.contains('sound-control')) return;
    const sound = target.type === 'submit' || target.dataset.sound === 'confirm'
      ? 'confirm'
      : target.matches('a, .nav-link') ? 'navigate' : target.classList.contains('btn-danger') ? 'warning' : 'click';
    window.playAppSound(sound);
  }, { passive: true });

  document.addEventListener('change', event => {
    if (event.target.matches('select, input[type="checkbox"], input[type="radio"]')) window.playAppSound('select');
  }, { passive: true });

  const observeToast = () => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    new MutationObserver(() => {
      if (toast.classList.contains('hidden')) return;
      const signature = `${toast.className}:${toast.textContent}`;
      if (signature === lastToast) return;
      lastToast = signature;
      window.playAppSound(toast.classList.contains('error') ? 'error' : toast.classList.contains('warning') ? 'warning' : 'success');
    }).observe(toast, { childList: true, characterData: true, attributes: true, subtree: true });
  };
  observeToast();
})();
