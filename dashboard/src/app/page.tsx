"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect } from "react";

/**
 * Comic landing — ported from the Claude Design HTML handoff
 * (public/landing.html). Pure marketing page outside the (app) route
 * group, so it never imports wagmi/RainbowKit. The wallet flow opens
 * via the "Open the app →" link to /dashboard, which sits behind the
 * Providers context.
 */
export default function LandingPage() {
  useEffect(() => {
    document.body.setAttribute("data-style", "komik");
    document.body.setAttribute("data-mode", "light");
  }, []);

  return (
    <>
      <link rel="stylesheet" href="/landing.css" />
      <Script src="/landing.js" strategy="afterInteractive" />
      <div className="lp">
        {/* Top nav — logo + nav links + ConnectWallet */}
        <header className="lp-nav">
          <Link href="/" className="brand" aria-label="Nih home">
            <img src="/assets/logo.svg" alt="Nih" style={{ height: 36, width: "auto", display: "block" }} />
          </Link>
          <nav>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/logo.html">Brand</Link>
            <Link
              href="/dashboard"
              className="comic-btn primary"
              style={{ fontSize: 14, padding: "6px 14px" }}
            >
              Open the app →
            </Link>
          </nav>
        </header>
    {/* ANIMATED COMIC BACKGROUND */}
    <div className="comic-bg" aria-hidden="true">

      {/* Top strip — going LEFT */}
      <div className="strip">
        {/* 8 panels, then duplicated for seamless loop */}

        {/* PANEL 1: scroll a tweet */}
        <div className="panel tilt-l">
          <span className="label">01 · scroll</span>
          <svg viewBox="0 0 260 200" preserveAspectRatio="xMidYMid slice">
            <rect width="260" height="200" fill="#FBF6E8"/>
            {/* phone */}
            <rect x="80" y="22" width="100" height="156" rx="10" fill="#fff" stroke="#0A0A0A" strokeWidth="4"/>
            <rect x="90" y="42" width="80" height="14" rx="2" fill="#E5E5E5"/>
            <circle cx="100" cy="74" r="8" fill="#C8A2C8" stroke="#0A0A0A" strokeWidth="2"/>
            <rect x="114" y="68" width="48" height="6" rx="1" fill="#0A0A0A"/>
            <rect x="114" y="78" width="40" height="4" rx="1" fill="#888"/>
            <rect x="90" y="96" width="80" height="3" fill="#0A0A0A" opacity=".3"/>
            <rect x="90" y="106" width="60" height="3" fill="#0A0A0A" opacity=".3"/>
            <rect x="90" y="116" width="68" height="3" fill="#0A0A0A" opacity=".3"/>
            {/* finger */}
            <path d="M40 110 Q48 90 56 100 L62 130 Q60 140 50 138 Z" fill="#FFD2B8" stroke="#0A0A0A" strokeWidth="3"/>
            {/* motion lines */}
            <path d="M30 90 L20 92 M30 100 L18 102 M30 110 L20 112" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="bubble" style={{ "top": "60px", "right": "14px" }}>a thread!</span>
          <div className="halftone"></div>
        </div>

        {/* PANEL 2: see the N tip button */}
        <div className="panel tilt-r">
          <span className="label">02 · spot</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FFF6E0"/>
            {/* spotlight rays */}
            <g stroke="#FFD32D" strokeWidth="6" strokeLinecap="round" opacity=".8">
              <line x1="130" y1="100" x2="50"  y2="40"/>
              <line x1="130" y1="100" x2="80"  y2="20"/>
              <line x1="130" y1="100" x2="180" y2="20"/>
              <line x1="130" y1="100" x2="220" y2="40"/>
              <line x1="130" y1="100" x2="240" y2="80"/>
              <line x1="130" y1="100" x2="240" y2="130"/>
              <line x1="130" y1="100" x2="200" y2="180"/>
              <line x1="130" y1="100" x2="60"  y2="180"/>
              <line x1="130" y1="100" x2="30"  y2="130"/>
            </g>
            {/* N button */}
            <rect x="100" y="76" width="60" height="48" rx="0" fill="#F7931A" stroke="#0A0A0A" strokeWidth="4"/>
            <text x="130" y="112" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="38" fill="#0A0A0A">N</text>
          </svg>
          <span className="bubble" style={{ "top": "130px", "left": "16px" }}>that's it!</span>
          <div className="halftone"></div>
        </div>

        {/* PANEL 3: TAP */}
        <div className="panel">
          <span className="label">03 · tap</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FBF6E8"/>
            {/* button being pressed */}
            <rect x="80" y="86" width="100" height="60" rx="0" fill="#F7931A" stroke="#0A0A0A" strokeWidth="4"/>
            <text x="130" y="128" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="44" fill="#0A0A0A">TIP!</text>
            {/* finger from below */}
            <path d="M126 195 L126 158 Q116 152 116 142 L116 130 Q126 122 138 130 L138 145 Q148 148 148 158 L148 195 Z"
                  fill="#FFD2B8" stroke="#0A0A0A" strokeWidth="3"/>
            {/* impact lines */}
            <g stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round">
              <line x1="60" y1="80" x2="40" y2="60"/>
              <line x1="200" y1="80" x2="220" y2="60"/>
              <line x1="50" y1="100" x2="25" y2="100"/>
              <line x1="210" y1="100" x2="235" y2="100"/>
            </g>
          </svg>
          <div className="sfx star" style={{ "top": "12px", "right": "12px", "width": "56px", "height": "56px", "display": "flex", "alignItems": "center", "justifyContent": "center" }}>TAP</div>
          <div className="halftone"></div>
        </div>

        {/* PANEL 4: MUSD FLIES */}
        <div className="panel tilt-l">
          <span className="label">04 · send</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FEF6E6"/>
            {/* motion blur lines */}
            <g stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" opacity=".8">
              <line x1="20"  y1="80"  x2="100" y2="80"/>
              <line x1="10"  y1="105" x2="120" y2="105"/>
              <line x1="30"  y1="130" x2="110" y2="130"/>
              <line x1="20"  y1="55"  x2="90"  y2="55"/>
            </g>
            {/* coin */}
            <g className="coin-spin" style={{ "transformOrigin": "170px 100px" }}>
              <circle cx="170" cy="100" r="36" fill="#F7C700" stroke="#0A0A0A" strokeWidth="4"/>
              <circle cx="170" cy="100" r="28" fill="none" stroke="#0A0A0A" strokeWidth="2" opacity=".4"/>
              <text x="170" y="112" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="36" fill="#0A0A0A">$</text>
            </g>
            {/* sparkle */}
            <g className="sparkle" style={{ "transformOrigin": "220px 50px" }}>
              <path d="M220 38 L224 50 L236 54 L224 58 L220 70 L216 58 L204 54 L216 50 Z" fill="#FF3D7F" stroke="#0A0A0A" strokeWidth="2"/>
            </g>
          </svg>
          <div className="sfx" style={{ "top": "14px", "right": "12px" }}>whoosh!</div>
          <div className="halftone"></div>
        </div>

        {/* PANEL 5: ESCROW VAULT (for carol) */}
        <div className="panel tilt-r">
          <span className="label">05 · park</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#EFE7D2"/>
            {/* vault */}
            <rect x="60" y="58" width="140" height="124" rx="4" fill="#7A9AB5" stroke="#0A0A0A" strokeWidth="4"/>
            <rect x="74" y="72" width="112" height="96" rx="2" fill="#5C7A92" stroke="#0A0A0A" strokeWidth="3"/>
            {/* dial */}
            <circle cx="130" cy="120" r="22" fill="#FBF6E8" stroke="#0A0A0A" strokeWidth="3"/>
            <circle cx="130" cy="120" r="3"  fill="#0A0A0A"/>
            <g stroke="#0A0A0A" strokeWidth="2">
              <line x1="130" y1="120" x2="130" y2="106"/>
            </g>
            <text x="130" y="170" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="14" fill="#0A0A0A">ESCROW</text>
            {/* coin going in */}
            <circle cx="40" cy="48" r="14" fill="#F7C700" stroke="#0A0A0A" strokeWidth="3"/>
            <text x="40" y="54" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="14" fill="#0A0A0A">$</text>
          </svg>
          <span className="bubble" style={{ "top": "12px", "right": "14px" }}>held safe</span>
          <div className="halftone"></div>
        </div>

        {/* PANEL 6: WALLET RECEIVING */}
        <div className="panel">
          <span className="label">06 · land</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FFFBE0"/>
            {/* wallet */}
            <rect x="50" y="90" width="160" height="90" rx="6" fill="#C46A45" stroke="#0A0A0A" strokeWidth="4"/>
            <rect x="50" y="90" width="160" height="20" fill="#A35337"/>
            <line x1="50" y1="110" x2="210" y2="110" stroke="#0A0A0A" strokeWidth="3"/>
            {/* card poking out */}
            <rect x="120" y="76" width="60" height="40" rx="2" fill="#F7C700" stroke="#0A0A0A" strokeWidth="3"/>
            <text x="150" y="100" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="16" fill="#0A0A0A">+5</text>
            {/* sparkles */}
            <g className="sparkle" style={{ "transformOrigin": "60px 50px" }}>
              <path d="M60 42 L62 50 L70 52 L62 54 L60 62 L58 54 L50 52 L58 50 Z" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="1.5"/>
            </g>
            <g className="sparkle" style={{ "transformOrigin": "210px 60px", "animationDelay": ".4s" }}>
              <path d="M210 52 L212 60 L220 62 L212 64 L210 72 L208 64 L200 62 L208 60 Z" fill="#FF3D7F" stroke="#0A0A0A" strokeWidth="1.5"/>
            </g>
          </svg>
          <div className="sfx" style={{ "top": "14px", "right": "14px", "background": "#2B7CE9", "color": "#fff" }}>ka-ching!</div>
          <div className="halftone"></div>
        </div>

        {/* PANEL 7: BORROW UNLOCK */}
        <div className="panel tilt-l">
          <span className="label">07 · borrow</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#E8F0E5"/>
            {/* padlock open */}
            <rect x="92" y="92" width="76" height="60" rx="6" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="4"/>
            <path d="M108 92 L108 70 Q108 50 130 50 Q150 50 150 70 L150 78" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="130" cy="122" r="6" fill="#0A0A0A"/>
            <rect x="128" y="122" width="4" height="12" fill="#0A0A0A"/>
            {/* coins escaping */}
            <g className="float-up" style={{ "transformOrigin": "60px 120px" }}>
              <circle cx="60" cy="160" r="12" fill="#F7C700" stroke="#0A0A0A" strokeWidth="3"/>
              <text x="60" y="164" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="12" fill="#0A0A0A">$</text>
            </g>
            <g className="float-up" style={{ "transformOrigin": "200px 120px", "animationDelay": ".5s" }}>
              <circle cx="200" cy="160" r="12" fill="#F7C700" stroke="#0A0A0A" strokeWidth="3"/>
              <text x="200" y="164" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="12" fill="#0A0A0A">$</text>
            </g>
            <g className="float-up" style={{ "transformOrigin": "30px 80px", "animationDelay": "1s" }}>
              <circle cx="30" cy="100" r="10" fill="#F7C700" stroke="#0A0A0A" strokeWidth="3"/>
              <text x="30" y="104" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="11" fill="#0A0A0A">$</text>
            </g>
          </svg>
          <span className="bubble" style={{ "top": "14px", "right": "12px" }}>unlocked!</span>
          <div className="halftone"></div>
        </div>

        {/* PANEL 8: KEEP BITCOIN */}
        <div className="panel tilt-r">
          <span className="label">08 · keep</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FFEFD2"/>
            {/* big bitcoin coin */}
            <circle cx="130" cy="100" r="56" fill="#F7931A" stroke="#0A0A0A" strokeWidth="4"/>
            <circle cx="130" cy="100" r="44" fill="none" stroke="#0A0A0A" strokeWidth="2" opacity=".4"/>
            <text x="130" y="118" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="56" fill="#0A0A0A">₿</text>
            {/* arms hugging */}
            <path d="M70 130 Q60 156 100 168" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round"/>
            <path d="M190 130 Q200 156 160 168" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round"/>
            {/* hearts */}
            <g className="pop-in" style={{ "transformOrigin": "50px 40px" }}>
              <path d="M50 32 L50 36 Q44 28 38 36 Q38 44 50 50 Q62 44 62 36 Q56 28 50 36" fill="#FF3D7F" stroke="#0A0A0A" strokeWidth="2"/>
            </g>
            <g className="pop-in" style={{ "transformOrigin": "210px 50px", "animationDelay": ".7s" }}>
              <path d="M210 42 L210 46 Q204 38 198 46 Q198 54 210 60 Q222 54 222 46 Q216 38 210 46" fill="#FF3D7F" stroke="#0A0A0A" strokeWidth="2"/>
            </g>
          </svg>
          <span className="bubble" style={{ "top": "12px", "right": "12px" }}>never sold!</span>
          <div className="halftone"></div>
        </div>

        {/* DUPLICATE the same panels for seamless loop */}
        <div className="panel tilt-l">
          <span className="label">01 · scroll</span>
          <svg viewBox="0 0 260 200" preserveAspectRatio="xMidYMid slice">
            <rect width="260" height="200" fill="#FBF6E8"/>
            <rect x="80" y="22" width="100" height="156" rx="10" fill="#fff" stroke="#0A0A0A" strokeWidth="4"/>
            <rect x="90" y="42" width="80" height="14" rx="2" fill="#E5E5E5"/>
            <circle cx="100" cy="74" r="8" fill="#C8A2C8" stroke="#0A0A0A" strokeWidth="2"/>
            <rect x="114" y="68" width="48" height="6" rx="1" fill="#0A0A0A"/>
            <rect x="114" y="78" width="40" height="4" rx="1" fill="#888"/>
            <rect x="90" y="96" width="80" height="3" fill="#0A0A0A" opacity=".3"/>
            <rect x="90" y="106" width="60" height="3" fill="#0A0A0A" opacity=".3"/>
            <rect x="90" y="116" width="68" height="3" fill="#0A0A0A" opacity=".3"/>
            <path d="M40 110 Q48 90 56 100 L62 130 Q60 140 50 138 Z" fill="#FFD2B8" stroke="#0A0A0A" strokeWidth="3"/>
            <path d="M30 90 L20 92 M30 100 L18 102 M30 110 L20 112" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span className="bubble" style={{ "top": "60px", "right": "14px" }}>a thread!</span>
          <div className="halftone"></div>
        </div>
        <div className="panel tilt-r">
          <span className="label">02 · spot</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FFF6E0"/>
            <g stroke="#FFD32D" strokeWidth="6" strokeLinecap="round" opacity=".8">
              <line x1="130" y1="100" x2="50"  y2="40"/>
              <line x1="130" y1="100" x2="80"  y2="20"/>
              <line x1="130" y1="100" x2="180" y2="20"/>
              <line x1="130" y1="100" x2="220" y2="40"/>
              <line x1="130" y1="100" x2="240" y2="80"/>
              <line x1="130" y1="100" x2="240" y2="130"/>
              <line x1="130" y1="100" x2="200" y2="180"/>
              <line x1="130" y1="100" x2="60"  y2="180"/>
              <line x1="130" y1="100" x2="30"  y2="130"/>
            </g>
            <rect x="100" y="76" width="60" height="48" rx="0" fill="#F7931A" stroke="#0A0A0A" strokeWidth="4"/>
            <text x="130" y="112" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="38" fill="#0A0A0A">N</text>
          </svg>
          <span className="bubble" style={{ "top": "130px", "left": "16px" }}>that's it!</span>
          <div className="halftone"></div>
        </div>
        <div className="panel">
          <span className="label">03 · tap</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FBF6E8"/>
            <rect x="80" y="86" width="100" height="60" rx="0" fill="#F7931A" stroke="#0A0A0A" strokeWidth="4"/>
            <text x="130" y="128" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="44" fill="#0A0A0A">TIP!</text>
            <path d="M126 195 L126 158 Q116 152 116 142 L116 130 Q126 122 138 130 L138 145 Q148 148 148 158 L148 195 Z"
                  fill="#FFD2B8" stroke="#0A0A0A" strokeWidth="3"/>
            <g stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round">
              <line x1="60" y1="80" x2="40" y2="60"/>
              <line x1="200" y1="80" x2="220" y2="60"/>
              <line x1="50" y1="100" x2="25" y2="100"/>
              <line x1="210" y1="100" x2="235" y2="100"/>
            </g>
          </svg>
          <div className="sfx star" style={{ "top": "12px", "right": "12px", "width": "56px", "height": "56px", "display": "flex", "alignItems": "center", "justifyContent": "center" }}>TAP</div>
          <div className="halftone"></div>
        </div>
        <div className="panel tilt-l">
          <span className="label">04 · send</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FEF6E6"/>
            <g stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" opacity=".8">
              <line x1="20"  y1="80"  x2="100" y2="80"/>
              <line x1="10"  y1="105" x2="120" y2="105"/>
              <line x1="30"  y1="130" x2="110" y2="130"/>
              <line x1="20"  y1="55"  x2="90"  y2="55"/>
            </g>
            <g className="coin-spin" style={{ "transformOrigin": "170px 100px" }}>
              <circle cx="170" cy="100" r="36" fill="#F7C700" stroke="#0A0A0A" strokeWidth="4"/>
              <circle cx="170" cy="100" r="28" fill="none" stroke="#0A0A0A" strokeWidth="2" opacity=".4"/>
              <text x="170" y="112" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="36" fill="#0A0A0A">$</text>
            </g>
            <g className="sparkle" style={{ "transformOrigin": "220px 50px" }}>
              <path d="M220 38 L224 50 L236 54 L224 58 L220 70 L216 58 L204 54 L216 50 Z" fill="#FF3D7F" stroke="#0A0A0A" strokeWidth="2"/>
            </g>
          </svg>
          <div className="sfx" style={{ "top": "14px", "right": "12px" }}>whoosh!</div>
          <div className="halftone"></div>
        </div>
      </div>{/* /strip top */}

      {/* Bottom strip — going RIGHT (reverse) */}
      <div className="strip reverse">
        {/* different panel order for visual variety */}
        <div className="panel tilt-r">
          <span className="label">05 · park</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#EFE7D2"/>
            <rect x="60" y="58" width="140" height="124" rx="4" fill="#7A9AB5" stroke="#0A0A0A" strokeWidth="4"/>
            <rect x="74" y="72" width="112" height="96" rx="2" fill="#5C7A92" stroke="#0A0A0A" strokeWidth="3"/>
            <circle cx="130" cy="120" r="22" fill="#FBF6E8" stroke="#0A0A0A" strokeWidth="3"/>
            <circle cx="130" cy="120" r="3"  fill="#0A0A0A"/>
            <line x1="130" y1="120" x2="130" y2="106" stroke="#0A0A0A" strokeWidth="2"/>
            <text x="130" y="170" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="14" fill="#0A0A0A">ESCROW</text>
            <circle cx="40" cy="48" r="14" fill="#F7C700" stroke="#0A0A0A" strokeWidth="3"/>
            <text x="40" y="54" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="14" fill="#0A0A0A">$</text>
          </svg>
          <span className="bubble" style={{ "top": "12px", "right": "14px" }}>held safe</span>
          <div className="halftone"></div>
        </div>

        <div className="panel">
          <span className="label">06 · land</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FFFBE0"/>
            <rect x="50" y="90" width="160" height="90" rx="6" fill="#C46A45" stroke="#0A0A0A" strokeWidth="4"/>
            <rect x="50" y="90" width="160" height="20" fill="#A35337"/>
            <line x1="50" y1="110" x2="210" y2="110" stroke="#0A0A0A" strokeWidth="3"/>
            <rect x="120" y="76" width="60" height="40" rx="2" fill="#F7C700" stroke="#0A0A0A" strokeWidth="3"/>
            <text x="150" y="100" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="16" fill="#0A0A0A">+5</text>
            <g className="sparkle" style={{ "transformOrigin": "60px 50px" }}>
              <path d="M60 42 L62 50 L70 52 L62 54 L60 62 L58 54 L50 52 L58 50 Z" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="1.5"/>
            </g>
          </svg>
          <div className="sfx" style={{ "top": "14px", "right": "14px", "background": "#2B7CE9", "color": "#fff" }}>ka-ching!</div>
          <div className="halftone"></div>
        </div>

        <div className="panel tilt-l">
          <span className="label">07 · borrow</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#E8F0E5"/>
            <rect x="92" y="92" width="76" height="60" rx="6" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="4"/>
            <path d="M108 92 L108 70 Q108 50 130 50 Q150 50 150 70 L150 78" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="130" cy="122" r="6" fill="#0A0A0A"/>
            <rect x="128" y="122" width="4" height="12" fill="#0A0A0A"/>
            <g className="float-up" style={{ "transformOrigin": "60px 120px" }}>
              <circle cx="60" cy="160" r="12" fill="#F7C700" stroke="#0A0A0A" strokeWidth="3"/>
              <text x="60" y="164" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="12" fill="#0A0A0A">$</text>
            </g>
            <g className="float-up" style={{ "transformOrigin": "200px 120px", "animationDelay": ".5s" }}>
              <circle cx="200" cy="160" r="12" fill="#F7C700" stroke="#0A0A0A" strokeWidth="3"/>
              <text x="200" y="164" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="12" fill="#0A0A0A">$</text>
            </g>
          </svg>
          <span className="bubble" style={{ "top": "14px", "right": "12px" }}>unlocked!</span>
          <div className="halftone"></div>
        </div>

        <div className="panel tilt-r">
          <span className="label">08 · keep</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FFEFD2"/>
            <circle cx="130" cy="100" r="56" fill="#F7931A" stroke="#0A0A0A" strokeWidth="4"/>
            <circle cx="130" cy="100" r="44" fill="none" stroke="#0A0A0A" strokeWidth="2" opacity=".4"/>
            <text x="130" y="118" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="56" fill="#0A0A0A">₿</text>
            <path d="M70 130 Q60 156 100 168" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round"/>
            <path d="M190 130 Q200 156 160 168" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round"/>
            <g className="pop-in" style={{ "transformOrigin": "50px 40px" }}>
              <path d="M50 32 L50 36 Q44 28 38 36 Q38 44 50 50 Q62 44 62 36 Q56 28 50 36" fill="#FF3D7F" stroke="#0A0A0A" strokeWidth="2"/>
            </g>
          </svg>
          <span className="bubble" style={{ "top": "12px", "right": "12px" }}>never sold!</span>
          <div className="halftone"></div>
        </div>

        <div className="panel">
          <span className="label">01 · scroll</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FBF6E8"/>
            <rect x="80" y="22" width="100" height="156" rx="10" fill="#fff" stroke="#0A0A0A" strokeWidth="4"/>
            <rect x="90" y="42" width="80" height="14" rx="2" fill="#E5E5E5"/>
            <circle cx="100" cy="74" r="8" fill="#C8A2C8" stroke="#0A0A0A" strokeWidth="2"/>
            <rect x="114" y="68" width="48" height="6" rx="1" fill="#0A0A0A"/>
            <rect x="114" y="78" width="40" height="4" rx="1" fill="#888"/>
            <rect x="90" y="96" width="80" height="3" fill="#0A0A0A" opacity=".3"/>
            <rect x="90" y="106" width="60" height="3" fill="#0A0A0A" opacity=".3"/>
            <rect x="90" y="116" width="68" height="3" fill="#0A0A0A" opacity=".3"/>
            <path d="M40 110 Q48 90 56 100 L62 130 Q60 140 50 138 Z" fill="#FFD2B8" stroke="#0A0A0A" strokeWidth="3"/>
          </svg>
          <span className="bubble" style={{ "top": "60px", "right": "14px" }}>a thread!</span>
          <div className="halftone"></div>
        </div>

        <div className="panel tilt-l">
          <span className="label">04 · send</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FEF6E6"/>
            <g stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" opacity=".8">
              <line x1="20"  y1="80"  x2="100" y2="80"/>
              <line x1="10"  y1="105" x2="120" y2="105"/>
              <line x1="30"  y1="130" x2="110" y2="130"/>
              <line x1="20"  y1="55"  x2="90"  y2="55"/>
            </g>
            <g className="coin-spin" style={{ "transformOrigin": "170px 100px" }}>
              <circle cx="170" cy="100" r="36" fill="#F7C700" stroke="#0A0A0A" strokeWidth="4"/>
              <circle cx="170" cy="100" r="28" fill="none" stroke="#0A0A0A" strokeWidth="2" opacity=".4"/>
              <text x="170" y="112" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="36" fill="#0A0A0A">$</text>
            </g>
          </svg>
          <div className="sfx" style={{ "top": "14px", "right": "12px" }}>whoosh!</div>
          <div className="halftone"></div>
        </div>

        {/* duplicates for seamless reverse loop */}
        <div className="panel tilt-r">
          <span className="label">05 · park</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#EFE7D2"/>
            <rect x="60" y="58" width="140" height="124" rx="4" fill="#7A9AB5" stroke="#0A0A0A" strokeWidth="4"/>
            <rect x="74" y="72" width="112" height="96" rx="2" fill="#5C7A92" stroke="#0A0A0A" strokeWidth="3"/>
            <circle cx="130" cy="120" r="22" fill="#FBF6E8" stroke="#0A0A0A" strokeWidth="3"/>
            <circle cx="130" cy="120" r="3"  fill="#0A0A0A"/>
            <line x1="130" y1="120" x2="130" y2="106" stroke="#0A0A0A" strokeWidth="2"/>
            <text x="130" y="170" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="14" fill="#0A0A0A">ESCROW</text>
          </svg>
          <span className="bubble" style={{ "top": "12px", "right": "14px" }}>held safe</span>
          <div className="halftone"></div>
        </div>
        <div className="panel">
          <span className="label">06 · land</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FFFBE0"/>
            <rect x="50" y="90" width="160" height="90" rx="6" fill="#C46A45" stroke="#0A0A0A" strokeWidth="4"/>
            <rect x="50" y="90" width="160" height="20" fill="#A35337"/>
            <rect x="120" y="76" width="60" height="40" rx="2" fill="#F7C700" stroke="#0A0A0A" strokeWidth="3"/>
            <text x="150" y="100" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="16" fill="#0A0A0A">+5</text>
          </svg>
          <div className="sfx" style={{ "top": "14px", "right": "14px", "background": "#2B7CE9", "color": "#fff" }}>ka-ching!</div>
          <div className="halftone"></div>
        </div>
        <div className="panel tilt-l">
          <span className="label">07 · borrow</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#E8F0E5"/>
            <rect x="92" y="92" width="76" height="60" rx="6" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="4"/>
            <path d="M108 92 L108 70 Q108 50 130 50 Q150 50 150 70 L150 78" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="130" cy="122" r="6" fill="#0A0A0A"/>
            <rect x="128" y="122" width="4" height="12" fill="#0A0A0A"/>
          </svg>
          <span className="bubble" style={{ "top": "14px", "right": "12px" }}>unlocked!</span>
          <div className="halftone"></div>
        </div>
        <div className="panel tilt-r">
          <span className="label">08 · keep</span>
          <svg viewBox="0 0 260 200">
            <rect width="260" height="200" fill="#FFEFD2"/>
            <circle cx="130" cy="100" r="56" fill="#F7931A" stroke="#0A0A0A" strokeWidth="4"/>
            <circle cx="130" cy="100" r="44" fill="none" stroke="#0A0A0A" strokeWidth="2" opacity=".4"/>
            <text x="130" y="118" textAnchor="middle" fontFamily="Bangers,sans-serif" fontSize="56" fill="#0A0A0A">₿</text>
          </svg>
          <span className="bubble" style={{ "top": "12px", "right": "12px" }}>never sold!</span>
          <div className="halftone"></div>
        </div>

      </div>{/* /strip bottom */}
    </div>{/* /comic-bg */}

    {/* HERO */}
    <main className="lp-hero">
      <span className="kicker">tipping that lives where you scroll</span>
      <h1>nih<span className="dot-big"></span></h1>
      <p className="tagline">Tip MUSD on every platform. Borrow against it. Keep your Bitcoin.</p>
      <div className="ctas">
        <a className="lp-cta primary" href="/dashboard">
          Enter the app
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
        </a>
        <a className="lp-cta" href="/dashboard">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
          Watch the 3-minute story
        </a>
      </div>
    </main>

    {/* LIVE TIP TICKER */}
    <div className="lp-ticker"></div>

    {/* STORY COMIC — full narrative comic page */}
    <section className="story-comic" id="story">
      <div className="sc-head">
        <span className="sc-kicker">the story · in 6 panels</span>
        <h2 className="sc-title">How a tip becomes a credit line.</h2>
        <p className="sc-sub">Alice tips Bob. Bob stacks tips. Bob borrows against the stack. Bob keeps his Bitcoin. The end (and the beginning).</p>
      </div>

      <div className="story-grid">

        {/* PANEL 1: Alice reads Bob's thread on her laptop */}
        <article className="scp scp-1">
          <span className="sc-label">P.1 · the scroll</span>
          <div className="sc-art">
            <svg viewBox="0 0 600 380" preserveAspectRatio="xMidYMid slice">
              <rect width="600" height="380" fill="#FFF6E0"/>
              {/* desk lamp glow */}
              <circle cx="120" cy="60" r="80" fill="#FFD32D" opacity=".5"/>
              {/* laptop */}
              <rect x="180" y="120" width="320" height="180" rx="10" fill="#fff" stroke="#0A0A0A" strokeWidth="5"/>
              <rect x="180" y="120" width="320" height="22" fill="#0A0A0A"/>
              <circle cx="194" cy="131" r="3" fill="#FF5F57"/>
              <circle cx="208" cy="131" r="3" fill="#FEBC2E"/>
              <circle cx="222" cy="131" r="3" fill="#28C840"/>
              {/* tweet card */}
              <rect x="200" y="160" width="280" height="120" rx="6" fill="#FBF6E8" stroke="#0A0A0A" strokeWidth="3"/>
              <circle cx="222" cy="184" r="12" fill="#6EB5C0" stroke="#0A0A0A" strokeWidth="2.5"/>
              <text x="244" y="178" fontFamily="Geist, sans-serif" fontSize="11" fontWeight="700" fill="#0A0A0A">Bob Marquez</text>
              <text x="244" y="190" fontFamily="Geist Mono, monospace" fontSize="9" fill="#555">@bobbuilds · 4h</text>
              <text x="210" y="220" fontFamily="Geist, sans-serif" fontSize="12" fill="#0A0A0A">"the moment you can borrow against</text>
              <text x="210" y="238" fontFamily="Geist, sans-serif" fontSize="12" fill="#0A0A0A">your savings is the moment they</text>
              <text x="210" y="256" fontFamily="Geist, sans-serif" fontSize="12" fill="#0A0A0A">stop being lazy."</text>
              {/* N TIP button */}
              <rect x="420" y="260" width="50" height="20" fill="#F7931A" stroke="#0A0A0A" strokeWidth="2.5"/>
              <text x="445" y="274" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="12" fill="#0A0A0A">N TIP</text>
              {/* laptop base */}
              <rect x="166" y="298" width="350" height="14" rx="4" fill="#E5E5E5" stroke="#0A0A0A" strokeWidth="3"/>
              {/* coffee cup */}
              <ellipse cx="80" cy="280" rx="25" ry="8" fill="#0A0A0A" opacity=".15"/>
              <rect x="60" y="240" width="40" height="44" fill="#C46A45" stroke="#0A0A0A" strokeWidth="3"/>
              <ellipse cx="80" cy="240" rx="20" ry="6" fill="#3a1f12" stroke="#0A0A0A" strokeWidth="3"/>
              <path d="M100 250 Q120 252 120 262 Q120 272 100 272" fill="none" stroke="#0A0A0A" strokeWidth="3"/>
              {/* steam */}
              <path d="M70 232 Q66 222 72 214 Q78 206 74 198" fill="none" stroke="#0A0A0A" strokeWidth="2" opacity=".5"/>
              <path d="M88 230 Q92 220 86 212 Q80 204 84 196" fill="none" stroke="#0A0A0A" strokeWidth="2" opacity=".5"/>
            </svg>
          </div>
          <div className="sc-halftone"></div>
          <span className="sc-bubble" style={{ "top": "30px", "right": "28px" }}>good thread.</span>
          <span className="sc-caption">Alice's reading Bob's late-night thread. There's a small "N" button on every post. She's never tipped anyone before.</span>
        </article>

        {/* PANEL 2: tap close-up */}
        <article className="scp scp-2">
          <span className="sc-label">P.2 · tap</span>
          <div className="sc-art">
            <svg viewBox="0 0 300 220">
              <rect width="300" height="220" fill="#FBF6E8"/>
              {/* action lines */}
              <g stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round">
                <line x1="60"  y1="60" x2="40"  y2="40"/>
                <line x1="240" y1="60" x2="260" y2="40"/>
                <line x1="60"  y1="160" x2="40" y2="180"/>
                <line x1="240" y1="160" x2="260" y2="180"/>
                <line x1="40"  y1="110" x2="20" y2="110"/>
                <line x1="260" y1="110" x2="280" y2="110"/>
              </g>
              {/* N button big */}
              <rect x="100" y="80" width="100" height="60" fill="#F7931A" stroke="#0A0A0A" strokeWidth="5"/>
              <text x="150" y="124" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="44" fill="#0A0A0A">N</text>
              {/* finger */}
              <path d="M152 215 L152 175 Q142 168 142 158 L142 144 Q152 134 168 144 L168 160 Q180 164 180 174 L180 215 Z" fill="#FFD2B8" stroke="#0A0A0A" strokeWidth="3"/>
            </svg>
          </div>
          <div className="sc-halftone"></div>
          <span className="sc-sfx" style={{ "top": "12px", "right": "12px", "background": "#FFD32D", "color": "#0A0A0A" }}>TAP!</span>
        </article>

        {/* PANEL 3: coin flies */}
        <article className="scp scp-3">
          <span className="sc-label">P.3 · whoosh</span>
          <div className="sc-art">
            <svg viewBox="0 0 300 220">
              <rect width="300" height="220" fill="#FFEFD2"/>
              <g stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" opacity=".75">
                <line x1="20"  y1="80"  x2="120" y2="80"/>
                <line x1="10"  y1="110" x2="130" y2="110"/>
                <line x1="30"  y1="140" x2="115" y2="140"/>
                <line x1="20"  y1="60"  x2="100" y2="60"/>
              </g>
              <circle cx="200" cy="110" r="40" fill="#F7C700" stroke="#0A0A0A" strokeWidth="5"/>
              <circle cx="200" cy="110" r="30" fill="none" stroke="#0A0A0A" strokeWidth="2" opacity=".4"/>
              <text x="200" y="124" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="38" fill="#0A0A0A">$</text>
              <path d="M260 50 L264 62 L276 66 L264 70 L260 82 L256 70 L244 66 L256 62 Z" fill="#FF3D7F" stroke="#0A0A0A" strokeWidth="2"/>
            </svg>
          </div>
          <div className="sc-halftone"></div>
          <span className="sc-sfx" style={{ "top": "12px", "right": "12px", "background": "#FF3D7F", "color": "#fff" }}>WHOOSH!</span>
        </article>

        {/* PANEL 4: Bob's wallet pings */}
        <article className="scp scp-4">
          <span className="sc-label">P.4 · land</span>
          <div className="sc-art">
            <svg viewBox="0 0 480 380">
              <rect width="480" height="380" fill="#FFFBE0"/>
              {/* Bob */}
              <circle cx="120" cy="170" r="70" fill="#6EB5C0" stroke="#0A0A0A" strokeWidth="5"/>
              <text x="120" y="186" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="44" fill="#102A2F">BOB</text>
              {/* arm holding phone */}
              <rect x="200" y="200" width="40" height="50" fill="#C8A2C8" stroke="#0A0A0A" strokeWidth="4"/>
              <rect x="180" y="120" width="120" height="200" rx="14" fill="#fff" stroke="#0A0A0A" strokeWidth="5"/>
              <rect x="180" y="120" width="120" height="24" fill="#0A0A0A"/>
              <text x="240" y="170" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="11" fill="#999">YOUR WALLET</text>
              {/* balance change */}
              <rect x="194" y="186" width="92" height="56" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="3"/>
              <text x="240" y="220" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="32" fill="#0A0A0A">+5</text>
              <text x="240" y="236" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="10" fill="#0A0A0A">MUSD</text>
              <text x="240" y="270" textAnchor="middle" fontFamily="Geist, sans-serif" fontSize="11" fill="#0A0A0A">"thank you for the thread"</text>
              <text x="240" y="288" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="9" fill="#888">— alice · 3s ago</text>
              {/* sparkles */}
              <path d="M340 90 L344 102 L356 106 L344 110 L340 122 L336 110 L324 106 L336 102 Z" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="2"/>
              <path d="M400 200 L404 212 L416 216 L404 220 L400 232 L396 220 L384 216 L396 212 Z" fill="#FF3D7F" stroke="#0A0A0A" strokeWidth="2"/>
              <path d="M380 320 L383 329 L392 332 L383 335 L380 344 L377 335 L368 332 L377 329 Z" fill="#5CFFA1" stroke="#0A0A0A" strokeWidth="2"/>
            </svg>
          </div>
          <div className="sc-halftone"></div>
          <span className="sc-sfx" style={{ "top": "14px", "right": "14px", "background": "#2B7CE9", "color": "#fff" }}>KA-CHING!</span>
          <span className="sc-caption">3 seconds. No fee. Bob sees Alice's note. The money is real, stable, and his.</span>
        </article>

        {/* PANEL 5: credit unlock — Bob locks tips, gets credit */}
        <article className="scp scp-5">
          <span className="sc-label">P.5 · unlock</span>
          <div className="sc-art">
            <svg viewBox="0 0 480 380">
              <rect width="480" height="380" fill="#E8F0E5"/>
              {/* vault chest closed → open */}
              <rect x="80" y="180" width="180" height="140" rx="6" fill="#C46A45" stroke="#0A0A0A" strokeWidth="5"/>
              <rect x="80" y="180" width="180" height="30" fill="#A35337"/>
              <line x1="80" y1="210" x2="260" y2="210" stroke="#0A0A0A" strokeWidth="4"/>
              <text x="170" y="270" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="20" fill="#0A0A0A">218 MUSD</text>
              <text x="170" y="295" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="10" fill="#0A0A0A">collected from tips</text>
              {/* padlock open */}
              <rect x="148" y="138" width="44" height="36" rx="4" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="4"/>
              <path d="M156 138 L156 122 Q156 104 170 104 Q184 104 184 122 L184 128" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round"/>
              {/* arrow + new credit */}
              <path d="M290 240 L350 240" stroke="#0A0A0A" strokeWidth="5" strokeLinecap="round"/>
              <path d="M340 230 L355 240 L340 250" fill="none" stroke="#0A0A0A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              {/* credit card */}
              <rect x="360" y="180" width="100" height="120" rx="8" fill="#F7C700" stroke="#0A0A0A" strokeWidth="5"/>
              <rect x="370" y="200" width="80" height="14" fill="#0A0A0A"/>
              <text x="410" y="248" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="20" fill="#0A0A0A">130</text>
              <text x="410" y="266" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="9" fill="#0A0A0A">MUSD CREDIT</text>
              <text x="410" y="282" textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize="9" fill="#0A0A0A">1% FIXED</text>
              {/* sparkle on padlock */}
              <path d="M210 110 L213 120 L223 123 L213 126 L210 136 L207 126 L197 123 L207 120 Z" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="2"/>
            </svg>
          </div>
          <div className="sc-halftone"></div>
          <span className="sc-sfx" style={{ "top": "14px", "right": "14px", "background": "#5CFFA1", "color": "#0A0A0A" }}>CLINK!</span>
          <span className="sc-caption">Lock 218 MUSD. Mint 130. Pay 1.30 in interest a year. Spend the cash today.</span>
        </article>

        {/* PANEL 6: Bob keeps his Bitcoin — wide hero panel */}
        <article className="scp scp-6">
          <span className="sc-label">P.6 · keep</span>
          <div className="sc-art">
            <svg viewBox="0 0 1180 240" preserveAspectRatio="xMidYMid slice">
              <rect width="1180" height="240" fill="#FFEFD2"/>
              {/* sun rays from center */}
              <g stroke="#FFD32D" strokeWidth="6" strokeLinecap="round" opacity=".7">
                <line x1="590" y1="120" x2="490" y2="40"/>
                <line x1="590" y1="120" x2="540" y2="20"/>
                <line x1="590" y1="120" x2="640" y2="20"/>
                <line x1="590" y1="120" x2="690" y2="40"/>
                <line x1="590" y1="120" x2="740" y2="80"/>
                <line x1="590" y1="120" x2="440" y2="80"/>
                <line x1="590" y1="120" x2="740" y2="160"/>
                <line x1="590" y1="120" x2="440" y2="160"/>
                <line x1="590" y1="120" x2="490" y2="220"/>
                <line x1="590" y1="120" x2="690" y2="220"/>
              </g>
              {/* big bitcoin */}
              <circle cx="590" cy="120" r="80" fill="#F7931A" stroke="#0A0A0A" strokeWidth="5"/>
              <circle cx="590" cy="120" r="62" fill="none" stroke="#0A0A0A" strokeWidth="2" opacity=".4"/>
              <text x="590" y="148" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="80" fill="#0A0A0A">₿</text>
              {/* hands holding bitcoin */}
              <path d="M510 170 Q480 200 525 220" fill="none" stroke="#0A0A0A" strokeWidth="5" strokeLinecap="round"/>
              <path d="M670 170 Q700 200 655 220" fill="none" stroke="#0A0A0A" strokeWidth="5" strokeLinecap="round"/>
              {/* hearts */}
              <path d="M780 60 L780 66 Q770 54 760 66 Q760 78 780 88 Q800 78 800 66 Q790 54 780 66" fill="#FF3D7F" stroke="#0A0A0A" strokeWidth="3"/>
              <path d="M400 50 L400 56 Q390 44 380 56 Q380 68 400 78 Q420 68 420 56 Q410 44 400 56" fill="#FF3D7F" stroke="#0A0A0A" strokeWidth="3"/>
              {/* nih stamp */}
              <g transform="translate(960,80) rotate(-8)">
                <rect x="-50" y="-30" width="100" height="56" fill="#FFD32D" stroke="#0A0A0A" strokeWidth="4"/>
                <text x="0" y="6" textAnchor="middle" fontFamily="Bangers, sans-serif" fontSize="28" fill="#0A0A0A">NIH!</text>
              </g>
              {/* the punchline */}
              <text x="150" y="120" fontFamily="Bangers, sans-serif" fontSize="32" fill="#0A0A0A">never sold.</text>
              <text x="150" y="155" fontFamily="Bangers, sans-serif" fontSize="32" fill="#0A0A0A">never moved.</text>
              <text x="150" y="190" fontFamily="Bangers, sans-serif" fontSize="32" fill="#0A0A0A">never not yours.</text>
            </svg>
          </div>
          <div className="sc-halftone"></div>
        </article>

      </div>
    </section>

    {/* 4-up explainer strip below the fold */}
    <section className="lp-strip" id="how">
      <div className="item">
        <span className="num">01</span>
        <div className="body">
          <b>Install</b>
          <span>Chrome / Brave extension. Mezo Passport for wallet — MetaMask, Xverse, Unisat.</span>
        </div>
      </div>
      <div className="item">
        <span className="num">02</span>
        <div className="body">
          <b>Tip from anywhere</b>
          <span>One button injected on Twitter, YouTube, Substack, Medium, GitHub, Reddit, HN.</span>
        </div>
      </div>
      <div className="item">
        <span className="num">03</span>
        <div className="body">
          <b>Land or park</b>
          <span>Verified creators get MUSD in 3 seconds. Unknown handles wait in escrow up to 180 days.</span>
        </div>
      </div>
      <div className="item">
        <span className="num">04</span>
        <div className="body">
          <b>Borrow, don't sell</b>
          <span>Lock MUSD as collateral, pull 60% as credit at 1% fixed. Keep your Bitcoin.</span>
        </div>
      </div>
    </section>

    {/* footer */}
    <footer className="lp-foot">
      <h2>Every social handle is now a Bitcoin-backed bank account.</h2>
      <div className="ctas">
        <a className="lp-cta primary" href="/dashboard">Open the app →</a>
        <a className="lp-cta" style={{ "background": "transparent", "color": "var(--paper)", "borderColor": "rgba(255,255,255,.4)", "boxShadow": "4px 4px 0 0 rgba(255,255,255,.2)" }} href="/claim">Claim my tips</a>
      </div>
      <div className="mini">
        <span>matsnet · 31611</span>
        <span>gas · BTC</span>
        <span>currency · MUSD</span>
        <span>built for the mezo hackathon</span>
      </div>
    </footer>

      </div>
    </>
  );
}
