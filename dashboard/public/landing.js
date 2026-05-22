/* ============================================================
   NIH — landing.js
   All interactivity for the standalone landing.
   - hover-pause + click-to-zoom on marquee panels
   - parallax drift layer
   - cursor sparkle on click
   - mini tweaks panel (style + palette)
   - localStorage sync with the app
   - live tip ticker
   - story comic reveal-on-scroll
   ============================================================ */

(() => {
  const LS = {
    style:   'nih.style',
    mode:    'nih.mode',
    palette: 'nih.palette',
    accent:  'nih.accent',
  };

  const STYLES = [
    { id: 'paper',       label: 'Paper' },
    { id: 'pos',         label: 'Pos 📮' },
    { id: 'tabungan',    label: 'Tabungan 📓' },
    { id: 'kebun',       label: 'Kebun 🌿' },
    { id: 'warung',      label: 'Warung 🍜' },
    { id: 'komik',       label: 'Komik 💥' },
    { id: 'koran',       label: 'Koran 📰' },
    { id: 'brutal',      label: 'Brutal' },
    { id: 'pixel',       label: 'Pixel' },
    { id: 'brutalpixel', label: 'Brutal × Pixel' },
  ];

  const PALETTES = {
    auto:       null,
    bitcoin:   ['#F4EDE0', '#ECE3D0', '#FBF6EB', '#1A1714', '#F7931A', '#2A6F6A'],
    indigo:    ['#F1EEFF', '#E4DFFA', '#FFFFFF', '#1A1740', '#4F46E5', '#0EA5A4'],
    forest:    ['#EBF0E1', '#DCE4CC', '#F6F4E8', '#1F2A1A', '#C46A45', '#4F7841'],
    sunset:    ['#FFE4D6', '#FFD2B8', '#FFF6EE', '#4A2545', '#E03960', '#7A4FB5'],
    monochrome:['#F2F2F2', '#E5E5E5', '#FFFFFF', '#000000', '#FF3D00', '#0066FF'],
    vivid:     ['#0A0E27', '#14182F', '#1E2543', '#F1F5F9', '#FF3D7F', '#B5FF3D'],
    ocean:     ['#E0EAF0', '#CFDFE9', '#F0F6FA', '#0F2540', '#2A8AC6', '#E89B5C'],
    rosé:      ['#FBE7E4', '#F4D2CD', '#FEF8F6', '#3D1E18', '#C84B5E', '#7A4D2C'],
  };

  const STYLE_ACCENT = {
    paper: '#F7931A', pos: '#D9251E', tabungan: '#A8281E', kebun: '#C46A45',
    warung: '#DC2D2D', komik: '#FFD32D', koran: '#A8281E',
    brutal: '#FF3D7F', pixel: '#5CFFA1', brutalpixel: '#FF6B1F',
  };

  /* ──────────────── 1. Apply persisted style ──────────────── */
  function applyStyle() {
    const root = document.documentElement;
    const body = document.body;
    const style = localStorage.getItem(LS.style) || body.getAttribute('data-style') || 'komik';
    const mode  = localStorage.getItem(LS.mode)  || 'light';
    const accent = localStorage.getItem(LS.accent) || STYLE_ACCENT[style] || '#FFD32D';
    body.setAttribute('data-style', style);
    body.setAttribute('data-mode', mode);

    // palette
    const palRaw = localStorage.getItem(LS.palette);
    const VARS = ['--bg', '--bg-2', '--paper', '--ink', '--accent', '--accent-2'];
    try {
      if (palRaw) {
        const pal = JSON.parse(palRaw);
        if (Array.isArray(pal) && pal[0] && pal[0].startsWith('#')) {
          pal.forEach((c, i) => { if (VARS[i]) root.style.setProperty(VARS[i], c); });
          root.style.setProperty('--accent', pal[4]);  // palette accent wins
        } else {
          VARS.forEach(v => root.style.removeProperty(v));
          root.style.setProperty('--accent', accent);
        }
      } else {
        root.style.setProperty('--accent', accent);
      }
    } catch (e) { /* ignore */ }
  }

  function persist(key, val) {
    try {
      localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
    } catch (e) {}
  }

  applyStyle();

  /* ──────────────── 2. Marquee hover-pause + click-to-zoom ──────────────── */
  function wireMarquee() {
    const strips = document.querySelectorAll('.strip');
    strips.forEach(strip => {
      strip.addEventListener('mouseenter', () => strip.style.animationPlayState = 'paused');
      strip.addEventListener('mouseleave', () => strip.style.animationPlayState = 'running');
    });

    // panel meta keyed by data-panel attr (set on the panel)
    const PANEL_INFO = {
      'scroll': {
        title: 'Alice scrolls Twitter.',
        body:  'On any feed — X, YouTube, Substack, Medium, GitHub, Reddit, HN — the Nih button is right there, on every post. No leaving the page. No tab-switching.',
        cta:   'See the extension',
        href:  '/dashboard',
        screen:'extension',
      },
      'spot': {
        title: 'She spots the tip button.',
        body:  'Injected on every post by the browser extension. Recognizable, friendly, never in the way. The "N" pulses softly on hover.',
        cta:   'See the extension',
        href:  '/dashboard',
        screen:'extension',
      },
      'tap': {
        title: 'Tap. Pick an amount.',
        body:  'A small sheet pops up: 1, 5, 10, 25, or custom. AI suggests an amount based on the post + on-chain context. Pay fees in MEZO for 50% off.',
        cta:   'See the tip flow',
        href:  '/dashboard',
        screen:'tip',
      },
      'send': {
        title: 'MUSD flies — 3 seconds.',
        body:  'Backed 1:1 by Bitcoin. Stable, instant, no platform fee. Settled on Mezo matsnet (chainId 31611). Gas paid in BTC.',
        cta:   'See live tips',
        href:  '/dashboard',
        screen:'leaderboard',
      },
      'park': {
        title: 'If they\'re unverified — escrow.',
        body:  'No wallet on file? No problem. NihVault holds the tip on-chain for 180 days, waiting for the recipient to verify their handle. If they don\'t, sender gets refunded.',
        cta:   'See the claim flow',
        href:  '/dashboard',
        screen:'claim',
      },
      'land': {
        title: 'Wallet pings: +5 MUSD.',
        body:  'Verified handle? Tip lands instantly. Bob sees it in his dashboard, with the note, the platform, the sender — all on-chain.',
        cta:   'See the dashboard',
        href:  '/dashboard',
        screen:'dashboard',
      },
      'borrow': {
        title: 'Lock tips, mint credit.',
        body:  'Collect MUSD tips. Lock them. Get 60% as credit at 1% fixed APR. Repay anytime. Liquidation cushion is huge because MUSD is already stable.',
        cta:   'See the credit line',
        href:  '/dashboard',
        screen:'borrow',
      },
      'keep': {
        title: 'Your Bitcoin? Untouched.',
        body:  'You never sold. You never custody-leaked. You stacked tips, borrowed against them, and your BTC is still yours — every satoshi.',
        cta:   'See the leaderboard',
        href:  '/dashboard',
        screen:'leaderboard',
      },
    };

    document.querySelectorAll('.panel').forEach(p => {
      const labelEl = p.querySelector('.label');
      const key = labelEl ? (labelEl.textContent.split('·')[1] || '').trim() : null;
      if (!key || !PANEL_INFO[key]) return;
      p.setAttribute('data-panel', key);
      p.style.cursor = 'pointer';
      p.addEventListener('click', (e) => {
        e.stopPropagation();
        openPanelModal(key, PANEL_INFO[key], p);
      });
    });
  }

  function openPanelModal(key, info, sourceEl) {
    // Close any existing
    document.querySelectorAll('.panel-modal').forEach(m => m.remove());

    const overlay = document.createElement('div');
    overlay.className = 'panel-modal';
    overlay.innerHTML = `
      <div class="pm-card">
        <button class="pm-x" aria-label="Close">✕</button>
        <div class="pm-art">
          ${sourceEl.querySelector('svg').outerHTML}
          <div class="pm-halftone"></div>
        </div>
        <div class="pm-meta">
          <span class="pm-step">step · ${key}</span>
          <h3 class="pm-title">${info.title}</h3>
          <p class="pm-body">${info.body}</p>
          <a class="pm-cta" href="${info.href}?screen=${info.screen}">${info.cta} →</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    const close = () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 200);
    };
    overlay.querySelector('.pm-x').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
    });
  }

  /* ──────────────── 3. Cursor sparkle on click ──────────────── */
  function wireCursor() {
    document.addEventListener('click', (e) => {
      // skip if click hit a button/link inside the chrome (overlap with their states)
      if (e.target.closest('.lp-cta, .lp-nav a, .pm-x, .pm-cta, .twk-mini-toggle')) {
        // still spark
      }
      spark(e.clientX, e.clientY);
    });
  }
  function spark(x, y) {
    const colors = ['#FFD32D', '#FF3D7F', '#5CFFA1', '#F7931A', '#0066FF'];
    const N = 8;
    for (let i = 0; i < N; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      const ang = (Math.PI * 2 * i) / N + Math.random() * 0.5;
      const dist = 30 + Math.random() * 30;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      s.style.setProperty('--dx', dx + 'px');
      s.style.setProperty('--dy', dy + 'px');
      s.style.left = x + 'px';
      s.style.top  = y + 'px';
      s.style.background = colors[i % colors.length];
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 700);
    }
    // big "POW" text every Nth click
    if (Math.random() > 0.7) {
      const pow = document.createElement('span');
      pow.className = 'pow';
      pow.textContent = ['POW!', 'BAM!', 'ZING!', 'NIH!', 'KA-POW!'][Math.floor(Math.random()*5)];
      pow.style.left = x + 'px';
      pow.style.top  = y + 'px';
      pow.style.color = colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(pow);
      setTimeout(() => pow.remove(), 900);
    }
  }

  /* ──────────────── 4. Parallax drift layer ──────────────── */
  function wireDrift() {
    const layer = document.createElement('div');
    layer.className = 'drift-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    const ITEMS = [
      { glyph: '✦',   size: 28 },
      { glyph: '$',   size: 36, badge: true },
      { glyph: '★',   size: 24 },
      { glyph: '✸',   size: 30 },
      { glyph: 'nih!', size: 18, bubble: true },
      { glyph: '+5',  size: 22, badge: true },
      { glyph: '✺',   size: 30 },
      { glyph: '⌁',   size: 26 },
    ];

    for (let i = 0; i < 14; i++) {
      const it = ITEMS[i % ITEMS.length];
      const el = document.createElement('span');
      el.className = it.badge ? 'drift-coin' : it.bubble ? 'drift-bubble' : 'drift-spark';
      el.textContent = it.glyph;
      el.style.fontSize = it.size + 'px';
      el.style.left = (Math.random() * 100) + 'vw';
      el.style.top  = (Math.random() * 100) + 'vh';
      el.style.animationDelay = (-Math.random() * 20) + 's';
      el.style.animationDuration = (16 + Math.random() * 18) + 's';
      layer.appendChild(el);
    }
  }

  /* ──────────────── 5. Mini tweaks panel ──────────────── */
  function wireTweaks() {
    const btn = document.createElement('button');
    btn.className = 'twk-mini-toggle';
    btn.innerHTML = '<span>style</span> <b id="twkCurStyle"></b>';
    btn.setAttribute('aria-label', 'Open style switcher');
    document.body.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'twk-mini';
    panel.innerHTML = `
      <div class="twk-mini-hd">
        <b>Style swap</b>
        <button class="twk-mini-x" aria-label="Close">✕</button>
      </div>
      <div class="twk-mini-section">visual style</div>
      <div class="twk-mini-styles">
        ${STYLES.map(s => `<button class="twk-mini-style" data-style="${s.id}">${s.label}</button>`).join('')}
      </div>
      <div class="twk-mini-section">palette</div>
      <div class="twk-mini-palettes">
        ${Object.entries(PALETTES).map(([k, p]) => `
          <button class="twk-mini-palette" data-palette="${k}" title="${k}">
            ${p ? p.slice(0, 5).map(c => `<i style="background:${c}"></i>`).join('') : '<i class="auto">auto</i>'}
          </button>
        `).join('')}
      </div>
      <a class="twk-mini-cta" href="/dashboard">Open the app with this style →</a>
    `;
    document.body.appendChild(panel);

    const sync = () => {
      const cur = localStorage.getItem(LS.style) || document.body.getAttribute('data-style');
      document.getElementById('twkCurStyle').textContent = (STYLES.find(s => s.id === cur) || {label: cur}).label;
      panel.querySelectorAll('.twk-mini-style').forEach(b => b.classList.toggle('on', b.dataset.style === cur));
      const palRaw = localStorage.getItem(LS.palette);
      let cp = 'auto';
      try {
        const pal = palRaw ? JSON.parse(palRaw) : null;
        if (Array.isArray(pal) && pal[0] && pal[0].startsWith('#')) {
          cp = Object.entries(PALETTES).find(([k, p]) => p && JSON.stringify(p) === JSON.stringify(pal))?.[0] || 'auto';
        }
      } catch {}
      panel.querySelectorAll('.twk-mini-palette').forEach(b => b.classList.toggle('on', b.dataset.palette === cp));
    };

    btn.addEventListener('click', () => panel.classList.toggle('open'));
    panel.querySelector('.twk-mini-x').addEventListener('click', () => panel.classList.remove('open'));

    panel.querySelectorAll('.twk-mini-style').forEach(b => {
      b.addEventListener('click', () => {
        const s = b.dataset.style;
        persist(LS.style, s);
        persist(LS.accent, STYLE_ACCENT[s]);
        applyStyle();
        sync();
      });
    });
    panel.querySelectorAll('.twk-mini-palette').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.dataset.palette;
        const p = PALETTES[k];
        if (p) persist(LS.palette, p);
        else localStorage.removeItem(LS.palette);
        applyStyle();
        sync();
      });
    });

    sync();
  }

  /* ──────────────── 6. Live tip ticker ──────────────── */
  function wireTicker() {
    const tickerEl = document.querySelector('.lp-ticker');
    if (!tickerEl) return;
    const TIPS = [
      { from: 'mira',  to: '@bobbuilds',  amt: 5,   plat: 'X', when: '2s' },
      { from: 'jun',   to: 'PugarHuda',   amt: 10,  plat: 'GitHub', when: '7s' },
      { from: 'kit',   to: '@caroldraws', amt: 25,  plat: 'X', when: '14s' },
      { from: 'lin',   to: '@hajislamet', amt: 8,   plat: 'X', when: '22s' },
      { from: 'dee',   to: '@miratypes',  amt: 3,   plat: 'X', when: '31s' },
      { from: 'sam',   to: 'PugarHuda',   amt: 50,  plat: 'GitHub', when: '42s' },
      { from: 'nat',   to: '@bobbuilds',  amt: 1,   plat: 'X', when: '58s' },
      { from: 'alice', to: '@caroldraws', amt: 12,  plat: 'X', when: '1m' },
    ];
    const html = TIPS.concat(TIPS).map(t => `
      <span class="lp-tk-item">
        <b>${t.from}</b>
        <span class="lp-tk-arrow">→</span>
        <b>${t.to}</b>
        <span class="lp-tk-plat">·</span>
        <span class="lp-tk-plat">${t.plat}</span>
        <span class="lp-tk-amt">+${t.amt} MUSD</span>
        <span class="lp-tk-when">${t.when}</span>
      </span>
    `).join('');
    tickerEl.innerHTML = `<div class="lp-tk-track">${html}</div>`;
  }

  /* ──────────────── 7. Story comic reveal-on-scroll ──────────────── */
  function wireStoryReveal() {
    const panels = document.querySelectorAll('.story-comic .scp');
    if (!panels.length) return;
    if (!('IntersectionObserver' in window)) {
      panels.forEach(p => p.classList.add('revealed'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    panels.forEach(p => io.observe(p));
    // Safety: if for any reason (broken IO, reduced motion, headless) the panels
    // haven't been revealed after 4s, just reveal them all.
    setTimeout(() => {
      panels.forEach(p => p.classList.add('revealed'));
    }, 4000);
  }

  /* ──────────────── boot ──────────────── */
  function boot() {
    wireMarquee();
    wireCursor();
    wireDrift();
    wireTweaks();
    wireTicker();
    wireStoryReveal();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
