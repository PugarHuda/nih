/* eslint-disable */
// screens/extension.jsx — shows the injected tip button on Twitter + the popup UI

const Extension = ({ go }) => {
  const [tipState, setTipState] = React.useState('idle'); // idle | sheet | sending | sent
  const [amount, setAmount] = React.useState(5);
  const [popupOpen, setPopupOpen] = React.useState(true);
  const [target, setTarget] = React.useState('bob'); // bob (verified) | carol (unregistered)

  const startTip = (who) => {
    setTarget(who);
    setTipState('sheet');
  };
  const send = () => {
    setTipState('sending');
    setTimeout(() => setTipState('sent'), 1400);
  };

  return (
    <div className="screen slide" style={{ paddingBottom: 100 }}>
      <div className="crumb"><span>nih</span><span className="sep">/</span><span className="active">extension</span></div>

      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <span className="eyebrow">browser extension · v0.3.0</span>
          <h1 className="h1" style={{ fontSize: 'clamp(40px, 5vw, 64px)', marginTop: 6 }}>Tipping that lives where you scroll.</h1>
          <p className="lede" style={{ marginTop: 12 }}>The Nih button gets injected on every post on 7 platforms. Click it, pick an amount, done.</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn">Chrome</button>
          <button className="btn">Brave</button>
          <button className="btn primary"><Icon name="puzzle" size={14} /> Add to browser</button>
        </div>
      </div>

      {/* The big browser mockup */}
      <div className="card" style={{ padding: 0, overflow: 'visible', position: 'relative' }}>
        {/* Browser chrome */}
        <BrowserChrome />

        {/* The page content */}
        <div style={{ background: '#fff', color: '#0F1419', padding: '0 0 40px', borderBottomLeftRadius: 'var(--radius)', borderBottomRightRadius: 'var(--radius)', position: 'relative' }}>
          <TwitterPage onTipBob={() => startTip('bob')} onTipCarol={() => startTip('carol')} />

          {/* Floating popup */}
          {popupOpen && (
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
              <ExtensionPopup onClose={() => setPopupOpen(false)} go={go} />
            </div>
          )}

          {!popupOpen && (
            <button
              onClick={() => setPopupOpen(true)}
              style={{
                position: 'absolute', top: 18, right: 18,
                width: 36, height: 36,
                background: 'var(--accent)', color: 'var(--accent-ink)',
                border: '2px solid #0A0A0A',
                borderRadius: 'var(--radius-sm)',
                cursor: 'default',
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 'var(--display-weight)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10,
              }}
            >N</button>
          )}

          {/* Tip sheet */}
          {tipState !== 'idle' && (
            <TipSheet
              target={target}
              state={tipState}
              amount={amount}
              setAmount={setAmount}
              onSend={send}
              onClose={() => setTipState('idle')}
            />
          )}
        </div>
      </div>

      {/* Explainer strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 28 }}>
        <SmallExplain
          title="One button. Seven platforms."
          body="Twitter, YouTube, Substack, Medium, GitHub, Reddit, Hacker News. Per-post on feeds, per-profile on bio pages."
          icon="puzzle"
        />
        <SmallExplain
          title="Wallet's already there."
          body="Mezo Passport supports MetaMask, Xverse, Unisat, OKX, WalletConnect. Chain auto-switches to matsnet."
          icon="lock"
        />
        <SmallExplain
          title="Verified or escrowed."
          body="If the recipient's linked their handle, MUSD lands instantly. If not, it parks in escrow until they claim — up to 180 days."
          icon="claim"
        />
      </div>
    </div>
  );
};

const BrowserChrome = () => (
  <div style={{
    background: 'var(--bg-2)',
    borderBottom: 'var(--border-w) var(--border-style) var(--line)',
    padding: '10px 14px',
    borderTopLeftRadius: 'var(--radius)',
    borderTopRightRadius: 'var(--radius)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }}>
    <div className="row" style={{ gap: 6 }}>
      {['#FF5F57','#FEBC2E','#28C840'].map(c => <span key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,.2)' }} />)}
    </div>
    <div className="row" style={{ gap: 8, marginLeft: 12 }}>
      <Icon name="arrow" size={14} style={{ transform: 'rotate(180deg)' }} />
      <Icon name="arrow" size={14} />
    </div>
    <div className="row grow" style={{
      background: 'var(--paper)', border: 'var(--border-w) var(--border-style) var(--line)',
      borderRadius: 999, padding: '5px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)', gap: 8,
      maxWidth: 540, marginLeft: 12,
    }}>
      <Icon name="lock" size={11} />
      <span>x.com/bobbuilds/status/1827</span>
    </div>
    <span className="grow" />
    <div className="row" style={{ gap: 6 }}>
      <span className="chip mono" style={{ fontSize: 10 }}>passport</span>
      <span style={{
        width: 28, height: 28, background: 'var(--accent)', color: 'var(--accent-ink)',
        border: '2px solid var(--ink)', borderRadius: 'var(--radius-sm)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 'var(--display-weight)',
        boxShadow: '0 0 0 3px var(--paper)',
      }}>N</span>
    </div>
  </div>
);

const TwitterPage = ({ onTipBob, onTipCarol }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 320px', minHeight: 580, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
    {/* Twitter left rail */}
    <div style={{ padding: '18px 14px', borderRight: '1px solid #eff3f4' }}>
      <div style={{ width: 32, height: 32, background: '#0F1419', borderRadius: 999, marginBottom: 14 }} />
      {['Home','Explore','Notifications','Messages','Bookmarks','Profile'].map(l => (
        <div key={l} style={{ padding: '12px 10px', borderRadius: 999, color: '#0F1419', fontSize: 18, fontWeight: l === 'Home' ? 700 : 400 }}>{l}</div>
      ))}
      <div style={{ marginTop: 14, padding: '12px 0', background: '#1d9bf0', color: '#fff', borderRadius: 999, textAlign: 'center', fontWeight: 700 }}>Post</div>
    </div>

    {/* Feed */}
    <div style={{ borderRight: '1px solid #eff3f4' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #eff3f4', fontWeight: 800, fontSize: 19 }}>Home</div>

      {/* Tweet 1 — Bob (verified, instant tip) */}
      <TweetCard
        name="Bob Marquez" handle="@bobbuilds" verified
        body="a quiet thing about money that took me too long to learn:&#10;the moment you can borrow against your savings is the moment your savings stop being lazy."
        meta="42 ↻  ·  318 ♡  ·  4h"
        onTip={onTipBob}
        avatarPersona="bob"
        injectLabel="Tip MUSD"
        injectStatus="verified"
      />

      {/* Tweet 2 — Carol (unregistered, will escrow) */}
      <TweetCard
        name="Carol Adeyemi" handle="@caroldraws"
        body="my latest commission — a tiny sunlit garden, rendered while listening to side B of a tape someone made me in 2007. (link to print + thanks)"
        meta="11 ↻  ·  186 ♡  ·  6h"
        onTip={onTipCarol}
        avatarPersona="carol"
        injectLabel="Tip MUSD"
        injectStatus="unregistered"
      />

      {/* Tweet 3 — another */}
      <TweetCard
        name="Mira Sato" handle="@miratypes"
        body="hot take: tipping is the most underrated UX surface on the internet."
        meta="8 ↻  ·  124 ♡  ·  1d"
        avatarPersona="alice"
        injectLabel="Tip MUSD"
        injectStatus="verified"
      />
    </div>

    {/* Right rail */}
    <div style={{ padding: 14 }}>
      <div style={{ background: '#f7f9fa', borderRadius: 16, padding: 14 }}>
        <b style={{ fontSize: 19 }}>What's happening</b>
        <div style={{ fontSize: 12, color: '#536471', marginTop: 12 }}>Trending</div>
        <b style={{ fontSize: 14 }}>#tippingisback</b>
        <div style={{ fontSize: 12, color: '#536471', marginTop: 2 }}>1,438 posts</div>
      </div>
    </div>
  </div>
);

const TweetCard = ({ name, handle, body, meta, verified, onTip, avatarPersona, injectLabel, injectStatus }) => (
  <div style={{ padding: '14px 18px', borderBottom: '1px solid #eff3f4', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, color: '#0F1419', position: 'relative' }}>
    <Avatar persona={avatarPersona} size="md" />
    <div>
      <div style={{ fontSize: 14 }}>
        <b>{name}</b> {verified && <span style={{ color: '#1d9bf0' }}>✓</span>} <span style={{ color: '#536471' }}>{handle}</span>
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 15, lineHeight: 1.45, whiteSpace: 'pre-line' }}>{body}</p>
      <div style={{ marginTop: 10, fontSize: 12, color: '#536471', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span>{meta}</span>
        {onTip && (
          <button
            onClick={onTip}
            style={{
              border: '2px solid #0A0A0A',
              background: injectStatus === 'verified' ? 'var(--accent)' : 'var(--paper)',
              color: '#0A0A0A',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              boxShadow: '3px 3px 0 0 #0A0A0A',
              cursor: 'default',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 'var(--display-weight)' }}>N</span>
            {injectLabel}
            {injectStatus === 'unregistered' && <span title="will escrow" style={{ opacity: .55 }}>·escrow</span>}
          </button>
        )}
      </div>
    </div>
  </div>
);

const ExtensionPopup = ({ onClose, go }) => (
  <div className="card" style={{
    width: 320,
    padding: 18,
    background: 'var(--paper)',
    border: '2.5px solid var(--ink)',
    borderRadius: 'var(--radius)',
    boxShadow: '8px 8px 0 0 var(--ink)',
    color: 'var(--ink)',
    fontFamily: 'var(--font-body)',
  }}>
    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
      <div className="row" style={{ gap: 6 }}>
        <span className="rail-brand mark" style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)' }}>nih.</span>
        <span className="chip">v0.3.0</span>
      </div>
      <button className="btn ghost sm" onClick={onClose} style={{ padding: 4 }}><Icon name="close" size={12} /></button>
    </div>

    {/* Wallet */}
    <div className="card" style={{ background: 'var(--bg-2)', padding: 12, boxShadow: 'none' }}>
      <div className="row" style={{ gap: 8 }}>
        <Avatar persona="alice" size="sm" />
        <div className="grow">
          <b style={{ fontSize: 13 }}>Alice</b>
          <div className="mono muted" style={{ fontSize: 10 }}>0xA11ce…b7F2</div>
        </div>
        <Tag tone="good"><span className="dot"/>matsnet</Tag>
      </div>
      <div className="div dashed" style={{ margin: '10px 0' }} />
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="kicker">balance</span>
        <b style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 'var(--display-weight)' }} className="tabular">142.50</b>
      </div>
      <div className="muted mono center" style={{ fontSize: 10, textAlign: 'right' }}>MUSD</div>
    </div>

    {/* Default amount picker */}
    <div style={{ marginTop: 14 }}>
      <span className="kicker">default tip</span>
      <div className="row" style={{ gap: 4, marginTop: 6 }}>
        {TIP_PRESETS.map((v,i) => (
          <button key={v} className="btn sm" style={{
            flex: 1, justifyContent: 'center',
            background: i === 1 ? 'var(--accent)' : 'var(--paper)',
            color: i === 1 ? 'var(--accent-ink)' : 'inherit',
            fontFamily: 'var(--font-display)', fontSize: 16, padding: '8px 0',
          }}>{v}</button>
        ))}
      </div>
    </div>

    {/* MEZO toggle */}
    <label className="row" style={{ marginTop: 14, gap: 8, padding: 10, background: 'var(--bg-2)', border: 'var(--border-w) var(--border-style) var(--line)', borderRadius: 'var(--radius-sm)', cursor: 'default' }}>
      <input type="checkbox" defaultChecked />
      <span style={{ fontSize: 12 }}>Pay fees in MEZO <b>(50% off)</b></span>
    </label>

    {/* Footer */}
    <div className="row" style={{ gap: 4, marginTop: 14 }}>
      <button className="btn sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => go('dashboard')}>Dashboard</button>
      <button className="btn sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => go('claim')}>Claim</button>
    </div>
  </div>
);

const TipSheet = ({ target, state, amount, setAmount, onSend, onClose }) => {
  const recipient = PERSONAS[target];
  const isUnregistered = target === 'carol';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(15,20,25,.45)',
      backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 20,
      borderBottomLeftRadius: 'var(--radius)', borderBottomRightRadius: 'var(--radius)',
    }}>
      <div className="card pop" style={{
        width: 420, padding: 24,
        background: 'var(--paper)',
        border: '2.5px solid var(--ink)',
        boxShadow: '10px 10px 0 0 var(--ink)',
      }}>
        {state === 'sheet' && (
          <>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="kicker">sending a tip</span>
              <button className="btn ghost sm" onClick={onClose} style={{ padding: 4 }}><Icon name="close" size={12} /></button>
            </div>
            <div className="row" style={{ gap: 12, marginBottom: 16 }}>
              <Avatar persona={target} size="md" />
              <div className="grow">
                <b style={{ fontSize: 18 }}>{recipient.name}</b>
                <div className="muted mono" style={{ fontSize: 12 }}>{recipient.handle} · twitter</div>
              </div>
              {isUnregistered
                ? <Tag tone="warn">will escrow</Tag>
                : <Tag tone="good"><Icon name="check" size={10}/> verified</Tag>}
            </div>

            {isUnregistered && (
              <div className="card" style={{ background: 'var(--bg-2)', padding: 10, boxShadow: 'none', marginBottom: 16 }}>
                <div className="row" style={{ gap: 8 }}>
                  <Icon name="bolt" size={14} />
                  <small>Carol hasn't linked her handle yet. Your tip will park in escrow on-chain — she can claim it any time in the next 180 days.</small>
                </div>
              </div>
            )}

            <span className="kicker">amount</span>
            <div className="row" style={{ gap: 6, marginTop: 6 }}>
              {TIP_PRESETS.map(v => (
                <button key={v} className="btn lg" onClick={() => setAmount(v)} style={{
                  flex: 1, justifyContent: 'center',
                  background: amount === v ? 'var(--accent)' : 'var(--paper)',
                  color: amount === v ? 'var(--accent-ink)' : 'inherit',
                  fontFamily: 'var(--font-display)', fontSize: 22,
                }}>{v}</button>
              ))}
            </div>

            <div className="row" style={{ marginTop: 16, justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="muted mono" style={{ fontSize: 11 }}>+ {(amount * 0.005).toFixed(4)} MUSD fee · ≈ 3s</span>
            </div>

            <button className="btn primary lg" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={onSend}>
              Confirm — send {amount} MUSD
            </button>
          </>
        )}
        {state === 'sending' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="pulse" style={{
              width: 64, height: 64, margin: '0 auto', background: 'var(--accent)',
              border: '2.5px solid var(--ink)', borderRadius: 'var(--radius-sm)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 'var(--display-weight)',
            }}>N</div>
            <h3 className="h3" style={{ marginTop: 18 }}>Confirming in your wallet…</h3>
            <p className="muted mono" style={{ fontSize: 12 }}>broadcasting to matsnet · block #1,284,221</p>
          </div>
        )}
        {state === 'sent' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="stamp pop" style={{ width: 100, height: 100, fontSize: 18, margin: '0 auto' }}>
              {isUnregistered ? 'parked' : 'sent.'}
            </div>
            <h3 className="h3" style={{ marginTop: 18 }}>
              {amount} MUSD → {recipient.handle}
            </h3>
            <p className="soft" style={{ fontSize: 13, lineHeight: 1.5, margin: '6px 0 16px' }}>
              {isUnregistered
                ? 'Carol\'s tip is now in escrow. She can claim it anytime in the next 180 days.'
                : 'Landed in 2.8 seconds. Bob\'s dashboard already shows it.'}
            </p>
            <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
              <button className="btn" onClick={onClose}>Done</button>
              <button className="btn primary" onClick={onClose}>Tip again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SmallExplain = ({ title, body, icon }) => (
  <div className="card">
    <div style={{
      width: 36, height: 36, background: 'var(--accent)', color: 'var(--accent-ink)',
      border: 'var(--border-w) var(--border-style) var(--line)',
      borderRadius: 'var(--radius-sm)', display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    }}>
      <Icon name={icon} size={18} />
    </div>
    <h3 className="h3" style={{ fontSize: 20 }}>{title}</h3>
    <p className="soft" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 6, marginBottom: 0 }}>{body}</p>
  </div>
);

window.Extension = Extension;
