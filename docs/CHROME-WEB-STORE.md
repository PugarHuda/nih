# Chrome Web Store submission package

Everything you need to publish Nih on Chrome Web Store.

## One-time setup ($5 + 5 minutes)

1. Sign in to https://chrome.google.com/webstore/devconsole with your Google account.
2. Pay the **one-time $5 developer registration fee**.
3. Click **Add new item** → upload the zip from `extension/build/chrome-mv3-prod.zip`.

## Store listing copy (paste into the console)

### Product name (45 char limit)
```
Nih — Tip MUSD on Twitter, YouTube, more
```

### Short description (132 char limit)
```
Tip Bitcoin-backed MUSD on any social profile. One click, self-custodial, no platform fee. Powered by Mezo.
```

### Detailed description
```
Nih turns every social profile into a Bitcoin-backed bank account.

Send MUSD — a stablecoin fully backed by Bitcoin reserves — with a single click on Twitter (X.com), YouTube, Substack, Medium, and GitHub. Creators receive stable money instantly with zero platform fee. They can even borrow against their accumulated tips without ever selling a satoshi of BTC.

WHY MUSD
• Stable — pegged 1:1 to USD, backed by Bitcoin reserves (110%+ collateral)
• Composable — your tip income becomes credit-line collateral on Mezo
• Self-custodial — your keys, your money, always

WHY NIH
• One-click tipping on every social platform you already use
• 0.5% protocol fee (or 0.25% if you pay in MEZO token)
• Tips to unregistered handles wait safely in an on-chain escrow vault
• Creators verify handle ownership with a single public post — no KYC

GET STARTED
1. Install Nih, click the extension icon
2. Connect your wallet (MetaMask, Xverse, Unisat)
3. Get test BTC for gas at faucet.test.mezo.org
4. Open Twitter — every tweet now has an "N Tip MUSD" button

Currently on Mezo Matsnet testnet (chainId 31611). Mainnet coming after the Mezo Hackathon judging.

Open source: github.com/PugarHuda/nih
Dashboard: nih-seven.vercel.app
```

### Category
Productivity → Wallets

### Language
English

### Single purpose
```
Adds a one-click tip button to social media posts, routing Bitcoin-backed MUSD to the recipient through the Nih protocol on Mezo blockchain.
```

### Permission justification

| Permission | Why we need it |
|---|---|
| `storage` | Persist user's default tip amount and MEZO-fee preference between sessions |
| `activeTab` | Inject the tip button only on tabs the user is actively viewing |
| `host_permissions` for twitter.com / x.com / youtube.com / substack.com / medium.com / github.com | These are the sites where we inject the tip button. We never read any other site. |
| `host_permissions` for rpc.test.mezo.org and mezo.public.validationcloud.io | Reading on-chain balance and tip history from Mezo testnet/mainnet RPCs |

## Privacy policy

Host this somewhere stable (Vercel works) and link from the listing. Suggested location: `https://nih-seven.vercel.app/privacy`.

> **Nih Privacy Policy**
>
> Last updated: May 22, 2026
>
> **Data we collect**: none. Nih is a client-side browser extension. The only data it stores is your local settings (default tip amount, MEZO-fee toggle) in your browser's `chrome.storage`. We never see this data.
>
> **Data we transmit**: only what you explicitly choose to send. When you click "Tip", your wallet signs a transaction broadcast to the Mezo blockchain — same model as any DeFi dApp.
>
> **Third parties**: We use public RPCs (Mezo, Spectrum, Validation Cloud, Boar Network) to read on-chain state. These are stateless reads; the providers don't know who you are.
>
> **No tracking**: no analytics, no fingerprinting, no telemetry.
>
> Open source under MIT license at github.com/PugarHuda/nih — verify every line yourself.

## Screenshots needed (4-5, 1280×800 each)

Take these against the live dashboard `https://nih-seven.vercel.app`:

1. **Hero shot** — landing page with TweetMockup visible
2. **In-the-wild tip** — Twitter feed with "N Tip MUSD" button injected on a tweet, popover open
3. **Creator dashboard** — `/dashboard` showing balance + lifetime tips + action grid
4. **Borrow flow** — `/borrow` open credit line with "You receive 60 MUSD" highlighted
5. **Claim challenge** — `/claim` page showing the wallet-bound challenge text

Save as PNG, 1280×800, in `docs/screenshots/`.

## Promotional images (optional but boosts conversion)

- **Small promo tile**: 440×280 — N logo on Bitcoin-orange gradient
- **Marquee promo tile**: 1400×560 — tagline + screenshot collage

## Review timeline

- Initial review: typically 1–3 business days
- Re-review after rejection: 24–48 hours
- Common rejection reasons: missing privacy policy URL, vague permission justification, screenshots not matching listing description — all covered above.

## After approval

1. Update `dashboard/src/app/install/page.tsx` — set `WEB_STORE_URL` to the live listing URL.
2. Change the big primary CTA from "Download extension" → "Add to Chrome".
3. Push, auto-deploys. Done — install is now genuinely one-click.

## Future: enterprise force-install via manifest

For potential B2B users (creator agencies, content studios), Chrome supports enterprise managed install via `ExtensionInstallForcelist` policy + a self-hosted `update.xml` manifest. Skip until first paying customer asks.
