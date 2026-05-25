"use client";

import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { CheckCircle2, ExternalLink, HelpCircle } from "lucide-react";
import { addresses, registryAbi } from "@/lib/contracts";
import {
  handleIdOf,
  avatarUrl,
  profileUrl,
  PLATFORM_LABELS,
  type Platform,
} from "@/lib/handle-utils";
import { truncateAddress } from "@/lib/utils";

const ZERO = "0x0000000000000000000000000000000000000000";

/**
 * Live preview card for a social handle the user typed.
 *
 * Pulls the creator's real avatar straight from the platform (GitHub's
 * /{user}.png, unavatar.io for X/YouTube) and resolves the handle on-chain
 * via NihRegistry.resolveById to show whether it's claimed + which wallet
 * tips route to. `onResolved` hands the owner address + tier back to the
 * parent so a stream/tip form can target the wallet without the user ever
 * seeing a hex string.
 */
export function HandlePreview({
  platform,
  username,
  onResolved,
}: {
  platform: Platform;
  username: string;
  onResolved?: (owner: string | null, tier: number) => void;
}) {
  const handle = username.replace(/^@/, "");
  const handleId = handle ? handleIdOf(platform, handle) : undefined;
  const [imgError, setImgError] = useState(false);

  const { data, isLoading } = useReadContract({
    address: addresses.Registry,
    abi: registryAbi,
    functionName: "resolveById",
    args: handleId ? [handleId] : undefined,
    query: { enabled: !!handleId },
  });

  const tuple = data as readonly [string, number] | undefined;
  const owner = tuple && tuple[0] && tuple[0].toLowerCase() !== ZERO ? tuple[0] : null;
  const tier = tuple ? Number(tuple[1]) : 0;

  useEffect(() => {
    onResolved?.(owner, tier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, tier]);

  // Reset the broken-image flag when the target handle changes.
  useEffect(() => setImgError(false), [platform, handle]);

  if (!handle) return null;

  const avatar = avatarUrl(platform, handle);
  const label = PLATFORM_LABELS[platform];
  const initials = handle.slice(0, 2).toUpperCase();

  return (
    <div
      className="flex items-center gap-3 p-3 fade-up"
      style={{
        background: "var(--paper)",
        border: "3px solid var(--ink)",
        boxShadow: "3px 3px 0 0 var(--ink)",
      }}
    >
      {/* Avatar (real, from the platform) with initials fallback. */}
      <div
        className="flex-none h-12 w-12 overflow-hidden flex items-center justify-center"
        style={{
          border: "2.5px solid var(--ink)",
          background: "var(--accent)",
          color: "var(--ink)",
          fontFamily: "var(--font-display)",
          fontSize: 18,
        }}
      >
        {avatar && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={handle}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          initials
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm truncate">@{handle}</span>
          <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
            · {label.name}
          </span>
        </div>
        {isLoading ? (
          <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
            Checking on-chain…
          </p>
        ) : owner ? (
          <p className="text-[11px] inline-flex items-center gap-1" style={{ color: "var(--good, #1a7f37)" }}>
            <CheckCircle2 className="h-3 w-3" />
            {tier >= 1 ? "Verified" : "Registered"} · tips route to{" "}
            <code className="mono">{truncateAddress(owner)}</code>
          </p>
        ) : (
          <p className="text-[11px] inline-flex items-center gap-1" style={{ color: "var(--ink-3)" }}>
            <HelpCircle className="h-3 w-3" />
            Not on Nih yet — they need to claim this handle first
          </p>
        )}
      </div>

      <a
        href={profileUrl(platform, handle)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-none text-[11px] inline-flex items-center gap-1 hover:underline"
        style={{ color: "var(--accent-2)" }}
        title={`Open @${handle} on ${label.name}`}
      >
        View <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
