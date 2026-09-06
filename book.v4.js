/* book.v4.js — 月みちて、山となる。 PC版 スクリプト本体
   2026-09-06 / 10見開き構成
     1) ページ遷移エンジン（GSAP依存）
     2) Instagramフィード連携（右=最新1件／左=次の6件）
     3) お問い合わせフォーム送信
   ※ 埋め込み側のブートストラップ（画像パス展開・初期表示解除）は含みません

   ■ v4 で追加した3つのしくみ
     ⑥ 起動が終わった瞬間に埋め込み側の window.__ENGINE() を呼び、
        root から "pre"（ローディング以外を隠すクラス）を外す。
        JSやGSAPが届く前に他ページがチラッと見える問題への対策。
     ⑦ 奥付のGoogleマップは、クリックするまで操作を受け付けない。
        地図の上でホイールを回しても本がめくれる状態を保つため。
     ⑧ ホイール／スワイプを止める範囲に、操作中の地図（.fmapc.on）を追加。

   ■ book.v2.js から引き継いだ5つの安全装置（2026-09-04・body末尾移設で入れたもの）
     ① ホイール／タッチ／キーは「本の内側で起きた操作」に限定する。
        iframeを出てページ直下に置くため、本の外のスクロールを妨げない。
        加えて、お問い合わせフォーム（.fm）の中では本をめくらない。
     ② #root が見つからないときの再試行に上限（250回＝約15秒）を設ける。
     ③ .fs（めくり影）の生成は起動が確定してから一度だけ。
     ④ Instagram連携は #gf と #gl が両方あるときだけ起動する。
     ⑤ スマホ幅（768px以下）ではPC版の本を起動しない。スマホはSP用Embedが担当する。
        768 の値は embed側の @media と、StudioのSP用Embedの表示切替と必ず揃えること。

   ■ 見開きと紙の対応 --------------------------------------------
   紙は9枚（p0〜p8）。cs は「いま開いている見開き番号」。
     cs=0 右:.cr(ローディング右)      左:p0表(ローディング左)
     cs=1 右:p0裏(イントロ)           左:p1表(目次)
     cs=2 右:p1裏(Instagram右)        左:p2表(Instagram左)
     cs=3 右:p2裏(とまる右)           左:p3表(とまる左)
     cs=4 右:p3裏(たべる右)           左:p4表(たべる左)
     cs=5 右:p4裏(しる右)             左:p5表(しる左)
     cs=6 右:p5裏(ためす右)           左:p6表(ためす左)
     cs=7 右:p6裏(つくる右)           左:p7表(つくる左)
     cs=8 右:p7裏(すまう右)           左:p8表(すまう左)
     cs=9 右:p8裏(お問い合わせ)       左:.cl(奥付)
   ---------------------------------------------------------------- */

/* ============ 1. ページ遷移エンジン ============ */
(()=>{const D=document;let rc=0,bd=0;
/* ▼⑤ スマホ幅ではPC版の本を起動しない */
const NARROW=()=>matchMedia("(max-width:768px)").matches;
function boot(){
if(bd||NARROW())return;
const R=D.getElementById("root"),IR=D.getElementById("ir"),
      ids=["p0","p1","p2","p3","p4","p5","p6","p7","p8"],
      pp=ids.map(i=>D.getElementById(i));
/* ▼② 本が無ければ再試行。ただし250回（約15秒）で諦める */
if(!R||pp.some(p=>!p)||typeof gsap=="undefined"){if(++rc>250)return;return setTimeout(boot,60)}
bd=1;
/* ▼③ めくり影の生成は起動が確定してから一度だけ */
D.querySelectorAll(".pf").forEach(x=>{var v=D.createElement("div");v.className="fs";x.appendChild(v)});

/* === 調整パラメータ === */
const SD=1.8,   /* 手動めくり：1枚あたりの秒数 */
      FD=.62,   /* メニュー選択：1枚あたりの秒数 */
      FG=90,    /* メニュー選択：次の1枚までの間(ms) */
      HOLD=5200,/* ローディング演出 → 自動めくり(ms) */
      NAVAT=3,  /* 左ナビが出はじめる見開き番号 */
      BTNTO=8;  /* 右下ボタンが出ている最後の見開き番号 */

const T=pp.length,TS=T+1,
      nav=D.querySelectorAll(".ni"),si=D.getElementById("si"),
      toc=D.querySelectorAll(".ti"),jump=D.querySelectorAll("[data-go]");
let tr=0,iv=0,cs=0,an=0,lk=1,wa=0,tx=0,ty=0,tg=0;

function z(){pp.forEach((p,i)=>{p.style.zIndex=i<cs?i*10+5:(T-i)*10})}
function n(){
  R.classList.toggle("hn",cs>=NAVAT);
  R.classList.toggle("hcn",cs>=NAVAT&&cs<=BTNTO);
  R.classList.toggle("last",cs>=TS-1);
  const na=Math.min(cs,BTNTO);nav.forEach(x=>x.classList.toggle("on",+x.dataset.p===na));
}
function rt(){if(tr||!toc.length)return;tr=1;gsap.to(toc,{opacity:1,y:0,duration:.9,ease:"power3.out",stagger:.08,delay:.12})}

function flip(d,dur,cb){
  if(d<0)cs--;
  const p=pp[cs],f=p.querySelector(".pf:not(.b) .fs"),b=p.querySelector(".pf.b .fs"),
        h=dur/2,a=d>0?f:b,c=d>0?b:f;
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
  if(an||lk||t===cs||t<1||t>=TS)return;
  an=1;const d=t>cs?1:-1;
  (function step(){if(cs===t)return an=0;flip(d,FD,()=>setTimeout(step,FG))})();
}
window.__GO=go;

/* ローディング演出 */
function intro(){
  if(iv)return;iv=1;
  const lg=D.querySelectorAll(".ilh img"),ti=D.querySelector(".itl"),
        ln=D.querySelectorAll(".itx span"),tl=gsap.timeline();
  tl.fromTo(lg,{opacity:0,scale:1.02,filter:"blur(7px)"},{opacity:1,scale:1,filter:"blur(0px)",duration:2.2,ease:"power2.out"},0);
  if(ti)tl.fromTo(ti,{opacity:0,y:-10},{opacity:1,y:0,duration:1.5,ease:"power2.out"},1.15);
  if(ln.length)tl.fromTo(ln,{opacity:0,y:8,letterSpacing:".42em"},{opacity:1,y:0,letterSpacing:".30em",duration:1.25,stagger:.3,ease:"power2.out"},1.55);
  setTimeout(()=>turn(1,1),HOLD);
}

/* ▼① 本の内側で起きた操作かどうか／フォームの中か／文字入力中か */
function inR(e){var t=e.target;return !!(t&&t.nodeType===1&&R.contains(t))}
/* ▼⑧ フォームの中／操作中の地図の上では本をめくらない */
function inF(t){return !!(t&&t.closest&&(t.closest(".fm")||t.closest(".fmapc.on")))}
function typing(t){if(!t)return false;var g=t.tagName;
  return g=="INPUT"||g=="TEXTAREA"||g=="SELECT"||t.isContentEditable===true}

addEventListener("wheel",e=>{if(!inR(e)||inF(e.target))return;e.preventDefault();if(an||lk)return;
  wa+=e.deltaY;if(Math.abs(wa)>70){turn(wa>0?1:-1);wa=0}},{passive:false});
addEventListener("touchstart",e=>{tg=(inR(e)&&!inF(e.target))?1:0;if(!tg)return;
  tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
addEventListener("touchend",e=>{if(!tg)return;tg=0;if(an||lk)return;
  const x=tx-e.changedTouches[0].clientX,y=ty-e.changedTouches[0].clientY;
  if(Math.abs(x)>50&&Math.abs(x)>Math.abs(y))turn(x<0?1:-1);
  else if(Math.abs(y)>50)turn(y>0?1:-1)},{passive:true});
addEventListener("keydown",e=>{if(typing(e.target)||an||lk)return;
  if(["ArrowRight","ArrowDown"," "].includes(e.key)){e.preventDefault();turn(1)}
  if(["ArrowLeft","ArrowUp"].includes(e.key)){e.preventDefault();turn(-1)}});

nav.forEach(x=>x.addEventListener("click",()=>go(+x.dataset.p)));
toc.forEach(it=>it.addEventListener("click",()=>{if(an||lk)return;
  gsap.to(it,{opacity:.45,duration:.13,yoyo:true,repeat:1,ease:"power1.inOut"});go(+it.dataset.p)}));
jump.forEach(b=>b.addEventListener("click",e=>{e.preventDefault();go(+b.dataset.go)}));
si&&si.addEventListener("click",()=>turn(1));

R.classList.add("ld");
pp.forEach((p,i)=>{p.style.zIndex=(T-i)*10;gsap.set(p,{rotationY:0,z:0})});
if(toc.length)gsap.set(toc,{opacity:0,y:20});
n();
/* ▼⑥ ここまで来れば紙の重なり順と回転が確定している。
       埋め込み側に合図を送り、ローディング以外を隠す "pre" を外してもらう */
try{window.__ENGINE&&window.__ENGINE()}catch(e){}
R.classList.remove("pre");
window.__R?intro():(D.addEventListener("ready",intro),setTimeout(intro,2600));
}
D.readyState=="loading"?D.addEventListener("DOMContentLoaded",boot):boot();
/* ▼⑤ PC幅へ広げられたときに起動し直す（境界をまたいだ瞬間だけ発火） */
try{matchMedia("(max-width:768px)").addEventListener("change",e=>{if(!e.matches)boot()})}catch(e){}
})();


/* ============ 2. Instagramフィード連携 ============ */
(function(){var D=document;
/* ▼ここだけ編集
   FEED_URL : GASのURL（末尾 /exec。複数案件なら ?c=案件ID）。空ならダミー表示
   CACHE_MIN: 同期間隔（分）
   GRID     : 左ページに並べる件数（最新1件は右ページに別途表示） */
var FEED_URL="https://script.google.com/macros/s/AKfycbyREpbMLNwyhlj_dGmAW832bUxwt_2K3oOv6Le3jB8-npNpyJb97vnx6hyV2eOpHFNBIg/exec";
var CACHE_MIN=30;
var GRID=6;
/* ========================================================== */
var KEY="igCache";
function p2(n){return n<10?"0"+n:""+n}
function fmt(t){var d=new Date(t);return isNaN(d)?"":d.getFullYear()+"."+p2(d.getMonth()+1)+"."+p2(d.getDate())}
function norm(j){var a=(j&&j.data)||[];return a.map(function(p){return{
  img:p.media_url||p.thumbnail_url||"",date:p.timestamp||"",cap:p.caption||"",url:p.permalink||"#"}})
  .filter(function(p){return p.img})}
function card(p){
  var a=D.createElement("a");a.className="igc";a.href=p.url;a.target="_blank";a.rel="noopener";
  var i=D.createElement("img");i.src=p.img;i.alt="";i.loading="lazy";a.appendChild(i);
  var d=D.createElement("div");d.className="igd";d.textContent=fmt(p.date);a.appendChild(d);
  var c=D.createElement("p");c.className="igp";c.textContent=p.cap;a.appendChild(c);
  return a}
function render(l){
  var F=D.getElementById("gf"),G=D.getElementById("gl");if(!F||!G)return;
  l=l.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date)}).slice(0,GRID+1);
  F.innerHTML="";G.innerHTML="";
  if(l[0])F.appendChild(card(l[0]));
  l.slice(1).forEach(function(p){G.appendChild(card(p))})}
function demo(){var a=[],im="data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23e7e1d5'/%3E%3C/svg%3E";
  for(var i=0;i<GRID+1;i++)a.push({img:im,date:new Date(Date.now()-i*864e5).toISOString(),cap:"連携が完了すると最新の投稿が表示されます（ダミー）",url:"#"});return a}
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
/* ▼④＋⑤ グリッドが無いページ／スマホ幅では起動しない（無駄なGAS通信を止める） */
function init(){if(matchMedia("(max-width:768px)").matches)return;
  if(!D.getElementById("gf")||!D.getElementById("gl"))return;
  load();setInterval(load,CACHE_MIN*6e4)}
D.readyState=="loading"?D.addEventListener("DOMContentLoaded",init):init();
})();


/* ============ 3. お問い合わせフォーム送信 ============ */
(function(){var D=document;
/* ▼ここだけ編集
   GAS_URL       : Google Apps Script ウェブアプリのURL（末尾 /exec）
   RECAPTCHA_KEY : reCAPTCHA v3 のサイトキー。使わないなら空のまま
   TEL           : エラー時に案内する電話番号 */
var GAS_URL="";
var RECAPTCHA_KEY="";
var TEL="0237-00-0000";
/* ========================================================== */
function boot(){
  if(matchMedia("(max-width:768px)").matches)return;/* ▼⑤ スマホはSP版のフォームが担当 */
  var pg=D.getElementById("cf"),f=D.getElementById("cfF");if(!pg||!f)return;
  var er=D.getElementById("cfE"),sb=D.getElementById("cfS"),rcS=0;
  function msg(t){if(er)er.textContent=t||""}
  function ok(id){pg.classList.add("done");var s=D.getElementById("cfId");if(s)s.textContent=id?"受付番号 "+id:""}
  function ng(t){sb.disabled=false;msg(t||"送信に失敗しました。お手数ですが時間をおいて再度お試しください。")}
  function rcPre(){if(!RECAPTCHA_KEY||rcS)return;rcS=1;var s=D.createElement("script");
    s.src="https://www.google.com/recaptcha/api.js?render="+encodeURIComponent(RECAPTCHA_KEY);
    s.async=true;s.defer=true;D.head.appendChild(s)}
  function rcToken(cb){
    if(!RECAPTCHA_KEY)return cb("");
    rcPre();var done=0,fin=function(t){if(done)return;done=1;cb(t||"")};
    setTimeout(function(){fin("")},8000);
    var n=0,iv=setInterval(function(){
      if(window.grecaptcha&&window.grecaptcha.execute){clearInterval(iv);
        try{grecaptcha.ready(function(){grecaptcha.execute(RECAPTCHA_KEY,{action:"contact"}).then(fin,function(){fin("")})})}catch(e){fin("")}}
      else if(++n>80){clearInterval(iv);fin("")}},100)}
  function post(d){
    try{
      var n="tmccf"+Date.now(),i=D.createElement("iframe");i.name=n;i.style.display="none";D.body.appendChild(i);
      var fm=D.createElement("form");fm.action=GAS_URL;fm.method="POST";fm.target=n;fm.style.display="none";
      Object.keys(d).forEach(function(k){var h=D.createElement("input");h.type="hidden";h.name=k;h.value=d[k];fm.appendChild(h)});
      D.body.appendChild(fm);
      var done=0,fin=function(){if(done)return;done=1;ok("");
        setTimeout(function(){fm.parentNode&&fm.parentNode.removeChild(fm);i.parentNode&&i.parentNode.removeChild(i)},800)};
      i.onload=fin;setTimeout(fin,6000);fm.submit();
    }catch(e){ng()}}
  function send(d){
    fetch(GAS_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(d)})
    .then(function(r){return r.json()})
    .then(function(j){
      if(j&&j.ok)return ok(j.id);
      if(j&&j.error=="recaptcha")return ng("自動送信の疑いがあるため送信を停止しました。お手数ですが時間をおいて再度お試しいただくか、tel. "+TEL+" までご連絡ください。");
      ng()})
    .catch(function(){post(d)})}
  f.addEventListener("submit",function(e){
    e.preventDefault();
    var g=function(k){var el=f.elements[k];return el?String(el.value||"").trim():""};
    var name=g("name"),mail=g("mail"),topic=g("topic"),body=g("body");
    if(f.elements._hp&&f.elements._hp.value)return ok("");
    if(!name)return msg("お名前をご記入ください。");
    if(!mail||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail))return msg("メールアドレスをご確認ください。");
    if(!topic)return msg("お問い合わせ項目をお選びください。");
    if(!body)return msg("内容をご記入ください。");
    if(!f.elements.agree.checked)return msg("プライバシーポリシーへの同意が必要です。");
    if(!/^https:\/\/script\.google\.com\//.test(GAS_URL))
      return msg("送信先が未設定です（book.v4.js の GAS_URL をご確認ください）。");
    msg("");sb.disabled=true;
    rcToken(function(tk){
      send({name:name,addr:g("addr"),tel:g("tel"),mail:mail,
            body:"【お問い合わせ項目】"+topic+"\n\n"+body,
            topic:topic,token:tk,ua:navigator.userAgent})})});
  f.addEventListener("focusin",rcPre,{once:true});
}
D.readyState=="loading"?D.addEventListener("DOMContentLoaded",boot):boot();
})();


/* ============ 4. 奥付のGoogleマップ（クリックで操作を有効化） ============ */
(function(){var D=document;
function boot(){
  var l=D.querySelectorAll(".fmapc");if(!l.length)return;
  l.forEach(function(c){
    c.addEventListener("click",function(){c.classList.add("on")});
    /* 地図から離れたら操作を戻す。次に本をめくるときに邪魔をしない */
    c.addEventListener("mouseleave",function(){c.classList.remove("on")});
  });
}
D.readyState=="loading"?D.addEventListener("DOMContentLoaded",boot):boot();
})();
