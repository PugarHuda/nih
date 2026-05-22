"use client";

import Link from "next/link";
import { ConnectWallet } from "./connect-wallet";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center font-bold text-bg text-lg shadow-[0_0_24px_-4px_hsl(22_90%_56%)]">
            N
          </div>
          <span className="text-lg font-semibold tracking-tight group-hover:text-brand transition-colors">
            Nih
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-muted">
          <Link href="/dashboard" className="hover:text-fg transition-colors">Dashboard</Link>
          <Link href="/stream" className="hover:text-fg transition-colors">Stream</Link>
          <Link href="/earn" className="hover:text-fg transition-colors">Earn</Link>
          <Link href="/borrow" className="hover:text-fg transition-colors">Borrow</Link>
          <Link href="/claim" className="hover:text-fg transition-colors">Claim</Link>
          <Link href="/leaderboard" className="hover:text-fg transition-colors">Top</Link>
          <Link href="/install" className="hover:text-fg transition-colors">Install</Link>
        </nav>
        <ConnectWallet />
      </div>
    </header>
  );
}
