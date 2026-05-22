import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Dynamic Open Graph image for /c/[platform]/[username].
 *
 * Returns a 1200×630 PNG rendered via @vercel/og — perfect for Twitter,
 * Discord, Slack preview cards. Cached at the edge.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform") ?? "twitter";
  const username = (searchParams.get("username") ?? "").replace(/^@/, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, hsl(20 14% 5%) 0%, hsl(22 60% 15%) 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "60px",
          color: "hsl(30 20% 96%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top row: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "hsl(22 90% 56%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "hsl(20 14% 5%)",
              fontWeight: 800,
              fontSize: "32px",
            }}
          >
            N
          </div>
          <span style={{ fontSize: "32px", fontWeight: 600, letterSpacing: "-0.02em" }}>Nih</span>
          <span style={{ marginLeft: "auto", fontSize: "16px", color: "hsl(20 8% 60%)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Tip in MUSD
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: "40px" }}>
          <span style={{ fontSize: "30px", color: "hsl(22 90% 65%)", fontWeight: 500 }}>
            @{username}
          </span>
          <span style={{ fontSize: "80px", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, marginTop: "8px" }}>
            Send Bitcoin-backed
          </span>
          <span style={{ fontSize: "80px", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, color: "hsl(22 90% 56%)" }}>
            money. One click.
          </span>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "20px", color: "hsl(20 8% 60%)" }}>
          <span>{platform}</span>
          <span>nih-seven.vercel.app</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
