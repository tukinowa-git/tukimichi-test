/* book.v2.js — 本のめくりエンジン ＋ Instagram連携
   book.v1.js からの変更点（2026-09-04 / Studio body末尾カスタムコードへの移設に対応）

   ① ホイール・タッチ・キーの各操作を「本の内側で起きたもの」に限定した。
      iframe を出てページ直下に置くため、本が存在しない場所のスクロールや
      フォームへの文字入力を妨げないようにする。
   ② #root が見つからないときの再試行に上限（250回＝約15秒）を設けた。
      v1 は無限にタイマーを回し続けていた。
   ③ .fs（めくり影）の生成を再試行ループの外に出した。
      v1 は GSAP の到着が遅れるたび、再試行のたびに .fs を重複生成していた。
   ④ Instagram連携は #gr と #gl が両方あるときだけ起動する。
      要素が無いページで無駄な fetch とタイマーが回らないようにする。

   めくりの速度・ローディング演出・レイアウトは v1 と完全に同一。
   ※ 読み込み側のブートストラップ（画像パス展開・目隠し解除）は含みません */

/* ============ 1. ページ遷移エンジン ============ */
(()=>{const D=document;let rc=0;
function boot(){
const R=D.getElementById("root"),IR=D.getElementById("ir"),pp=["p0","p1","pi","p2","p3","p4"].map(i=>D.getElementById(i));
/* ▼変更② 本が無ければ再試行。ただし250回（約15秒）で諦める */
if(!R||pp.some(p=>!p)||typeof gsap=="undefined"){if(++rc>250)return;return setTimeout(boot,60)}
/* ▼変更③ めくり影の生成は起動が確定してから一度だけ */
D.querySelectorAll(".pf").forEach(x=>{var v=D.createElement("div");v.className="fs";x.appendChild(v)});
/* === 調整パラメータ === */
const SD=1.8,  /* 手動めくり：1枚の秒数 */
FD=.62,        /* メニュー選択：1枚の秒数 */
FG=90,         /* メニュー選択：次の1枚までの間(ms) */
HOLD=5200;     /* ローディング演出→自動めくり(ms) */
const T=pp.length,TS=T+1,nav=D.querySelectorAll(".ni"),si=D.getElementById("si"),toc=D.querySelectorAll(".ti");
let tr=0,iv=0,cs=0,an=0,lk=1,wa=0,tx=0,ty=0,tg=0;
function z(){pp.forEach((p,i)=>{p.style.zIndex=i<cs?i*10+5:(T-i)*10})}
function n(){R.classList.toggle("hn",cs>=2);nav.forEach(x=>x.classList.toggle("on",+x.dataset.p===cs));if(si)si.style.opacity=cs>=TS-1?.28:.5}
function rt(){if(tr||!toc.length)return;tr=1;gsap.to(toc,{opacity:1,y:0,duration:.9,ease:"power3.out",stagger:.08,delay:.12})}
function flip(d,dur,cb){
if(d<0)cs--;
const p=pp[cs],f=p.querySelector(".pf:not(.b) .fs"),b=p.querySelector(".pf.b .fs"),h=dur/2,a=d>0?f:b,c=d>0?b:f;
p.style.zIndex=1e3;
gsap.timeline({onComplete(){if(d>0)cs++;z();n();cb&&cb()}})
.to(p,{rotationY:d>0?180:0,duration:dur,ease:"power2.inOut"},0)
.to(p,{z:30,duration:h,ease:"sine.inOut"},0)
.to(p,{z:0,duration:h,ease:"sine.inOut"},h)
.fromTo(a,{opacity:0},{opacity:.9,duration:h},0)
.to(a,{opacity:0,duration:dur*.11},h)
.fromTo(c,{opacity:.9},{opacity:0,duration:h},h);
}
/* 手動めくり（ホイール／スワイプ／キー） */
function turn(d,auto){
if(an||(lk&&!auto)||(d>0&&cs>=TS-1)||(d<0&&cs<=1))return;
an=1;if(auto)R.classList.remove("ld");
flip(d,SD,()=>{if(auto){lk=0;IR&&IR.classList.add("cd");rt()}an=0});
}
/* メニュー・目次選択：1枚ずつ順にパラパラと */
function go(t){
if(an||lk||t===cs||t<2||t>=TS)return;
an=1;const d=t>cs?1:-1;
(function step(){if(cs===t)return an=0;flip(d,FD,()=>setTimeout(step,FG))})();
}
/* ローディング演出 */
function intro(){
if(iv)return;iv=1;
const lg=D.querySelectorAll(".ilh img"),tt=D.querySelector(".itl"),ln=D.querySelectorAll(".itx span"),tl=gsap.timeline();
tl.fromTo(lg,{opacity:0,scale:1.02,filter:"blur(7px)"},{opacity:1,scale:1,filter:"blur(0px)",duration:2.2,ease:"power2.out"},0);
if(tt)tl.fromTo(tt,{opacity:0,y:-10},{opacity:1,y:0,duration:1.5,ease:"power2.out"},1.15);
if(ln.length)tl.fromTo(ln,{opacity:0,y:8,letterSpacing:".44em"},{opacity:1,y:0,letterSpacing:".32em",duration:1.25,stagger:.3,ease:"power2.out"},1.55);
setTimeout(()=>turn(1,1),HOLD);
}
/* ▼変更① 本の内側で起きた操作かどうかを判定する */
function inR(e){var t=e.target;return !!(t&&t.nodeType===1&&R.contains(t))}
function typing(e){var t=e.target;if(!t)return false;var g=t.tagName;return g=="INPUT"||g=="TEXTAREA"||g=="SELECT"||t.isContentEditable===true}
addEventListener("wheel",e=>{if(!inR(e))return;e.preventDefault();if(an||lk)return;wa+=e.deltaY;if(Math.abs(wa)>70){turn(wa>0?1:-1);wa=0}},{passive:false});
addEventListener("touchstart",e=>{tg=inR(e)?1:0;if(!tg)return;tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
addEventListener("touchend",e=>{if(!tg)return;tg=0;if(an||lk)return;const x=tx-e.changedTouches[0].clientX,y=ty-e.changedTouches[0].clientY;if(Math.abs(x)>50&&Math.abs(x)>Math.abs(y))turn(x<0?1:-1);else if(Math.abs(y)>50)turn(y>0?1:-1)},{passive:true});
addEventListener("keydown",e=>{if(typing(e)||an||lk)return;if(["ArrowRight","ArrowDown"," "].includes(e.key)){e.preventDefault();turn(1)}if(["ArrowLeft","ArrowUp"].includes(e.key)){e.preventDefault();turn(-1)}});
nav.forEach(x=>x.addEventListener("click",()=>go(+x.dataset.p)));
toc.forEach(it=>it.addEventListener("click",()=>{if(an||lk)return;gsap.to(it,{opacity:.45,duration:.13,yoyo:true,repeat:1,ease:"power1.inOut"});go(+it.dataset.p)}));
si&&si.addEventListener("click",()=>turn(1));
R.classList.add("ld");pp.forEach((p,i)=>{p.style.zIndex=(T-i)*10;gsap.set(p,{rotationY:0,z:0})});
if(toc.length)gsap.set(toc,{opacity:0,y:20});
n();
window.__R?intro():(D.addEventListener("ready",intro),setTimeout(intro,2600));
}
D.readyState=="loading"?D.addEventListener("DOMContentLoaded",boot):boot();
})();

/* ============ 2. SNSフィード連携 ============ */
(function(){var D=document;
/* ▼ここだけ編集 FEED_URL:GASのURL(末尾/exec、複数案件なら?c=案件ID)。空ならダミー表示
   CACHE_MIN:同期間隔(分) / COUNT:表示件数(右6+左6) */
var FEED_URL="https://script.google.com/macros/s/AKfycbyREpbMLNwyhlj_dGmAW832bUxwt_2K3oOv6Le3jB8-npNpyJb97vnx6hyV2eOpHFNBIg/exec";
var CACHE_MIN=30;
var COUNT=12;
/* ========================================================== */
var KEY="igCache";
function p2(n){return n<10?"0"+n:""+n}
function fmt(t){var d=new Date(t);return isNaN(d)?"":d.getFullYear()+"."+p2(d.getMonth()+1)+"."+p2(d.getDate())}
function norm(j){var a=(j&&j.data)||[];return a.map(function(p){return{
img:p.media_url||p.thumbnail_url||"",date:p.timestamp||"",cap:p.caption||"",url:p.permalink||"#"}}).filter(function(p){return p.img})}
function card(p){var a=D.createElement("a");a.className="igc";a.href=p.url;a.target="_blank";a.rel="noopener";
var i=D.createElement("img");i.src=p.img;i.alt="";i.loading="lazy";a.appendChild(i);
var d=D.createElement("div");d.className="igd";d.textContent=fmt(p.date);a.appendChild(d);
var c=D.createElement("p");c.className="igp";c.textContent=p.cap;a.appendChild(c);return a}
function render(l){var R=D.getElementById("gr"),L=D.getElementById("gl");if(!R||!L)return;
l=l.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date)}).slice(0,COUNT);
R.innerHTML="";L.innerHTML="";
l.forEach(function(p,i){(i<COUNT/2?R:L).appendChild(card(p))})}
function demo(){var a=[],im="data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23e7e1d5'/%3E%3C/svg%3E";
for(var i=0;i<12;i++)a.push({img:im,date:new Date(Date.now()-i*864e5).toISOString(),cap:"連携が完了すると最新の投稿が表示されます（ダミー）",url:"#"});return a}
function last(){try{var c=JSON.parse(localStorage.getItem(KEY)||"null");return c?{t:c.t,list:norm(c.j)}:null}catch(e){return null}}
function load(){
if(!FEED_URL){render(demo());return}
var c=last();
if(c&&Date.now()-c.t<CACHE_MIN*6e4&&c.list.length){render(c.list);return}
fetch(FEED_URL).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
var l=norm(j);if(!l.length)throw 0;
try{localStorage.setItem(KEY,JSON.stringify({t:Date.now(),j:j}))}catch(e){}
render(l)
}).catch(function(){c&&c.list.length?render(c.list):render(demo())})}
/* ▼変更④ グリッドが無いページでは起動しない */
function init(){if(!D.getElementById("gr")||!D.getElementById("gl"))return;load();setInterval(load,CACHE_MIN*6e4)}
D.readyState=="loading"?D.addEventListener("DOMContentLoaded",init):init();
})();
