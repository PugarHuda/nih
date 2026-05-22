/**
 * Nih embed widget — drop a single <script> on any site and a "Tip MUSD" button
 * appears wherever you place a <div data-nih-tip data-platform="..." data-username="...">.
 *
 * Usage:
 *   <script src="https://nih.xyz/widget.js" defer></script>
 *   <div data-nih-tip data-platform="twitter" data-username="hajislamet"></div>
 *
 * No innerHTML used anywhere — all DOM constructed via createElement + textContent
 * so untrusted data-* values cannot escape into HTML execution.
 */
(function () {
  if (window.__nihLoaded) return;
  window.__nihLoaded = true;

  const STYLE = `
    .nih-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 999px;
      background: hsl(22, 90%, 56%); color: #1a0f08; border: none;
      font: 600 13px system-ui, -apple-system, sans-serif;
      cursor: pointer; transition: opacity .15s;
    }
    .nih-btn:hover { opacity: .9 }
    .nih-btn-mark { font-weight: 700 }
    .nih-popover {
      position: absolute; z-index: 9999; margin-top: 8px;
      background: hsl(20, 14%, 8%); color: hsl(30, 20%, 96%);
      border: 1px solid hsl(20, 10%, 16%); border-radius: 12px;
      padding: 12px; min-width: 240px; box-shadow: 0 10px 30px rgba(0,0,0,.45);
      font-family: system-ui, -apple-system, sans-serif;
    }
    .nih-label { font-size: 11px; color: hsl(20,8%,60%); margin-bottom: 8px; }
    .nih-presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .nih-presets button {
      height: 34px; border: none; border-radius: 8px;
      background: hsl(22, 90%, 56%); color: #1a0f08;
      font: 600 13px system-ui; cursor: pointer;
    }
  `;

  const PRESETS = [1, 5, 10, 25];
  const DASHBOARD =
    document.currentScript && document.currentScript.dataset.dashboard
      ? document.currentScript.dataset.dashboard
      : "https://nih.xyz";

  const styleEl = document.createElement("style");
  styleEl.textContent = STYLE;
  document.head.appendChild(styleEl);

  function el(tag, opts) {
    const node = document.createElement(tag);
    if (opts) {
      if (opts.className) node.className = opts.className;
      if (opts.text != null) node.textContent = String(opts.text);
      if (opts.style) Object.assign(node.style, opts.style);
      if (opts.attrs) {
        for (const k in opts.attrs) node.setAttribute(k, String(opts.attrs[k]));
      }
    }
    return node;
  }

  function attach(host) {
    const platform = host.dataset.platform;
    const username = host.dataset.username;
    if (!platform || !username) return;

    const btn = el("button", { className: "nih-btn" });
    btn.appendChild(el("span", { className: "nih-btn-mark", text: "N" }));
    btn.appendChild(document.createTextNode(" Tip MUSD"));
    host.appendChild(btn);

    let pop = null;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (pop) {
        pop.remove();
        pop = null;
        return;
      }
      pop = el("div", { className: "nih-popover" });

      const label = el("div", { className: "nih-label" });
      label.appendChild(document.createTextNode("Tip "));
      const strong = el("strong", { text: "@" + username });
      label.appendChild(strong);
      label.appendChild(document.createTextNode(" on " + platform));
      pop.appendChild(label);

      const grid = el("div", { className: "nih-presets" });
      PRESETS.forEach(function (amt) {
        const b = el("button", { text: String(amt) });
        b.addEventListener("click", function () {
          // Route to dashboard tip flow (cross-domain hand-off)
          const url =
            DASHBOARD +
            "/tip?platform=" +
            encodeURIComponent(platform) +
            "&username=" +
            encodeURIComponent(username) +
            "&amount=" +
            encodeURIComponent(String(amt));
          window.open(url, "_blank", "noopener,noreferrer");
          if (pop) {
            pop.remove();
            pop = null;
          }
        });
        grid.appendChild(b);
      });
      pop.appendChild(grid);

      const rect = btn.getBoundingClientRect();
      pop.style.left = rect.left + window.scrollX + "px";
      pop.style.top = rect.bottom + window.scrollY + 4 + "px";
      document.body.appendChild(pop);

      document.addEventListener(
        "click",
        function close() {
          if (pop) {
            pop.remove();
            pop = null;
          }
          document.removeEventListener("click", close);
        },
        { once: true }
      );
    });
  }

  function scan() {
    document.querySelectorAll("[data-nih-tip]:not([data-nih-bound])").forEach(function (host) {
      host.setAttribute("data-nih-bound", "1");
      attach(host);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
