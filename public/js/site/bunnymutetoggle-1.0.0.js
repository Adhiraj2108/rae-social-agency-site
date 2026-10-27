(function () {
  function setState(player, muted) {
    var v = player.querySelector('video');
    var b = player.querySelector('[data-mute-toggle]');
    if (!v || !b) return;
    v.muted = muted;
    b.setAttribute('aria-pressed', String(!muted));
    b.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
    var off = b.querySelector('[data-mute-icon="muted"]');
    var on = b.querySelector('[data-mute-icon="unmuted"]');
    if (off) off.classList.toggle('u-d-none', !muted);
    if (on) on.classList.toggle('u-d-none', muted);
  }
  function toggle(btn) {
    var p = btn.closest('[data-bunny-background-init]');
    var v = p && p.querySelector('video');
    if (!v) return;
    var mute = !v.muted;
    if (!mute) {
      document.querySelectorAll('[data-bunny-background-init]').forEach(function (o) {
        if (o !== p) setState(o, true); // only one video has sound
      });
    }
    setState(p, mute);
    if (!mute && v.paused) {
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () {});
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-mute-toggle]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    toggle(b);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var b = e.target.closest && e.target.closest('[data-mute-toggle]');
    if (!b) return;
    e.preventDefault();
    toggle(b);
  });
})();