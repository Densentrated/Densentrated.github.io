/* ==========================================================================
   chan-updated-portfolio — case study page
   renders project.html?p=<slug> from content.js
   ========================================================================== */

(function () {
  "use strict";

  var P = window.portfolio;
  var el = P.el, plate = P.plate;
  var SITE = window.PORTFOLIO.SITE;
  var PROJECTS = window.PORTFOLIO.PROJECTS;

  var main = document.getElementById("main");
  var slug = new URLSearchParams(location.search).get("p");

  // No ?p= at all means "show the first project" — handy while editing.
  var project = slug
    ? PROJECTS.find(function (p) { return p.slug === slug; })
    : PROJECTS[0];

  var sections = []; // { id, label } for the side nav

  /* --- hero ---------------------------------------------------------------- */

  function hero() {
    var meta = el("dl", { class: "case-meta" });
    [
      ["Year", project.year],
      ["Role", project.role],
      ["Client", project.client],
      ["Status", project.status],
      ["Stack", project.tags.join(", ")]
    ].forEach(function (pair) {
      meta.appendChild(el("div", {}, [
        el("dt", { text: pair[0] }),
        el("dd", { text: pair[1] })
      ]));
    });

    return el("header", { class: "case-hero" }, [
      el("p", {}, [el("a", { class: "backlink", href: "index.html", "data-wipe": "", text: "Index" })]),
      el("p", { class: "case-hero__index" }, [
        el("b", { text: project.index }),
        el("span", { text: "—" }),
        el("span", { text: project.title.toUpperCase() })
      ]),
      el("h1", { class: "case-hero__title" }, [
        el("span", { class: "glitch", "data-text": project.title, text: project.title })
      ]),
      el("p", { class: "case-hero__sub", text: project.subtitle }),
      meta
    ]);
  }

  /* --- block renderers ----------------------------------------------------- */

  function head(text) {
    var id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    sections.push({ id: id, label: text });
    return el("div", { class: "block__head" }, [el("h2", { id: id, text: text })]);
  }

  /* Most blocks are the same shape: a section, an optional heading, content.
     `content` may be one node or an array of them. */
  function section(block, className, content) {
    var node = el("section", { class: className, "data-reveal": "" });
    if (block.heading) node.appendChild(head(block.heading));
    (Array.isArray(content) ? content : [content]).forEach(function (child) {
      node.appendChild(child);
    });
    return node;
  }

  var render = {
    text: function (block) {
      return section(block, "prose", block.body.map(function (para) {
        return el("p", { html: para });
      }));
    },

    steps: function (block) {
      var list = el("ol", { class: "steps" });
      block.items.forEach(function (item) {
        list.appendChild(el("li", {}, [
          el("div", {}, [el("b", { text: item.title }), el("span", { text: item.text })])
        ]));
      });
      return section(block, null, list);
    },

    quote: function (block) {
      return el("blockquote", { class: "quote", "data-reveal": "" }, [
        el("p", { text: block.text }),
        el("footer", { text: block.attribution })
      ]);
    },

    figure: function (block) {
      return el("div", { class: block.bleed ? "bleed" : "wide", "data-reveal": "" }, [
        el("figure", {}, [
          plate(block.src, block.alt, true),
          el("figcaption", { text: block.caption })
        ])
      ]);
    },

    gallery: function (block) {
      var grid = el("div", { class: "gallery" });
      block.items.forEach(function (item) {
        grid.appendChild(el("figure", {}, [
          plate(item.src, item.alt, true),
          el("figcaption", { text: item.caption })
        ]));
      });
      return section(block, "wide", grid);
    },

    specs: function (block) {
      var body = el("tbody");
      block.rows.forEach(function (row) {
        body.appendChild(el("tr", {}, [
          el("th", { scope: "row", text: row[0] }),
          el("td", { text: row[1] })
        ]));
      });
      return section(block, null, el("table", { class: "specs" }, [body]));
    },

    links: function (block) {
      var list = el("div", { class: "outlinks" });
      block.items.forEach(function (item) {
        list.appendChild(el("a", { href: item.href }, [
          el("span", { text: item.label }),
          el("span", { text: item.note || "Link" })
        ]));
      });
      return section(block, null, list);
    }
  };

  /* --- next project -------------------------------------------------------- */

  function nextUp() {
    var next = PROJECTS[(PROJECTS.indexOf(project) + 1) % PROJECTS.length];

    return el("a", {
      class: "nextup",
      href: "project.html?p=" + encodeURIComponent(next.slug),
      "data-wipe": ""
    }, [
      el("div", { class: "nextup__bg", "aria-hidden": "true" }, [plate(next.cover, "", true)]),
      el("p", { class: "nextup__label", text: "Next — " + next.index }),
      el("p", { class: "nextup__title", text: next.title }),
      el("p", { class: "dim", text: next.subtitle.split(/[.—]/)[0] })
    ]);
  }

  /* --- not found ----------------------------------------------------------- */

  function notFound() {
    return el("div", { class: "notfound" }, [
      el("p", { class: "label", text: "Error 404" }),
      el("h1", { class: "case-hero__title", text: "No such project" }),
      el("p", { class: "dim", text: "“" + slug + "” is not in the index." }),
      el("p", {}, [el("a", { class: "link", href: "index.html", text: "Back to the index" })])
    ]);
  }

  /* --- reading progress + section highlighting ------------------------------ */

  function initProgress() {
    var bar = el("div", { class: "progress", "aria-hidden": "true" });
    document.body.appendChild(bar);

    var navLinks = [];
    if (sections.length > 1) {
      var nav = el("nav", { class: "sectionnav", "aria-label": "On this page" });
      sections.forEach(function (s) {
        nav.appendChild(el("a", { href: "#" + s.id, text: s.label }));
      });
      document.body.appendChild(nav);
      navLinks = nav.querySelectorAll("a");
    }

    var ticking = false;

    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 1);

      // The last heading above the 40% line is the one you are reading.
      var current = null;
      sections.forEach(function (s) {
        var node = document.getElementById(s.id);
        if (node && node.getBoundingClientRect().top < innerHeight * 0.4) current = s.id;
      });
      navLinks.forEach(function (link) {
        link.setAttribute("aria-current", String(link.getAttribute("href") === "#" + current));
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    update();
  }

  /* --- build --------------------------------------------------------------- */

  if (project) {
    document.title = project.title + " — " + SITE.name;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", project.subtitle);

    var doc = el("article", { class: "doc" }, [hero()]);
    project.blocks.forEach(function (block) {
      var fn = render[block.type];
      if (fn) doc.appendChild(fn(block));
    });
    main.appendChild(doc);
    main.appendChild(nextUp());

    initProgress();
    P.setAutoAccent(project.accent);
  } else {
    main.appendChild(notFound());
  }

  /* --- chrome -------------------------------------------------------------- */

  P.buildChrome("project");
  P.initCursor();
  P.initWipe();
  P.initReveals(main);
  P.initKeys(function (e) {
    if (e.key === "Escape") location.href = "index.html";
  });
})();
