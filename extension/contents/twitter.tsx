import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo";
import { useState } from "react";
import { Storage } from "@plasmohq/storage";
import { tip, resolveHandle } from "~lib/tip";
import { TIP_PRESETS } from "~lib/config";

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
  run_at: "document_idle",
};

const storage = new Storage();

/**
 * Inject a Nih button into every tweet's action bar.
 * Strategy: locate tweet articles via stable [data-testid="tweet"] selector,
 * then attach below the existing share/like row.
 */
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  return Array.from(document.querySelectorAll('article[data-testid="tweet"]')).map((el) => ({
    element: el as HTMLElement,
    insertPosition: "beforeend" as const,
  }));
};

function extractAuthor(article: HTMLElement): { username: string; tweetId: string } | null {
  // Author username is in the User-Name area; link is /username
  const userLink = article.querySelector('a[href^="/"][role="link"][tabindex="-1"]') as HTMLAnchorElement | null;
  const username = userLink?.getAttribute("href")?.split("/")[1] ?? "";
  // Tweet ID from the status link
  const statusLink = article.querySelector('a[href*="/status/"]') as HTMLAnchorElement | null;
  const tweetId = statusLink?.getAttribute("href")?.split("/status/")[1]?.split("/")[0] ?? "";
  if (!username) return null;
  return { username, tweetId };
}

function NihTipButton({ article }: { article: HTMLElement }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);

  const meta = extractAuthor(article);
  if (!meta) return null;

  async function handleTip(amount: number) {
    setSending(true);
    setStatus("idle");
    setError(null);
    try {
      const payInMezo = (await storage.get<boolean>("payInMezo")) ?? false;
      await tip({
        platform: "twitter",
        username: meta!.username,
        amount,
        payFeeInMezo: payInMezo,
        context: meta!.tweetId,
      });
      setStatus("ok");
      setTimeout(() => setOpen(false), 1500);
    } catch (err) {
      setStatus("err");
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        margin: "8px 0 0 0",
        display: "inline-block",
        position: "relative",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "999px",
          background: "rgba(247, 147, 26, 0.12)",
          color: "hsl(22, 90%, 56%)",
          border: "1px solid rgba(247, 147, 26, 0.3)",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(247, 147, 26, 0.22)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(247, 147, 26, 0.12)")}
      >
        <span style={{ fontWeight: 700 }}>N</span> Tip MUSD
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            zIndex: 999,
            minWidth: "240px",
            padding: "12px",
            borderRadius: "12px",
            background: "hsl(20, 14%, 8%)",
            border: "1px solid hsl(20, 10%, 16%)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
            color: "hsl(30, 20%, 96%)",
          }}
        >
          <div style={{ fontSize: "11px", color: "hsl(20, 8%, 60%)", marginBottom: "8px" }}>
            Tip <strong style={{ color: "hsl(30, 20%, 96%)" }}>@{meta.username}</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
            {TIP_PRESETS.map((amt) => (
              <button
                key={amt}
                disabled={sending}
                onClick={() => handleTip(amt)}
                style={{
                  height: "36px",
                  borderRadius: "8px",
                  background: "hsl(22, 90%, 56%)",
                  color: "hsl(20, 14%, 5%)",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: sending ? "not-allowed" : "pointer",
                  opacity: sending ? 0.6 : 1,
                }}
              >
                {amt}
              </button>
            ))}
          </div>
          {status === "ok" && (
            <div style={{ fontSize: "12px", color: "hsl(140, 60%, 50%)", marginTop: "8px" }}>
              ✓ Tip sent
            </div>
          )}
          {status === "err" && error && (
            <div style={{ fontSize: "11px", color: "hsl(0, 70%, 60%)", marginTop: "8px" }}>
              {error.slice(0, 80)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TwitterTipInjector({ anchor }: any) {
  return <NihTipButton article={anchor.element as HTMLElement} />;
}
