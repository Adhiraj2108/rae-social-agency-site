(function(){
function copy(t){
if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(t);
return new Promise(function(r,j){var a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();var ok=0;try{ok=document.execCommand('copy')}catch(e){}document.body.removeChild(a);ok?r():j();});}
/* [data-copy-email] links copy their address instead of opening the mail app, and say Copied! in the same text */
document.addEventListener('click',function(e){
var a=e.target.closest&&e.target.closest('[data-copy-email]');if(!a)return;
var m=(a.getAttribute('href')||'').replace(/^mailto:/i,'').split('?')[0];if(!m)return;
e.preventDefault();if(a.__copied)return;
var t=a.querySelector('.footer-link')||a;
copy(m).then(function(){
a.__copied=1;var old=t.textContent;
t.textContent='Copied!';a.setAttribute('data-copied','');a.setAttribute('aria-live','polite');
setTimeout(function(){t.textContent=old;a.removeAttribute('data-copied');a.__copied=0;},1800);
},function(){location.href='mailto:'+m;});
});
})();