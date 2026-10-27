// Home page scripts: sticky testimonials, Bunny player, CSS accordion, sticky scale.
  // Testimonial section
  function initStickyTestimonials() {
    document.querySelectorAll('[data-tst="section"]').forEach((section) => {
      if (section.__tst) return;
      section.__tst = true; // safe to call more than once

      const stage = section.querySelector('[data-tst="stage"]');
      const items = [...section.querySelectorAll('[data-tst="item"]')];
      if (!stage) {
        console.warn('Sticky testimonials: add data-tst="stage" to the sticky wrapper.', section);
        return;
      }
      if (items.length < 2) return; // 0–1 testimonial: normal section
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; // stacked list for reduced motion

      const num = (name, def) => {
        const v = parseFloat(section.getAttribute(name));
        return isFinite(v) && v > 0 ? v : def;
      };
      const STEP = num('data-tst-step', 150); // vh of scrolling per testimonial
      const FADE = num('data-tst-fade', 600); // ms

      // sticky silently fails if a parent clips/scrolls — warn so it's easy to fix in Webflow
      for (let el = section.parentElement; el && el !== document.documentElement; el = el.parentElement) {
        const o = getComputedStyle(el);
        if (/(hidden|auto|scroll)/.test(o.overflow + o.overflowX + o.overflowY)) {
          console.warn('Sticky testimonials: this parent has overflow "' + o.overflow + '", which breaks sticky. Set Overflow to Clip (or Visible) instead:', el);
        }
      }

      items[0].parentElement.setAttribute('data-tst-list', ''); // the Collection List
      section.style.setProperty('--tst-count', items.length);
      section.style.setProperty('--tst-step', STEP + 'vh');
      section.style.setProperty('--tst-fade', FADE + 'ms');
      section.setAttribute('data-tst-ready', '');

      let current = -1,
        ticking = false;
      function update() {
        ticking = false;
        const r = section.getBoundingClientRect();
        const range = r.height - stage.offsetHeight; // = count × step
        const p = range > 0 ? Math.min(Math.max(-r.top / range, 0), 0.9999) : 0;
        const i = Math.min(items.length - 1, Math.floor(p * items.length));
        if (i === current) return;
        if (current > -1) items[current].removeAttribute('data-tst-active');
        items[i].setAttribute('data-tst-active', '');
        section.setAttribute('data-tst-index', i + 1); // handy for styling counters/dots
        current = i;
      }
      const request = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };

      // first one shows immediately, without a fade on page load
      items.forEach((it) => {
        it.style.transition = 'none';
      });
      update();
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          items.forEach((it) => {
            it.style.transition = '';
          }),
        ),
      );

      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request);
      if ('ResizeObserver' in window) new ResizeObserver(request).observe(section);
    });
  }

  // Bunny player
  function initBunnyPlayerBasic() {
    document.querySelectorAll('[data-bunny-player-init]').forEach(function (player) {
      var src = player.getAttribute('data-player-src');
      if (!src) return;

      var video = player.querySelector('video');
      if (!video) return;

      try {
        video.pause();
      } catch (_) {}
      try {
        video.removeAttribute('src');
        video.load();
      } catch (_) {}

      // Attribute helpers
      function setStatus(s) {
        if (player.getAttribute('data-player-status') !== s) {
          player.setAttribute('data-player-status', s);
        }
      }
      function setActivated(v) {
        player.setAttribute('data-player-activated', v ? 'true' : 'false');
      }
      if (!player.hasAttribute('data-player-activated')) setActivated(false);

      // Flags
      var updateSize = player.getAttribute('data-player-update-size'); // "true" | "cover" | null
      var lazyMode = player.getAttribute('data-player-lazy'); // "true" | "meta" | null
      var isLazyTrue = lazyMode === 'true';
      var isLazyMeta = lazyMode === 'meta';
      var autoplay = player.getAttribute('data-player-autoplay') === 'true';

      // Used to suppress 'ready' flicker when user just pressed play in lazy modes
      var pendingPlay = false;

      // Autoplay forces muted + loop; IO will drive play/pause
      video.muted = !!autoplay;
      if (autoplay) video.loop = true;

      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.playsInline = true;
      if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
      if (autoplay) video.autoplay = false;

      var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
      var canUseHlsJs = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

      // Minimal ratio fetch when requested (and not already handled by lazy meta)
      if (updateSize === 'true' && !isLazyMeta) {
        if (isLazyTrue) {
          // Do nothing: no fetch, no <video> touch when lazy=true
        } else {
          var prev = video.preload;
          video.preload = 'metadata';
          var onMeta2 = function () {
            setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
            video.removeEventListener('loadedmetadata', onMeta2);
            video.preload = prev || '';
          };
          video.addEventListener('loadedmetadata', onMeta2, { once: true });
          video.src = src;
        }
      }

      //  Lazy meta fetch (duration + aspect) without attaching playback
      function fetchMetaOnce() {
        getSourceMeta(src, canUseHlsJs).then(function (meta) {
          if (meta.width && meta.height) setBeforeRatio(player, updateSize, meta.width, meta.height);
          readyIfIdle(player, pendingPlay);
        });
      }

      // Attach media only once (for actual playback)
      var isAttached = false;
      var userInteracted = false;
      var lastPauseBy = ''; // 'io' | 'manual' | ''
      function attachMediaOnce() {
        if (isAttached) return;
        isAttached = true;

        if (player._hls) {
          try {
            player._hls.destroy();
          } catch (_) {}
          player._hls = null;
        }

        if (isSafariNative) {
          video.preload = isLazyTrue || isLazyMeta ? 'auto' : video.preload;
          video.src = src;
          video.addEventListener(
            'loadedmetadata',
            function () {
              readyIfIdle(player, pendingPlay);
              if (updateSize === 'true') setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
            },
            { once: true },
          );
        } else if (canUseHlsJs) {
          var hls = new Hls({ maxBufferLength: 10 });
          hls.attachMedia(video);
          hls.on(Hls.Events.MEDIA_ATTACHED, function () {
            hls.loadSource(src);
          });
          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            readyIfIdle(player, pendingPlay);
            if (updateSize === 'true') {
              var lvls = hls.levels || [];
              var best = bestLevel(lvls);
              if (best && best.width && best.height) setBeforeRatio(player, updateSize, best.width, best.height);
            }
          });
          player._hls = hls;
        } else {
          // Fallback if not HLS
          video.src = src;
        }
      }

      // Initialize based on lazy mode
      if (isLazyMeta) {
        if (updateSize === 'true') fetchMetaOnce();
        video.preload = 'none';
      } else if (isLazyTrue) {
        video.preload = 'none';
      } else {
        attachMediaOnce();
      }

      // Toggle play/pause
      function togglePlay() {
        userInteracted = true;
        if (video.paused || video.ended) {
          if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();
          pendingPlay = true;
          lastPauseBy = '';
          setStatus('loading');
          safePlay(video);
        } else {
          lastPauseBy = 'manual';
          video.pause();
        }
      }

      // Toggle mute
      function toggleMute() {
        video.muted = !video.muted;
        player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
      }

      // Controls (delegated)
      player.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-player-control]');
        if (!btn || !player.contains(btn)) return;
        var type = btn.getAttribute('data-player-control');
        if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
        else if (type === 'mute') toggleMute();
      });

      // Media event wiring
      video.addEventListener('play', function () {
        setActivated(true);
        setStatus('playing');
      });
      video.addEventListener('playing', function () {
        pendingPlay = false;
        setStatus('playing');
      });
      video.addEventListener('pause', function () {
        pendingPlay = false;
        setStatus('paused');
      });
      video.addEventListener('waiting', function () {
        setStatus('loading');
      });
      video.addEventListener('canplay', function () {
        readyIfIdle(player, pendingPlay);
      });
      video.addEventListener('ended', function () {
        pendingPlay = false;
        setStatus('paused');
        setActivated(false);
      });

      // Ensure aspect ratio updates as soon as real dimensions exist (lazy=true path included)
      var ratioSet = false;
      function maybeSetRatioOnce() {
        if (ratioSet || updateSize !== 'true') return;
        var before = player.querySelector('[data-player-before]');
        if (!before) return;
        if (video.videoWidth && video.videoHeight) {
          before.style.paddingTop = (video.videoHeight / video.videoWidth) * 100 + '%';
          ratioSet = true;
        }
      }
      video.addEventListener('loadedmetadata', function () {
        maybeSetRatioOnce();
      });
      video.addEventListener('loadeddata', function () {
        maybeSetRatioOnce();
      });
      video.addEventListener('playing', function () {
        maybeSetRatioOnce();
      });

      // Hover (basic: active on enter, idle on leave)
      function setHover(state) {
        if (player.getAttribute('data-player-hover') !== state) {
          player.setAttribute('data-player-hover', state);
        }
      }
      player.addEventListener('pointerenter', function () {
        setHover('active');
      });
      player.addEventListener('pointerleave', function () {
        setHover('idle');
      });

      // In-view auto play/pause (only when autoplay is true)
      if (autoplay) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              var inView = entry.isIntersecting && entry.intersectionRatio > 0;
              if (inView) {
                if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();
                if (lastPauseBy === 'io' || (video.paused && lastPauseBy !== 'manual')) {
                  setStatus('loading');
                  if (video.paused) togglePlay();
                  lastPauseBy = '';
                }
              } else {
                if (!video.paused && !video.ended) {
                  lastPauseBy = 'io';
                  video.pause();
                }
              }
            });
          },
          { threshold: 0.1 },
        );
        io.observe(player);
      }
    });

    // Helper: Ready status guard
    function readyIfIdle(player, pendingPlay) {
      if (!pendingPlay && player.getAttribute('data-player-activated') !== 'true' && player.getAttribute('data-player-status') === 'idle') {
        player.setAttribute('data-player-status', 'ready');
      }
    }

    // Helper: Ratio setter
    function setBeforeRatio(player, updateSize, w, h) {
      if (updateSize !== 'true' || !w || !h) return;
      var before = player.querySelector('[data-player-before]');
      if (!before) return;
      before.style.paddingTop = (h / w) * 100 + '%';
    }
    function maybeSetRatioFromVideo(player, updateSize, video) {
      if (updateSize !== 'true') return;
      var before = player.querySelector('[data-player-before]');
      if (!before) return;
      var hasPad = before.style.paddingTop && before.style.paddingTop !== '0%';
      if (!hasPad && video.videoWidth && video.videoHeight) {
        setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
      }
    }

    // Helper: best HLS level by resolution
    function bestLevel(levels) {
      if (!levels || !levels.length) return null;
      return levels.reduce(function (a, b) {
        return (b.width || 0) > (a.width || 0) ? b : a;
      }, levels[0]);
    }

    // Helper: safe programmatic play
    function safePlay(video) {
      var p = video.play();
      if (p && typeof p.then === 'function') p.catch(function () {});
    }

    // Helper: simple URL resolver
    function resolveUrl(base, rel) {
      try {
        return new URL(rel, base).toString();
      } catch (_) {
        return rel;
      }
    }

    // Helper: unified meta fetch (hls.js or native fetch)
    function getSourceMeta(src, useHlsJs) {
      return new Promise(function (resolve) {
        if (useHlsJs && window.Hls && Hls.isSupported()) {
          try {
            var tmp = new Hls();
            var out = { width: 0, height: 0, duration: NaN };

            tmp.on(Hls.Events.MANIFEST_PARSED, function (e, data) {
              var lvls = (data && data.levels) || tmp.levels || [];
              var best = bestLevel(lvls);
              if (best && best.width && best.height) {
                out.width = best.width;
                out.height = best.height;
              }
            });
            tmp.on(Hls.Events.LEVEL_LOADED, function (e, data) {
              if (data && data.details && isFinite(data.details.totalduration)) {
                out.duration = data.details.totalduration;
              }
            });
            tmp.on(Hls.Events.ERROR, function () {
              try {
                tmp.destroy();
              } catch (_) {}
              resolve(out);
            });
            tmp.on(Hls.Events.LEVEL_LOADED, function () {
              try {
                tmp.destroy();
              } catch (_) {}
              resolve(out);
            });

            tmp.loadSource(src);
            return;
          } catch (_) {
            resolve({ width: 0, height: 0, duration: NaN });
            return;
          }
        }

        function parseMaster(masterText) {
          var lines = masterText.split(/\r?\n/);
          var bestW = 0,
            bestH = 0,
            firstMedia = null,
            lastInf = null;
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf('#EXT-X-STREAM-INF:') === 0) {
              lastInf = line;
            } else if (lastInf && line && line[0] !== '#') {
              if (!firstMedia) firstMedia = line.trim();
              var m = /RESOLUTION=(\d+)x(\d+)/.exec(lastInf);
              if (m) {
                var w = parseInt(m[1], 10),
                  h = parseInt(m[2], 10);
                if (w > bestW) {
                  bestW = w;
                  bestH = h;
                }
              }
              lastInf = null;
            }
          }
          return { bestW: bestW, bestH: bestH, media: firstMedia };
        }
        function sumDuration(mediaText) {
          var dur = 0,
            re = /#EXTINF:([\d.]+)/g,
            m;
          while ((m = re.exec(mediaText))) dur += parseFloat(m[1]);
          return dur;
        }

        fetch(src, { credentials: 'omit', cache: 'no-store' })
          .then(function (r) {
            if (!r.ok) throw new Error('master');
            return r.text();
          })
          .then(function (master) {
            var info = parseMaster(master);
            if (!info.media) {
              resolve({ width: info.bestW || 0, height: info.bestH || 0, duration: NaN });
              return;
            }
            var mediaUrl = resolveUrl(src, info.media);
            return fetch(mediaUrl, { credentials: 'omit', cache: 'no-store' })
              .then(function (r) {
                if (!r.ok) throw new Error('media');
                return r.text();
              })
              .then(function (mediaText) {
                resolve({ width: info.bestW || 0, height: info.bestH || 0, duration: sumDuration(mediaText) });
              });
          })
          .catch(function () {
            resolve({ width: 0, height: 0, duration: NaN });
          });
      });
    }
  }

  // Services accordion
  function initAccordionCSS() {
    document.querySelectorAll('[data-accordion-css-init]').forEach((accordion) => {
      const closeSiblings = accordion.getAttribute('data-accordion-close-siblings') === 'true';

      // Open the first item by default
      accordion.querySelector('[data-accordion-status]')?.setAttribute('data-accordion-status', 'active');

      accordion.addEventListener('click', (event) => {
        const toggle = event.target.closest('[data-accordion-toggle]');
        if (!toggle) return; // Exit if the clicked element is not a toggle

        const singleAccordion = toggle.closest('[data-accordion-status]');
        if (!singleAccordion) return; // Exit if no accordion container is found

        const isActive = singleAccordion.getAttribute('data-accordion-status') === 'active';
        singleAccordion.setAttribute('data-accordion-status', isActive ? 'not-active' : 'active');

        // When [data-accordion-close-siblings="true"]
        if (closeSiblings && !isActive) {
          accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
            if (sibling !== singleAccordion) sibling.setAttribute('data-accordion-status', 'not-active');
          });
        }
      });
    });
  }

  // Campaign section sticky on mobile
function initStickyScale() {
  const els = document.querySelectorAll('[data-sticky-scale]');
  if (!els.length) return;

  const mq = window.matchMedia('(max-width: 767px)'); // below 768px

  // cubic-bezier solver: returns an easing function f(x) -> y
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
    const sampleY = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 20; i++) {
        const v = sampleX(t);
        if (Math.abs(v - x) < 1e-5) break;
        v < x ? (lo = t) : (hi = t);
        t = (lo + hi) / 2;
      }
      return sampleY(t);
    };
  }

  const DEFAULT_EASE = '0.625, 0.05, 0, 1';

  const items = [...els].map((el) => {
    const ease = (el.dataset.ease || DEFAULT_EASE).split(',').map(Number);
    return {
      el,
      parent: el.parentElement,
      range: parseFloat(el.dataset.range ?? 20) / 100,
      opacity: parseFloat(el.dataset.opacity ?? 0.6),
      scale: parseFloat(el.dataset.scale ?? 0.8),
      top: parseFloat(el.dataset.top ?? 0),
      duration: parseFloat(el.dataset.duration ?? 0.6),
      smooth: el.dataset.mode === 'smooth',
      cssEase: `cubic-bezier(${ease.join(',')})`,
      ease: bezier(...ease),
      active: null,
    };
  });

  function setup(item) {
    const { el, smooth, duration, cssEase } = item;
    el.style.transformOrigin = el.dataset.origin || 'center top';
    el.style.willChange = 'opacity, transform';
    el.style.transition = smooth
      ? 'none'
      : `opacity ${duration}s ${cssEase}, transform ${duration}s ${cssEase}`;
  }

  function reset(item) {
    const { el } = item;
    el.style.opacity = '';
    el.style.transform = '';
    el.style.transition = '';
    el.style.transformOrigin = '';
    el.style.willChange = '';
    item.active = null;
  }

  let ticking = false;

  function update() {
    items.forEach((item) => {
      const { el, parent, range, opacity, scale, top, smooth, ease } = item;
      const rangePx = window.innerHeight * range;
      const scrolled = Math.max(0, top - parent.getBoundingClientRect().top);

      if (smooth) {
        const p = ease(Math.min(scrolled / rangePx, 1));
        el.style.opacity = 1 - (1 - opacity) * p;
        el.style.transform = `scale(${1 - (1 - scale) * p})`;
      } else {
        const active = scrolled > rangePx;
        if (active === item.active) return;
        item.active = active;
        el.style.opacity = active ? opacity : 1;
        el.style.transform = `scale(${active ? scale : 1})`;
      }
    });
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  let enabled = false;

  function enable() {
    if (enabled) return;
    enabled = true;
    items.forEach(setup);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function disable() {
    if (!enabled) return;
    enabled = false;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', update);
    items.forEach(reset);
  }

  function check() {
    mq.matches ? enable() : disable();
  }

  mq.addEventListener('change', check);
  check();
}

  // Initialization is grouped at the bottom of the homepage code.

// Initialize homepage functions after all definitions.
function initHomePage() {
  initStickyTestimonials();
  initBunnyPlayerBasic();
  initAccordionCSS();
  initStickyScale();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomePage, { once: true });
} else {
  initHomePage();
}
