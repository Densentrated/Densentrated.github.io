/* ==========================================================================
   chan-updated-portfolio — home page
   builds the snap-scrolled showcase from content.js
   ========================================================================== */

(function () {
  "use strict";

  var P = window.portfolio;
  var el = P.el;
  var SITE = window.PORTFOLIO.SITE;
  var PROJECTS = window.PORTFOLIO.PROJECTS;

  var main = document.getElementById("main");

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* --- hero ---------------------------------------------------------------- */

  function hero() {
    var meta = el("dl", { class: "hero__meta" });
    SITE.meta.forEach(function (pair) {
      // Each term/definition pair shares one grid cell so they stack.
      meta.appendChild(el("div", {}, [
        el("dt", { text: pair[0] }),
        el("dd", { text: pair[1] })
      ]));
    });

    return el("section", { class: "panel hero", id: "top" }, [
      el("div", { class: "hero__kicker" }, [
        el("span", { class: "tag", text: SITE.status }),
        el("span", { class: "label", text: SITE.handle + " — based in " + SITE.location })
      ]),
      el("h1", { class: "hero__name" }, [
        el("span", { class: "glitch", "data-text": SITE.nameLines[0], text: SITE.nameLines[0] }),
        el("em", { text: SITE.nameLines[1] })
      ]),
      el("p", { class: "hero__intro", html: SITE.tagline }),
      meta,
      el("div", { class: "scrollcue", text: "scroll" })
    ]);
  }

  /* --- project panel ------------------------------------------------------- */

  /* One project: a text column and a masked cover sharing a stacking layer.
     Returns the article together with the four parts the deck engine moves,
     so the scroll loop never has to go back to the DOM to find them. */
  function slide(project, i) {
    var href = "project.html?p=" + encodeURIComponent(project.slug);

    var tags = el("ul", { class: "work__tags" });
    project.tags.forEach(function (tag) { tags.appendChild(el("li", { text: tag })); });

    var title = el("h2", { class: "work__title" }, [
      el("a", {
        href: href,
        "data-wipe": "",
        class: "glitch",
        "data-text": project.title,
        text: project.title
      })
    ]);

    var body = el("div", { class: "slide__body" }, [
      el("p", { class: "work__index" }, [
        el("b", { text: project.index }),
        el("span", { text: project.year + " — " + project.status })
      ]),
      el("div", { class: "slide__line" }, [title]),
      el("p", { class: "work__sub", text: project.subtitle }),
      tags,
      el("a", { class: "work__open", href: href, "data-wipe": "", text: "Open case" })
    ]);

    var shift = el("div", { class: "slide__shift" }, [
      el("img", {
        src: project.cover,
        alt: project.coverAlt,
        decoding: "async",
        loading: i < 2 ? "eager" : "lazy"
      })
    ]);

    var media = el("div", { class: "slide__media" }, [shift]);

    var frame = P.brackets(el("div", { class: "slide__frame" }, [
      media,
      el("span", { class: "slide__caption", text: project.caption }),
      el("a", {
        href: href,
        "data-wipe": "",
        tabindex: "-1",
        "aria-hidden": "true",
        "aria-label": project.title
      })
    ]));

    var node = el("article", {
      class: "slide",
      id: "work-" + project.slug,
      style: "z-index:" + i,
      "data-index": project.index
    }, [body, frame]);

    return {
      project: project,
      node: node,
      body: body,
      media: media,
      shift: shift,
      title: title
    };
  }

  /* The deck: one sticky viewport plus a spacer per remaining project, so the
     whole thing is PROJECTS.length viewports of scroll. */
  function deck(slides) {
    var sticky = el("div", { class: "deck__sticky" });
    slides.forEach(function (s) { sticky.appendChild(s.node); });

    var section = el("section", { class: "deck", id: "work" }, [sticky]);
    for (var i = 1; i < slides.length; i++) {
      section.appendChild(el("div", { class: "deck__step", "aria-hidden": "true" }));
    }
    return section;
  }

  /* --- outro --------------------------------------------------------------- */

  function outro() {
    function list(title, items) {
      var ul = el("ul");
      items.forEach(function (item) {
        ul.appendChild(el("li", {}, [el("a", { href: item.href, text: item.label })]));
      });
      return el("div", {}, [el("h3", { text: title }), ul]);
    }

    return el("section", { class: "panel outro", id: "contact" }, [
      el("p", { class: "label", text: "Contact" }),
      el("p", { class: "outro__big" }, [
        el("a", { href: "mailto:" + SITE.email, class: "glitch", "data-text": SITE.email, text: SITE.email })
      ]),
      el("div", { class: "outro__grid" }, [
        list("Links", SITE.links),
        list("Elsewhere", SITE.elsewhere),
        el("div", {}, [
          el("h3", { text: "Colophon" }),
          el("p", { class: "colophon", text: SITE.colophon })
        ])
      ]),
      el("p", { class: "colophon" }, [
        "© " + new Date().getFullYear() + " " + SITE.name + ". Working since " + SITE.since + "."
      ])
    ]);
  }

  /* --- index rail ---------------------------------------------------------- */

  function rail(slides) {
    var nav = el("nav", { class: "rail", "aria-label": "Project index" });
    nav.appendChild(el("a", { class: "rail__item", href: "#top", "data-target": "top", text: "00" }));
    slides.forEach(function (s, i) {
      nav.appendChild(el("a", {
        class: "rail__item",
        href: "#" + s.node.id,
        "data-target": s.project.slug,
        "data-i": i,
        text: s.project.index,
        title: s.project.title
      }));
    });
    nav.appendChild(el("a", { class: "rail__item", href: "#contact", "data-target": "contact", text: "//" }));
    return nav;
  }

  /* --- build --------------------------------------------------------------- */

  var slides = PROJECTS.map(slide);
  var last = slides.length - 1;

  main.appendChild(hero());
  main.appendChild(deck(slides));
  main.appendChild(outro());
  document.body.appendChild(rail(slides));

  var deckEl = document.getElementById("work");
  var railItems = document.querySelectorAll(".rail__item");

  P.initReveals(main);

  function highlight(target) {
    railItems.forEach(function (item) {
      item.setAttribute("aria-current", String(item.dataset.target === target));
    });
  }

  /* --- the deck engine ------------------------------------------------------
     Scroll position inside the deck becomes a fractional slide index. For
     slide i, t = i - position says where it stands:

       t > 0   still below the window  -> mask parked at +t * 100%
       t = 0   filling the window
       t < 0   already passed          -> mask drifts up to t * DRIFT%

     The artwork inside each mask travels the opposite way at COUNTER of the
     mask's distance. That mismatch is the whole effect: the cover reads as a
     window wiping open over a near-stationary image rather than a picture
     sliding past. --------------------------------------------------------- */

  var DRIFT = 14;      // how far a passed cover creeps upward, in %
  var COUNTER = 0.55;  // artwork travel as a fraction of its mask's travel
  var EASE = 0.18;     // scroll-follow damping

  var position = 0;
  var target = 0;
  var rafId = null;
  var active = -1;

  function readScroll() {
    var span = deckEl.offsetHeight - innerHeight; // == last viewports
    var travelled = -deckEl.getBoundingClientRect().top;
    var p = span > 0 ? clamp(travelled / span, 0, 1) : 0;

    // Smoothstep within each pair, so slides rest at the ends of their
    // segment and cross over quickly in the middle.
    var raw = p * last;
    var i = Math.min(Math.floor(raw), last);
    var f = raw - i;
    target = i + f * f * (3 - 2 * f);
  }

  function paint(pos) {
    slides.forEach(function (s, i) {
      var t = i - pos;
      var mask = t >= 0 ? Math.min(t, 1) * 100 : Math.max(t, -1) * DRIFT;

      s.media.style.transform = "translate3d(0," + mask.toFixed(2) + "%,0)";
      s.shift.style.transform = "translate3d(0," + (-mask * COUNTER).toFixed(2) + "%,0)";

      // The text runs on its own, much shorter track and clears out well
      // before its neighbour arrives, so the two never read as a blur.
      var fade = clamp(1 - Math.abs(t) * 2.2, 0, 1);
      s.body.style.opacity = fade;
      s.body.style.transform = "translate3d(0," + (t * 42).toFixed(1) + "px,0)";
      s.title.style.transform = "translate3d(0," + (clamp(t, -1, 1) * 105).toFixed(1) + "%,0)";

      // Only the legible slide takes clicks and tab stops.
      s.node.style.pointerEvents = fade > 0.6 ? "auto" : "none";
      s.node.style.visibility = t > 1.02 || t < -1.35 ? "hidden" : "visible";
    });

    var now = clamp(Math.round(pos), 0, last);
    if (now === active) return;
    active = now;
    highlight(slides[now].project.slug);
    P.setAutoAccent(slides[now].project.accent);
    history.replaceState(null, "", "#" + slides[now].node.id);
  }

  function tick() {
    position += (target - position) * EASE;
    if (Math.abs(target - position) < 0.0004) position = target;
    paint(position);
    rafId = position === target ? null : requestAnimationFrame(tick);
  }

  function onScroll() {
    readScroll();
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  /* Document scroll offset that parks the deck on slide i. With a single
     project there is nothing to travel, so don't divide by zero. */
  function offsetFor(i) {
    if (last < 1) return deckEl.offsetTop;
    return deckEl.offsetTop + ((deckEl.offsetHeight - innerHeight) * i) / last;
  }

  function goTo(i) {
    scrollTo({ top: offsetFor(clamp(i, 0, last)), behavior: P.reduced ? "auto" : "smooth" });
  }

  if (P.reduced) {
    // No pinning and no transforms: the deck lays out as ordinary panels.
    deckEl.classList.add("deck--static");
  } else {
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    readScroll();
    position = target;
    paint(position);

    /* The rail's project links point at slides that all share one scroll
       position, so send them through the deck's own offsets instead. */
    railItems.forEach(function (item) {
      if (!item.dataset.i) return;
      item.addEventListener("click", function (e) {
        e.preventDefault();
        goTo(parseInt(item.dataset.i, 10));
      });
    });
  }

  /* Hero and outro sit outside the deck and manage their own highlight. */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        active = -1; // force a repaint when the deck comes back into play
        highlight(entry.target.id);
        P.setAutoAccent(entry.target.id === "top" ? null : slides[last].project.accent);
      });
    }, { threshold: 0.6 });
    [document.getElementById("top"), document.getElementById("contact")]
      .forEach(function (node) { io.observe(node); });
  }

  /* --- keyboard ------------------------------------------------------------ */

  P.initKeys(function (e) {
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= slides.length) goTo(n - 1);
    if (e.key === "0") document.getElementById("top").scrollIntoView({ behavior: "smooth" });
  });

  /* --- chrome -------------------------------------------------------------- */

  P.buildChrome("home");
  P.initCursor();
  P.initWipe();
  P.initBoot(function () {
    // Let the hero glitch once as the boot screen clears.
    var name = document.querySelector(".hero__name .glitch");
    if (!name || P.reduced) return;
    name.setAttribute("data-glitching", "");
    setTimeout(function () { name.removeAttribute("data-glitching"); }, 520);
  });
})();
