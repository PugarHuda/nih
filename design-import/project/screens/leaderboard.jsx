/* eslint-disable */
// screens/leaderboard.jsx

const Leaderboard = ({ go }) => {
  const [tab, setTab] = React.useState('creators');
  const [period, setPeriod] = React.useState('7d');
  const [platform, setPlatform] = React.useState('all');

  return (
    <div className="screen slide">
      <div className="crumb"><span>nih</span><span className="sep">/</span><span className="active">leaderboard</span></div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <span className="eyebrow">indexed by Goldsky</span>
          <h1 className="h1" style={{ fontSize: 'clamp(40px, 5vw, 68px)', marginTop: 6 }}>Who's getting paid.</h1>
          <p className="lede" style={{ marginTop: 12 }}>Live from matsnet. Updated every block. Receipts on-chain — sort, filter, gawk.</p>
        </div>
        <div className="row" style={{ gap: 4, padding: 4, background: 'var(--bg-2)', border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)' }}>
          {['creators', 'tippers'].map(k => (
            <button key={k} className="btn ghost sm" onClick={() => setTab(k)} style={{
              background: tab === k ? 'var(--paper)' : 'transparent',
              border: tab === k ? 'var(--border-w) var(--border-style) var(--line)' : 'var(--border-w) var(--border-style) transparent',
              padding: '8px 14px',
              textTransform: 'capitalize',
            }}>
              {k === 'creators' ? 'Top creators' : 'Top tippers'}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="row" style={{ gap: 18, marginBottom: 18, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 4 }}>
          {['24h','7d','30d','all'].map(p => (
            <button key={p} className="btn sm" onClick={() => setPeriod(p)} style={{
              background: period === p ? 'var(--ink)' : 'var(--paper)',
              color: period === p ? 'var(--paper)' : 'inherit',
            }}>{p}</button>
          ))}
        </div>
        <div className="row" style={{ gap: 4 }}>
          {['all','twitter','github','youtube','substack'].map(p => (
            <button key={p} className="btn sm" onClick={() => setPlatform(p)} style={{
              background: platform === p ? 'var(--ink)' : 'var(--paper)',
              color: platform === p ? 'var(--paper)' : 'inherit',
              textTransform: 'capitalize',
            }}>{p === 'all' ? 'all platforms' : p}</button>
          ))}
        </div>
        <span className="right mono muted" style={{ fontSize: 12 }}>
          <span className="dot" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999, background: 'var(--good)', marginRight: 6 }} />
          indexing · last block 1,284,219
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* Main leaderboard */}
        <div className="card" style={{ padding: 0 }}>
          {/* Header */}
          <div className="row" style={{
            padding: '14px 22px',
            borderBottom: 'var(--border-w) var(--border-style) var(--line)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--ink-3)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
          }}>
            <span style={{ width: 32 }}>#</span>
            <span className="grow">handle</span>
            <span style={{ width: 80, textAlign: 'right' }}>tips</span>
            <span style={{ width: 140, textAlign: 'right' }}>received</span>
          </div>
          {LEADERS.map((row, i) => (
            <LeaderRow key={row.name + row.platform} row={row} i={i} go={go} />
          ))}
        </div>

        <div className="col" style={{ gap: 18 }}>
          {/* Aggregate stats */}
          <div className="card" style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}>
            <span className="kicker" style={{ color: 'rgba(255,255,255,.55)' }}>protocol totals</span>
            <h3 className="h3" style={{ marginTop: 6, color: 'inherit' }}>The big picture.</h3>
            <div className="div" style={{ background: 'rgba(255,255,255,.12)' }} />
            <div className="col" style={{ gap: 10 }}>
              {[
                ['MUSD tipped (all-time)', '24,816'],
                ['Tips this 7d', '1,284'],
                ['Unique tippers', '438'],
                ['Verified handles', '161'],
                ['MUSD in vault', '2,148'],
              ].map(([l, v]) => (
                <div key={l} className="row" style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                  <span className="grow muted" style={{ color: 'rgba(255,255,255,.65)' }}>{l}</span>
                  <b className="tabular">{v}</b>
                </div>
              ))}
            </div>
          </div>

          {/* Live activity ticker */}
          <div className="card">
            <span className="kicker">live · last 60s</span>
            <h3 className="h3" style={{ marginTop: 6 }}>Tip stream.</h3>
            <div className="col" style={{ gap: 0, marginTop: 12 }}>
              {RECENT_TIPS.slice(0, 6).map((t, i) => (
                <div key={i} className="row" style={{ padding: '8px 0', borderTop: i ? 'var(--border-w) dashed var(--line-2)' : 'none', gap: 8 }}>
                  <span className="mono muted" style={{ fontSize: 11, width: 60 }}>{t.time}</span>
                  <PGlyph p={t.platform} size={16} />
                  <span className="grow" style={{ fontSize: 13 }}><b>{t.from}</b> → <b>{t.toHandle}</b></span>
                  <b className="tabular" style={{ fontSize: 13 }}>{t.amount} <span className="muted">M</span></b>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg-2)' }}>
            <span className="kicker">how this list works</span>
            <p className="soft" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 8, marginBottom: 0 }}>
              Every tip is a <code style={{ background: 'var(--paper)', padding: '1px 5px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>Tipped</code> event on <code style={{ background: 'var(--paper)', padding: '1px 5px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>NihRouter</code>. Goldsky indexes the event stream and we group by recipient. No middleman, no fudging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LeaderRow = ({ row, i, go }) => {
  const top = i < 3;
  return (
    <button
      className="row"
      onClick={() => go('profile')}
      style={{
        padding: '14px 22px',
        borderTop: i ? 'var(--border-w) var(--border-style) var(--line-2)' : 'none',
        background: top ? 'var(--bg-2)' : 'transparent',
        textAlign: 'left',
        width: '100%',
        border: 'none', borderTop: i ? 'var(--border-w) var(--border-style) var(--line-2)' : 'none',
        gap: 14,
        cursor: 'default',
      }}
    >
      <span style={{
        width: 32, textAlign: 'left',
        fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: top ? 28 : 20,
        color: top ? 'var(--accent)' : 'var(--ink-2)',
      }}>{row.rank}</span>
      <Avatar size="sm" label={row.name.slice(0,2)} persona={['alice','bob','carol'][i%3]} />
      <div className="grow">
        <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
          <b>@{row.name}</b>
          <PGlyph p={row.platform} size={14} />
          {top && <Tag tone="accent">{row.badge || 'top'}</Tag>}
        </div>
        <div className="muted mono" style={{ fontSize: 11 }}>{PLATFORM_LABELS[row.platform]}</div>
      </div>
      <span style={{ width: 80, textAlign: 'right' }}><b className="tabular">{row.tips}</b></span>
      <span style={{ width: 140, textAlign: 'right' }}>
        <b className="tabular" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 'var(--display-weight)' }}>
          <Amount value={row.received} suffix="" />
        </b>
        <span className="muted mono" style={{ fontSize: 10, marginLeft: 4 }}>MUSD</span>
      </span>
    </button>
  );
};

window.Leaderboard = Leaderboard;
