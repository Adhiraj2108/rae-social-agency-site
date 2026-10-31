(function(){
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
function init(){
var g=gsap,ST=ScrollTrigger;g.registerPlugin(ST);
try{lenis.on('scroll',ST.update)}catch(e){}
/* hero: image drifts down at half speed and dims while the next section scrolls over it */
document.querySelectorAll('[data-hero-parallax]').forEach(function(h){
var img=h.querySelector('[data-hero-parallax-img]');if(!img)return;
if(img.parentNode)img.parentNode.style.overflow='clip';
g.timeline({scrollTrigger:{trigger:h,start:'top top',end:'bottom top',scrub:true}}).to(img,{yPercent:50,opacity:.4,ease:'none'});});
/* section image: drifts 12% each way against the scroll; scale 1.25 keeps the edges covered */
document.querySelectorAll('[data-parallax-img]').forEach(function(img){
var s=img.closest('section');if(!s)return;
if(img.parentNode)img.parentNode.style.overflow='clip';
g.set(img,{scale:1.25});
g.fromTo(img,{yPercent:-12},{yPercent:12,ease:'none',scrollTrigger:{trigger:s,start:'top bottom',end:'bottom top',scrub:true}});});
/* footer: starts 25% up under the section above and slides down as it brightens */
document.querySelectorAll('[data-footer-parallax]').forEach(function(el){
var tl=g.timeline({scrollTrigger:{trigger:el,start:'clamp(top bottom)',end:'clamp(top top)',scrub:true}});
var i=el.querySelector('[data-footer-parallax-inner]'),d=el.querySelector('[data-footer-parallax-dark]');
if(i)tl.from(i,{yPercent:-25,ease:'linear'});
if(d)tl.from(d,{opacity:.5,ease:'linear'},'<');});
ST.refresh();}
function go(){if(!window.gsap)return;if(window.ScrollTrigger)return init();
var s=document.createElement('script');s.src='/js/vendor/gsap/'+(gsap.version||'3.15.0')+'/ScrollTrigger.min.js';s.onload=init;document.head.appendChild(s);}
if(document.readyState==='complete')go();else addEventListener('load',go);
})();