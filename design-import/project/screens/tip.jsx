/* eslint-disable */
// screens/tip.jsx — tip flow with AI suggestion

const Tip = ({ go }) => {
  const [amount, setAmount] = React.useState(5);
  const [note, setNote] = React.useState('thank you for the thread');
  const [payInMezo, setPayInMezo] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const fee = +(payInMezo ? amount * 0.0025 : amount * 0.005).toFixed(4);
  const total = +(amount + (payInMezo ? 0 : fee)).toFixed(4);

  const send = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1400);
  };

  return (
    <div className="screen slide">
      <div className="crumb">
        <span>nih</span><span className="sep">/</span><span>tip</span><span className="sep">/</span><span className="active">@bobbuilds</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 28, alignItems: 'start' }}>
        {/* Left — composer */}
        <div className="card" style={{ padding: 32, position: 'relative', overflow: 'visible' }}>
          {!sent && (
            <>
              {/* recipient block */}
              <div className="row" style={{ gap: 14, marginBottom: 22 }}>
                <Avatar persona="bob" size="lg" />
                <div className="grow">
                  <span className="kicker">tipping</span>
                  <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
                    <b style={{ fontSize: 22 }}>@bobbuilds</b>
                    <Tag tone="good"><Icon name="check" size={10}/> Tier 1 verified</Tag>
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>Bob Marquez · X / Twitter · {PERSONAS.bob.addr}</div>
                </div>
                <button className="btn ghost sm" onClick={() => go('profile')}>view profile →</button>
              </div>

              <div className="div" />

              {/* The post being tipped */}
              <div className="card" style={{ background: 'var(--bg-2)', padding: 16, marginBottom: 22 }}>
                <div className="row" style={{ gap: 10 }}>
                  <Avatar persona="bob" size="sm" />
                  <div className="grow">
                    <b style={{ fontSize: 14 }}>Bob Marquez <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>@bobbuilds · 4h</span></b>
                    <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.5 }}>
                      a quiet thing about money that took me too long to learn:<br/>
                      the moment you can borrow against your savings is the moment your savings stop being lazy.
                    </p>
                    <div className="muted mono" style={{ fontSize: 11, marginTop: 8 }}>↻ 42 · ♡ 318</div>
                  </div>
                </div>
              </div>

              {/* AI suggestion bubble */}
              <AISuggestion onUse={(amt) => setAmount(amt)} chosen={amount} />

              <div className="div" />

              {/* Amount picker */}
              <span className="kicker">how much?</span>
              <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {TIP_PRESETS.map(v => (
                  <button key={v} className="btn lg" onClick={() => setAmount(v)} style={{
                    background: amount === v ? 'var(--accent)' : 'var(--paper)',
                    color: amount === v ? 'var(--accent-ink)' : 'inherit',
                    padding: '14px 20px',
                    minWidth: 80,
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                  }}>
                    {v}
                  </button>
                ))}
                <div className="row" style={{ background: 'var(--paper)', border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)', padding: '0 12px', minWidth: 140 }}>
                  <input className="input lg" type="number" value={amount} onChange={e => setAmount(+e.target.value || 0)} style={{
                    background: 'transparent', border: 'none', boxShadow: 'none', padding: '14px 0', width: 80,
                    fontFamily: 'var(--font-display)', fontSize: 22,
                  }} />
                  <span className="muted">MUSD</span>
                </div>
              </div>

              {/* Note */}
              <div style={{ marginTop: 22 }}>
                <span className="kicker">add a note (optional)</span>
                <input className="input" style={{ marginTop: 8 }} value={note} maxLength={80} onChange={e => setNote(e.target.value)} placeholder="thanks for the thread" />
                <div className="muted mono" style={{ fontSize: 11, marginTop: 4, textAlign: 'right' }}>{note.length}/80</div>
              </div>

              <div className="div dashed" />

              {/* Fee row */}
              <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
                <div className="grow">
                  <span className="kicker">protocol fee</span>
                  <div style={{ fontSize: 14, marginTop: 6 }}>
                    {payInMezo ? <><b>0.25%</b> paid in MEZO</> : <><b>0.5%</b> paid in MUSD</>} · <span className="muted">{payInMezo ? '50% discount applied' : `${fee.toFixed(4)} MUSD`}</span>
                  </div>
                </div>
                <label className="row" style={{ gap: 8, padding: '8px 12px', background: 'var(--bg-2)', border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)', cursor: 'default' }}>
                  <input type="checkbox" checked={payInMezo} onChange={e => setPayInMezo(e.target.checked)} />
                  <span style={{ fontSize: 13 }}>Pay fee in MEZO (50% off)</span>
                </label>
              </div>

              <div className="div" />

              {/* Summary + send */}
              <div className="row" style={{ alignItems: 'flex-end', gap: 16 }}>
                <div className="grow">
                  <span className="kicker">total</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 'var(--display-weight)' }} className="tabular">
                    {total} <span style={{ fontSize: 18, color: 'var(--ink-3)' }}>MUSD</span>
                  </div>
                  <div className="muted mono" style={{ fontSize: 11 }}>
                    {payInMezo && '+ '}{payInMezo ? (fee).toFixed(4) + ' MEZO fee' : ''}{!payInMezo && fee.toFixed(4) + ' MUSD fee included'} · ≈ 3s settlement
                  </div>
                </div>
                <button className="btn primary lg" onClick={send} disabled={sending}>
                  {sending ? 'Confirming in wallet…' : <>Send {amount} MUSD <Icon name="arrow" size={14} /></>}
                </button>
              </div>
            </>
          )}

          {sent && (
            <SentReceipt amount={amount} note={note} fee={fee} payInMezo={payInMezo} go={go} reset={() => { setSent(false); setAmount(5); }} />
          )}
        </div>

        {/* Right — context rails */}
        <div className="col" style={{ gap: 18 }}>
          <RecipientStats />
          <YouVsThem />
          <TipperLeaders />
        </div>
      </div>
    </div>
  );
};

const AISuggestion = ({ onUse, chosen }) => (
  <div className="card" style={{
    background: 'var(--paper)',
    border: 'var(--border-w) dashed var(--accent)',
    boxShadow: 'none',
    padding: 16,
  }}>
    <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
      <div style={{
        width: 28, height: 28, borderRadius: 'var(--radius-sm)',
        background: 'var(--accent)', color: 'var(--accent-ink)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flex: '0 0 auto',
      }}><Icon name="sparkle" size={14} /></div>
      <div className="grow">
        <div className="row" style={{ gap: 8, marginBottom: 4 }}>
          <b style={{ fontSize: 13 }}>Nih suggests <span style={{ color: 'var(--accent)' }}>5 MUSD</span></b>
          <span className="chip" style={{ background: 'var(--bg-2)' }}>claude+boar</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--ink-2)' }}>
          Bob's posts average 4–6 MUSD in tips, and yours sits at 4. Solid post, short read. 5 lands you in the sweet spot.
        </p>
      </div>
      {chosen !== 5 && (
        <button className="btn sm" onClick={() => onUse(5)}>Use → 5</button>
      )}
      {chosen === 5 && <Tag tone="good"><Icon name="check" size={10}/> using</Tag>}
    </div>
  </div>
);

const SentReceipt = ({ amount, note, fee, payInMezo, go, reset }) => (
  <div className="pop" style={{ textAlign: 'center', padding: '32px 8px' }}>
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div className="stamp" style={{ width: 130, height: 130, fontSize: 22 }}>sent.</div>
      <Note rotate={8} style={{ position: 'absolute', top: -20, right: -80, fontSize: 20 }}>nice ✨</Note>
    </div>
    <h2 className="h2" style={{ marginTop: 24, fontSize: 40 }}>
      <Amount value={amount} suffix=" MUSD" /> → @bobbuilds
    </h2>
    <p className="lede" style={{ margin: '12px auto 0' }}>Landed in 2.8 seconds. Bob will see your note next time he opens his dashboard.</p>

    <div className="card" style={{ background: 'var(--bg-2)', marginTop: 28, textAlign: 'left', maxWidth: 480, margin: '28px auto 0' }}>
      <div className="row" style={{ justifyContent: 'space-between', padding: '6px 0' }}><span className="muted">amount</span><b>{amount} MUSD</b></div>
      <div className="row" style={{ justifyContent: 'space-between', padding: '6px 0', borderTop: 'var(--border-w) dashed var(--line-2)' }}><span className="muted">fee</span><b>{fee.toFixed(4)} {payInMezo ? 'MEZO' : 'MUSD'}</b></div>
      <div className="row" style={{ justifyContent: 'space-between', padding: '6px 0', borderTop: 'var(--border-w) dashed var(--line-2)' }}><span className="muted">note</span><b style={{ fontStyle: 'italic' }}>"{note}"</b></div>
      <div className="row" style={{ justifyContent: 'space-between', padding: '6px 0', borderTop: 'var(--border-w) dashed var(--line-2)' }}><span className="muted">tx</span><b className="mono" style={{ fontSize: 12 }}>0x7c2f…91d2</b></div>
    </div>

    <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 28 }}>
      <button className="btn lg" onClick={reset}>Tip again</button>
      <button className="btn lg" onClick={() => go('dashboard')}>Back to dashboard</button>
      <button className="btn primary lg" onClick={() => go('profile')}>Share Bob's profile</button>
    </div>
  </div>
);

const RecipientStats = () => (
  <div className="card">
    <span className="kicker">about bob</span>
    <h3 className="h3" style={{ marginTop: 6 }}>Numbers that matter.</h3>
    <div className="div dashed" />
    {[
      ['Tips received', '522 MUSD', '68 tips'],
      ['Avg tip', '7.7 MUSD', 'mostly 5s'],
      ['Active since', 'Apr 2026', '46 days'],
      ['Last paid out', '2h ago', 'to wallet'],
    ].map(([l, v, sub]) => (
      <div key={l} className="row" style={{ padding: '10px 0', borderTop: 'var(--border-w) dashed var(--line-2)' }}>
        <span className="grow muted">{l}</span>
        <div style={{ textAlign: 'right' }}>
          <b className="tabular">{v}</b>
          <div className="muted" style={{ fontSize: 11 }}>{sub}</div>
        </div>
      </div>
    ))}
  </div>
);

const YouVsThem = () => (
  <div className="card" style={{ background: 'var(--bg-2)' }}>
    <span className="kicker">your tipping</span>
    <h3 className="h3" style={{ marginTop: 6 }}>You & Bob, so far.</h3>
    <div style={{ marginTop: 14 }}>
      <Bar pct={66} label="Sent to Bob this month" right="28 MUSD" />
    </div>
    <div style={{ marginTop: 14 }}>
      <Bar pct={42} label="Your total tipping (Apr)" right="142 MUSD" tone="good" />
    </div>
    <p className="soft" style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}>
      You're in the top 15% of tippers this month. The free coffee section thanks you.
    </p>
  </div>
);

const TipperLeaders = () => (
  <div className="card">
    <span className="kicker">top tippers · 7d</span>
    <div className="col" style={{ marginTop: 10, gap: 0 }}>
      {TOP_TIPPERS.slice(0, 5).map((t, i) => (
        <div key={t.name} className="row" style={{ padding: '8px 0', borderTop: i ? 'var(--border-w) dashed var(--line-2)' : 'none' }}>
          <span className="mono muted" style={{ width: 20, fontSize: 12 }}>0{i+1}</span>
          <Avatar size="sm" label={t.name.slice(0,2)} persona={['alice','bob','carol'][i%3]} />
          <span className="grow"><b>{t.name}</b></span>
          <b className="tabular">{t.sent}</b>
          <span className="muted mono" style={{ fontSize: 11, marginLeft: 6 }}>MUSD</span>
        </div>
      ))}
    </div>
  </div>
);

window.Tip = Tip;
