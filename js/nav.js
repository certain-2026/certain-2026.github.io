/*!
 * js/nav.js — CERTAIN @ NeurIPS 2026 navigation, scroll-spy, smooth scroll,
 * scroll-reveal, and hash-driven biography auto-open.
 *
 * Loaded from each HTML page as: <script src="js/nav.js" defer></script>
 * No dependencies, no module system, no globals leaked.
 */
(function () {
  "use strict";

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  function init() {
    initScrollspy();
    initSmoothScroll();
    initScrollReveal();
    initHashBioOpen();

    var nav = document.querySelector("nav.site-nav");
    if (!nav) return;

    var toggle = nav.querySelector(".site-nav__toggle");
    var panel = nav.querySelector("#site-nav-list");
    if (!toggle || !panel) return;

    var LABEL_OPEN = "Open navigation menu";
    var LABEL_CLOSE = "Close navigation menu";

    var desktop = typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 769px)")
      : null;

    function isOpen() {
      return panel.getAttribute("data-open") === "true";
    }

    function setOpen(open) {
      var next = open ? "true" : "false";
      panel.setAttribute("data-open", next);
      toggle.setAttribute("aria-expanded", next);
      toggle.setAttribute("aria-label", open ? LABEL_CLOSE : LABEL_OPEN);
    }

    function close(returnFocus) {
      if (!isOpen()) return;
      setOpen(false);
      if (returnFocus) {
        try { toggle.focus(); } catch (_e) { /* no-op */ }
      }
    }

    // Toggle click/tap
    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      setOpen(!isOpen());
    });

    // Click on a link inside the open panel — close it
    panel.addEventListener("click", function (event) {
      if (!isOpen()) return;
      var target = event.target;
      while (target && target !== panel) {
        if (target.tagName === "A") {
          close(true);
          return;
        }
        target = target.parentNode;
      }
    });

    // Click outside the open panel — close it
    document.addEventListener("click", function (event) {
      if (!isOpen()) return;
      var target = event.target;
      if (panel.contains(target) || toggle.contains(target)) return;
      close(true);
    });

    // Escape key while panel is open — close it
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" && event.key !== "Esc") return;
      if (!isOpen()) return;
      event.preventDefault();
      close(true);
    });

    // Resize above 768 px — reset state silently
    function handleDesktop(event) {
      if (event.matches && isOpen()) {
        setOpen(false);
      }
    }

    if (desktop) {
      if (typeof desktop.addEventListener === "function") {
        desktop.addEventListener("change", handleDesktop);
      } else if (typeof desktop.addListener === "function") {
        desktop.addListener(handleDesktop);
      }
      if (desktop.matches && isOpen()) setOpen(false);
    } else {
      var resizeTimer = null;
      window.addEventListener("resize", function () {
        if (resizeTimer !== null) return;
        resizeTimer = window.setTimeout(function () {
          resizeTimer = null;
          if (window.innerWidth >= 769 && isOpen()) setOpen(false);
        }, 100);
      });
    }
  }

  // In-page nav scroll-spy: toggle aria-current="true" on the link whose
  // section is currently in view. Only the home page ships .inpage-nav.
  function initScrollspy() {
    var nav = document.querySelector(".inpage-nav");
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;
    var byId = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (section) byId[id] = a;
    });
    if (typeof IntersectionObserver !== "function") return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.values(byId).forEach(function (l) {
            l.removeAttribute("aria-current");
          });
          link.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    Object.keys(byId).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  // Reduced-motion-aware smooth scroll. The static prefers-reduced-motion
  // override in css/site.css uses !important so it stays authoritative for
  // users who request reduced motion.
  function initSmoothScroll() {
    var prefersReduce = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.style.scrollBehavior = prefersReduce ? "auto" : "smooth";
  }

  // Scroll-reveal: add .reveal to cards and toggle .is-visible as they
  // enter the viewport. Falls back to immediate reveal without IO support.
  function initScrollReveal() {
    var selector = ".person, .format-card, .session-intro, .schedule-block, " +
      ".scope-block, .why-attend__list li";
    var elements = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!elements.length) return;

    elements.forEach(function (el) { el.classList.add("reveal"); });

    if (typeof IntersectionObserver !== "function") {
      elements.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });

    elements.forEach(function (el) { io.observe(el); });
  }

  // When the page loads with a #speaker-<id> hash (e.g. from a schedule
  // link), open that speaker's biography <details> automatically so the
  // inverted card is immediately visible.
  function initHashBioOpen() {
    function openFromHash() {
      var hash = window.location.hash;
      if (!hash || hash.indexOf("#speaker-") !== 0) return;
      var target = document.querySelector(hash);
      if (!target) return;
      var bio = target.querySelector(".speaker-bio");
      if (bio && !bio.hasAttribute("open")) {
        bio.setAttribute("open", "");
      }
    }
    openFromHash();
    // Also respond when the user navigates between speaker hashes on the
    // same page (browser back/forward, or another schedule click).
    window.addEventListener("hashchange", openFromHash);
  }
})();
