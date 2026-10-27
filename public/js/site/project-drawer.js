// Project drawer: opens a project's details panel ([data-drawer-panel]) from
// [data-drawer-open] links, with GSAP slide-in, focus trap, scroll lock and
// #slug deep links. Extracted from the site's Odyn bundle; the bundle's
// live-reload WebSocket (an editor tool) is intentionally left out.
var OdynCode = (() => {
  // odyn:/__entry__.tsx
  function initProjectDrawer() {
    "use strict";
    if (window.projectDrawer) return window.projectDrawer;
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
    const SKIP_TAGS = /^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE)$/;
    const root = document.querySelector("[data-drawer-root]");
    if (!root) return;
    const overlay = document.querySelector("[data-drawer-overlay]");
    const titleEl = root.querySelector("[data-drawer-title]");
    const scroller = root.querySelector("[data-drawer-scroll]") || root;
    const docEl = document.documentElement;
    const body = document.body;
    const panels = /* @__PURE__ */ new Map();
    root.querySelectorAll("[data-drawer-panel]").forEach((p) => {
      panels.set(p.dataset.drawerPanel, p);
      p.hidden = true;
      p.style.display = "none";
    });
    if (!panels.size) {
      console.warn("[drawer] No [data-drawer-panel] elements found.");
      return;
    }
    const duration = isNaN(parseFloat(root.dataset.drawerDuration)) ? 0.6 : parseFloat(root.dataset.drawerDuration);
    const ease = root.dataset.drawerEase || "expo.out";
    const updateDocTitle = root.hasAttribute("data-drawer-update-title");
    const getLenis = () => window[root.dataset.drawerLenis || "lenis"];
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (titleEl && !titleEl.id) titleEl.id = "drawer-title";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    if (titleEl) root.setAttribute("aria-labelledby", titleEl.id);
    root.setAttribute("aria-hidden", "true");
    root.setAttribute("tabindex", "-1");
    root.style.outline = "none";
    root.inert = true;
    root.dataset.state = "closed";
    if (overlay) overlay.setAttribute("aria-hidden", "true");
    if (!scroller.hasAttribute("tabindex"))
      scroller.setAttribute("tabindex", "0");
    scroller.setAttribute("data-lenis-prevent", "");
    scroller.style.overscrollBehavior = "contain";
    let isOpen = false;
    let locked = false;
    let current = null;
    let shownPanel = null;
    let trigger = null;
    let inerted = [];
    let baseTitle = document.title;
    let anim;
    if (window.gsap && !reduceMotion) {
      const tl = gsap.timeline({
        paused: true,
        defaults: { duration, ease },
        onReverseComplete: afterClose
      });
      if (overlay) {
        tl.fromTo(
          overlay,
          { autoAlpha: 0 },
          { autoAlpha: 1, ease: "power1.out", duration: duration * 0.7 },
          0
        );
      }
      tl.fromTo(
        root,
        { xPercent: 100, visibility: "hidden" },
        { xPercent: 0, visibility: "visible", force3D: true },
        0
      );
      anim = {
        play: () => tl.play(),
        reverse: () => tl.reverse()
      };
    } else {
      root.style.visibility = "hidden";
      root.style.transform = "translateX(100%)";
      anim = {
        play() {
          root.style.visibility = "visible";
          root.style.transform = "none";
          if (overlay) {
            overlay.style.visibility = "visible";
            overlay.style.opacity = "1";
          }
        },
        reverse() {
          root.style.visibility = "hidden";
          root.style.transform = "translateX(100%)";
          if (overlay) {
            overlay.style.visibility = "hidden";
            overlay.style.opacity = "0";
          }
          afterClose();
        }
      };
    }
    const slugFromUrl = () => {
      try {
        return decodeURIComponent(location.hash.slice(1));
      } catch (_) {
        return "";
      }
    };
    function inertPage() {
      const nodes = [];
      let node = root;
      while (node && node !== body && node.parentElement) {
        for (const sib of node.parentElement.children) {
          if (sib !== node && !SKIP_TAGS.test(sib.tagName) && !(overlay && sib.contains(overlay)) && !sib.inert) {
            nodes.push(sib);
          }
        }
        node = node.parentElement;
      }
      nodes.forEach((n) => n.inert = true);
      inerted = nodes;
    }
    function restorePage() {
      inerted.forEach((n) => n.inert = false);
      inerted = [];
    }
    function lockScroll() {
      if (locked) return;
      locked = true;
      const sbw = window.innerWidth - docEl.clientWidth;
      docEl.style.setProperty("--drawer-sbw", sbw + "px");
      docEl.style.overflow = "hidden";
      if (sbw > 0) body.style.paddingRight = sbw + "px";
      const l = getLenis();
      if (l && typeof l.stop === "function") l.stop();
    }
    function unlockScroll() {
      if (!locked) return;
      locked = false;
      docEl.style.overflow = "";
      docEl.style.removeProperty("--drawer-sbw");
      body.style.paddingRight = "";
      const l = getLenis();
      if (l && typeof l.start === "function") l.start();
    }
    function renderPanel(slug, triggerEl) {
      if (shownPanel) {
        shownPanel.hidden = true;
        shownPanel.style.display = "none";
        shownPanel.removeAttribute("data-drawer-active");
      }
      const panel = panels.get(slug);
      panel.hidden = false;
      panel.style.display = "";
      panel.setAttribute("data-drawer-active", "");
      shownPanel = panel;
      const heading = panel.querySelector("h1,h2,h3");
      const text = panel.dataset.drawerPanelTitle || heading && heading.textContent.trim() || triggerEl && triggerEl.getAttribute("aria-label") || "";
      if (titleEl) titleEl.textContent = text;
      if (updateDocTitle && text) document.title = text + " \u2014 " + baseTitle;
      scroller.scrollTop = 0;
    }
    function onKeydown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...root.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.getClientRects().length
      );
      if (!items.length) {
        e.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
    function show(slug, triggerEl) {
      if (!panels.has(slug)) return;
      if (isOpen && current === slug) return;
      const wasOpen = isOpen;
      current = slug;
      renderPanel(slug, triggerEl);
      if (wasOpen) {
        root.focus({ preventScroll: true });
        return;
      }
      isOpen = true;
      trigger = triggerEl || null;
      baseTitle = updateDocTitle && baseTitle ? baseTitle : document.title;
      lockScroll();
      inertPage();
      root.inert = false;
      root.setAttribute("aria-hidden", "false");
      root.dataset.state = "open";
      document.addEventListener("keydown", onKeydown);
      root.style.visibility = "visible";
      anim.play();
      root.focus({ preventScroll: true });
    }
    function hide() {
      if (!isOpen) return;
      isOpen = false;
      current = null;
      document.removeEventListener("keydown", onKeydown);
      restorePage();
      root.inert = true;
      root.setAttribute("aria-hidden", "true");
      root.dataset.state = "closed";
      if (updateDocTitle) document.title = baseTitle;
      let target = trigger;
      if (!target || !document.contains(target)) {
        const slug = shownPanel && shownPanel.dataset.drawerPanel;
        target = slug ? document.querySelector(
          '[data-drawer-open="' + CSS.escape(slug) + '"]'
        ) : null;
      }
      if (target) target.focus({ preventScroll: true });
      trigger = null;
      anim.reverse();
    }
    function afterClose() {
      if (isOpen) return;
      unlockScroll();
    }
    function openDrawer(slug, triggerEl) {
      if (!panels.has(slug)) return;
      if (slugFromUrl() !== slug) {
        history.pushState({ drawer: slug }, "", "#" + encodeURIComponent(slug));
      }
      show(slug, triggerEl);
    }
    function closeDrawer() {
      if (!isOpen) return;
      if (history.state && history.state.drawer) {
        history.back();
      } else {
        history.replaceState(null, "", location.pathname + location.search);
        hide();
      }
    }
    function sync() {
      const slug = slugFromUrl();
      if (slug && panels.has(slug)) show(slug, null);
      else hide();
    }
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-drawer-open]");
      if (opener) {
        if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey)
          return;
        const slug = opener.dataset.drawerOpen;
        if (!panels.has(slug)) return;
        e.preventDefault();
        openDrawer(slug, opener);
        return;
      }
      if (isOpen && e.target.closest("[data-drawer-close],[data-drawer-overlay]")) {
        e.preventDefault();
        closeDrawer();
      }
    });
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    requestAnimationFrame(sync);
    window.projectDrawer = {
      open: (slug) => openDrawer(slug, null),
      close: closeDrawer,
      get isOpen() {
        return isOpen;
      }
    };
    return window.projectDrawer;
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProjectDrawer);
  } else {
    initProjectDrawer();
  }
})();
