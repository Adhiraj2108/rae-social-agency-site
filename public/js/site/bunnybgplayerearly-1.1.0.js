(function(){var c=navigator.connection||{};if(matchMedia('(prefers-reduced-motion: reduce)').matches||c.saveData||/(^|-)2g$/.test(c.effectiveType||''))return;
function init(p){var v=p.querySelector('video'),s=p.getAttribute('data-player-src');if(!v||!s)return;v.muted=!0;v.loop=!0;v.playsInline=!0;v.preload='auto';var ok=0,vis=0;
function st(x){p.setAttribute('data-player-status',x)}
function attach(){if(ok)return;ok=1;if(v.canPlayType('application/vnd.apple.mpegurl'))v.src=s;else if(window.Hls&&Hls.isSupported()){var h=new Hls({capLevelToPlayerSize:!0,maxBufferLength:10,maxMaxBufferLength:20});h.loadSource(s);h.attachMedia(v)}else v.src=s}
function play(){var r=v.play();r&&r.catch&&r.catch(function(){})}
v.addEventListener('playing',function(){st('playing');p.setAttribute('data-player-activated','true');var i=p.querySelector('.bunny-bg__placeholder');if(i){i.style.transition='opacity .6s ease';i.style.opacity='0'}});
v.addEventListener('pause',function(){st('paused')});v.addEventListener('waiting',function(){st('loading')});
/* plays only while actually on screen (and not hidden, e.g. a closed drawer, or a background tab); pauses the moment it is not */
function chk(){var on=vis&&!document.hidden&&getComputedStyle(p).visibility!=='hidden';if(on){if(v.paused)play()}else if(!v.paused)v.pause()}
/* buffers from 100vh away so it is ready on arrival, without playing */
new IntersectionObserver(function(e){if(e[0].isIntersecting)attach()},{rootMargin:'100% 0px'}).observe(p);
new IntersectionObserver(function(e){vis=e[0].isIntersecting;if(vis)attach();chk()}).observe(p);
document.addEventListener('visibilitychange',chk);setInterval(function(){if(vis)chk()},300)}
function run(){document.querySelectorAll('[data-bunny-background-init]').forEach(init)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run):run()})();