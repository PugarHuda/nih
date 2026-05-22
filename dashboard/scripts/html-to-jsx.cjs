/* eslint-disable */
/**
 * Quick-and-dirty HTML→JSX attribute converter for the comic landing.
 * Reads dashboard/public/landing.html, extracts the <body> inner content,
 * rewrites SVG/HTML attributes to JSX camelCase, escapes JSX-reserved
 * sequences, and prints the result to stdout for embedding into a
 * React Server Component.
 *
 * Not a full HTML parser — it's tuned for THIS landing only and bails
 * on anything weird (e.g., <script>).
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(
  path.join(__dirname, "..", "public", "landing.html"),
  "utf-8"
);

// 1. Extract body content (everything between <body ...> and </body>)
const bodyMatch = src.match(/<body[^>]*>([\s\S]*)<\/body>/);
if (!bodyMatch) {
  console.error("No body match");
  process.exit(1);
}
let body = bodyMatch[1];

// 2. Strip <script> tags (we'll wire interactivity in React)
body = body.replace(/<script[\s\S]*?<\/script>/gi, "");

// 3. Convert HTML attribute names → JSX
const ATTR_MAP = {
  class: "className",
  for: "htmlFor",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-opacity": "strokeOpacity",
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "clip-path": "clipPath",
  "clip-rule": "clipRule",
  "text-anchor": "textAnchor",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-weight": "fontWeight",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "mix-blend-mode": "mixBlendMode",
  "letter-spacing": "letterSpacing",
  tabindex: "tabIndex",
  contenteditable: "contentEditable",
  spellcheck: "spellCheck",
  preserveAspectRatio: "preserveAspectRatio",
};

for (const [from, to] of Object.entries(ATTR_MAP)) {
  // match attribute boundary so we don't accidentally rewrite class="..." values
  const re = new RegExp(`(\\s)${from}=`, "g");
  body = body.replace(re, `$1${to}=`);
}

// 4. Convert inline style="prop: val; ..." → style={{ prop: 'val', ... }}
body = body.replace(/style="([^"]+)"/g, (_, css) => {
  const obj = {};
  css.split(";").forEach((rule) => {
    const idx = rule.indexOf(":");
    if (idx === -1) return;
    const k = rule.slice(0, idx).trim();
    const v = rule.slice(idx + 1).trim();
    if (!k) return;
    const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    obj[camel] = v;
  });
  // build JSX style object literal
  const parts = Object.entries(obj).map(([k, v]) => {
    // numeric pixel values become numbers in JSX usually but we keep strings
    // to preserve units (px, %, em, var(...))
    return `${JSON.stringify(k)}: ${JSON.stringify(v)}`;
  });
  return `style={{ ${parts.join(", ")} }}`;
});

// 5. Self-close void elements that React requires
body = body.replace(/<(img|br|hr|input|meta|link|circle|rect|line|path|polygon|use|stop|ellipse)([^>]*?)>/gi, (m, tag, rest) => {
  if (rest.trim().endsWith("/")) return m;
  return `<${tag}${rest} />`;
});

// 6. Escape literal { and } inside text content. Only doing the obvious
// hand-wavy comic copy. We DON'T want to escape inside attribute values
// since those use double quotes. Simple heuristic: if a { or } is outside
// quotes and outside a tag, escape.
// Skipping — this landing has no literal {} in copy.

// 7. JSX comment markers: replace HTML comments with JSX-safe comments
body = body.replace(/<!--([\s\S]*?)-->/g, (_, c) => `{/*${c}*/}`);

// 8. Trim trailing whitespace
body = body.trim();

process.stdout.write(body);
