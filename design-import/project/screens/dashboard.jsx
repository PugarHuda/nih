/* eslint-disable */
// screens/dashboard.jsx — v2 with live notification, heatmap, top tippers, donut, milestone

const Dashboard = ({ go, persona = 'bob' }) => {
  const p = PERSONAS[persona];

  // Live "tip just dropped" rotation
  const TIP_FEED = [
    { from: 'alice',  amount: 5,  platform: 'twitter',  note: 'thank you for the thread' },
    { from: 'mira',   amount: 12, platform: 'twitter',  note: 'this drawing made my day' },
    { from: 'jun',    amount: 25, platform: 'github',   note: 'fix landed, you saved my week' },
    { from: 'lin',    amount: 50, platform: 'github',   note: 'sponsoring the v2 release' },
    { from: 'sam',    amount: 1,  platform: 'twitter',  note: 'good post' },
    { from: 'dee',    amount: 10, platform: 'substack', note: 'consistently great writing' },
  ];
  const [tipIdx, setTipIdx] = React.useState(0);
  const [showBanner, setShowBanner] = React.useState(true);
  React.useEffect(() => {
    const t = setInterval(() => {
      setShowBanner(false);
      setTimeout(() => {
        setTipIdx(i => (i + 1) % TIP_FEED.length);
        setShowBanner(true);
      }, 250);
    }, 6500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="screen slide">
      <div className="crumb">
        <span>nih</span><span className="sep">/</span><span className="active">dashboard</span>
      </div>

      {/* Live tip-drop notification */}
      <TipDropBanner tip={TIP_FEED[tipIdx]} show={showBanner} />

      {/* Top: hello + summary */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <span className="eyebrow">Good morning,</span>
          <h1 className="h1" style={{ fontSize: 'clamp(36px,4.5vw,64px)', marginTop: 6 }}>{p.name.split(' ')[0]}.</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" onClick={() => go('claim')}><Icon name="claim" size={14} /> Verify handle</button>
          <button className="btn primary" onClick={() => go('borrow')}><Icon name="bolt" size={14} /> Borrow</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
        <BalanceCard p={p} go={go} />
        <KpiCard label="Lifetime tips received" value={522} sub="68 tips · since Apr 2026" />
        <KpiCard label="Available credit" value={130.8} sub="60% LTV · 1% fixed" cta={() => go('borrow')} ctaLabel="open line →" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
        <div className="col" style={{ gap: 18 }}>

          {/* Cash flow + activity heatmap */}
          <div className="card" style={{ position: 'relative' }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, alignItems: 'flex-end' }}>
              <div>
                <span className="kicker">activity · last 7 days</span>
                <h3 className="h3" style={{ marginTop: 6 }}>When tips arrive.</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 32, lineHeight: 1 }} className="tabular">
                  +63 <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>MUSD</span>
                </div>
                <div className="muted mono" style={{ fontSize: 11, marginTop: 4 }}>↑ 27% vs last week · 18 tips</div>
              </div>
            </div>
            <ActivityHeatmap />
            <Note rotate={-4} style={{ position: 'absolute', bottom: 18, right: 18, fontSize: 14, color: 'var(--accent-3)' }}>nights peak!</Note>
          </div>

          {/* Linked handles + recent receipts side-by-side */}
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span className="kicker">your linked handles</span>
                <h3 className="h3" style={{ marginTop: 6 }}>Three of seven possible.</h3>
              </div>
              <button className="btn sm" onClick={() => go('claim')}><Icon name="plus" size={12} /> Link another</button>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {p.handles.map((h, i) => (
                <HandleRow key={i} h={h} />
              ))}
              <button className="btn ghost" style={{ justifyContent: 'flex-start', padding: '12px 10px', border: 'var(--border-w) dashed var(--line)' }} onClick={() => go('claim')}>
                <Icon name="plus" size={14} /> Add YouTube, Medium, Reddit, or HN
              </button>
            </div>
          </div>

          {/* Recent tips */}
          <div className="card">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <span className="kicker">recent tips received</span>
                <h3 className="h3" style={{ marginTop: 6 }}>Latest receipts.</h3>
              </div>
              <button className="btn ghost sm" onClick={() => go('leaderboard')}>see all →</button>
            </div>
            <div className="col" style={{ gap: 0 }}>
              {RECENT_TIPS.slice(0, 5).map((t, i) => (
                <div key={i} className="row" style={{ padding: '12px 0', borderTop: i ? 'var(--border-w) var(--border-style) var(--line-2)' : 'none', gap: 12 }}>
                  <Avatar size="sm" label={t.from[0].toUpperCase() + (t.from[1] || '').toUpperCase()} persona={['alice','carol','bob'][i%3]} />
                  <div className="grow">
                    <b>{t.from}</b>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>"{t.note}"</div>
                  </div>
                  <PGlyph p={t.platform} size={18} />
                  <span className="muted mono" style={{ fontSize: 11, width: 64, textAlign: 'right' }}>{t.time}</span>
                  <b className="tabular" style={{ color: 'var(--good)', minWidth: 60, textAlign: 'right' }}>+<Amount value={t.amount} /></b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col" style={{ gap: 18 }}>
          {/* Milestone progress */}
          <MilestoneCard current={68} target={100} />

          {/* Quick actions */}
          <div className="card">
            <span className="kicker">things to do</span>
            <h3 className="h3" style={{ marginTop: 6, marginBottom: 14 }}>Make your tips work.</h3>
            <div className="col" style={{ gap: 8 }}>
              <ActionRow icon="claim" label="Claim 47 MUSD from your YouTube handle" onClick={() => go('claim')} hot />
              <ActionRow icon="borrow" label="Open a 90 MUSD credit line" onClick={() => go('borrow')} />
              <ActionRow icon="bolt" label="Earn 4.2% APY on idle MUSD" onClick={() => go('borrow')} sub="auto-deposit into Mezo Earn" />
              <ActionRow icon="profile" label="Share your public profile" onClick={() => go('profile')} />
            </div>
          </div>

          {/* Top tippers */}
          <TopTippersCard />

          {/* Platform breakdown donut */}
          <PlatformDonut />

          {/* Your stack */}
          <div className="card" style={{ background: 'var(--bg-2)' }}>
            <span className="kicker">your stack</span>
            <h3 className="h3" style={{ marginTop: 6, marginBottom: 14 }}>What you're sitting on.</h3>
            <div className="col" style={{ gap: 12 }}>
              <StackRow icon="MUSD" label="MUSD (cash)"        amount={218.0} sub="liquid · in wallet" />
              <StackRow icon="ESCR" label="MUSD (escrowed)"    amount={47.0}  sub="parked under @bobbuilds_yt" tone="warn" />
              <StackRow icon="LOAN" label="MUSD borrowed"      amount={0}     sub="no open credit line yet" />
              <StackRow icon="BTC"  label="Bitcoin (gas)"      amount={p.btc} sub="≈ $2,800" suffix=" BTC" />
            </div>
          </div>

          {/* Public profile share */}
          <div className="card" style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}>
            <span className="kicker" style={{ color: 'rgba(255,255,255,.55)' }}>your public profile</span>
            <h3 className="h3" style={{ marginTop: 6, color: 'inherit' }}>nih.app/@bobbuilds</h3>
            <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, lineHeight: 1.5, marginTop: 6 }}>
              Drop this link anywhere. We render OG cards for X, Discord and Slack.
            </p>
            <div className="row" style={{ gap: 8, marginTop: 14 }}>
              <button className="btn" style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' }} onClick={() => go('profile')}>
                Preview <Icon name="arrow" size={12} />
              </button>
              <button className="btn" style={{ background: 'transparent', color: 'inherit', borderColor: 'rgba(255,255,255,.3)' }}>
                <Icon name="copy" size={12} /> Copy link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================
   NEW: Live tip-drop banner
   ========================== */
const TipDropBanner = ({ tip, show }) => (
  <div style={{
    marginBottom: 20,
    overflow: 'hidden',
    maxHeight: show ? 80 : 0,
    transition: 'max-height .25s ease, opacity .25s ease',
    opacity: show ? 1 : 0,
  }}>
    <div className="card" style={{
      background: 'var(--accent)',
      color: 'var(--accent-ink)',
      borderColor: 'var(--ink)',
      padding: '12px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      position: 'relative',
    }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        background: 'var(--ink)',
        color: 'var(--paper)',
        padding: '4px 12px',
        borderRadius: 'var(--radius-sm)',
        border: 'var(--border-w) var(--border-style) var(--line)',
        letterSpacing: '.04em',
        transform: 'rotate(-3deg)',
        flex: '0 0 auto',
      }}>NIH!</span>
      <Avatar persona={['alice','bob','carol'][Math.abs(tip.from.charCodeAt(0)) % 3]} size="sm" label={tip.from[0].toUpperCase() + (tip.from[1]||'').toUpperCase()} />
      <div className="grow">
        <b style={{ fontSize: 14 }}>{tip.from} tipped you <Amount value={tip.amount} /> on {PLATFORM_LABELS[tip.platform]}</b>
        <div style={{ fontSize: 12, opacity: .75 }}>"{tip.note}"</div>
      </div>
      <PGlyph p={tip.platform} size={20} />
      <span className="mono" style={{ fontSize: 11, opacity: .6 }}>just now</span>
    </div>
  </div>
);

/* ==========================
   NEW: Activity heatmap
   ========================== */
const ActivityHeatmap = () => {
  // 7 days × 6 time bands. Deterministic seed-ish noise for repeatability.
  const days = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const bands = ['00–04','04–08','08–12','12–16','16–20','20–24'];
  const cells = [
    [0, 0, 1, 1, 2, 3],   // Mon
    [0, 1, 2, 1, 3, 4],   // Tue
    [1, 0, 1, 2, 2, 2],   // Wed
    [0, 1, 1, 3, 2, 4],   // Thu
    [1, 1, 2, 2, 3, 4],   // Fri — peak
    [2, 2, 1, 2, 3, 4],   // Sat — peak
    [1, 1, 1, 2, 4, 3],   // Sun
  ];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: 8, alignItems: 'center' }}>
        <div></div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${bands.length}, 1fr)`, gap: 4, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: '.05em', marginBottom: 4 }}>
          {bands.map(b => <span key={b} style={{ textAlign: 'center' }}>{b}</span>)}
        </div>
        {days.map((d, di) => (
          <React.Fragment key={d}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.1em' }}>{d}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${bands.length}, 1fr)`, gap: 4 }}>
              {cells[di].map((v, bi) => (
                <div key={bi} style={{
                  height: 22,
                  background: v === 0 ? 'var(--bg-2)' : 'var(--accent)',
                  opacity: v === 0 ? .4 : (v / 4) * 0.6 + 0.4,
                  border: 'var(--border-w) var(--border-style) var(--line-2)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: v >= 3 ? 'var(--accent-ink)' : 'var(--ink-2)',
                  fontWeight: v >= 3 ? 700 : 400,
                }}>
                  {v > 0 ? v : ''}
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="row" style={{ marginTop: 14, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', gap: 8, justifyContent: 'flex-end' }}>
        <span>less</span>
        {[0,1,2,3,4].map(v => (
          <span key={v} style={{
            width: 14, height: 14,
            background: v === 0 ? 'var(--bg-2)' : 'var(--accent)',
            opacity: v === 0 ? .4 : (v / 4) * 0.6 + 0.4,
            border: 'var(--border-w) var(--border-style) var(--line-2)',
            borderRadius: 'var(--radius-sm)',
          }} />
        ))}
        <span>more</span>
      </div>
    </div>
  );
};

/* ==========================
   NEW: Top Tippers
   ========================== */
const TopTippersCard = () => {
  const tippers = [
    { name: 'mira',        amount: 78,  tips: 14, persona: 'alice' },
    { name: 'lin',         amount: 64,  tips: 9,  persona: 'bob'   },
    { name: 'jun',         amount: 48,  tips: 7,  persona: 'carol' },
    { name: 'alicewrites', amount: 32,  tips: 5,  persona: 'alice' },
    { name: 'dee',         amount: 22,  tips: 4,  persona: 'bob'   },
  ];
  const max = tippers[0].amount;
  return (
    <div className="card">
      <span className="kicker">top tippers · this month</span>
      <h3 className="h3" style={{ marginTop: 6, marginBottom: 14 }}>Who keeps showing up.</h3>
      <div className="col" style={{ gap: 10 }}>
        {tippers.map((t, i) => (
          <div key={t.name} className="row" style={{ gap: 10 }}>
            <span className="mono muted" style={{ width: 18, fontSize: 11 }}>0{i+1}</span>
            <Avatar size="sm" persona={t.persona} label={t.name[0].toUpperCase() + (t.name[1] || '').toUpperCase()} />
            <div className="grow" style={{ minWidth: 0 }}>
              <b style={{ fontSize: 13 }}>{t.name}</b>
              <div style={{
                marginTop: 4,
                height: 4,
                background: 'var(--bg-2)',
                border: 'var(--border-w) var(--border-style) var(--line-2)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(t.amount / max) * 100}%`,
                  height: '100%',
                  background: 'var(--accent)',
                }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
              <b className="tabular" style={{ fontSize: 13 }}>{t.amount}</b>
              <div className="muted mono" style={{ fontSize: 10 }}>{t.tips} tips</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ==========================
   NEW: Platform donut
   ========================== */
const PlatformDonut = () => {
  const data = [
    { platform: 'twitter',  amount: 312, color: '#1DA1F2' },
    { platform: 'github',   amount: 142, color: '#6E40C9' },
    { platform: 'substack', amount: 38,  color: '#FF6719' },
    { platform: 'medium',   amount: 18,  color: '#1A8917' },
    { platform: 'hn',       amount: 12,  color: '#FF6600' },
  ];
  const total = data.reduce((s, d) => s + d.amount, 0);
  // donut arc segments
  const R = 56, CX = 80, CY = 80, STROKE = 22;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="card">
      <span className="kicker">platform mix · 30d</span>
      <h3 className="h3" style={{ marginTop: 6, marginBottom: 14 }}>Where you earn.</h3>
      <div className="row" style={{ gap: 18, alignItems: 'center' }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ flex: '0 0 auto' }}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--bg-2)" strokeWidth={STROKE} />
          {data.map((d, i) => {
            const portion = d.amount / total;
            const arcLen = portion * circumference;
            const seg = (
              <circle
                key={d.platform}
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={d.color}
                strokeWidth={STROKE}
                strokeDasharray={`${arcLen} ${circumference - arcLen}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{ transition: 'stroke-dasharray .6s ease' }}
              />
            );
            offset += arcLen;
            return seg;
          })}
          <text x={CX} y={CY-2} textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 28, fill: 'var(--ink)' }}>{total}</text>
          <text x={CX} y={CY+16} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--ink-3)', letterSpacing: '.08em' }}>MUSD · 30D</text>
        </svg>
        <div className="grow" style={{ minWidth: 0 }}>
          {data.map(d => (
            <div key={d.platform} className="row" style={{ gap: 8, padding: '4px 0', fontSize: 12 }}>
              <span style={{ width: 10, height: 10, background: d.color, border: 'var(--border-w) var(--border-style) var(--line-2)', borderRadius: 'var(--radius-sm)', flex: '0 0 auto' }} />
              <span className="grow" style={{ textTransform: 'capitalize' }}>{PLATFORM_LABELS[d.platform].replace(' / Twitter','')}</span>
              <b className="tabular">{d.amount}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ==========================
   NEW: Milestone progress
   ========================== */
const MilestoneCard = ({ current, target }) => {
  const pct = Math.min(100, (current / target) * 100);
  return (
    <div className="card" style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--line)', position: 'relative', overflow: 'hidden' }}>
      <span className="kicker" style={{ color: 'currentColor', opacity: .7 }}>milestone · this month</span>
      <div className="row" style={{ alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 44, lineHeight: 1 }} className="tabular">{current}</span>
        <span style={{ fontSize: 18, opacity: .7 }}>/ {target} tips</span>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.4, margin: '8px 0 14px', opacity: .8 }}>
        Hit 100 this month → unlock a verified badge on your profile.
      </p>
      <div style={{
        height: 12,
        background: 'rgba(0,0,0,.15)',
        border: 'var(--border-w) var(--border-style) var(--line)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: 'var(--ink)',
          transition: 'width .8s cubic-bezier(.2,.7,.2,1)',
        }} />
      </div>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 11, opacity: .7 }}>
        <span>{pct.toFixed(0)}% there</span>
        <span>32 to go · 12 days left</span>
      </div>
    </div>
  );
};

/* ==========================
   Existing components (slightly cleaned)
   ========================== */

const BalanceCard = ({ p, go }) => (
  <div className="card" style={{ background: 'var(--paper)', position: 'relative', overflow: 'hidden' }}>
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span className="kicker">wallet balance</span>
      <span className="mono muted" style={{ fontSize: 11 }}>{p.addr}</span>
    </div>
    <div style={{ marginTop: 12 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 'clamp(48px,6vw,84px)', lineHeight: 1 }} className="tabular">
        <Amount value={p.musd} suffix="" />
        <span style={{ fontSize: 22, color: 'var(--ink-3)', marginLeft: 10, fontWeight: 500 }}>MUSD</span>
      </div>
      <div className="row" style={{ gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        <span className="chip"><Icon name="bolt" size={11}/> +63 in the last 24h</span>
        <span className="chip"><Icon name="btc" size={11}/> {p.btc} BTC for gas</span>
        <span className="chip good"><span className="dot"/> Tier 1 verified</span>
      </div>
    </div>
    <Note rotate={6} style={{ position: 'absolute', top: 16, right: 90, fontSize: 14, color: 'var(--accent-3)' }}>nice!</Note>
  </div>
);

const KpiCard = ({ label, value, sub, cta, ctaLabel }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <span className="kicker">{label}</span>
    <div className="stat" style={{ marginTop: 12 }}>
      <div className="num"><Amount value={value} suffix="" /></div>
      <div className="sub">{sub}</div>
    </div>
    {cta && <button className="btn ghost sm" style={{ alignSelf: 'flex-start', marginTop: 12, padding: '6px 0' }} onClick={cta}>{ctaLabel}</button>}
  </div>
);

const HandleRow = ({ h }) => (
  <div className="row" style={{ padding: '10px 12px', border: 'var(--border-w) var(--border-style) var(--line-2)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-2)', gap: 14 }}>
    <PGlyph p={h.platform} size={26} />
    <div className="grow">
      <b>@{h.username}</b>
      <div className="muted mono" style={{ fontSize: 11 }}>{PLATFORM_LABELS[h.platform]} · linked {h.since}</div>
    </div>
    <Tag tone="good"><Icon name="check" size={10}/> Tier {h.tier}</Tag>
  </div>
);

const ActionRow = ({ icon, label, sub, onClick, hot }) => (
  <button className="btn ghost" onClick={onClick} style={{
    border: 'var(--border-w) var(--border-style) var(--line)',
    background: hot ? 'var(--accent)' : 'var(--paper)',
    color: hot ? 'var(--accent-ink)' : 'inherit',
    justifyContent: 'flex-start',
    padding: '12px 14px',
    textAlign: 'left',
  }}>
    <Icon name={icon} size={16} />
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {sub && <small className="muted">{sub}</small>}
    </div>
    <Icon name="arrow" size={14} style={{ marginLeft: 'auto' }} />
  </button>
);

const StackRow = ({ icon, label, amount, sub, suffix, tone }) => (
  <div className="row" style={{ gap: 12 }}>
    <span style={{
      width: 36, height: 36,
      background: 'var(--paper)',
      border: 'var(--border-w) var(--border-style) var(--line)',
      borderRadius: 'var(--radius-sm)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
    }}>{icon}</span>
    <div className="grow">
      <b>{label}</b>
      <div className="muted" style={{ fontSize: 12 }}>{sub}</div>
    </div>
    <b className="tabular" style={{ color: tone === 'warn' ? 'var(--warn)' : 'inherit' }}>
      <Amount value={amount} suffix={suffix || ' MUSD'} />
    </b>
  </div>
);

window.Dashboard = Dashboard;
