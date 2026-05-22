/* eslint-disable */
// data.jsx — mock data for the prototype

const PERSONAS = {
  alice: {
    id: 'alice',
    name: 'Alice Tanaka',
    handle: '@alicewrites',
    platform: 'twitter',
    addr: '0xA11ce…b7F2',
    bio: 'Coffee, code, occasional essay.',
    color: 'alice',
    role: 'tipper',
    musd: 142.50,
    btc: 0.0182,
  },
  bob: {
    id: 'bob',
    name: 'Bob Marquez',
    handle: '@bobbuilds',
    platform: 'twitter',
    addr: '0xB0b…e91A',
    bio: 'Building small things in public.',
    color: 'bob',
    role: 'creator',
    musd: 218.00,
    btc: 0.041,
    verified: true,
    handles: [
      { platform: 'twitter',  username: 'bobbuilds',   tier: 1, since: 'Apr 2026' },
      { platform: 'github',   username: 'bobbuilds',   tier: 1, since: 'Apr 2026' },
      { platform: 'substack', username: 'bobbuilds',   tier: 1, since: 'May 2026' },
    ],
  },
  carol: {
    id: 'carol',
    name: 'Carol Adeyemi',
    handle: '@caroldraws',
    platform: 'twitter',
    addr: '0xCa401…3aBe',
    bio: 'Illustrator, gardener.',
    color: 'carol',
    role: 'unregistered',
    musd: 0,
    btc: 0,
    parked: 47,         // sitting in vault waiting to be claimed
  },
};

const RECENT_TIPS = [
  { from: 'alice', toHandle: '@bobbuilds',   platform: 'twitter',  amount: 5,  note: 'thank you for the thread',     time: 'just now',   status: 'sent' },
  { from: 'mira',  toHandle: '@caroldraws',  platform: 'twitter',  amount: 25, note: 'this drawing made my day',     time: '2 min ago',  status: 'parked' },
  { from: 'jun',   toHandle: 'PugarHuda',    platform: 'github',   amount: 10, note: 'fix landed, you saved my week', time: '6 min ago',  status: 'sent' },
  { from: 'dee',   toHandle: '@caroldraws',  platform: 'twitter',  amount: 12, note: 'commission deposit',           time: '11 min ago', status: 'parked' },
  { from: 'sam',   toHandle: '@bobbuilds',   platform: 'twitter',  amount: 1,  note: 'good post',                    time: '24 min ago', status: 'sent' },
  { from: 'lin',   toHandle: 'PugarHuda',    platform: 'github',   amount: 50, note: 'sponsoring the v2 release',    time: '38 min ago', status: 'sent' },
  { from: 'nat',   toHandle: '@bobbuilds',   platform: 'twitter',  amount: 3,  note: '☕',                             time: '1 hr ago',   status: 'sent' },
  { from: 'kit',   toHandle: '@hajislamet',  platform: 'twitter',  amount: 8,  note: 'lessgo',                       time: '1 hr ago',   status: 'sent' },
];

const LEADERS = [
  { rank: 1, name: 'hajislamet',  platform: 'twitter', received: 1248.5, tips: 162, badge: '🏆' },
  { rank: 2, name: 'pugarhuda',   platform: 'twitter', received: 982.0,  tips: 121, badge: '' },
  { rank: 3, name: 'PugarHuda',   platform: 'github',  received: 716.5,  tips:  84, badge: '' },
  { rank: 4, name: 'bobbuilds',   platform: 'twitter', received: 522.0,  tips:  68, badge: '' },
  { rank: 5, name: 'MezoNetwork', platform: 'twitter', received: 412.0,  tips:  41, badge: '' },
  { rank: 6, name: 'caroldraws',  platform: 'twitter', received: 318.0,  tips:  55, badge: '' },
  { rank: 7, name: 'EncodeClub',  platform: 'twitter', received: 264.0,  tips:  18, badge: '' },
  { rank: 8, name: 'alicewrites', platform: 'twitter', received: 188.5,  tips:  29, badge: '' },
];

const TOP_TIPPERS = [
  { name: 'mira',         sent: 412.0, tips: 38 },
  { name: 'lin',          sent: 322.5, tips: 27 },
  { name: 'jun',          sent: 288.0, tips: 31 },
  { name: 'alicewrites',  sent: 142.5, tips: 22 },
  { name: 'dee',          sent: 96.0,  tips: 14 },
];

const PLATFORM_GLYPHS = {
  twitter:  'x',
  x:        'x',
  youtube:  '▶',
  substack: 'ş',
  medium:   'm',
  github:   '◉',
  reddit:   'r',
  hn:       'y',
};
const PLATFORM_LABELS = {
  twitter:  'X / Twitter',
  x:        'X / Twitter',
  youtube:  'YouTube',
  substack: 'Substack',
  medium:   'Medium',
  github:   'GitHub',
  reddit:   'Reddit',
  hn:       'Hacker News',
};

const TIP_PRESETS = [1, 5, 10, 25];

const STORY_BEATS = [
  {
    id: 'intro',
    persona: null,
    screen: 'landing',
    title: 'Meet Alice, Bob & Carol.',
    body: "Three people. One tipping product. Watch how MUSD moves between them — and what it unlocks.",
    cta: 'Start the story',
  },
  {
    id: 'alice-tip-bob',
    persona: 'alice',
    screen: 'extension',
    title: 'Alice tips Bob, 5 MUSD.',
    body: "Bob's verified, so the tip hits his wallet instantly. No platform fee. No conversion.",
    cta: 'Next →',
  },
  {
    id: 'alice-tip-carol',
    persona: 'alice',
    screen: 'extension',
    title: 'Alice tips Carol, 5 MUSD.',
    body: "Carol's never heard of Nih. Her tip parks in an on-chain escrow. It'll wait up to 180 days.",
    cta: 'Next →',
  },
  {
    id: 'carol-discovers',
    persona: 'carol',
    screen: 'claim',
    title: 'Carol finds a stranger gift.',
    body: "She opens /claim and sees 47 MUSD sitting in escrow with her handle on it. She verifies and claims.",
    cta: 'Next →',
  },
  {
    id: 'bob-borrows',
    persona: 'bob',
    screen: 'borrow',
    title: 'Bob borrows against his tips.',
    body: "Bob's collected 218 MUSD. He locks 150 of it and gets 90 MUSD credit — at 1% fixed. No Bitcoin sold.",
    cta: 'Next →',
  },
  {
    id: 'outro',
    persona: null,
    screen: 'landing',
    title: 'Tip → save → borrow.',
    body: "Every social handle becomes a Bitcoin-backed bank account. That's Nih.",
    cta: 'Replay',
  },
];

Object.assign(window, {
  PERSONAS, RECENT_TIPS, LEADERS, TOP_TIPPERS,
  PLATFORM_GLYPHS, PLATFORM_LABELS, TIP_PRESETS, STORY_BEATS,
});
