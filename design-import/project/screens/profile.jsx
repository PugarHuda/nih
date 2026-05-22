/* eslint-disable */
// screens/profile.jsx — public creator profile

const Profile = ({ go }) => {
  const p = PERSONAS.bob;
  const [showOg, setShowOg] = React.useState(false);

  return (
    <div className="screen slide">
      <div className="crumb">
        <span>nih</span><span className="sep">/</span><span>c</span><span className="sep">/</span><span>twitter</span><span className="sep">/</span><span className="active">@bobbuilds</span>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="row" style={{ gap: 14 }}>
          <button className="btn ghost sm" onClick={() => go('landing')}>← home</button>
          <span className="muted mono" style={{ fontSize: 12 }}>nih.app/c/twitter/bobbuilds</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn sm" onClick={() => setShowOg(s => !s)}><Icon name="copy" size={12} /> {showOg ? 'Hide' : 'See'} OG card</button>
          <button className="btn sm"><Icon name="copy" size={12} /> Copy link</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 28 }}>
        {/* Left — identity */}
        <div className="card" style={{ padding: 32, position: 'relative', overflow: 'visible' }}>
          <div style={{ position: 'relative' }}>
            <Avatar persona="bob" size="xl" />
            <span className="stamp" style={{
              position: 'absolute', top: -10, right: 6, width: 56, height: 56, fontSize: 12,
            }}>nih!</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 48, lineHeight: 1.05, margin: '20px 0 4px' }}>Bob Marquez</h1>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <span className="mono">@bobbuilds</span>
            <Tag tone="good"><Icon name="check" size={10}/> verified</Tag>
          </div>
          <p className="lede" style={{ marginTop: 14 }}>{p.bio} Tips keep the lights on.</p>

          {/* linked handles */}
          <div className="div" />
          <span className="kicker">also tippable at</span>
          <div className="col" style={{ gap: 8, marginTop: 10 }}>
            {p.handles.map(h => (
              <div key={h.platform} className="row" style={{ gap: 10, padding: '10px 12px', background: 'var(--bg-2)', border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)' }}>
                <PGlyph p={h.platform} size={22} />
                <span className="grow"><b>@{h.username}</b> <span className="muted mono" style={{ fontSize: 11 }}>· {PLATFORM_LABELS[h.platform]}</span></span>
                <Tag>Tier {h.tier}</Tag>
              </div>
            ))}
          </div>

          <div className="div" />

          {/* big tip CTA */}
          <span className="kicker">leave a tip</span>
          <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {[1, 5, 10, 25, 'custom'].map(v => (
              <button key={v} className="btn lg" style={{
                background: v === 5 ? 'var(--accent)' : 'var(--paper)',
                color: v === 5 ? 'var(--accent-ink)' : 'inherit',
                fontFamily: 'var(--font-display)', fontSize: 22, padding: '14px 22px',
              }} onClick={() => go('tip')}>
                {v === 'custom' ? '…' : v}
              </button>
            ))}
          </div>
          <p className="muted mono" style={{ fontSize: 11, marginTop: 10 }}>MUSD · backed 1:1 by Bitcoin · lands in 3 seconds</p>
        </div>

        {/* Right — stats & feed */}
        <div className="col" style={{ gap: 18 }}>
          {/* Stats row */}
          <div className="card" style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'stretch' }}>
              <BigStat label="Lifetime received"  value="522"   suffix="MUSD" />
              <BigStat label="Tips this month"   value="63"    suffix="MUSD" sub="+18% vs last" />
              <BigStat label="Tippers"           value="58"    suffix="people" />
            </div>
          </div>

          {/* Activity heatmap-ish */}
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="kicker">activity · last 28 days</span>
              <span className="mono muted" style={{ fontSize: 11 }}>each dot = a tip</span>
            </div>
            <Heatmap />
          </div>

          {/* Recent receipts */}
          <div className="card">
            <span className="kicker">latest receipts</span>
            <div className="col" style={{ gap: 0, marginTop: 10 }}>
              {[
                { who: 'alice', amt: 5,  note: 'thank you for the thread', when: 'just now' },
                { who: 'sam',   amt: 1,  note: 'good post',                when: '24m' },
                { who: 'nat',   amt: 3,  note: '☕',                        when: '1h' },
                { who: 'dee',   amt: 10, note: 'consistently great writing', when: '3h' },
                { who: 'mira',  amt: 25, note: 'sponsoring the next post', when: '6h' },
              ].map((r, i) => (
                <div key={i} className="row" style={{ padding: '12px 0', borderTop: i ? 'var(--border-w) dashed var(--line-2)' : 'none', gap: 12 }}>
                  <Avatar size="sm" label={r.who.slice(0,2)} persona={['alice','bob','carol'][i%3]} />
                  <div className="grow">
                    <b>{r.who}</b>
                    <div className="muted" style={{ fontSize: 12 }}>"{r.note}"</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <b className="tabular" style={{ color: 'var(--good)' }}>+<Amount value={r.amt} /></b>
                    <div className="muted mono" style={{ fontSize: 11 }}>{r.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OG card preview */}
      {showOg && (
        <div className="card" style={{ marginTop: 24, padding: 24 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="kicker">og share card · 1200 × 630</span>
            <button className="btn sm ghost" onClick={() => setShowOg(false)}><Icon name="close" size={12} /></button>
          </div>
          <OGCard />
          <p className="muted mono" style={{ fontSize: 11, marginTop: 10 }}>This image renders dynamically when you paste nih.app/c/twitter/bobbuilds anywhere.</p>
        </div>
      )}
    </div>
  );
};

const BigStat = ({ label, value, suffix, sub }) => (
  <div>
    <div className="kicker" style={{ color: 'rgba(255,255,255,.55)' }}>{label}</div>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 52, lineHeight: 1, marginTop: 6 }} className="tabular">{value}</div>
    <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-mono)' }}>{suffix} {sub && `· ${sub}`}</div>
  </div>
);

const Heatmap = () => {
  const days = 28;
  const cells = Array.from({ length: days * 4 }, () => Math.random());
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${days}, 1fr)`, gap: 3, alignItems: 'stretch' }}>
      {cells.map((v, i) => {
        const op = v > 0.85 ? 1 : v > 0.6 ? 0.7 : v > 0.35 ? 0.4 : v > 0.15 ? 0.2 : 0.06;
        return <div key={i} style={{
          paddingTop: '100%',
          background: 'var(--accent)',
          opacity: op,
          border: 'var(--border-w) var(--border-style) var(--line-2)',
          borderRadius: 'var(--radius-sm)',
        }} />;
      })}
    </div>
  );
};

const OGCard = () => (
  <div style={{
    width: '100%', aspectRatio: '1200 / 630',
    background: 'var(--ink)', color: 'var(--paper)',
    border: 'var(--border-w) var(--border-style) var(--ink)',
    borderRadius: 'var(--radius)',
    padding: 'min(48px, 5%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: 24, right: 28, opacity: .6, fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)' }}>nih.app/c/twitter/bobbuilds</div>
    <div className="row" style={{ gap: 18, marginTop: 'auto', marginBottom: 'auto' }}>
      <div style={{
        width: 'min(140px, 14%)', aspectRatio: 1, borderRadius: '50%', background: '#6EB5C0', color: '#102A2F',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 'min(54px, 5vw)', fontWeight: 'var(--display-weight)',
      }}>BM</div>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.15em' }}>tip in one click</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 'clamp(36px, 5.5vw, 76px)', lineHeight: 1, margin: '8px 0 0' }}>Bob Marquez</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(14px,1.5vw,20px)', color: 'rgba(255,255,255,.6)' }}>@bobbuilds · 522 MUSD received</div>
      </div>
    </div>
    <div className="row" style={{ marginTop: 'auto', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 'min(40px, 4vw)' }}>nih.</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: .6 }}>backed 1:1 by bitcoin · settled on mezo</span>
    </div>
  </div>
);

window.Profile = Profile;
