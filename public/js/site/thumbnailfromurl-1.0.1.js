(function () {
  function setThumbs() {
    document.querySelectorAll('[data-thumb-src]').forEach(function (player) {
      var url = (player.getAttribute('data-thumb-src') || '').trim();
      if (!url) return; // no URL: no image
      var img = player.querySelector('.bunny-bg__placeholder');
      if (!img) {
        img = document.createElement('img');
        img.className = 'bunny-bg__placeholder';
        img.alt = '';
        img.decoding = 'async';
        img.loading = 'lazy';
        var video = player.querySelector('video');
        if (video) video.after(img);
        else player.prepend(img);
      }
      if (img.getAttribute('src') !== url) img.src = url;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setThumbs);
  else setThumbs();
})();