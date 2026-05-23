// Replace <motion.div initial={...} animate={...} transition={...}>
// with <div className="fade-up"> across .tsx files. Also drops
// <AnimatePresence> wrappers (leaving children intact).
const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const SRC = path.join(process.cwd(), "src");
let total = 0;

for (const file of walk(SRC)) {
  let s = fs.readFileSync(file, "utf8");
  const before = s;

  // Replace opening <motion.div ...> with <div className="fade-up">
  // Preserve user's own className if present.
  s = s.replace(/<motion\.div([^>]*)>/g, (full, attrs) => {
    const classMatch = attrs.match(/className=("([^"]*)"|\{`([^`]+)`\}|\{([^}]+)\})/);
    let userClass = "";
    if (classMatch) userClass = classMatch[2] ?? classMatch[3] ?? classMatch[4] ?? "";
    const merged = userClass ? `${userClass.trim()} fade-up` : "fade-up";
    return `<div className="${merged}">`;
  });

  s = s.replace(/<\/motion\.div>/g, "</div>");

  // Drop AnimatePresence wrappers — replace open/close tags with React fragments.
  s = s.replace(/<AnimatePresence[^>]*>/g, "<>");
  s = s.replace(/<\/AnimatePresence>/g, "</>");

  if (s !== before) {
    fs.writeFileSync(file, s);
    total++;
    console.log("patched", path.relative(process.cwd(), file));
  }
}

console.log(`done: ${total} files updated`);
