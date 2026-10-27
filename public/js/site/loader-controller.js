// Hero loader controller. Markup lives in src/components/home/Loader.astro ([data-loader="wrapper"]).
(function () {
  var root = document.documentElement;
  var ld = document.querySelector('[data-loader="wrapper"]');

  // -- Preview switch: data-loader-preview on the wrapper ------------------
  //   "hide" = never play the loader (page opens straight away)
  //   "show" = always play it, even if the guard skipped it (once-per-session, #hash, reduced motion, other path)
  //   "auto" / empty = normal rules. ?loader=0 in the URL still wins over "show".
  var mode = ld ? (ld.getAttribute('data-loader-preview') || '').toLowerCase().trim() : '';
  if (mode === 'hide') { if (root.classList.contains('is-loading') && window.__raeUnlock) window.__raeUnlock(); return; }
  if (mode === 'show' && !root.classList.contains('is-loading') && window.__raeStart && !window.__raeSkip) window.__raeStart();
  if (!root.classList.contains('is-loading')) return; // guard (site head) says: don't play

  // -- Settings (all in one place) -----------------------------------------
  var EASE = 'osmo';                              // registered below with CustomEase.create("osmo", "M0,0 C0.625,0.05 0,1 1,1"); use ease: "osmo" anywhere in GSAP
  var OSMO_PATH = 'M0,0 C0.625,0.05 0,1 1,1';
  var CFG = {
    fontWait: 800,                 // max ms to wait for the webfont before starting
    imageWait: 3500,               // max ms to wait for the hero image before starting anyway

    // 1) blank screen, then the image scales up from 0 to imgStart while the four words enter (mask reveal)
    blank: 0.25,                   // seconds of blank screen before anything enters
    popDur: 0.8,                   // image: scale 0 -> imgStart
    inDur: 0.7, inStagger: 0.07,   // words: slide up out of their masks

    // 1b) sentence version. true: the four words first read as one sentence in the middle of the screen (mask reveal, word by word),
    //     hold for sentenceHold, then travel to the four corners while the image scales 0 -> imgStart. false: the words enter straight in the corners.
    sentence: true,
    sentenceHold: 0.7,             // seconds the sentence stays readable once it is in
    moveDur: 0.9, moveStagger: 0.04,   // words: middle -> corners (the image pop runs alongside)
    // what the sentence adds around the four words. They reveal with the words and vanish instantly when the words start travelling to the corners.
    // after: index of the word it follows. attach: true hugs that word (a comma), otherwise it is a word of its own with a gap each side.
    sentenceExtras: [{ after: 1, text: ',', attach: true }, { after: 2, text: ',', attach: true }],   // "Be seen, remembered, chosen"; for "... remembered and chosen" use { after: 2, text: 'and' } instead of the second comma
    sentenceGap: 0.24,             // space between the words of the sentence, in em of the word size (a natural word space, a touch tight to match the -4% tracking)

    // 2) pause, then the image grows to full screen
    hold: 0.3,                     // seconds of pause once everything is in
    imgStart: 0.2,                 // size of the small image
    growDur: 1.3,

    // 3) the words exit (mask exit) wordsLead seconds before the image reaches handoffAt x scale, where the loader
    //    hands over to the real hero image, which finishes the growth
    handoffAt: 0.85,
    outDur: 0.5, outStagger: 0.05,
    wordsLead: 0.1,                // the words start leaving this many seconds BEFORE the image reaches handoffAt

    // 4) the hero content enters (mask reveal) heroLead seconds before the image is full width
    heroLead: 0.45,
    heroDur: 0.9, heroLineGap: 0.12,      // headline: the top lines rise together, the bottom lines follow heroLineGap later
    servicesAt: 0.35, servicesDur: 0.8,   // services: every word rises together (word masks) at servicesAt
    barAt: 0.7, barDur: 0.6,              // bottom row fades in at barAt
    navDur: 0.7,

    maskClip: 'inset(0em -0.15em 0em -0.15em)'   // applied to the masks GSAP SplitText builds: tight top/bottom, a little side room for tracking
  };

  var wrapper = document.querySelector('.page-wrapper');
  var parkedRestore = null; // undoes the parked hero content if the loader ever bails out early
  var finished = false, live, guards = [], imgReady = false, imgOk = true, imgWaiters = [];

  // -- Helpers -------------------------------------------------------------
  function getLenis() { try { return lenis; } catch (e) { return window.lenis || null; } }
  function say(msg) { if (live) live.textContent = msg; }
  // GSAP's lag smoothing slows animation time when frames drop (slow device / throttled tab).
  // Switch it off while the loader runs so every duration here is real wall-clock time.
  function relag() { try { window.gsap.ticker.lagSmoothing(500, 33); } catch (e) {} } // GSAP defaults
  function unlock() { if (window.__raeUnlock) window.__raeUnlock(); else root.classList.remove('is-loading'); }
  function onDomReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function removeLoader() { if (ld && ld.parentNode) ld.parentNode.removeChild(ld); }

  // -- 0. The "osmo" ease ----------------------------------------------------
  // CustomEase.create("osmo", ...) registers the ease by name, so ease: "osmo" works in any GSAP tween on the page.
  // CustomEase is loaded from Webflow's GSAP CDN when the site doesn't already have it. If it can't load,
  // the same cubic-bezier is registered by hand so the animation never changes.
  function registerOsmo(g) {
    try { if (window.CustomEase) { g.registerPlugin(window.CustomEase); window.CustomEase.create(EASE, OSMO_PATH); return; } } catch (e) {}
    var x1 = 0.625, y1 = 0.05, x2 = 0, y2 = 1;
    g.registerEase(EASE, function (p) {
      if (p <= 0) return 0; if (p >= 1) return 1;
      var lo = 0, hi = 1, t = p, i, x;
      for (i = 0; i < 30; i++) {
        t = (lo + hi) / 2;
        x = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
        if (x < p) lo = t; else hi = t;
      }
      return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
    });
  }
  function loadEase(cb) {
    var g = window.gsap, done = false;
    if (!g) return cb();
    function fin() { if (done) return; done = true; try { registerOsmo(g); } catch (e) {} cb(); }
    if (window.CustomEase) return fin();
    var s = document.createElement('script');
    s.src = '/js/vendor/gsap/' + (g.version || '3.15.0') + '/CustomEase.min.js';
    s.onload = fin; s.onerror = fin;
    setTimeout(fin, 1200);
    document.head.appendChild(s);
  }

  // -- 1. Scroll lock (layered) --------------------------------------------
  // CSS overflow lock + stable scrollbar gutter live in the head. Here: stop Lenis
  // (it scrolls via scrollTo, which overflow:hidden does NOT block), swallow input,
  // keep the page pinned to the top, and make the page inert for keyboard / AT users.
  function lockPage() {
    if (wrapper) { wrapper.inert = true; wrapper.setAttribute('data-rae-inert', ''); }
    var main = document.querySelector('main');
    if (main) main.setAttribute('aria-busy', 'true');
    var stop = function (e) { e.preventDefault(); e.stopPropagation(); };
    var keys = function (e) {
      if (/^( |PageUp|PageDown|Home|End|ArrowUp|ArrowDown)$/.test(e.key)) e.preventDefault();
    };
    var pin = function () { if (window.scrollY) window.scrollTo(0, 0); };
    guards = [['wheel', stop, true], ['touchmove', stop, true], ['keydown', keys, true], ['scroll', pin, false]];
    guards.forEach(function (g) { addEventListener(g[0], g[1], g[0] === 'scroll' ? { passive: true } : { passive: false, capture: true }); });
    var l = getLenis(); if (l && l.stop) l.stop();
  }
  function unguard() {
    guards.forEach(function (g) { removeEventListener(g[0], g[1], g[2]); });
    guards = [];
  }

  // -- 2. Exit paths -------------------------------------------------------
  function cleanup() {
    unguard();
    setTimeout(function () { say(''); if (live && live.parentNode) live.parentNode.removeChild(live); }, 2000);
  }
  function hardFinish() { // no animation: just show the page
    if (finished) return;
    finished = true;
    if (parkedRestore) parkedRestore();
    relag();
    unlock();
    say('Page loaded');
    cleanup();
    setTimeout(removeLoader, 100);
  }

  // -- 3. Hero image gate ----------------------------------------------------
  // The loader's own image is a copy of the hero image: same file, same srcset and sizes, so the browser downloads it once.
  function prepareImage() {
    var hero = document.querySelector('.section.cc-hero .full-bg-img img');
    var limg = ld.querySelector('[data-loader="image"] img');
    function done(ok) { if (imgReady) return; imgReady = true; imgOk = ok !== false; imgWaiters.splice(0).forEach(function (f) { f(); }); }
    setTimeout(function () { done(true); }, CFG.imageWait);
    if (!hero || !limg) return done(false);
    hero.loading = 'eager';
    try { hero.fetchPriority = 'high'; } catch (e) {}
    limg.loading = 'eager';
    try { limg.fetchPriority = 'high'; } catch (e) {}
    var srcset = hero.getAttribute('srcset'), sizes = hero.getAttribute('sizes'), src = hero.getAttribute('src');
    if (srcset && limg.getAttribute('srcset') !== srcset) limg.setAttribute('srcset', srcset);
    if (sizes && limg.getAttribute('sizes') !== sizes) limg.setAttribute('sizes', sizes);
    if (src && limg.getAttribute('src') !== src) limg.setAttribute('src', src);
    try { if (hero.decode) hero.decode().catch(function () {}); } catch (e) {}   // the real hero image is decoded ahead of the handoff too
    function decoded() { (limg.decode ? limg.decode() : Promise.resolve()).then(function () { done(true); }, function () { done(true); }); }
    if (limg.complete && limg.naturalWidth) decoded();
    else { limg.addEventListener('load', decoded, { once: true }); limg.addEventListener('error', function () { done(false); }, { once: true }); }
  }
  function whenImage(fn) { if (imgReady) fn(); else imgWaiters.push(fn); }

  // -- 4. Sequence ---------------------------------------------------------
  // blank -> (sentence version: the words read as one sentence in the middle, then travel to the corners) image scales 0 -> small + words in the corners -> pause -> image grows -> words exit (wordsLead before the handoff)
  // -> handoff to the real hero image at handoffAt x scale -> hero content enters (heroLead before the image is full width)
  function play() {
    var g = window.gsap;
    if (finished) return;
    if (!g) return hardFinish();
    if (!imgOk) return hardFinish();
    var l = getLenis(); if (l && l.stop) l.stop();

    var box = ld.querySelector('[data-loader="image"]');
    var words = [].slice.call(ld.querySelectorAll('[data-loader="word"]'));
    var wordEls = words.slice();   // the four loader words, kept: `words` is reused below for the hero services
    var heroBox = document.querySelector('.section.cc-hero .full-bg-img');

    // the loader image must frame exactly like the hero image, so the handoff to the real hero is seamless
    var cw = root.clientWidth, ch = root.clientHeight, ox = cw / 2, oy = ch / 2;
    var r = heroBox ? heroBox.getBoundingClientRect() : null;
    if (r && r.width && r.height && (Math.abs(r.width - cw) > 1 || Math.abs(r.height - ch) > 1 || Math.abs(r.left) > 1 || Math.abs(r.top) > 1)) {
      box.style.left = r.left + 'px'; box.style.top = r.top + 'px';
      box.style.right = 'auto'; box.style.bottom = 'auto';
      box.style.width = r.width + 'px'; box.style.height = r.height + 'px';
      ox = cw / 2 - r.left; oy = ch / 2 - r.top;
    }
    var origin = ox + 'px ' + oy + 'px';
    var coverColor = getComputedStyle(root, '::before').backgroundColor; // the loader colour, resolved

    // the words are masked by GSAP SplitText (it builds the mask wrappers), nothing is masked in the markup
    var items = [], masks = [];
    words.forEach(function (w) {
      try {
        var s = window.SplitText && SplitText.create(w, { type: 'lines', mask: 'lines' });
        if (s && s.lines && s.lines.length) {
          items = items.concat(s.lines);
          masks = masks.concat(s.masks && s.masks.length ? s.masks : s.lines.map(function (n) { return n.parentNode; }));
        } else items.push(w);
      } catch (e) { items.push(w); }
    });

    // hero content: split into masked lines and parked BEFORE the animation starts. The screen is still blank here,
    // so this cost is invisible instead of landing in the middle of the overlap.
    var hero = document.querySelector('.section.cc-hero');
    var nav = document.querySelector('.nav');
    var cont = hero && hero.querySelector('.container');
    var heads = hero ? [].slice.call(hero.querySelectorAll('.hero-title .h1')) : [];
    var tags = hero ? [].slice.call(hero.querySelectorAll('.hero-title .row.u-sm-d-none .eyebrow')) : [];
    var bar = hero && hero.querySelector('.container > .row:last-child');
    // headline lines grouped by line number (top lines together, bottom lines together), services as word masks
    var splits = [], rows = [], words = [];
    heads.forEach(function (el) {
      try {
        var s = SplitText.create(el, { type: 'lines', mask: 'lines' });
        splits.push(s);
        s.lines.forEach(function (ln, i) { (rows[i] = rows[i] || []).push(ln); });
      } catch (e) {}
    });
    tags.forEach(function (el) {
      try {
        var s = SplitText.create(el, { type: 'words', mask: 'words' });
        splits.push(s);
        words = words.concat(s.words);
      } catch (e) {}
    });
    var flatLines = [].concat.apply([], rows);
    if (nav) g.set(nav, { yPercent: -100 });
    if (flatLines.length) g.set(flatLines, { yPercent: 110 });
    if (words.length) g.set(words, { yPercent: 110 });
    if (bar) g.set(bar, { autoAlpha: 0 });
    parkedRestore = function () {
      splits.forEach(function (s) { try { s.revert(); } catch (e) {} });
      g.set([nav, bar].filter(Boolean), { clearProps: 'opacity,visibility,transform' });
      if (cont) cont.style.visibility = '';
    };
    // no will-change here on purpose: it freezes the raster scale and makes the image soft while it scales

    // sentence version: where would the four words sit as one centred sentence? Measure it on a hidden copy built from the same
    // classes, then park every word there (x / y offset from its corner). Moving the offsets back to 0 sends them to the corners.
    // The comma and the "and" are extra masked pieces on their own fixed layer: they only exist in the sentence and vanish the moment the words travel.
    var sentence = false, layer = null, seq = [], extraInners = [];
    if (CFG.sentence && wordEls.length) {
      try {
        var cs0 = getComputedStyle(wordEls[0]);
        var tmp = document.createElement('div');
        tmp.setAttribute('aria-hidden', 'true');
        tmp.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;padding:0 5vw;box-sizing:border-box;display:flex;flex-wrap:wrap;' +
          'align-content:center;justify-content:center;column-gap:' + CFG.sentenceGap + 'em;row-gap:0.1em;visibility:hidden;pointer-events:none;font-size:' + cs0.fontSize + ';';
        var defs = items.length === wordEls.length ? (CFG.sentenceExtras || []) : [];   // extras need one line per word
        var cores = [], marks = [];
        function mkP(text) {
          var p = document.createElement('p');
          p.className = wordEls[0].className;
          p.style.cssText = 'margin:0;white-space:nowrap;';
          if (text != null) p.textContent = text;
          return p;
        }
        wordEls.forEach(function (w, i) {
          var c = mkP(null), core = document.createElement('span');
          core.textContent = w.textContent.replace(/\s+/g, ' ').trim();
          c.appendChild(core);
          cores.push(core);
          defs.forEach(function (d) {
            if (d.after === i && d.attach) { var sp = document.createElement('span'); sp.textContent = d.text; c.appendChild(sp); marks.push({ d: d, el: sp, host: c }); }
          });
          tmp.appendChild(c);
          defs.forEach(function (d) {
            if (d.after === i && !d.attach) { var e = mkP(d.text); tmp.appendChild(e); marks.push({ d: d, el: e, host: e }); }
          });
        });
        document.body.appendChild(tmp);
        var offs = wordEls.map(function (w, i) {
          var a = w.getBoundingClientRect(), b = cores[i].getBoundingClientRect();
          return { x: (b.left + b.width / 2) - (a.left + a.width / 2), y: (b.top + b.height / 2) - (a.top + a.height / 2) };
        });
        var spots = marks.map(function (m) {
          var e = m.el.getBoundingClientRect(), h = m.host.getBoundingClientRect();
          return { d: m.d, left: e.left, top: h.top, width: e.width, height: h.height };
        });
        document.body.removeChild(tmp);
        if (offs.every(function (o) { return isFinite(o.x) && isFinite(o.y); })) {
          g.set(wordEls, { x: function (i) { return offs[i].x; }, y: function (i) { return offs[i].y; } });
          sentence = true;
          if (spots.length) {
            layer = document.createElement('div');
            layer.setAttribute('data-loader', 'extra');
            layer.setAttribute('aria-hidden', 'true');
            layer.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483002;mix-blend-mode:difference;pointer-events:none;visibility:hidden;';
            var extraAt = {};
            spots.forEach(function (sp) {
              var mask = document.createElement('div'), inner = mkP(sp.d.text);
              mask.style.cssText = 'position:absolute;left:' + sp.left + 'px;top:' + sp.top + 'px;width:' + sp.width + 'px;height:' + sp.height + 'px;';
              mask.appendChild(inner);
              layer.appendChild(mask);
              g.set(mask, { clipPath: CFG.maskClip });
              g.set(inner, { yPercent: 110 });
              (extraAt[sp.d.after] = extraAt[sp.d.after] || []).push(inner);
              extraInners.push(inner);
            });
            ld.appendChild(layer);
          }
          // reveal order = reading order: Be, Seen, ",", Remembered, "and", Chosen
          items.forEach(function (it, i) { seq.push(it); (extraAt && extraAt[i] || []).forEach(function (x) { seq.push(x); }); });
        }
      } catch (e) {}
    }

    // start states, set BEFORE the loader becomes visible
    g.set(masks, { overflow: 'visible', clipPath: CFG.maskClip });  // a little side room so the tracking never crops a letter
    g.set(items, { yPercent: 110 });
    g.set(box, { opacity: 1, scale: 0, transformOrigin: origin });
    ld.classList.add('is-ready');
    if (layer) layer.style.visibility = '';
    try { g.ticker.lagSmoothing(0); } catch (e) {}

    // one scale tween drives whichever image is on screen: the loader's copy first, the real hero image after the handoff
    var grow = { s: 0 }, target = box, handed = false, heroIn = null, exited = false, wordsDone = false;

    // the words exit (mask exit); the loader is only removed once the words are gone AND the handoff has happened
    function maybeRemove() { if (wordsDone && handed) removeLoader(); }
    function exitWords() {
      if (exited) return;
      exited = true;
      g.to(items, { yPercent: -110, duration: CFG.outDur, ease: EASE, stagger: CFG.outStagger,
        onComplete: function () { wordsDone = true; maybeRemove(); } });
    }

    function handoff() {
      if (handed) return;
      handed = true;
      if (!root.classList.contains('is-loading')) return hardFinish(); // watchdog already unlocked
      finished = true;

      if (hero) hero.style.backgroundColor = coverColor;               // loader colour frames the growing image
      if (heroBox) g.set(heroBox, { scale: grow.s, transformOrigin: origin, force3D: true });
      if (nav) nav.style.visibility = 'hidden';
      if (cont) cont.style.visibility = 'hidden';                       // hero content waits for the full-width image

      // the hero content enters (mask reveal): called when the image is full width
      heroIn = function () {
        if (nav) nav.style.visibility = '';
        if (cont) cont.style.visibility = '';
        var tl = g.timeline({
          onComplete: function () {
            splits.forEach(function (s) { try { s.revert(); } catch (e) {} });
            g.set([nav, bar].filter(Boolean), { clearProps: 'opacity,visibility,transform' });
            relag();
          }
        });
        if (nav) tl.to(nav, { yPercent: 0, duration: CFG.navDur, ease: EASE }, 0);
        rows.forEach(function (r, i) { tl.to(r, { yPercent: 0, duration: CFG.heroDur, ease: EASE }, i * CFG.heroLineGap); }); // top lines together, bottom lines slightly after
        if (words.length) tl.to(words, { yPercent: 0, duration: CFG.servicesDur, ease: EASE }, CFG.servicesAt);              // services all together
        if (bar) tl.to(bar, { autoAlpha: 1, duration: CFG.barDur, ease: EASE }, CFG.barAt);                                  // bottom row fades in
      };

      target = heroBox || box;
      ld.classList.add('is-handoff');                                   // keeps the loader (the words) on screen once is-loading is gone
      unlock();                                                         // cover goes, the real hero image goes live
      if (box.parentNode) box.parentNode.removeChild(box);              // same frame: the loader image was identical to the hero's

      exitWords();     // normally already running (see wordsLead); this is the safety net
      maybeRemove();

      say('Page loaded');
      cleanup();
    }

    function applyScale() { g.set(target, { scale: grow.s, force3D: true }); }
    var wordsIn = CFG.blank + CFG.inDur + CFG.inStagger * Math.max((sentence && seq.length ? seq.length : items.length) - 1, 0);   // when the last word has risen into view
    var moveAt = wordsIn + CFG.sentenceHold;                                                  // sentence version: the words leave the middle here
    var inEnd = sentence
      ? moveAt + Math.max(CFG.moveDur + CFG.moveStagger * Math.max(wordEls.length - 1, 0), CFG.popDur)
      : CFG.blank + Math.max(CFG.inDur + CFG.inStagger * Math.max(items.length - 1, 0), CFG.popDur);
    var growAt = inEnd + CFG.hold;
    // when (seconds into the growth) does the image reach scale sc? read off the osmo ease itself
    var easeFn = g.parseEase(EASE);
    function timeAtScale(sc) {
      var y = (sc - CFG.imgStart) / (1 - CFG.imgStart), lo = 0, hi = 1, i;
      for (i = 0; i < 30; i++) { var m = (lo + hi) / 2; if (easeFn(m) < y) lo = m; else hi = m; }
      return hi * CFG.growDur;
    }
    var heroEntered = false;
    function enterHero() {                                          // hero content enters (the loader has already handed over to the real hero)
      if (heroEntered) return;
      heroEntered = true;
      handoff();
      if (heroIn) heroIn();
    }
    var tl0 = g.timeline();
    tl0.to(sentence && seq.length ? seq : items, { yPercent: 0, duration: CFG.inDur, ease: EASE, stagger: CFG.inStagger }, CFG.blank);
    if (sentence) {
      // the words travel from the middle to the corners while the image scales 0 -> imgStart
      tl0.to(wordEls, { x: 0, y: 0, duration: CFG.moveDur, ease: EASE, stagger: CFG.moveStagger }, moveAt);
      if (layer) {   // the commas (and any "and") disappear instantly, with no animation, the moment the words start travelling
        tl0.call(function () { if (layer && layer.parentNode) layer.parentNode.removeChild(layer); }, null, moveAt);
      }
      tl0.to(grow, { s: CFG.imgStart, duration: CFG.moveDur, ease: EASE, onUpdate: applyScale }, moveAt);
    } else {
      tl0.to(grow, { s: CFG.imgStart, duration: CFG.popDur, ease: EASE, onUpdate: applyScale }, CFG.blank);
    }
    tl0.call(exitWords, null, Math.max(growAt, growAt + timeAtScale(CFG.handoffAt) - CFG.wordsLead)); // words leave wordsLead seconds before the image hits handoffAt
    tl0.call(enterHero, null, Math.max(growAt, growAt + CFG.growDur - CFG.heroLead)); // hero content: heroLead seconds before the image is full width
    tl0.to(grow, { s: 1, duration: CFG.growDur, ease: EASE,
      onUpdate: function () {
        applyScale();
        if (!handed && grow.s >= CFG.handoffAt) handoff();            // the loader hands over to the real hero image at .85x
      },
      onComplete: function () {
        handoff();
        if (heroBox) g.set(heroBox, { clearProps: 'transform' });
        if (hero) hero.style.backgroundColor = '';
        enterHero();                                                    // safety net: no-op when it already entered
      } }, growAt);
  }

  // -- Go ------------------------------------------------------------------
  try {
    if (!ld) return hardFinish(); // page has no loader wrapper: just unlock
    live = document.createElement('div');
    live.className = 'rae-sr';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
    setTimeout(function () { if (!finished) say('Loading'); }, 150);
    lockPage();

    onDomReady(function () {
      try {
        prepareImage();
        var font = document.fonts && document.fonts.load
          ? Promise.race([document.fonts.load('700 40px "Apfel Grotezk"'), new Promise(function (r) { setTimeout(r, CFG.fontWait); })])
          : Promise.resolve();
        var fontDone = false, easeDone = false;
        function go() { if (fontDone && easeDone) whenImage(play); }
        font.then(function () { fontDone = true; go(); }, function () { fontDone = true; go(); });
        loadEase(function () { easeDone = true; go(); });
      } catch (err) { hardFinish(); }
    });
  } catch (err) { hardFinish(); }
})();
