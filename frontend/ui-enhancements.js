(()=> {
  const body = document.body;
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || '').toLowerCase();
  const classes = [];

  if (platform.includes('mac') || ua.includes('macintosh')) {
    classes.push('os-mac');
  } else if (platform.includes('win') || ua.includes('windows')) {
    classes.push('os-windows');
  } else if (platform.includes('linux') || /x11/.test(platform)) {
    classes.push('os-linux');
  }

  if (/iphone|ipad|ipod|android/.test(ua)) {
    classes.push('os-mobile');
  } else if (/tablet/.test(ua)) {
    classes.push('os-tablet');
  } else {
    classes.push('os-desktop');
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    classes.push('theme-dark');
  } else {
    classes.push('theme-light');
  }

  body.classList.add(...classes);

  const updateSizeClass = () => {
    body.classList.toggle('screen-small', window.innerWidth <= 900);
    body.classList.toggle('screen-large', window.innerWidth > 900);
  };

  updateSizeClass();
  window.addEventListener('resize', updateSizeClass);

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx;

  function getAudioContext() {
    if (!AudioContext) return null;
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  }

  function playTone(freq, duration = 0.04, volume = 0.12) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  window.playAppSound = function(type = 'click') {
    if (!AudioContext) return;
    switch (type) {
      case 'success':
        playTone(520, 0.06, 0.14);
        break;
      case 'error':
        playTone(180, 0.08, 0.16);
        break;
      default:
        playTone(320, 0.03, 0.11);
    }
  };

  document.addEventListener('click', event => {
    if (event.target.closest('button, .btn, .nav-link, .icon-button')) {
      window.playAppSound('click');
    }
  }, { passive: true });
})();