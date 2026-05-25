import { useState } from "react";
import { DASHBOARD_URL } from "~lib/config";

/**
 * Shared tip + subscribe panel for the floating extension button.
 *
 * Two modes:
 *   - tip   → /tip?platform=X&username=Y&amount=N (single tx)
 *   - sub   → /stream?platform=X&username=Y&amount=N&duration=2592000
 *            (1-month per-second stream)
 *
 * Shows the target handle + platform up front so the user always knows
 * who they're sending to before they confirm.
 */
export type Platform = "twitter" | "youtube" | "github" | "linkedin";

export function TipPanel({
  username,
  platform,
  onClose,
}: {
  username: string;
  platform: Platform;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"tip" | "sub">("tip");
  const [custom, setCustom] = useState("");

  function go(amount: number) {
    const base = mode === "tip" ? `${DASHBOARD_URL}/tip` : `${DASHBOARD_URL}/stream`;
    const url =
      mode === "tip"
        ? `${base}?platform=${platform}&username=${encodeURIComponent(username)}&amount=${amount}`
        : `${base}?platform=${platform}&username=${encodeURIComponent(username)}&amount=${amount}&duration=2592000`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <div
      style={{
        marginBottom: 8,
        background: "#FFFEF7",
        color: "#0A0A0A",
        border: "3px solid #0A0A0A",
        boxShadow: "4px 4px 0 0 #0A0A0A",
        padding: 12,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        width: 240,
      }}
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {(["tip", "sub"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: "5px 8px",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              background: mode === m ? "#0A0A0A" : "transparent",
              color: mode === m ? "#FFD32D" : "#0A0A0A",
              border: "2px solid #0A0A0A",
              cursor: "pointer",
            }}
          >
            {m === "tip" ? "Tip once" : "Subscribe / mo"}
          </button>
        ))}
      </div>
      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
        {mode === "tip" ? "Tip" : "Subscribe to"} @{username}
      </div>
      <div style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>
        platform: {platform}
        {mode === "sub" ? " · streams for 30 days" : " · single tx"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[1, 5, 10, 25].map((p) => (
          <button key={p} onClick={() => go(p)} style={pillStyle}>
            {p} MUSD{mode === "sub" ? " / mo" : ""}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          type="number"
          min={0.5}
          step={0.5}
          placeholder="custom"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          style={{
            flex: 1,
            padding: "6px 8px",
            border: "2px solid #0A0A0A",
            fontFamily: "system-ui, sans-serif",
            fontSize: 13,
          }}
        />
        <button
          disabled={!Number(custom)}
          onClick={() => go(Number(custom))}
          style={{
            ...pillStyle,
            background: Number(custom) ? "#FFD32D" : "#E8E8E8",
            cursor: Number(custom) ? "pointer" : "not-allowed",
          }}
        >
          Go
        </button>
      </div>
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  padding: "6px 10px",
  background: "#FFD32D",
  color: "#0A0A0A",
  border: "2px solid #0A0A0A",
  fontFamily: "system-ui, sans-serif",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};
