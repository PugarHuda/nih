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
  // Hard gate: this script only owns the marketing landing at "/".
  // The dashboard and app routes share the same document instance
  // during client-side navigation, so re-running landing.js there
  // appends sticky DOM (tweaks toggle, SFX overlays) into the app UI.
  // Bail out early if we're anywhere except the root path.
  if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/') {
    return;
  }

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

  /* (Removed: 5. Mini tweaks panel)
     The Style swap floating panel (style picker + palette switcher) was
     removed at the user's request. The landing is locked to data-style=
     "komik" / data-mode="light"; no runtime style toggling is exposed.
     STYLES / PALETTES / STYLE_ACCENT constants are kept above purely so
     applyStyle() can resolve persisted user prefs from prior visits. */

  /* ──────────────── 6. Live tip ticker ────────────────
     Real tips from the Goldsky subgraph (nih/v4). The endpoint is public
     (NEXT_PUBLIC_GOLDSKY_URL) and CORS-enabled, so this vanilla landing
     script can read it directly. While the fetch is in flight — or if it
     fails / the index is momentarily empty — we render a few example rows
     so the ticker is never blank, but the default state is real on-chain
     data. Built with safe DOM nodes (no innerHTML). */
  const NIH_GOLDSKY = 'https://api.goldsky.com/api/public/project_cmo5pukv64upu01y48tefank9/subgraphs/nih/v4/gn';
  const NIH_HANDLES = {
    '0x876ed16774c41851a77836c6b7c8a73d1c4b8235505742837e791346d9640d75': '@hajislamet',
    '0xe42fad11825c4bb4bc805f9ad53dbde50e93baf1431d09934ba95fe91bf60d91': '@pugarhuda',
    '0xc0a8544bd367c1f9e4bad8de180be3c96f97d663c4168d837e04c5628c64e77e': 'PugarHuda',
    '0x6773975048115fba630eae27d130fa00457470464b1f3b7cbc48b2720e319a51': '@MezoNetwork',
    '0x3c5b565e32b3a7f627794117bdd3a0292f1e4d225316f4b5b2bae3d08a6ca151': '@EncodeClub',
    '0xf4b93ecd1f999495e6fbb57b7ed5e22a86439aa54227208fb72066531464bead': '@BangDropID',
  };
  function nihRel(ts) {
    const d = Math.floor(Date.now() / 1000) - Number(ts);
    if (d < 60) return d + 's';
    if (d < 3600) return Math.floor(d / 60) + 'm';
    if (d < 86400) return Math.floor(d / 3600) + 'h';
    return Math.floor(d / 86400) + 'd';
  }
  function nihRenderTicker(rows) {
    const tickerEl = document.querySelector('.lp-ticker');
    if (!tickerEl || !rows.length) return;
    const track = document.createElement('div');
    track.className = 'lp-tk-track';
    // Duplicate the row set for a seamless marquee loop.
    rows.concat(rows).forEach(t => {
      const item = document.createElement('span');
      item.className = 'lp-tk-item';
      const mk = (tag, cls, text) => {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        el.textContent = text;          // textContent — no HTML injection
        return el;
      };
      item.appendChild(mk('b', '', t.from));
      item.appendChild(mk('span', 'lp-tk-arrow', '→'));
      item.appendChild(mk('b', '', t.to));
      item.appendChild(mk('span', 'lp-tk-plat', '·'));
      item.appendChild(mk('span', 'lp-tk-plat', t.plat));
      item.appendChild(mk('span', 'lp-tk-amt', '+' + t.amt + ' MUSD'));
      item.appendChild(mk('span', 'lp-tk-when', t.when));
      track.appendChild(item);
    });
    tickerEl.replaceChildren(track);
  }
  function wireTicker() {
    const tickerEl = document.querySelector('.lp-ticker');
    if (!tickerEl) return;
    const FALLBACK = [
      { from: '0x4f…a1', to: '@hajislamet', amt: 8,  plat: 'X', when: '—' },
      { from: '0x9c…3d', to: 'PugarHuda',   amt: 10, plat: 'GitHub', when: '—' },
      { from: '0x2b…7e', to: '@BangDropID', amt: 5,  plat: 'X', when: '—' },
    ];
    nihRenderTicker(FALLBACK);
    fetch(NIH_GOLDSKY, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: '{ tips(first: 12, orderBy: timestamp, orderDirection: desc) { amount handleId sender { address } timestamp } }',
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        const tips = j && j.data && j.data.tips;
        if (!tips || !tips.length) return;
        const rows = tips.map(t => {
          const addr = (t.sender && t.sender.address) || '0x0';
          const hid = (t.handleId || '').toLowerCase();
          const label = NIH_HANDLES[hid] || (hid.slice(0, 8) + '…');
          return {
            from: addr.slice(0, 4) + '…' + addr.slice(-2),
            to: label,
            amt: Math.round(Number(t.amount) / 1e18 * 100) / 100,
            plat: label.charAt(0) === '@' ? 'X' : 'GitHub',
            when: nihRel(t.timestamp),
          };
        });
        nihRenderTicker(rows);
      })
      .catch(() => { /* keep fallback rows */ });
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
    // Idempotent — purge any sticky drift / sparkle / pow nodes the
    // previous boot left behind (StyleSwapPurge sweeps these on
    // (app)-route mount). Marquee panel listeners are attached to
    // existing nodes; calling wireMarquee() twice is harmless.
    document.body.querySelectorAll('.drift-layer, .spark, .pow, .panel-modal').forEach(el => el.remove());
    applyStyle();
    wireMarquee();
    wireCursor();
    wireDrift();
    wireTicker();
    wireStoryReveal();
  }
  // Expose boot so a soft-nav back to / from /dashboard can re-run init.
  // The page.tsx mount effect calls `window.nihLandingBoot?.()` directly.
  window.nihLandingBoot = boot;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
