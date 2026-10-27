(function(){
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
/* osmo ease: CustomEase.create("osmo", "M0,0 C0.625,0.05 0,1 1,1"); same curve by hand if CustomEase is missing */
function osmo(g){
try{if(window.CustomEase){g.registerPlugin(CustomEase);CustomEase.create('osmo','M0,0 C0.625,0.05 0,1 1,1');return;}}catch(e){}
g.registerEase('osmo',function(p){if(p<=0)return 0;if(p>=1)return 1;
var lo=0,hi=1,t=p,i,u;for(i=0;i<30;i++){t=(lo+hi)/2;u=1-t;if(3*u*u*t*.625+t*t*t<p)lo=t;else hi=t;}
u=1-t;return 3*u*u*t*.05+3*u*t*t+t*t*t;});}
function seen(el,fn){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.disconnect();fn();}});},{rootMargin:'0px 0px -12% 0px'});io.observe(el);}
function init(){
var g=window.gsap;if(!g)return;osmo(g);
/* unmask from the bottom up, image zooms out 1.25 -> 1 */
document.querySelectorAll('[data-img-reveal]').forEach(function(el){
var im=el.querySelector('img');
g.set(el,{clipPath:'inset(100% 0% 0% 0%)'});
if(im)g.set(im,{scale:1.25});
seen(el,function(){
g.to(el,{clipPath:'inset(0% 0% 0% 0%)',duration:1.2,ease:'osmo',clearProps:'clipPath'});
if(im)g.to(im,{scale:1,duration:1.2,ease:'osmo',clearProps:'transform'});});});
/* campaign reels: fade in while scaling 1.15 -> 1 */
document.querySelectorAll('[data-reel-in]').forEach(function(el){
g.set(el,{opacity:0,scale:1.15});
seen(el,function(){g.to(el,{opacity:1,scale:1,duration:1.2,ease:'osmo',clearProps:'opacity,transform'});});});}
if(window.gsap)init();else addEventListener('load',init);
})();