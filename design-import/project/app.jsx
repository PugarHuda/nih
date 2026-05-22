/* eslint-disable */
// app.jsx — shell + router + tweaks

const { useState, useEffect, useCallback, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "style": "paper",
  "mode": "light",
  "density": "regular",
  "tone": "friendly",
  "persona": "bob",
  "showMarginalia": true,
  "accent": "#F7931A",
  "palette": ["auto"]
}/*EDITMODE-END*/;

// Curated palettes — each is [bg, bg-2, paper, ink, accent, accent-2].
// Used as the 'palette' tweak. First entry "auto" tells the app to fall back
// to the active style's natural colors.
const PALETTES = {
  bitcoin:   ['#F4EDE0', '#ECE3D0', '#FBF6EB', '#1A1714', '#F7931A', '#2A6F6A'],
  indigo:    ['#F1EEFF', '#E4DFFA', '#FFFFFF', '#1A1740', '#4F46E5', '#0EA5A4'],
  forest:    ['#EBF0E1', '#DCE4CC', '#F6F4E8', '#1F2A1A', '#C46A45', '#4F7841'],
  sunset:    ['#FFE4D6', '#FFD2B8', '#FFF6EE', '#4A2545', '#E03960', '#7A4FB5'],
  monochrome:['#F2F2F2', '#E5E5E5', '#FFFFFF', '#000000', '#FF3D00', '#0066FF'],
  vivid:     ['#0A0E27', '#14182F', '#1E2543', '#F1F5F9', '#FF3D7F', '#B5FF3D'],
  ocean:     ['#E0EAF0', '#CFDFE9', '#F0F6FA', '#0F2540', '#2A8AC6', '#E89B5C'],
  rosé:      ['#FBE7E4', '#F4D2CD', '#FEF8F6', '#3D1E18', '#C84B5E', '#7A4D2C'],
};

const SCREENS = [
  { id: 'landing',     label: 'Landing',     icon: 'home' },
  { id: 'extension',   label: 'Extension',   icon: 'puzzle' },
  { id: 'tip',         label: 'Tip flow',    icon: 'tip' },
  { id: 'claim',       label: 'Claim',       icon: 'claim' },
  { id: 'borrow',      label: 'Borrow',      icon: 'borrow' },
  { id: 'profile',     label: 'Public profile', icon: 'profile' },
  { id: 'dashboard',   label: 'Dashboard',   icon: 'home' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'board' },
];

function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState(() => {
    // pick up ?screen=… from URL so landing modal links can deep-link
    try {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get('screen');
      if (s && ['landing','dashboard','claim','borrow','tip','profile','leaderboard','extension'].includes(s)) return s;
    } catch (e) {}
    return 'landing';
  });
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyBeat, setStoryBeat] = useState(0);
  const [toast, setToast] = useState(null);

  // Sync style on the html element (so body::before backgrounds pick up)
  useEffect(() => {
    document.documentElement.setAttribute('data-style', tw.style);
    document.documentElement.setAttribute('data-mode', tw.mode);
    document.documentElement.setAttribute('data-density', tw.density);
  }, [tw.style, tw.mode, tw.density]);

  // accent override (live) — only apply if user picked one. "auto" lets style default through.
  useEffect(() => {
    if (tw.accent && tw.accent !== 'auto') {
      document.documentElement.style.setProperty('--accent', tw.accent);
    } else {
      document.documentElement.style.removeProperty('--accent');
    }
  }, [tw.accent, tw.style]);

  // Style → natural accent color map (used by both palette + accent auto-update)
  const STYLE_ACCENT = {
    paper: '#F7931A', pos: '#D9251E', tabungan: '#A8281E', kebun: '#C46A45',
    warung: '#DC2D2D', komik: '#FFD32D', koran: '#A8281E',
    brutal: '#FF3D7F', pixel: '#5CFFA1', brutalpixel: '#FF6B1F',
  };

  // Apply palette override (overrides style's natural colors)
  const prevPaletteRef = React.useRef(tw.palette);
  useEffect(() => {
    const root = document.documentElement;
    const VARS = ['--bg', '--bg-2', '--paper', '--ink', '--accent', '--accent-2'];
    const isReal = Array.isArray(tw.palette) && tw.palette.length >= 5 && typeof tw.palette[0] === 'string' && tw.palette[0].startsWith('#');
    if (isReal) {
      tw.palette.forEach((c, i) => { if (VARS[i]) root.style.setProperty(VARS[i], c); });
      // also sync the standalone accent picker so the chosen palette's accent wins
      if (prevPaletteRef.current !== tw.palette && tw.palette[4]) {
        setTweak('accent', tw.palette[4]);
      }
    } else {
      // clear overrides (let style defaults flow through)
      VARS.forEach(v => root.style.removeProperty(v));
      // and reset accent to match the current style
      if (prevPaletteRef.current !== tw.palette) {
        setTweak('accent', STYLE_ACCENT[tw.style] || '#F7931A');
      }
    }
    prevPaletteRef.current = tw.palette;
  }, [tw.palette, tw.style]);

  // When style changes, auto-update accent to match that style's natural palette.
  // Keeps the "tipnya kek nge-pos surat" vibe coherent.
  const prevStyleRef = React.useRef(tw.style);
  useEffect(() => {
    if (prevStyleRef.current !== tw.style) {
      const target = STYLE_ACCENT[tw.style];
      if (target) setTweak('accent', target);
      prevStyleRef.current = tw.style;
    }
  }, [tw.style]);

  // Sync style/palette to localStorage so landing.html picks them up.
  useEffect(() => {
    try {
      localStorage.setItem('nih.style', tw.style);
      localStorage.setItem('nih.mode', tw.mode);
      localStorage.setItem('nih.accent', tw.accent || '#F7931A');
      if (Array.isArray(tw.palette) && tw.palette[0] && tw.palette[0].startsWith('#')) {
        localStorage.setItem('nih.palette', JSON.stringify(tw.palette));
      } else {
        localStorage.removeItem('nih.palette');
      }
    } catch (e) {}
  }, [tw.style, tw.mode, tw.palette, tw.accent]);

  // On first mount, also pull from localStorage (in case user set style on landing first).
  const bootedRef = React.useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    try {
      const s = localStorage.getItem('nih.style');
      if (s) setTweak('style', s);
      const m = localStorage.getItem('nih.mode');
      if (m) setTweak('mode', m);
      const a = localStorage.getItem('nih.accent');
      if (a) setTweak('accent', a);
      const p = localStorage.getItem('nih.palette');
      if (p) {
        try { setTweak('palette', JSON.parse(p)); } catch {}
      }
    } catch (e) {}
  }, []);

  const go = useCallback((s) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Story navigation
  const openStory = () => {
    setStoryBeat(0);
    setStoryOpen(true);
    const b = STORY_BEATS[0];
    if (b.screen) go(b.screen);
  };
  const nextBeat = () => {
    const n = storyBeat + 1;
    if (n >= STORY_BEATS.length) {
      // last beat clicked CTA "Replay"
      setStoryBeat(0);
      go(STORY_BEATS[0].screen || 'landing');
      return;
    }
    setStoryBeat(n);
    const b = STORY_BEATS[n];
    if (b.screen) go(b.screen);
  };
  const prevBeat = () => {
    const p = Math.max(0, storyBeat - 1);
    setStoryBeat(p);
    const b = STORY_BEATS[p];
    if (b.screen) go(b.screen);
  };
  const jumpBeat = (i) => {
    setStoryBeat(i);
    const b = STORY_BEATS[i];
    if (b.screen) go(b.screen);
  };
  const closeStory = () => setStoryOpen(false);

  // keyboard
  useEffect(() => {
    if (!storyOpen) return;
    const h = (e) => {
      if (e.key === 'Escape') closeStory();
      if (e.key === 'ArrowRight') nextBeat();
      if (e.key === 'ArrowLeft') prevBeat();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [storyOpen, storyBeat]);

  // Page render
  const renderScreen = () => {
    switch (screen) {
      case 'landing':     return <Landing go={go} tone={tw.tone} openStory={openStory} />;
      case 'dashboard':   return <Dashboard go={go} persona={tw.persona} />;
      case 'claim':       return <Claim go={go} tone={tw.tone} onClaimed={() => setToast('+47 MUSD claimed')} />;
      case 'borrow':      return <Borrow go={go} tone={tw.tone} />;
      case 'tip':         return <Tip go={go} />;
      case 'profile':     return <Profile go={go} />;
      case 'leaderboard': return <Leaderboard go={go} />;
      case 'extension':   return <Extension go={go} />;
      default: return null;
    }
  };

  return (
    <div className="app">
      {/* Side rail */}
      <aside className="rail">
        <div className="rail-brand">
          <span className="mark">nih.</span>
          <span className="dot" />
          <span className="tag">v0.3</span>
        </div>

        <nav className="nav">
          <div className="nav-section">Story</div>
          <button className="nav-item" onClick={openStory}>
            <span className="ico"><Icon name="play" size={12} /></span>
            Watch the story
          </button>
          <a className="nav-item" href="landing.html" style={{ textDecoration: 'none' }}>
            <span className="ico">↗</span>
            Landing (comic)
          </a>
          <a className="nav-item" href="logo.html" style={{ textDecoration: 'none' }}>
            <span className="ico">◉</span>
            Brand identity
          </a>

          <div className="nav-section">Screens</div>
          {SCREENS.map(s => (
            <button
              key={s.id}
              className={`nav-item ${screen === s.id ? 'active' : ''}`}
              onClick={() => go(s.id)}
            >
              <span className="ico"><Icon name={s.icon} size={13} /></span>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="rail-foot">
          <div className="card" style={{ padding: 10, background: 'var(--paper)', textAlign: 'center' }}>
            <div className="kicker" style={{ justifyContent: 'center', marginBottom: 6 }}>protocol</div>
            <div className="mono" style={{ fontSize: 11 }}>
              <div>chain · matsnet (31611)</div>
              <div>gas · BTC</div>
              <div>currency · MUSD</div>
            </div>
          </div>
          <ConnectChip persona={tw.persona} />
        </div>
      </aside>

      {/* Main */}
      <main>
        {renderScreen()}
      </main>

      {/* Story overlay */}
      {storyOpen && (
        <Story
          beat={storyBeat}
          total={STORY_BEATS.length}
          onNext={nextBeat}
          onPrev={prevBeat}
          onJump={jumpBeat}
          onClose={closeStory}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Visual style" />
        <TweakSelect
          label="Style"
          value={tw.style}
          options={[
            { value: 'paper',       label: 'Paper · default vibe' },
            { value: 'pos',         label: 'Pos · airmail / letters 📮' },
            { value: 'tabungan',    label: 'Tabungan · passbook 📓' },
            { value: 'kebun',       label: 'Kebun · garden journal 🌿' },
            { value: 'warung',      label: 'Warung · shop sign 🍜' },
            { value: 'komik',       label: 'Komik · comic panel 💥' },
            { value: 'koran',       label: 'Koran · broadsheet 📰' },
            { value: 'brutal',      label: 'Neo-brutalist' },
            { value: 'pixel',       label: 'Pixel · CRT terminal' },
            { value: 'brutalpixel', label: 'Brutal × Pixel hybrid' },
          ]}
          onChange={(v) => setTweak('style', v)}
        />
        <TweakRadio
          label="Mode"
          value={tw.mode}
          options={['light', 'dark']}
          onChange={(v) => setTweak('mode', v)}
        />
        <TweakRadio
          label="Density"
          value={tw.density}
          options={['compact', 'regular', 'comfy']}
          onChange={(v) => setTweak('density', v)}
        />
        <TweakColor
          label="Palette"
          value={tw.palette}
          options={[
            PALETTES.bitcoin,
            PALETTES.indigo,
            PALETTES.forest,
            PALETTES.sunset,
            PALETTES.ocean,
            PALETTES.rosé,
            PALETTES.monochrome,
            PALETTES.vivid,
          ]}
          onChange={(v) => setTweak('palette', v)}
        />
        <TweakButton label="Use style's own colors" onClick={() => {
          setTweak('palette', ['auto']);
        }} />

        <TweakColor
          label="Accent (fine-tune)"
          value={tw.accent}
          options={[
            '#F7931A', // bitcoin orange
            '#D9251E', // airmail red
            '#A8281E', // official red
            '#C46A45', // terracotta
            '#DC2D2D', // warung tomato
            '#FFD32D', // komik yellow
            '#FF3D7F', // hot pink
            '#5CFFA1', // crt green
            '#FF6B1F', // brutal-pixel orange
            '#2A6F6A', // deep teal
            '#7A5AE0', // violet
            '#0066FF', // electric blue
          ]}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakButton label="Match accent to style" onClick={() => {
          const map = {
            paper: '#F7931A', pos: '#D9251E', tabungan: '#A8281E', kebun: '#C46A45',
            warung: '#DC2D2D', komik: '#FFD32D', koran: '#A8281E',
            brutal: '#FF3D7F', pixel: '#5CFFA1', brutalpixel: '#FF6B1F',
          };
          setTweak('accent', map[tw.style] || '#F7931A');
        }} />

        <TweakSection label="Copy" />
        <TweakRadio
          label="Tone"
          value={tw.tone}
          options={['friendly', 'technical', 'hype']}
          onChange={(v) => setTweak('tone', v)}
        />

        <TweakSection label="Story" />
        <TweakSelect
          label="Logged in as"
          value={tw.persona}
          options={[
            { value: 'alice', label: 'Alice (the tipper)' },
            { value: 'bob',   label: 'Bob (creator, verified)' },
            { value: 'carol', label: 'Carol (creator, unverified)' },
          ]}
          onChange={(v) => setTweak('persona', v)}
        />
        <TweakButton label="Play story mode" onClick={openStory} />

        <TweakSection label="Jump to screen" />
        <TweakSelect
          label="Screen"
          value={screen}
          options={SCREENS.map(s => ({ value: s.id, label: s.label }))}
          onChange={(v) => go(v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
