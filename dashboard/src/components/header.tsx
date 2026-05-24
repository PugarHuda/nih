"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ConnectWallet } from "./connect-wallet";

// Slimmer top nav — 5 primary links (Dashboard + the 4 money flows).
// "Trove" merges into Borrow flow on dashboard. /leaderboard, /install,
// /onboarding, /docs, /slides reachable via the dashboard's "things-to-do"
// + footer; not every minor route needs a top-nav slot.
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tip", label: "Tip" },
  { href: "/stream", label: "Subscribe" },
  { href: "/borrow", label: "Borrow" },
  { href: "/earn", label: "Earn" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu on route change so the user lands on the new
  // page with no overlay covering it.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          background: "rgba(251, 246, 232, 0.85)",
          borderBottom: "3.5px solid var(--ink)",
        }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 gap-3">
          <Link href="/" className="flex items-center gap-3 group flex-none">
            <Image
              src="/assets/logo.svg"
              alt="Nih"
              width={88}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop nav — md+ only */}
          <nav
            className="hidden md:flex items-center gap-6 text-sm"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {NAV_LINKS.map((l) => (
              <NavLink key={l.href} href={l.href}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-none">
            <ConnectWallet />
            {/* Mobile menu button — only visible below md */}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden inline-flex items-center justify-center"
              style={{
                width: 40,
                height: 40,
                background: "var(--paper)",
                color: "var(--ink)",
                border: "3px solid var(--ink)",
                boxShadow: "3px 3px 0 0 var(--ink)",
              }}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet — full-screen overlay below the header */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-x-0 bottom-0 z-30"
          style={{ top: 64 }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.45)", border: 0, cursor: "pointer" }}
          />
          {/* Sheet */}
          <nav
            className="relative w-full p-4"
            style={{
              background: "var(--paper)",
              borderBottom: "3.5px solid var(--ink)",
              animation: "nih-pop .25s ease-out",
            }}
          >
            <ul className="flex flex-col gap-2">
              {NAV_LINKS.map((l) => {
                const active = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 text-base"
                      style={{
                        fontFamily: "var(--font-display)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: active ? "var(--accent-ink)" : "var(--ink)",
                        background: active ? "var(--accent)" : "var(--paper)",
                        border: "3px solid var(--ink)",
                        boxShadow: active ? "3px 3px 0 0 var(--ink)" : "none",
                      }}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className="transition-colors"
      style={{
        color: active ? "var(--accent-2)" : "var(--ink-2)",
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = active ? "var(--accent-2)" : "var(--ink-2)")}
    >
      {children}
    </Link>
  );
}
