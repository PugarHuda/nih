/* eslint-disable */
// screens/borrow.jsx — credit line

const Borrow = ({ go, tone }) => {
  const t = TONE.borrow[tone] || TONE.borrow.friendly;
  const [collateral, setCollateral] = React.useState(150);
  const [activeLoan, setActiveLoan] = React.useState(null); // { collateral, borrowed, opened }
  const [opening, setOpening] = React.useState(false);

  const max = 218;
  const ltv = 0.60;
  const borrowAmt = +(collateral * ltv).toFixed(2);
  const yearInterest = +(borrowAmt * 0.01).toFixed(2);
  const liqLine = +(collateral * 0.90).toFixed(2);
  const cushion = +(((liqLine - borrowAmt) / collateral) * 100).toFixed(1);

  const open = () => {
    setOpening(true);
    setTimeout(() => {
      setActiveLoan({ collateral, borrowed: borrowAmt, opened: 'just now' });
      setOpening(false);
    }, 1300);
  };

  return (
    <div className="screen slide">
      <div className="crumb"><span>nih</span><span className="sep">/</span><span className="active">borrow</span></div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <span className="eyebrow">credit line</span>
          <h1 className="h1" style={{ fontSize: 'clamp(40px,5vw,68px)', marginTop: 6 }}>{t.title}</h1>
          <p className="lede" style={{ marginTop: 12 }}>{t.sub}</p>
        </div>
      </div>

      {activeLoan ? (
        <ActiveLoan loan={activeLoan} onRepay={() => setActiveLoan(null)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          {/* Builder */}
          <div className="card" style={{ padding: 32 }}>
            <span className="kicker">step 1 — how much to lock</span>
            <h2 className="h2" style={{ fontSize: 30, marginTop: 8, marginBottom: 6 }}>Pick your collateral.</h2>
            <p className="soft" style={{ margin: '0 0 24px' }}>This is your tip cash. It's safe — you stay in custody. It just can't be spent while it's locked.</p>

            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 72, lineHeight: 1 }} className="tabular">
                {collateral} <span style={{ fontSize: 24, color: 'var(--ink-3)' }}>MUSD</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="muted mono" style={{ fontSize: 11 }}>available</div>
                <b className="tabular">{max} MUSD</b>
              </div>
            </div>

            <input type="range" min={20} max={max} step={1} value={collateral}
              onChange={e => setCollateral(+e.target.value)}
              style={{
                width: '100%', marginTop: 16, accentColor: 'var(--accent)',
                height: 6,
              }} />

            <div className="row" style={{ gap: 6, marginTop: 12 }}>
              {[50, 100, 150, 218].map(v => (
                <button key={v} className="btn sm" onClick={() => setCollateral(v)} style={{
                  background: collateral === v ? 'var(--ink)' : 'var(--paper)',
                  color: collateral === v ? 'var(--paper)' : 'inherit',
                }}>
                  {v === 218 ? 'MAX' : v + ' MUSD'}
                </button>
              ))}
            </div>

            <div className="div dashed" />

            <div className="row" style={{ alignItems: 'flex-start', gap: 24 }}>
              <div className="grow">
                <span className="kicker">step 2 — what you get</span>
                <div style={{ marginTop: 12 }}>
                  <div className="row" style={{ alignItems: 'baseline', gap: 16 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 'var(--display-weight)', lineHeight: 1 }} className="tabular">
                      <Amount value={borrowAmt} suffix="" />
                    </span>
                    <span style={{ fontSize: 18, color: 'var(--ink-3)' }}>MUSD in your wallet, today</span>
                  </div>
                  <div className="row wrap" style={{ marginTop: 14, gap: 8 }}>
                    <Tag tone="accent">1% fixed APR</Tag>
                    <Tag>60% LTV</Tag>
                    <Tag>no platform fee</Tag>
                    <Tag>repay anytime</Tag>
                  </div>
                </div>
              </div>
            </div>

            <div className="div dashed" />

            {/* Risk visualization */}
            <span className="kicker">your safety cushion</span>
            <div style={{ marginTop: 14 }}>
              <RiskGauge collateral={collateral} borrowed={borrowAmt} />
              <div className="row" style={{ justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
                <span className="muted">borrowed {borrowAmt}</span>
                <span style={{ color: 'var(--good)' }}>{cushion}% cushion</span>
                <span className="muted">liquidation @ {liqLine}</span>
              </div>
              <p className="soft" style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>
                Your collateral is MUSD — a stable dollar. The only way you get liquidated is if you <i>actively borrow more</i> against it. You're in control.
              </p>
            </div>

            <div className="div" />
            <button className="btn primary lg" onClick={open} disabled={opening} style={{ width: '100%', justifyContent: 'center' }}>
              {opening ? 'Opening credit line…' : <>Lock {collateral} MUSD, get {borrowAmt} MUSD <Icon name="arrow" size={14} /></>}
            </button>
            <div className="muted mono center" style={{ fontSize: 11, marginTop: 10 }}>
              gas ≈ 0.00002 BTC · earliest repayment ~3 seconds after open
            </div>
          </div>

          {/* Side: what you keep + earner pool */}
          <div className="col" style={{ gap: 16 }}>
            <div className="card" style={{ background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' }}>
              <span className="kicker" style={{ color: 'rgba(255,255,255,.55)' }}>what stays yours</span>
              <h3 className="h3" style={{ marginTop: 8, color: 'inherit' }}>Your Bitcoin. Always.</h3>
              <div className="div" style={{ background: 'rgba(255,255,255,.15)' }} />
              <KeepRow label="Wallet ownership"     yes />
              <KeepRow label="BTC kept (never sold)" yes />
              <KeepRow label="MUSD price stability"  yes />
              <KeepRow label="Cash flow from tips"   yes />
              <KeepRow label="Mezo Earn deposits"    yes />
            </div>

            <div className="card">
              <span className="kicker">numbers · 1-year view</span>
              <h3 className="h3" style={{ marginTop: 8 }}>The math.</h3>
              <div className="div dashed" />
              <NumRow label="You lock"           value={`${collateral} MUSD`} />
              <NumRow label="You receive"        value={`${borrowAmt} MUSD`} accent />
              <NumRow label="Interest in 1 yr"   value={`${yearInterest} MUSD`} />
              <NumRow label="Total to repay"     value={`${(borrowAmt + yearInterest).toFixed(2)} MUSD`} />
              <NumRow label="Effective APR"      value="1.00%" />
              <div className="muted" style={{ fontSize: 11, marginTop: 8, fontStyle: 'italic' }}>vs. credit card APR ~22% · auto loan ~7%</div>
            </div>

            <div className="card" style={{ background: 'var(--bg-2)' }}>
              <span className="kicker">where the money comes from</span>
              <h3 className="h3" style={{ marginTop: 8, fontSize: 18 }}>Lender pool</h3>
              <p className="soft" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 6, marginBottom: 12 }}>
                Other people deposit MUSD into a pool to earn the 1% you pay. Anyone can lend. The pool size right now:
              </p>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                <b style={{ fontFamily: 'var(--font-display)', fontSize: 36 }} className="tabular">12,840</b>
                <span className="muted mono" style={{ fontSize: 11 }}>MUSD · 38 lenders</span>
              </div>
              <Bar pct={62} tone="accent" />
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                <span>borrowed: 7,961</span>
                <span>idle: 4,879</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RiskGauge = ({ collateral, borrowed }) => {
  const liq = collateral * 0.9;
  const safe = collateral * 0.6;
  const pct = (borrowed / collateral) * 100;
  return (
    <div style={{ position: 'relative', height: 36, background: 'var(--bg-2)', border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--good) 0%, var(--good) 55%, var(--warn) 70%, var(--bad) 88%)', opacity: .5 }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'var(--ink)' }} />
      <div style={{ position: 'absolute', left: `${pct}%`, top: -4, bottom: -4, width: 3, background: 'var(--accent)' }} />
      <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: 1, background: 'var(--ink)', opacity: .3 }} />
      <div style={{ position: 'absolute', left: '90%', top: 0, bottom: 0, width: 2, background: 'var(--bad)' }} />
    </div>
  );
};

const KeepRow = ({ label, yes }) => (
  <div className="row" style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
    <span className="grow" style={{ color: 'inherit', opacity: .9 }}>{label}</span>
    <span style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="check" size={12} />
    </span>
  </div>
);

const NumRow = ({ label, value, accent }) => (
  <div className="row" style={{ padding: '8px 0', borderBottom: 'var(--border-w) dashed var(--line-2)' }}>
    <span className="muted grow">{label}</span>
    <b className="tabular" style={{ color: accent ? 'var(--accent)' : 'inherit' }}>{value}</b>
  </div>
);

const ActiveLoan = ({ loan, onRepay }) => (
  <div className="card pop" style={{ padding: 36 }}>
    <div className="row" style={{ alignItems: 'flex-start', gap: 24 }}>
      <div className="grow">
        <span className="kicker"><Icon name="check" size={12} /> credit line open</span>
        <h2 className="h2" style={{ marginTop: 8, fontSize: 38 }}>You now have <Amount value={loan.borrowed} suffix=" MUSD" /> to spend.</h2>
        <p className="soft" style={{ maxWidth: 540 }}>
          Your {loan.collateral} MUSD is locked as collateral. You can repay any portion, anytime. Interest is accruing at 0.0027% per day.
        </p>
      </div>
      <div className="stamp" style={{ width: 110, height: 110, fontSize: 22, transform: 'rotate(-6deg)' }}>open</div>
    </div>

    <div className="div" />

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
      <Mini label="Collateral locked" value={loan.collateral + ' MUSD'} />
      <Mini label="Borrowed" value={loan.borrowed + ' MUSD'} accent />
      <Mini label="Health" value="100%" sub="liquidation @ 90% LTV" tone="good" />
      <Mini label="Interest accrued" value="0.00 MUSD" sub="opened just now" />
    </div>

    <div className="div" />

    <div className="row" style={{ gap: 10 }}>
      <button className="btn primary" onClick={onRepay}>Repay & unlock collateral</button>
      <button className="btn">Top up collateral</button>
      <button className="btn ghost">Borrow more</button>
      <span className="right muted mono" style={{ fontSize: 12 }}>tx 0x9af…32b1</span>
    </div>
  </div>
);

const Mini = ({ label, value, sub, accent, tone }) => (
  <div>
    <div className="kicker">{label}</div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 'var(--display-weight)', marginTop: 6, color: accent ? 'var(--accent)' : tone === 'good' ? 'var(--good)' : 'inherit' }} className="tabular">{value}</div>
    {sub && <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{sub}</div>}
  </div>
);

window.Borrow = Borrow;
