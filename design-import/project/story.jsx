/* eslint-disable */
// story.jsx — guided 6-beat story overlay (Alice → Bob → Carol)

const Story = ({ beat, total, onNext, onPrev, onClose, onJump }) => {
  const b = STORY_BEATS[beat];
  if (!b) return null;

  return (
    <>
      {/* Backdrop — non-blocking, just a tint at top */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,.06), transparent 30%, transparent 70%, rgba(0,0,0,.45))',
        pointerEvents: 'none',
        zIndex: 1000,
      }} />

      {/* The story dock — bottom center, beautiful */}
      <div className="slide" style={{
        position: 'fixed',
        bottom: 24, left: '50%',
        transform: 'translateX(-50%) scale(var(--dc-inv-zoom, 1))',
        transformOrigin: 'bottom center',
        zIndex: 1001,
        width: 'min(720px, 92vw)',
      }}>
        <div className="card" style={{
          padding: 0,
          overflow: 'hidden',
          background: 'var(--paper)',
          border: 'var(--border-w) var(--border-style) var(--line)',
          boxShadow: '0 20px 60px rgba(0,0,0,.25), var(--shadow-hard)',
        }}>
          {/* progress strip */}
          <div className="row" style={{ gap: 4, padding: '8px 16px', background: 'var(--bg-2)', borderBottom: 'var(--border-w) var(--border-style) var(--line)' }}>
            {Array.from({ length: total }, (_, i) => (
              <button key={i} onClick={() => onJump(i)} style={{
                flex: 1, height: 4,
                background: i <= beat ? 'var(--accent)' : 'var(--line)',
                border: 'none',
                borderRadius: 2,
                cursor: 'default',
              }} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: b.persona ? 'auto 1fr auto' : '1fr auto', gap: 18, padding: '18px 20px', alignItems: 'center' }}>
            {b.persona && (
              <div style={{ position: 'relative' }}>
                <Avatar persona={b.persona} size="lg" />
                <span className="chip" style={{
                  position: 'absolute', bottom: -6, left: -6,
                  background: 'var(--ink)', color: 'var(--paper)',
                  border: 'var(--border-w) var(--border-style) var(--line)',
                }}>{PERSONAS[b.persona].role}</span>
              </div>
            )}
            <div>
              <span className="kicker">chapter {beat + 1} / {total}</span>
              <h3 className="h3" style={{ marginTop: 4, fontSize: 22 }}>{b.title}</h3>
              <p className="soft" style={{ fontSize: 13, lineHeight: 1.5, marginTop: 6, marginBottom: 0 }}>{b.body}</p>
            </div>
            <div className="row" style={{ gap: 6 }}>
              {beat > 0 && <button className="btn sm" onClick={onPrev}>← back</button>}
              <button className="btn primary sm" onClick={onNext}>{b.cta}</button>
              <button className="btn ghost sm" onClick={onClose} title="Exit story"><Icon name="close" size={12} /></button>
            </div>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'center', gap: 8, marginTop: 8 }}>
          <span className="mono" style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 10, letterSpacing: '.1em' }}>
            STORY MODE
          </span>
          <span className="mono muted" style={{ fontSize: 11 }}>← → arrows · esc to exit</span>
        </div>
      </div>
    </>
  );
};

window.Story = Story;
