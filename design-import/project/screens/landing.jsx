/* eslint-disable */
// screens/landing.jsx

const Landing = ({ go, tone, openStory }) => {
  const t = TONE.hero[tone] || TONE.hero.friendly;
  return (
    <div className="screen slide">
      {/* Hero */}
      <section style={{ paddingTop: 32, paddingBottom: 64, position: 'relative' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 56 }}>
          <span className="kicker">{t.kicker}</span>
          <div className="row" style={{ gap: 10 }}>
            <Tag tone="accent"><Icon name="bolt" size={10} /> matsnet live</Tag>
            <Tag><span className="dot" style={{ background: 'var(--good)' }} /> RPC ok · 31611</Tag>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,.95fr)', gap: 48, alignItems: 'start' }}>
          <div>
            <h1 className="h1">{t.title}</h1>
            <p className="lede" style={{ marginTop: 24 }}>{t.sub}</p>

            <div className="row wrap" style={{ marginTop: 32, gap: 12 }}>
              <button className="btn primary lg" onClick={() => go('extension')}>
                Install the extension <Icon name="arrow" size={14} />
              </button>
              <button className="btn lg" onClick={openStory}>
                <Icon name="play" size={12} /> Watch the 3-minute story
              </button>
            </div>

            <div className="row wrap" style={{ marginTop: 28, gap: 10 }}>
              {['twitter','youtube','substack','medium','github','reddit','hn'].map(p => (
                <span key={p} className="row" style={{ gap: 8, padding: '6px 12px', border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--paper)', fontSize: 12 }}>
                  <PGlyph p={p} size={14} /> {PLATFORM_LABELS[p].replace(' / Twitter','')}
                </span>
              ))}
            </div>
          </div>

          {/* Hero artifact — the "tip ticket" */}
          <div style={{ position: 'relative', minHeight: 480 }}>
            <TipTicket />
            <Note rotate={-6} style={{ position: 'absolute', top: -20, right: 30, fontSize: 22 }}>nih!*</Note>
            <Note rotate={4} style={{ position: 'absolute', bottom: 40, left: -30, fontSize: 14, color: 'var(--ink-3)' }}>* indonesian for “here, take this”</Note>
          </div>
        </div>
      </section>

      {/* Three magic moments */}
      <section style={{ marginTop: 24, marginBottom: 64 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <h2 className="h2">Three moments. One product.</h2>
          <span className="eyebrow">Tip → save → borrow.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          <MomentCard
            num="01" persona="alice"
            title="Tip in one click."
            body="Alice scrolls Twitter. She sees a great thread. The Nih button is right there — she tips Bob 5 MUSD. Done in 3 seconds."
            cta="See the extension" onClick={() => go('extension')}
          />
          <MomentCard
            num="02" persona="carol"
            title="Find a stranger gift."
            body="Carol's never installed anything. But somebody tipped her handle weeks ago — it's been waiting in escrow. She verifies, and claims."
            cta="See the claim flow" onClick={() => go('claim')}
          />
          <MomentCard
            num="03" persona="bob"
            title="Borrow without selling."
            body="Bob's collected 218 MUSD in tips. He locks them as collateral and pulls a credit line at 1% — no Bitcoin sold."
            cta="See the credit line" onClick={() => go('borrow')}
          />
        </div>
      </section>

      {/* Live activity feed */}
      <section style={{ marginTop: 56 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
          <h2 className="h2" style={{ fontSize: 32 }}>Live on matsnet.</h2>
          <button className="btn ghost sm" onClick={() => go('leaderboard')}>see leaderboard <Icon name="arrow" size={12} /></button>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {RECENT_TIPS.slice(0, 6).map((tip, i) => (
            <ActivityRow key={i} tip={tip} idx={i} />
          ))}
        </div>
      </section>

      {/* How it works strip */}
      <section style={{ marginTop: 72 }}>
        <h2 className="h2" style={{ fontSize: 32, marginBottom: 24 }}>The way it works.</h2>
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, padding: 0, overflow: 'hidden' }}>
          {[
            { n: '1', t: 'Install + connect', b: 'Chrome extension + Mezo Passport. Wallet auto-switches to matsnet.' },
            { n: '2', t: 'Tip from any feed', b: 'Twitter, YouTube, Substack, Medium, GitHub, Reddit, HN. One button.' },
            { n: '3', t: 'MUSD lands or parks', b: 'Verified handles get instant credit. Unknown handles wait in escrow.' },
            { n: '4', t: 'Save, borrow, repeat', b: 'Earn yield on tips, or open a credit line at 1% APR. Keep your BTC.' },
          ].map((s, i) => (
            <div key={s.n} style={{
              padding: 'var(--pad-card)',
              borderRight: i < 3 ? 'var(--border-w) var(--border-style) var(--line)' : 'none',
            }}>
              <div className="kicker" style={{ marginBottom: 12 }}>{s.n}</div>
              <h3 className="h3" style={{ marginBottom: 8 }}>{s.t}</h3>
              <p className="soft" style={{ fontSize: 13, lineHeight: 1.5, margin: 0 }}>{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The big footer pitch */}
      <section style={{ marginTop: 80, paddingBottom: 16 }}>
        <div className="card" style={{
          padding: '48px 40px',
          textAlign: 'center',
          background: 'var(--ink)',
          color: 'var(--paper)',
          borderColor: 'var(--ink)',
        }}>
          <span className="kicker" style={{ color: 'rgba(255,255,255,.55)', justifyContent: 'center' }}>and now, the punchline</span>
          <h2 className="h2" style={{ color: 'inherit', marginTop: 16, fontSize: 'clamp(28px,4vw,52px)' }}>
            Every social handle is now a Bitcoin-backed bank account.
          </h2>
          <p className="lede" style={{ color: 'rgba(255,255,255,.7)', marginLeft: 'auto', marginRight: 'auto', marginTop: 16 }}>
            Tip jars used to take a cut. Lightning was a pain. Custodians held the money. Nih is none of those.
          </p>
          <div className="row" style={{ justifyContent: 'center', gap: 12, marginTop: 28 }}>
            <button className="btn lg" style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' }} onClick={() => go('dashboard')}>
              Open the dashboard <Icon name="arrow" size={14} />
            </button>
            <button className="btn lg" style={{ background: 'transparent', color: 'var(--paper)', borderColor: 'rgba(255,255,255,.4)' }} onClick={() => go('claim')}>
              Claim my tips
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

/* The hero "tip ticket" — like a paper coupon */
const TipTicket = () => (
  <div className="card pop" style={{
    padding: 0,
    overflow: 'hidden',
    background: 'var(--paper)',
    transform: 'rotate(-1.5deg)',
  }}>
    {/* perforated header */}
    <div style={{
      padding: '16px 20px',
      background: 'var(--bg-2)',
      borderBottom: 'var(--border-w) dashed var(--line)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div className="row" style={{ gap: 10 }}>
        <span className="stamp" style={{ fontSize: 18, width: 52, height: 52 }}>nih!</span>
        <div>
          <div className="kicker">tip receipt · no. 0042</div>
          <div className="h3" style={{ fontSize: 18, marginTop: 2 }}>good for any handle, anywhere</div>
        </div>
      </div>
      <div className="mono muted" style={{ fontSize: 11 }}>matsnet<br />31611</div>
    </div>

    {/* From → To */}
    <div style={{ padding: '22px 24px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
      <div>
        <div className="kicker" style={{ marginBottom: 10 }}>from</div>
        <div className="row" style={{ gap: 10 }}>
          <Avatar persona="alice" />
          <div>
            <b style={{ display: 'block' }}>{PERSONAS.alice.name}</b>
            <span className="mono muted" style={{ fontSize: 11 }}>{PERSONAS.alice.addr}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Icon name="arrow" size={26} />
      </div>

      <div>
        <div className="kicker" style={{ marginBottom: 10 }}>to</div>
        <div className="row" style={{ gap: 10 }}>
          <Avatar persona="bob" />
          <div>
            <b style={{ display: 'block' }}>{PERSONAS.bob.name}</b>
            <span className="mono muted" style={{ fontSize: 11 }}>@bobbuilds · twitter</span>
          </div>
        </div>
      </div>
    </div>

    {/* Amount */}
    <div style={{ padding: '8px 24px 22px', borderTop: 'var(--border-w) dashed var(--line)', borderBottom: 'var(--border-w) dashed var(--line)' }}>
      <div className="kicker" style={{ marginTop: 16, marginBottom: 8 }}>amount</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 72, lineHeight: 1, fontWeight: 'var(--display-weight)' }}>5</span>
        <span style={{ fontSize: 22, color: 'var(--ink-2)' }}>MUSD</span>
        <span className="margin-note" style={{ marginLeft: 'auto', transform: 'rotate(-6deg)', fontSize: 16 }}>≈ $5.00</span>
      </div>
      <div className="muted mono" style={{ fontSize: 11, marginTop: 8 }}>fee 0.025 MUSD · or 0.0125 paid in MEZO (50% off)</div>
    </div>

    {/* note */}
    <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className="kicker">note</span>
      <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20 }}>"thank you for the thread"</span>
    </div>

    {/* foot */}
    <div style={{
      padding: '12px 24px',
      background: 'var(--bg-2)',
      borderTop: 'var(--border-w) dashed var(--line)',
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      color: 'var(--ink-3)',
      letterSpacing: '.08em',
      textTransform: 'uppercase',
    }}>
      <span>tx 0x7c2…f91d</span>
      <span>confirmed in 2.8s</span>
      <span>block #1,284,193</span>
    </div>
  </div>
);

const MomentCard = ({ num, persona, title, body, cta, onClick }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div className="kicker">{num}</div>
      <Avatar persona={persona} size="lg" />
    </div>
    <h3 className="h3" style={{ fontSize: 26, marginTop: 8 }}>{title}</h3>
    <p className="soft" style={{ margin: 0, lineHeight: 1.5 }}>{body}</p>
    <button className="btn ghost sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={onClick}>
      {cta} <Icon name="arrow" size={12} />
    </button>
  </div>
);

const ActivityRow = ({ tip, idx }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto auto',
    gap: 14,
    alignItems: 'center',
    padding: '14px 18px',
    borderTop: idx > 0 ? 'var(--border-w) var(--border-style) var(--line)' : 'none',
  }}>
    <Avatar persona={['alice','bob','carol'][idx % 3]} size="sm" label={tip.from[0].toUpperCase() + tip.from[1]?.toUpperCase()} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 14 }}>
        <b>{tip.from}</b> <span className="muted">tipped</span> <b>{tip.toHandle}</b>
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
        "{tip.note}"
      </div>
    </div>
    <PGlyph p={tip.platform} size={20} />
    <div style={{ textAlign: 'right' }}>
      <b className="tabular"><Amount value={tip.amount} /></b>
    </div>
    {tip.status === 'parked'
      ? <Tag tone="warn">parked</Tag>
      : <Tag tone="good"><Icon name="check" size={10} /> sent</Tag>
    }
  </div>
);

window.Landing = Landing;
