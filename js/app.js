/* ==========================================================================
   chan-updated-portfolio — shared runtime
   theme, cursor, boot sequence, page transitions, scroll reveals
   Plain script. No modules, no dependencies, works from file://
   ========================================================================== */

(function () {
  "use strict";

  var SITE = window.PORTFOLIO.SITE;

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- tiny dom helpers --------------------------------------------------- */

  /* Attributes whose value is null or undefined are skipped, so callers can
     write `attr: cond ? value : null` inline. */
  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) {
      var v = attrs[k];
      if (v === null || v === undefined) continue;
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    (kids || []).forEach(function (kid) {
      if (kid) node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function $(sel, root) { return (root || document).querySelector(sel); }

  /* Corner marks, like a viewfinder. Returns the node for chaining. */
  function brackets(node) {
    ["tl", "tr", "bl", "br"].forEach(function (corner) {
      node.appendChild(el("i", { class: "bracket bracket--" + corner, "aria-hidden": "true" }));
    });
    return node;
  }

  /* A dithered, accent-tinted image in a bracketed frame. */
  function plate(src, alt, scan) {
    var img = el("img", { src: src, alt: alt || "", loading: "lazy", decoding: "async" });
    return brackets(el("div", { class: "plate" + (scan ? " plate--scan" : "") }, [img]));
  }

  /* --- theme -------------------------------------------------------------- */

  var THEMES = [
    {
      id: "auto",
      // A colour wheel of the five fixed palettes. css/base.css spins its hue
      // so the swatch visibly cycles, the way the mode does.
      swatch: "conic-gradient(from 0deg,#ffb000,#4ef08a,#4ad5ff,#cfc6ff,#ff5f8d,#ffb000)",
      title: "Auto — the colour follows whichever project you're on"
    },
    { id: "amber", swatch: "#ffb000", title: "Amber" },
    { id: "green", swatch: "#4ef08a", title: "Green" },
    { id: "cyan", swatch: "#4ad5ff", title: "Cyan" },
    { id: "rose", swatch: "#ff5f8d", title: "Rose" },
    { id: "bone", swatch: "#e8e4d8", title: "Bone" }
  ];

  var KEY = "portfolio:theme";
  var theme = localStorage.getItem(KEY) || "auto";
  var autoAccent = null; // what "auto" currently resolves to

  function applyTheme() {
    var root = document.documentElement;
    root.dataset.theme = theme === "auto" ? "amber" : theme;
    if (theme === "auto" && autoAccent) root.style.setProperty("--accent", autoAccent);
    else root.style.removeProperty("--accent");

    document.querySelectorAll(".themes__swatch").forEach(function (swatch) {
      swatch.setAttribute("aria-pressed", String(swatch.dataset.theme === theme));
    });
    var label = $(".themes__label");
    if (label) label.textContent = theme.toUpperCase();
  }

  function setTheme(id) {
    theme = id;
    localStorage.setItem(KEY, theme);
    applyTheme();
  }

  function cycleTheme() {
    var i = THEMES.findIndex(function (t) { return t.id === theme; });
    setTheme(THEMES[(i + 1) % THEMES.length].id);
  }

  /* Called by home.js / project.js as the active project changes. */
  function setAutoAccent(colour) {
    autoAccent = colour;
    if (theme === "auto") applyTheme();
  }

  /* --- chrome ------------------------------------------------------------- */

  function buildChrome(current) {
    document.body.insertBefore(
      el("a", { class: "skip-link", href: "#main", text: "Skip to content" }),
      document.body.firstChild
    );

    document.body.appendChild(
      el("header", { class: "topbar" }, [
        el("div", { class: "topbar__id" }, [
          el("a", { href: "index.html", text: SITE.name }),
          el("span", { class: "faint", text: SITE.role })
        ]),
        el("nav", { class: "topbar__nav" }, [
          el("a", { href: "index.html", "aria-current": current === "home" ? "page" : null, text: "Index" }),
          el("a", { href: "index.html#work", "data-optional": "", text: "Work" }),
          el("a", { href: "index.html#contact", "data-optional": "", text: "Contact" }),
          el("a", { href: "mailto:" + SITE.email, text: "Mail" })
        ])
      ])
    );

    // Listed twice so the marquee has no visible seam when it wraps.
    var track = el("span", { class: "ticker__track" });
    SITE.ticker.concat(SITE.ticker).forEach(function (bit) {
      track.appendChild(el("span", { text: bit + "  ·  " }));
    });

    var themes = el("div", { class: "themes" }, [
      el("span", { class: "themes__label faint", text: theme.toUpperCase() })
    ]);
    THEMES.forEach(function (t) {
      themes.appendChild(el("button", {
        class: "themes__swatch",
        style: "--swatch:" + t.swatch,
        "data-theme": t.id,
        title: t.title,
        "aria-pressed": "false",
        onclick: function () { setTheme(t.id); }
      }, [el("span", { class: "sr-only", text: t.title })]));
    });

    document.body.appendChild(
      el("footer", { class: "statusbar" }, [el("div", { class: "ticker" }, [track]), themes])
    );

    ["scan", "sweep", "grain", "vignette", "flicker"].forEach(function (fx) {
      document.body.appendChild(el("div", { class: "fx fx--" + fx, "aria-hidden": "true" }));
    });

    document.body.appendChild(el("div", { class: "cursor", "aria-hidden": "true" }));
    document.body.appendChild(
      el("div", { class: "wipe", "aria-hidden": "true" }, [
        el("div", { class: "wipe__inner" }),
        el("div", { class: "wipe__text caret", text: "loading" })
      ])
    );

    applyTheme();
  }

  /* --- cursor ------------------------------------------------------------- */

  function initCursor() {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.body.dataset.pointer = "fine";

    var dot = $(".cursor");
    var x = 0, y = 0, cx = 0, cy = 0, raf = null;

    function loop() {
      cx += (x - cx) * 0.25;
      cy += (y - cy) * 0.25;
      dot.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px)";
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : null;
    }

    addEventListener("pointermove", function (e) {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
      if (e.target.closest("a,button,[data-hot]")) dot.setAttribute("data-hot", "");
      else dot.removeAttribute("data-hot");
    }, { passive: true });
  }

  /* --- boot sequence ------------------------------------------------------- */

  function initBoot(done) {
    if (sessionStorage.getItem("portfolio:booted") || REDUCED) { done(); return; }

    var log = el("pre", { class: "boot__log" });
    var skip = el("button", { class: "boot__skip", text: "skip →" });
    var screen = el("div", { class: "boot" }, [log, skip]);
    document.body.appendChild(screen);
    document.body.style.overflow = "hidden";

    var i = 0;
    var timer = setInterval(function () {
      if (i < SITE.boot.length) {
        log.appendChild(el("div", { html: "<b>&gt;</b> " + SITE.boot[i++] }));
        return;
      }
      clearInterval(timer);
      setTimeout(finish, 420);
    }, 190);

    function onKey(e) {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") finish();
    }

    // Reachable from the skip button, a key, and the timer running out, so it
    // has to be safe to call more than once.
    function finish() {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
      removeEventListener("keydown", onKey);
      sessionStorage.setItem("portfolio:booted", "1");
      screen.hidden = true;
      document.body.style.overflow = "";
      setTimeout(function () { screen.remove(); }, 600);
      done();
    }

    skip.addEventListener("click", finish);
    addEventListener("keydown", onKey);
  }

  /* --- page transitions ---------------------------------------------------- */

  function initWipe() {
    var wipe = $(".wipe");

    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-wipe]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (REDUCED) { location.href = a.href; return; }
      wipe.setAttribute("data-on", "");
      setTimeout(function () { location.href = a.href; }, 300);
    });

    // Clear the overlay if the page is restored from the back/forward cache.
    addEventListener("pageshow", function () { wipe.removeAttribute("data-on"); });
  }

  /* --- reveals ------------------------------------------------------------- */

  function initReveals(root) {
    var targets = (root || document).querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.setAttribute("data-shown", ""); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-shown", "");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* --- keyboard ------------------------------------------------------------ */

  function initKeys(extra) {
    addEventListener("keydown", function (e) {
      if (e.target.matches("input,textarea")) return;
      if (e.key === "t" || e.key === "T") { cycleTheme(); return; }
      if (extra) extra(e);
    });
  }

  window.portfolio = {
    el: el,
    $: $,
    brackets: brackets,
    plate: plate,
    reduced: REDUCED,
    buildChrome: buildChrome,
    initCursor: initCursor,
    initBoot: initBoot,
    initWipe: initWipe,
    initReveals: initReveals,
    initKeys: initKeys,
    setAutoAccent: setAutoAccent
  };
})();
