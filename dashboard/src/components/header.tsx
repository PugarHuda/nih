"use client";

import Link from "next/link";
import Image from "next/image";
import { ConnectWallet } from "./connect-wallet";

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        background: "rgba(251, 246, 232, 0.85)",
        borderBottom: "3.5px solid var(--ink)",
      }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/assets/logo.svg"
            alt="Nih"
            width={88}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <nav
          className="hidden md:flex items-center gap-6 text-sm"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/stream">Stream</NavLink>
          <NavLink href="/earn">Earn</NavLink>
          <NavLink href="/borrow">Borrow</NavLink>
          <NavLink href="/claim">Claim</NavLink>
          <NavLink href="/leaderboard">Top</NavLink>
          <NavLink href="/install">Install</NavLink>
        </nav>
        <ConnectWallet />
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="transition-colors"
      style={{ color: "var(--ink-2)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-2)")}
    >
      {children}
    </Link>
  );
}
