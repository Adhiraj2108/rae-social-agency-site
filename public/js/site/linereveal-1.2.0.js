(function(){
window.__lineReveal=1;
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var D=document;
async function go(){try{
if(!window.gsap||!window.SplitText)return;
if(D.fonts)await D.fonts.ready;
var g=gsap;g.registerPlugin(SplitText);
g.registerEase('osmo',function(p){var a=0,b=1,t=p,u;for(var i=0;i<30;i++){t=(a+b)/2;u=1-t;if(3*u*u*t*.625+t*t*t<p)a=t;else b=t;}u=1-t;return 3*u*u*t*.05+3*u*t*t+t*t*t;});
D.querySelectorAll('[data-reveal="lines"]').forEach(function(el){
if(!el.textContent.trim())return;
var it=el.closest('[data-tst="item"]'),sc=el.closest('[data-tst="section"]'),v=0,on=false,sp;
/* all line reveals: 105% start, 0.03s stagger, 0.75s total. Plain text plays once; testimonials play every time they are active and in view, so scrolling back repeats them. No exit animation */
function sync(){var w=!!(v&&(!sc||!sc.hasAttribute('data-tst-ready')||!it||it.hasAttribute('data-tst-active')));
if(w===on||(!w&&!sc)||!sp)return;on=w;g.killTweensOf(sp.lines);
if(w){var n=sp.lines.length;g.set(sp.lines,{yPercent:105});g.to(sp.lines,{yPercent:0,duration:Math.max(.3,.75-.03*(n-1)),ease:'osmo',stagger:.03,delay:sc?.2:0});}}
sp=SplitText.create(el,{type:'lines',mask:'lines',autoSplit:true,onSplit:function(s){g.set(s.masks,{overflow:'visible',clipPath:'inset(0 -.15em)'});g.set(s.lines,{yPercent:on?0:105});}});
var m=new MutationObserver(sync);
if(it)m.observe(it,{attributes:true,attributeFilter:['data-tst-active']});
if(sc)m.observe(sc,{attributes:true,attributeFilter:['data-tst-ready']});
new IntersectionObserver(function(es){es.forEach(function(e){v=e.isIntersecting;sync();});},{rootMargin:sc?'-20% 0px -10% 0px':'0px 0px -10% 0px'}).observe(el);
if(sc)new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting&&!on)g.set(sp.lines,{yPercent:105});});}).observe(el);
});}catch(e){}}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',go);else go();
})();