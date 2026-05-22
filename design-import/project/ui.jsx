/* eslint-disable */
// ui.jsx — shared primitives used across screens

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------- copy tone helpers ---------- */
const TONE = {
  // friendly | technical | hype — each screen gets a key
  hero: {
    friendly:  { kicker: 'a friendlier tip jar', title: 'Tip anyone, anywhere. Get paid in dollars backed by Bitcoin.', sub: 'Nih lives in your browser. One click and a thank-you lands in their wallet — no platform fee, no conversion, no fuss.' },
    technical: { kicker: 'MUSD payments protocol', title: 'Tip MUSD on 7 platforms. Borrow against the receipts.', sub: 'Browser extension + dashboard on Mezo matsnet. 0.5% MUSD fee (or 0.25% in MEZO). 60% LTV credit line, 1% fixed APR.' },
    hype:      { kicker: 'orange-pilled tipping', title: 'Send dollars. Backed by bitcoin. Anywhere on the internet.', sub: 'Every reply guy is a payment terminal. Every creator is a bank account. We did the thing.' },
  },
  claim: {
    friendly:  { title: "Someone left you something.", sub: "Verify the handle, claim what's yours. Takes about a minute." },
    technical: { title: 'Claim escrowed tips.',         sub: "Post a wallet-bound challenge to your public profile. Our verifier signs a Tier 1 attestation; NihRegistry mints the binding on-chain." },
    hype:      { title: "You've got mail (it's money).", sub: 'Strangers gifted you stable money while you were busy. Time to grab it.' },
  },
  borrow: {
    friendly:  { title: 'Borrow against your tips.',       sub: 'Your tips are collateral. Spend the dollars now — keep the Bitcoin in your wallet for later.' },
    technical: { title: 'Open a credit line.',             sub: '60% LTV against MUSD collateral. 1% fixed APR. 90% liquidation threshold with a 0.5% keeper bounty.' },
    hype:      { title: 'Loan, not a sale.',               sub: 'Sell your Bitcoin? Never. Mint dollars against your tip stack and keep stacking.' },
  },
};

/* ---------- glyph svgs ---------- */
const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const s = { width: size, height: size, display: 'inline-block', flex: '0 0 auto' };
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style: s };
  switch (name) {
    case 'home':   return <svg {...props}><path d="M3 11l9-8 9 8" /><path d="M5 9.5V21h14V9.5" /></svg>;
    case 'tip':    return <svg {...props}><path d="M12 3v18" /><path d="M17 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H7" /></svg>;
    case 'claim':  return <svg {...props}><path d="M4 7l8 5 8-5" /><rect x="3" y="5" width="18" height="14" rx="1" /></svg>;
    case 'borrow': return <svg {...props}><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></svg>;
    case 'board':  return <svg {...props}><path d="M5 21V8" /><path d="M12 21V3" /><path d="M19 21v-9" /></svg>;
    case 'puzzle': return <svg {...props}><path d="M14 4a2 2 0 1 1 4 0v2h2a2 2 0 0 1 2 2v3h-2a2 2 0 1 0 0 4h2v5a2 2 0 0 1-2 2h-5v-2a2 2 0 1 0-4 0v2H6a2 2 0 0 1-2-2v-5h2a2 2 0 1 0 0-4H4V8a2 2 0 0 1 2-2h4V4z" /></svg>;
    case 'play':   return <svg {...props}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none"/></svg>;
    case 'arrow':  return <svg {...props}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>;
    case 'check':  return <svg {...props}><path d="M5 12l4 4 10-10" /></svg>;
    case 'copy':   return <svg {...props}><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M16 8V5a1.5 1.5 0 0 0-1.5-1.5h-9A1.5 1.5 0 0 0 4 5v9A1.5 1.5 0 0 0 5.5 15.5H8" /></svg>;
    case 'lock':   return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="1.5" /><path d="M8 11V7a4 4 0 1 1 8 0v4" /></svg>;
    case 'profile':return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>;
    case 'plus':   return <svg {...props}><path d="M12 5v14M5 12h14" /></svg>;
    case 'minus':  return <svg {...props}><path d="M5 12h14" /></svg>;
    case 'sparkle':return <svg {...props}><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" /></svg>;
    case 'bolt':   return <svg {...props}><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" fill="currentColor" stroke="none"/></svg>;
    case 'btc':    return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M9.5 8h4.5a2 2 0 1 1 0 4H9.5m0 0h5a2 2 0 1 1 0 4h-5m0-8v8m2-10v2m0 8v2m-2-10v2m0 8v2" /></svg>;
    case 'close':  return <svg {...props}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    default: return null;
  }
};

/* ---------- avatar ---------- */
const Avatar = ({ persona, size = 'md', label }) => {
  const p = PERSONAS[persona];
  const initials = label || (p ? p.name.split(' ').map(s => s[0]).slice(0,2).join('') : '?');
  const cls = ['avatar', p?.color, size === 'sm' && 'sm', size === 'lg' && 'lg', size === 'xl' && 'xl'].filter(Boolean).join(' ');
  return <span className={cls}>{initials}</span>;
};

/* ---------- platform glyph (mono) ---------- */
const PGlyph = ({ p, size = 16 }) => (
  <span style={{
    width: size, height: size, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: size * 0.7,
    border: 'var(--border-w) var(--border-style) var(--line)',
    background: 'var(--bg-2)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--ink-2)', fontWeight: 600,
  }}>
    {PLATFORM_GLYPHS[p] || '?'}
  </span>
);

/* ---------- amount with the currency mark ---------- */
const Amount = ({ value, big, suffix = ' MUSD', sign }) => {
  const formatted = (typeof value === 'number')
    ? value.toLocaleString(undefined, { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
    : value;
  return (
    <span className="tabular" style={{ fontFamily: big ? 'var(--font-display)' : 'inherit', fontWeight: big ? 'var(--display-weight)' : 600 }}>
      {sign && <span>{sign}</span>}{formatted}<span style={{ opacity: .5, marginLeft: 4, fontWeight: 500 }}>{suffix.trim()}</span>
    </span>
  );
};

/* ---------- tooltip ---------- */
const Tag = ({ children, tone = 'neutral' }) => (
  <span className={`chip ${tone === 'good' ? 'good' : tone === 'warn' ? 'warn' : tone === 'bad' ? 'bad' : tone === 'accent' ? 'accent' : ''}`}>{children}</span>
);

/* ---------- progress bar ---------- */
const Bar = ({ pct, tone = 'accent', label, right }) => (
  <div>
    {label && (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
        <span className="muted">{label}</span>
        <span className="tabular">{right}</span>
      </div>
    )}
    <div style={{
      height: 8,
      background: 'var(--bg-2)',
      border: 'var(--border-w) var(--border-style) var(--line)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, pct))}%`,
        height: '100%',
        background: tone === 'bad' ? 'var(--bad)' : tone === 'warn' ? 'var(--warn)' : tone === 'good' ? 'var(--good)' : 'var(--accent)',
        transition: 'width .5s cubic-bezier(.2,.7,.2,1)',
      }} />
    </div>
  </div>
);

/* ---------- Marginalia note (paper only, decorative) ---------- */
const Note = ({ children, rotate = -4, style }) => (
  <span className="margin-note" style={{ transform: `rotate(${rotate}deg)`, ...style }}>{children}</span>
);

/* ---------- Connect chip ---------- */
const ConnectChip = ({ persona = 'alice' }) => {
  const p = PERSONAS[persona];
  return (
    <div className="wallet-chip">
      <Avatar persona={persona} size="sm" />
      <div className="meta grow">
        <b>{p.name.split(' ')[0]}</b>
        <small>{p.addr}</small>
      </div>
    </div>
  );
};

/* ---------- Pixel-style coin (CSS art) ---------- */
const PixelCoin = ({ size = 24, color = 'var(--accent)' }) => {
  const px = size / 8;
  const grid = [
    "..XXXX..",
    ".XOOOOX.",
    "XOOOXOOX",
    "XOOXXOOX",
    "XOOOXOOX",
    "XOOOXOOX",
    ".XOOOOX.",
    "..XXXX..",
  ];
  return (
    <span style={{ display: 'inline-grid', gridTemplateColumns: `repeat(8, ${px}px)`, gridAutoRows: `${px}px`, lineHeight: 0 }}>
      {grid.flatMap((row,y) => row.split('').map((c,x) => (
        <span key={`${x}-${y}`} style={{
          background: c === 'X' ? 'var(--ink)' : c === 'O' ? color : 'transparent',
        }} />
      )))}
    </span>
  );
};

/* ---------- Toast ---------- */
const Toast = ({ msg, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <div className="pop" style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ink)', color: 'var(--paper)',
      padding: '10px 16px', borderRadius: 'var(--radius-sm)',
      border: 'var(--border-w) var(--border-style) var(--line)',
      boxShadow: 'var(--shadow-hard)',
      fontFamily: 'var(--font-mono)', fontSize: 13,
      zIndex: 9999,
    }}>
      {msg}
    </div>
  );
};

Object.assign(window, {
  TONE, Icon, Avatar, PGlyph, Amount, Tag, Bar, Note,
  ConnectChip, PixelCoin, Toast,
});
