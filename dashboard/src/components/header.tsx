"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ConnectWallet } from "./connect-wallet";

// Primary top-nav slots (always visible). "Tip" deliberately omitted —
// tipping is the extension's job + the dashboard's profile page already
// surfaces tip CTAs.
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/stream", label: "Subscribe" },
  { href: "/borrow", label: "Borrow" },
  { href: "/earn", label: "Earn" },
];

// Secondary nav — surfaced via a "More ▾" dropdown so nothing is cut,
// but the primary bar stays uncluttered.
const MORE_LINKS = [
  { href: "/trove", label: "Trove (mint MUSD)" },
  { href: "/claim", label: "Claim handle" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/unlock", label: "Pay-to-unlock" },
  { href: "/onboarding", label: "Onboarding tour" },
  { href: "/install", label: "Install extension" },
  { href: "/faucet", label: "Faucet" },
  { href: "/docs", label: "Developer docs" },
  { href: "/slides", label: "Pitch deck" },
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
            <MoreMenu />
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
              {[...NAV_LINKS, ...MORE_LINKS].map((l) => {
                const active = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm"
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

function MoreMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const anyActive = MORE_LINKS.some((l) => pathname === l.href || pathname.startsWith(l.href + "/"));

  // Close on outside click + Esc.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-more-menu]")) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div data-more-menu style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="transition-colors"
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          font: "inherit",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: anyActive ? "var(--accent-2)" : "var(--ink-2)",
          cursor: "pointer",
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        More ▾
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            minWidth: 240,
            background: "var(--paper)",
            border: "3px solid var(--ink)",
            boxShadow: "4px 4px 0 0 var(--ink)",
            padding: 8,
            zIndex: 50,
          }}
        >
          {MORE_LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                role="menuitem"
                className="block"
                style={{
                  padding: "8px 10px",
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: active ? "var(--accent-ink)" : "var(--ink)",
                  background: active ? "var(--accent)" : "transparent",
                  border: active ? "2px solid var(--ink)" : "2px solid transparent",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "var(--bg-2)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
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
