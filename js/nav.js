/*!
 * js/nav.js — MobileNavToggle behaviour for CERTAIN @ NeurIPS 2026.
 * Contract (from the design notes → Components and Interfaces → MobileNavToggle):
 * DOM shape (authored in every page's HTML, not by this script):
 * <nav class="site-nav" aria-label="Primary">
 * <button class="site-nav__toggle" type="button"
 * aria-expanded="false"
 * aria-controls="site-nav-list"
 * aria-label="Open navigation menu">…</button>
 * <ul id="site-nav-list" class="site-nav__list" data-open="false">
 * <li><a href="…">…</a></li>
 * …
 * </ul>
 * </nav>
 * Behaviour table:
 * | Trigger | Effect |
 * | Click/tap on toggle | Flip data-open + aria-expanded ("true"/"false") within 200ms |
 * | Click on a link inside the panel | Close panel, return focus to the toggle |
 * | Escape keypress while panel is open | Close panel, return focus to the toggle |
 * | Click outside the open panel | Close panel, return focus to the toggle |
 * | Resize above 768 px (≥ 769 px) | Reset data-open + aria-expanded to "false" (no focus shift) |
 * When opening, the toggle's aria-label flips to "Close navigation menu" and
 * reverts to "Open navigation menu" on close, so the accessible name reflects
 * the action that activation will perform.
 * No-JS fallback: this script only enhances behaviour. With JS disabled, the
 * raw <nav> markup is reachable via the normal tab order, and CSS-driven
 * :target / <details> opening (handled in css/site.css) is what reveals the
 * panel on Mobile. Accordingly, the script must be safe to load even when
 * the expected elements are missing — every lookup is null-checked.
 * Loaded from each HTML page as: <script src="js/nav.js" defer></script>
 * No dependencies, no module system, no globals leaked.
 */
(function  {
 "use strict";

 // Run once the DOM is parsed. With `defer` the script executes after parsing,
 // but readyState may already be "interactive" or "complete"; the check covers
 // both cases (and the rare case the script is loaded without `defer`).
 if (document.readyState === "loading") {
 document.addEventListener("DOMContentLoaded", init, { once: true });
 } else {
 init;
 }

 function init {
 // In-page scroll-spy runs independently of the mobile-nav setup (it lives
 // on a different element, .inpage-nav, present only on the home page).
 // Call it first so the early-return guards below don't suppress it on
 // pages where .site-nav happens to be absent.
 initScrollspy;
 // Reduced-motion-aware smooth scroll. Sets scroll-behavior at runtime so
 // the static prefers-reduced-motion override in of site.css
 // (which forces scroll-behavior: auto !important) keeps authority for
 // users with the preference. See /.
 initSmoothScroll;
 // Scroll-reveal: fade and slide cards into view as they enter the
 // viewport. Honours prefers-reduced-motion (the CSS rule in 
 // of site.css collapses the animation to nothing).
 initScrollReveal;
 // Auto-open speaker biography when navigating from the schedule page
 // via a #speaker-* hash link.
 initHashBioOpen;

 var nav = document.querySelector("nav.site-nav");
 if (!nav) return;

 var toggle = nav.querySelector(".site-nav__toggle");
 var panel = nav.querySelector("#site-nav-list");
 if (!toggle || !panel) return;

 var LABEL_OPEN = "Open navigation menu";
 var LABEL_CLOSE = "Close navigation menu";

 // matchMedia for the "above 768 px" threshold. Per the design notes, ≤ 768 is
 // mobile; anything ≥ 769 must reset the panel state.
 var desktop = typeof window.matchMedia === "function"
 ? window.matchMedia("(min-width: 769px)")
 : null;

 function isOpen {
 return panel.getAttribute("data-open") === "true";
 }

 function setOpen(open) {
 var next = open ? "true" : "false";
 // These two attribute writes are what the unit/property tests inspect.
 // They happen in the same synchronous tick, well within the 200 ms
 // budget required by.
 panel.setAttribute("data-open", next);
 toggle.setAttribute("aria-expanded", next);
 toggle.setAttribute("aria-label", open ? LABEL_CLOSE : LABEL_OPEN);
 }

 function close(returnFocus) {
 if (!isOpen) return;
 setOpen(false);
 if (returnFocus) {
 // Guard against the toggle being detached or hidden by CSS — in
 // practice it is always present on Mobile/Tablet, but defensiveness
 // matches the rest of this script.
 try { toggle.focus; } catch (_e) { /* no-op */ }
 }
 }

 // --- Toggle click/tap ---------------------------------------------------
 toggle.addEventListener("click", function (event) {
 event.preventDefault;
 setOpen(!isOpen);
 });

 // --- Click on a link inside the open panel ------------------------------
 panel.addEventListener("click", function (event) {
 if (!isOpen) return;
 var target = event.target;
 // Walk up from the click target to find an <a> inside the panel.
 while (target && target !== panel) {
 if (target.tagName === "A") {
 // The link's own navigation continues uninterrupted; we just close
 // the panel and return focus to the toggle for the next interaction.
 close(true);
 return;
 }
 target = target.parentNode;
 }
 });

 // --- Click outside the open panel ---------------------------------------
 document.addEventListener("click", function (event) {
 if (!isOpen) return;
 var target = event.target;
 if (panel.contains(target) || toggle.contains(target)) return;
 close(true);
 });

 // --- Escape key while panel open ----------------------------------------
 document.addEventListener("keydown", function (event) {
 if (event.key !== "Escape" && event.key !== "Esc") return;
 if (!isOpen) return;
 event.preventDefault;
 close(true);
 });

 // --- Resize above 768 px ------------------------------------------------
 function handleDesktop(event) {
 if (event.matches && isOpen) {
 // Reset state silently — the toggle is hidden at desktop widths so
 // forcing focus back to it would be disorienting. Per the design notes the
 // resize path only "resets data-open and aria-expanded".
 setOpen(false);
 }
 }

 if (desktop) {
 // Modern browsers expose addEventListener on MediaQueryList; older
 // Safari falls back to addListener.
 if (typeof desktop.addEventListener === "function") {
 desktop.addEventListener("change", handleDesktop);
 } else if (typeof desktop.addListener === "function") {
 desktop.addListener(handleDesktop);
 }
 // If the page is loaded already at desktop width with a stale data-open,
 // normalise it on init.
 if (desktop.matches && isOpen) setOpen(false);
 } else {
 // Fallback for environments without matchMedia: a throttled resize
 // listener achieves the same outcome.
 var resizeTimer = null;
 window.addEventListener("resize", function  {
 if (resizeTimer !== null) return;
 resizeTimer = window.setTimeout(function  {
 resizeTimer = null;
 if (window.innerWidth >= 769 && isOpen) setOpen(false);
 }, 100);
 });
 }
 }

 // ---------------------------------------------------------------------------
 // initScrollspy — In-page nav scroll-spy .
 //
 // Observes each section referenced by the .inpage-nav anchor links and
 // toggles aria-current="true" on the corresponding link as the user scrolls.
 // The 40 / 55 root-margin trims the observation band to a thin slice in the
 // upper third of the viewport, which produces the most stable "current
 // section" feel across scroll speeds.
 //
 // No-ops when:
 // - the page has no .inpage-nav (only index.html ships it);
 // - the nav has no in-page (#…) anchor links;
 // - the targeted section ids do not resolve to elements;
 // - the runtime lacks IntersectionObserver (very old browsers — the
 // existing CSS still highlights links on hover/focus, so the page
 // remains usable, just without scroll-spy).
 // ---------------------------------------------------------------------------
 function initScrollspy {
 var nav = document.querySelector('.inpage-nav');
 if (!nav) return; // only the home page has it
 var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
 if (!links.length) return;
 var byId = {};
 links.forEach(function (a) {
 var id = a.getAttribute('href').slice(1);
 var section = document.getElementById(id);
 if (section) byId[id] = a;
 });
 if (typeof IntersectionObserver !== 'function') return;
 var io = new IntersectionObserver(function (entries) {
 entries.forEach(function (entry) {
 var link = byId[entry.target.id];
 if (!link) return;
 if (entry.isIntersecting) {
 // Clear all, then mark this one. aria-current="true" matches.
 Object.values(byId).forEach(function (l) { l.removeAttribute('aria-current'); });
 link.setAttribute('aria-current', 'true');
 }
 });
 }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
 Object.keys(byId).forEach(function (id) {
 var sec = document.getElementById(id);
 if (sec) io.observe(sec);
 });
 }

 // ---------------------------------------------------------------------------
 // initSmoothScroll — Reduced-motion-aware smooth scroll (,
 //).
 //
 // Sets `scroll-behavior` on the document element at runtime rather than via
 // a static CSS rule. The static `prefers-reduced-motion: reduce` override in
 // of `css/site.css` already declares
 // scroll-behavior: auto !important;
 // for users with the preference, so it remains authoritative — even if this
 // function were ever to misfire, the CSS `!important` rule would still win
 // for reduced-motion users. For everyone else, this script flips the inline
 // style to `smooth`, which is what enables in-page anchor links to animate.
 //
 // No-ops when `window.matchMedia` is missing (very old browsers): the
 // browser default of `scroll-behavior: auto` is then used, matching the
 // reduced-motion fallback. This is intentional and safer than guessing the
 // user's preference.
 // ---------------------------------------------------------------------------
 function initSmoothScroll {
 var prefersReduce = typeof window.matchMedia === 'function'
 && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.documentElement.style.scrollBehavior = prefersReduce ? 'auto' : 'smooth';
 }

 // ---------------------------------------------------------------------------
 // initScrollReveal — Adds the .reveal class to every "card" surface and
 // observes them; once they enter the viewport, .is-visible is added so the
 // CSS transition runs. Honours prefers-reduced-motion via the CSS rule in
 // of site.css. No-ops in browsers without IntersectionObserver
 // (the .reveal class is still added but elements stay at opacity 1 since
 // the .is-visible class is also applied immediately as a fallback).
 // ---------------------------------------------------------------------------
 function initScrollReveal {
 var selector = '.person, .format-card, .session-intro, .schedule-block, ' +
 '.scope-block, .why-attend__list li';
 var elements = Array.prototype.slice.call(document.querySelectorAll(selector));
 if (!elements.length) return;

 elements.forEach(function (el) { el.classList.add('reveal'); });

 if (typeof IntersectionObserver !== 'function') {
 // Fallback: reveal everything immediately.
 elements.forEach(function (el) { el.classList.add('is-visible'); });
 return;
 }

 var io = new IntersectionObserver(function (entries) {
 entries.forEach(function (entry) {
 if (entry.isIntersecting) {
 entry.target.classList.add('is-visible');
 io.unobserve(entry.target);
 }
 });
 }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

 elements.forEach(function (el) { io.observe(el); });
 }

 // ---------------------------------------------------------------------------
 // initHashBioOpen — When the page loads with a #speaker-* hash (e.g. from
 // the schedule page links), automatically open that speaker's biography
 // <details> so the inverted card is immediately visible.
 // ---------------------------------------------------------------------------
 function initHashBioOpen {
 var hash = window.location.hash;
 if (!hash || hash.indexOf('#speaker-') !== 0) return;
 var target = document.querySelector(hash);
 if (!target) return;
 var bio = target.querySelector('.speaker-bio');
 if (bio && !bio.hasAttribute('open')) {
 bio.setAttribute('open', '');
 }
 }
});
