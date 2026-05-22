/* eslint-disable */
// screens/claim.jsx — verify handle + claim parked tips
// 4-step flow: pick platform → enter handle → post challenge → verify & claim

const Claim = ({ go, tone, onClaimed }) => {
  const t = TONE.claim[tone] || TONE.claim.friendly;
  const [step, setStep] = React.useState(0); // 0 platform, 1 handle, 2 challenge, 3 success
  const [platform, setPlatform] = React.useState('twitter');
  const [handle, setHandle] = React.useState('caroldraws');
  const [copied, setCopied] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [verified, setVerified] = React.useState(false);

  const wallet = PERSONAS.carol.addr;
  const challenge = `Verifying my Nih wallet ${wallet} — nih.app/claim`;

  const parked = step === 3 ? 47 : 47; // we'll show this as the prize

  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };

  const verify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      setTimeout(() => setStep(3), 500);
    }, 1600);
  };

  return (
    <div className="screen slide">
      <div className="crumb"><span>nih</span><span className="sep">/</span><span className="active">claim</span></div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <span className="eyebrow">step {step + 1} of 4</span>
          <h1 className="h1" style={{ fontSize: 'clamp(40px,5vw,68px)', marginTop: 6 }}>{t.title}</h1>
          <p className="lede" style={{ marginTop: 12 }}>{t.sub}</p>
        </div>
        {step < 3 && (
          <div style={{ position: 'relative' }}>
            <div className="card" style={{ padding: 14, background: 'var(--bg-2)', textAlign: 'center', minWidth: 200 }}>
              <span className="kicker">waiting in escrow</span>
              <div className="stat" style={{ marginTop: 8 }}>
                <div className="num" style={{ color: 'var(--accent-3)' }}><Amount value={parked} suffix="" /></div>
                <div className="sub">MUSD · 3 senders · expires in 174d</div>
              </div>
            </div>
            <Note rotate={-6} style={{ position: 'absolute', top: -22, right: -14, fontSize: 18 }}>← yours!</Note>
          </div>
        )}
      </div>

      {/* Progress stepper */}
      <Stepper step={step} labels={['Pick platform', 'Enter handle', 'Post challenge', 'Claim']} />

      <div style={{ display: 'grid', gridTemplateColumns: step === 3 ? '1fr' : '1.3fr 1fr', gap: 24, marginTop: 28 }}>
        <div className="card" style={{ padding: 32 }}>
          {step === 0 && (
            <div className="slide">
              <span className="kicker">step 1 — where do they tip you?</span>
              <h2 className="h2" style={{ fontSize: 32, marginTop: 10, marginBottom: 24 }}>Pick a platform.</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {['twitter','github','youtube','substack','medium'].map(p => (
                  <button key={p} onClick={() => setPlatform(p)} className="btn" style={{
                    padding: '20px 16px',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    background: platform === p ? 'var(--accent)' : 'var(--paper)',
                    color: platform === p ? 'var(--accent-ink)' : 'inherit',
                    borderColor: platform === p ? 'var(--ink)' : 'var(--line)',
                  }}>
                    <PGlyph p={p} size={26} />
                    <b style={{ marginTop: 12 }}>{PLATFORM_LABELS[p]}</b>
                    <small className="muted">verified via {p === 'github' ? 'README' : p === 'twitter' ? 'profile bio' : 'about page'}</small>
                  </button>
                ))}
              </div>
              <div className="row" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
                <button className="btn primary" onClick={() => setStep(1)}>Continue <Icon name="arrow" size={14} /></button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="slide">
              <span className="kicker">step 2 — your handle</span>
              <h2 className="h2" style={{ fontSize: 32, marginTop: 10, marginBottom: 24 }}>What's your username on {PLATFORM_LABELS[platform]}?</h2>
              <div className="row" style={{ background: 'var(--bg-2)', border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)', padding: '4px 14px', gap: 0 }}>
                <PGlyph p={platform} size={24} />
                <span className="muted" style={{ marginLeft: 12, fontSize: 18 }}>{platform === 'twitter' ? 'x.com/' : platform === 'github' ? 'github.com/' : platform === 'youtube' ? 'youtube.com/@' : `${platform}.com/@`}</span>
                <input className="input lg" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: '14px 0' }}
                  value={handle} onChange={e => setHandle(e.target.value)} placeholder="yourhandle" />
              </div>
              <div className="card" style={{ background: 'var(--bg-2)', marginTop: 18, padding: 14 }}>
                <div className="row" style={{ gap: 10 }}>
                  <Icon name="sparkle" size={16} />
                  <small><b>We'll search for tips parked under @{handle} on {PLATFORM_LABELS[platform]}.</b> If anyone tipped you before you joined Nih, the funds are sitting in escrow waiting.</small>
                </div>
              </div>
              <div className="row" style={{ marginTop: 24, justifyContent: 'space-between' }}>
                <button className="btn ghost" onClick={() => setStep(0)}>← Back</button>
                <button className="btn primary" onClick={() => setStep(2)}>Continue <Icon name="arrow" size={14} /></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="slide">
              <span className="kicker">step 3 — prove it's you</span>
              <h2 className="h2" style={{ fontSize: 28, marginTop: 10, marginBottom: 16 }}>Post this on your {PLATFORM_LABELS[platform]} {platform === 'github' ? 'README' : 'profile'}.</h2>
              <p className="soft" style={{ marginBottom: 18 }}>It's tied to your wallet — only you can post it from your account. We scrape your public profile, see it, and sign an attestation. Takes about 30 seconds.</p>

              <div className="card" style={{ background: 'var(--bg-2)', padding: 18 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="kicker">your challenge text</span>
                  <button className="btn sm" onClick={copy}><Icon name="copy" size={11} /> {copied ? 'Copied!' : 'Copy'}</button>
                </div>
                <div className="mono" style={{
                  background: 'var(--paper)',
                  border: 'var(--border-w) dashed var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  fontSize: 13,
                  wordBreak: 'break-all',
                  lineHeight: 1.6,
                }}>
                  Verifying my Nih wallet <b style={{ color: 'var(--accent)' }}>{wallet}</b> — nih.app/claim
                </div>
              </div>

              <div className="div dashed" />

              {/* Verify panel */}
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>Posted it? We'll check your profile.</div>
                  <div className="mono" style={{ fontSize: 12 }}>
                    {verifying && <><span className="blink">▌</span> scanning {platform}.com/{handle}…</>}
                    {verified && <span style={{ color: 'var(--good)' }}><Icon name="check" size={11} /> challenge found · signing attestation…</span>}
                    {!verifying && !verified && <span className="muted">⌁ waiting</span>}
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn ghost" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn primary" onClick={verify} disabled={verifying || verified}>
                    {verified ? <><Icon name="check" size={12} /> Verified</> : verifying ? 'Verifying…' : <>Verify now <Icon name="arrow" size={14} /></>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="slide" style={{ textAlign: 'center', padding: '24px 0' }}>
              <div className="pop" style={{ display: 'inline-block', position: 'relative' }}>
                <span className="stamp" style={{ width: 110, height: 110, fontSize: 32 }}>verified</span>
                <Note rotate={-12} style={{ position: 'absolute', top: -16, right: -60, fontSize: 22 }}>🎉 finally!</Note>
              </div>
              <h2 className="h2" style={{ fontSize: 48, marginTop: 28 }}>
                <Amount value={47} suffix="" /> <span style={{ color: 'var(--ink-3)' }}>MUSD</span> — yours.
              </h2>
              <p className="lede" style={{ margin: '12px auto 0', textAlign: 'center' }}>
                Three people tipped you on Twitter before you ever heard of Nih. We held it in escrow. Here it is.
              </p>

              {/* Breakdown */}
              <div className="card" style={{ background: 'var(--bg-2)', textAlign: 'left', marginTop: 32, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
                <span className="kicker">your delivery</span>
                <div className="col" style={{ gap: 10, marginTop: 12 }}>
                  {[
                    { from: 'mira',  amt: 25, note: 'this drawing made my day', when: '6 days ago' },
                    { from: 'dee',   amt: 12, note: 'commission deposit',       when: '4 days ago' },
                    { from: 'jun',   amt: 10, note: 'love your work',           when: '2 days ago' },
                  ].map((p, i) => (
                    <div key={i} className="row" style={{ paddingTop: i ? 8 : 0, borderTop: i ? 'var(--border-w) dashed var(--line-2)' : 'none' }}>
                      <Avatar size="sm" persona={i === 0 ? 'alice' : i === 1 ? 'bob' : 'carol'} label={p.from[0].toUpperCase() + p.from[1].toUpperCase()} />
                      <div className="grow">
                        <b>{p.from}</b>
                        <div className="muted" style={{ fontSize: 12 }}>"{p.note}" · {p.when}</div>
                      </div>
                      <b className="tabular" style={{ color: 'var(--good)' }}>+<Amount value={p.amt} /></b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 32 }}>
                <button className="btn primary lg" onClick={() => { onClaimed && onClaimed(); go('dashboard'); }}>
                  Claim all 47 MUSD <Icon name="arrow" size={14} />
                </button>
                <button className="btn lg" onClick={() => go('borrow')}>
                  Or borrow against it →
                </button>
              </div>
              <div className="mono muted" style={{ fontSize: 12, marginTop: 16 }}>
                gas ≈ 0.00001 BTC · tx will confirm in ~3s
              </div>
            </div>
          )}
        </div>

        {/* Side: live preview / explainer */}
        {step < 3 && (
          <div className="col" style={{ gap: 18 }}>
            <div className="card">
              <span className="kicker">preview · what we'll see</span>
              <h3 className="h3" style={{ marginTop: 6, fontSize: 18, marginBottom: 12 }}>{platform === 'twitter' ? 'x.com/' : platform === 'github' ? 'github.com/' : `${platform}.com/@`}{handle}</h3>
              <ProfilePreview platform={platform} handle={handle} challenge={step === 2 ? challenge : null} wallet={wallet} />
            </div>

            <div className="card" style={{ background: 'var(--bg-2)' }}>
              <span className="kicker">why this works</span>
              <ul style={{ paddingLeft: 18, margin: '10px 0 0', fontSize: 13, lineHeight: 1.6 }}>
                <li>Only <b>you</b> can post on your own profile.</li>
                <li>The challenge is bound to your wallet — an attacker can't forge it.</li>
                <li>We never see your password, never store anything, never post on your behalf.</li>
                <li>You can remove the post the moment we verify.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Stepper = ({ step, labels }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${labels.length}, 1fr)`, gap: 8, marginTop: 8 }}>
    {labels.map((l, i) => (
      <div key={l} style={{
        padding: '12px 14px',
        border: 'var(--border-w) var(--border-style) var(--line)',
        borderRadius: 'var(--radius-sm)',
        background: i <= step ? (i === step ? 'var(--accent)' : 'var(--paper)') : 'var(--bg-2)',
        color: i === step ? 'var(--accent-ink)' : i < step ? 'var(--ink)' : 'var(--ink-3)',
        boxShadow: i === step ? 'var(--shadow-hard)' : 'none',
      }}>
        <div className="row" style={{ gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12 }}>
            {i < step ? <Icon name="check" size={12} /> : `0${i + 1}`}
          </span>
          <b style={{ fontSize: 13 }}>{l}</b>
        </div>
      </div>
    ))}
  </div>
);

const ProfilePreview = ({ platform, handle, challenge, wallet }) => {
  // Render a tiny mockup of the platform profile so users see WHERE to post.
  if (platform === 'twitter') {
    return (
      <div style={{ border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)', padding: 16, background: 'var(--paper)' }}>
        <div style={{ height: 56, background: 'linear-gradient(90deg, #b8d4e8, #d8c4e8)', borderRadius: 6, marginBottom: -28 }} />
        <Avatar size="lg" persona="carol" />
        <h4 style={{ margin: '8px 0 0' }}>{handle}</h4>
        <div className="muted mono" style={{ fontSize: 12 }}>@{handle}</div>
        <p style={{ fontSize: 13, marginTop: 10, marginBottom: 0, lineHeight: 1.5, padding: 8, background: challenge ? '#FFF8B8' : 'var(--bg-2)', border: challenge ? '1.5px dashed var(--accent-3)' : 'var(--border-w) var(--border-style) var(--line-2)', borderRadius: 6 }}>
          Illustrator, gardener. {challenge && <><br/><span className="mono" style={{ fontSize: 11 }}>{challenge}</span></>}
        </p>
      </div>
    );
  }
  if (platform === 'github') {
    return (
      <div style={{ border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)', padding: 14, background: 'var(--paper)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        <div className="muted">📄 README.md</div>
        <div className="div" style={{ margin: '10px 0' }} />
        <div style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-display)' }}># Hi, I'm {handle}.</div>
        <div style={{ marginTop: 6 }}>Open-source maintainer. Coffee enjoyer.</div>
        {challenge && (
          <div style={{ marginTop: 10, padding: 8, background: '#FFF8B8', border: '1.5px dashed var(--accent-3)', borderRadius: 4 }}>
            {challenge}
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)', padding: 14, background: 'var(--paper)' }}>
      <div className="muted mono" style={{ fontSize: 11 }}>{platform} · about</div>
      <h4 style={{ marginTop: 6 }}>{handle}</h4>
      <p style={{ fontSize: 13 }}>A short bio about the creator. {challenge && <span className="mono" style={{ fontSize: 11, display: 'block', marginTop: 8, padding: 8, background: '#FFF8B8', border: '1.5px dashed var(--accent-3)' }}>{challenge}</span>}</p>
    </div>
  );
};

window.Claim = Claim;
