/* book-sp.v12.1.js — 月みちて、山となる。 スマホ版 スクリプト本体
   2026-10-21 / スマホ用Embed（iframe）から、STUDIO body末尾の2つ目の枠へ移した版
   （CSS は book-sp.v12.1.css。HTML は2つ目の枠の埋め込みコード）

   ■ スマホ用Embed → v12.1 の変更点（見た目と動きは Embed と同じ）
     ① 768px以下でだけ起動する（NARROW）。769px以上では何もしない。
        PC幅で開いてからスマホ幅へ狭めたときは、その時点で起動する
     ② ホイール・タッチは「スマホ幅のときに、スマホ版（#tmm）の中で起きた操作」だけを受ける。
        キー操作もスマホ幅のときだけ。iframe の外に出たので、PCの本に効かないようにするため
     ③ キー操作：入力欄の中と、⌘・Ctrl・Alt との組み合わせ（ブラウザのショートカット）は横取りしない
     ④ ページ番号の直書きをやめ、各ページの data-t（テーマ名）で判断する
        ・メニューの項目（data-g）は、そのテーマの最初のページへめくる
        ・メニューの印（.on）は、いま開いているページのテーマに付く
        ・右下の丸ボタンは、メニューにあるテーマのページで出す（Embed の「3ページ目から」と同じ）
        ページを足すときは、2つ目の枠に data-t 付きの section を足すだけでよい（JS は直さない）
     ⑤ coming soon の5ページは、2つ目の枠の HTML に書いた（JS で作らない）
     ⑥ GSAP は1つ目の枠（PC版）が読み込むものを使う。ページに GSAP の読み込みが無いときだけ、
        自分で読み込む（PC版の枠が無いページで試すとき用）
     ⑦ 起動の再試行は 250回（約15秒）まで（PC版の②と同じ）
   ■ Embed のままのもの
     めくりの動き・速さ・影・音、メニューの開閉、ローディングの自動解除（4.8秒）、
     スワイプの向き（上へ／右へで次のページ）、写真スライダー、Instagram（4件・2列）

   ■ ページの並び（data-t）
     0 top（ものがたりのはじまり）／1 ig（日々のあれこれ）
     2〜4 stay（とまる・嘉左エ門・平左エ門）／5 eat（たべる）／6 know（しる）
     7 try（ためす）／8 make（つくる）／9 live（すまう）
   ■ 768 の値は、CSS の読み込み（media）・2つ目の枠の @media・PC版の枠・book.v12.js と必ずそろえる
*/

/* ============ 1. めくり・メニュー・スライダー ============ */
(function(){var D=document,W=window,rc=0,bd=0,gq=0;
/* ▼① スマホ幅かどうか */
function NARROW(){return W.matchMedia("(max-width:768px)").matches}
/* ▼⑥ GSAP がまだ無く、ページに GSAP の読み込みも無いときだけ、その場で自分で読み込む（1回だけ）。
       ふつうは1つ目の枠（PC版）の読み込みがあるので、届くのを待つだけ */
function need(){
  if(gq)return;gq=1;if(D.querySelector('script[src*="gsap"]'))return;
  var s=D.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";D.head.appendChild(s)}
function boot(){
  if(bd||!NARROW())return;
  var R=D.getElementById("tmm"),pc=D.getElementById("tmmPc");
  /* ▼⑦ HTML か GSAP がまだ無ければ待つ。250回（約15秒）で諦める */
  if(!R||!pc||typeof gsap=="undefined"){if(++rc>250)return;need();return setTimeout(boot,60)}
  bd=1;
  var p=pc.querySelectorAll(".tmm-pg"),pl=D.getElementById("tmmPl"),hm=D.getElementById("tmmHm"),
      mn=D.getElementById("tmmMn"),mi=R.querySelectorAll(".tmm-mi"),fb=D.getElementById("tmmFb"),
      si=D.getElementById("tmmSi"),ld=D.getElementById("tmmLd"),
      ci=0,T=p.length,an=0,wa=0,wT,sd=D.createElement("div"),MT={};
  /* めくりの途中に出る紙（Embed と同じく、ページの後ろに1枚だけ足す） */
  sd.className="tmm-sd";pc.appendChild(sd);

  /* ▼④ テーマの扱い。MT＝メニューにあるテーマ（右下の丸ボタンを出すページ） */
  mi.forEach(function(m){if(m.dataset.g)MT[m.dataset.g]=1});
  function th(i){return(p[i]&&p[i].dataset.t)||""}
  function first(t){for(var i=0;i<T;i++)if(th(i)===t)return i;return -1}

  function ldHide(){if(ld&&!ld.classList.contains("h")){ld.classList.add("h");setTimeout(function(){p[0].classList.add("in")},250)}}
  function ldOn(){return ld&&!ld.classList.contains("h")}
  /* 左上のページ名（data-lbl）。いったん消してから書き換える */
  function label(){if(!pl)return;var l=p[ci].dataset.lbl||"";pl.classList.remove("v");pl.classList.add("chg");
    setTimeout(function(){pl.textContent=l;void pl.offsetWidth;pl.classList.remove("chg");if(l)pl.classList.add("v")},180)}
  /* swipe の表示（最後のページで消す）・右下の丸ボタン・メニューの印 */
  function ui(){
    if(si)si.style.opacity=ci==T-1?"0":"1";
    fb.classList.toggle("v",!!MT[th(ci)]);
    mi.forEach(function(m){var g=m.dataset.g;if(g)m.classList.toggle("on",g===th(ci))});
  }
  /* めくりの音（紙のこすれる音をその場で作る） */
  function snd(){try{var c=new(W.AudioContext||W.webkitAudioContext)(),d=.3,l=c.sampleRate*d,b=c.createBuffer(1,l,c.sampleRate),a=b.getChannelData(0),i,t,e;
    for(i=0;i<l;i++){t=i/c.sampleRate;e=Math.exp(-t*5)*(1-t/d);a[i]=(Math.random()*2-1)*e*.04}
    var s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type="bandpass";f.frequency.value=1400;f.Q.value=.8;g.gain.value=.5;
    s.connect(f);f.connect(g);g.connect(c.destination);s.start();setTimeout(function(){c.close()},500)}catch(e){}}
  /* ページめくり。右端を軸に、進むときは今のページがめくれ、戻るときは前のページが戻ってくる */
  function trans(n){
    if(an||n==ci||n<0||n>=T)return;
    an=1;snd();
    var d=n>ci?1:-1,c=p[ci],nx=p[n],FD=.6;
    nx.classList.add("on");
    gsap.set([c,nx],{transformOrigin:"100% 50%",x:0,y:0,scale:1});
    var tl=gsap.timeline({onComplete:function(){c.classList.remove("on","fx","fxb");nx.classList.remove("fx","fxb");
      gsap.set([c,nx],{clearProps:"all"});gsap.set(sd,{opacity:0});ci=n;p[ci].classList.add("in");label();ui();an=0}});
    if(d>0){
      c.classList.add("fx");nx.classList.add("fxb");
      gsap.set([c,nx],{rotationY:0,opacity:1,boxShadow:"0 0 0 rgba(26,24,22,0)"});
      gsap.set(sd,{opacity:1});
      tl.to(c,{rotationY:110,boxShadow:"18px 16px 40px rgba(26,24,22,.20)",duration:FD,ease:"power2.in"},0)
        .to(c,{opacity:0,duration:.3,ease:"power1.in"},.18)
        .to(sd,{opacity:0,duration:.32,ease:"power1.out"},.5);
    }else{
      nx.classList.add("fx");c.classList.add("fxb");
      gsap.set(sd,{opacity:0});
      gsap.set(c,{rotationY:0,opacity:1});
      gsap.set(nx,{rotationY:118,opacity:1,boxShadow:"-26px 20px 50px rgba(26,24,22,.28)"});
      tl.to(c,{opacity:0,duration:.24,ease:"power1.in"},0)
        .to(nx,{rotationY:0,boxShadow:"0 0 0 rgba(26,24,22,0)",duration:.66,ease:"power2.inOut"},0);
    }
  }
  function go(d){trans(ci+d)}
  function shut(){hm.classList.remove("o");mn.classList.remove("o")}

  /* 写真スライダー。写真をタップで次へ、点をタップでその写真へ */
  R.querySelectorAll("[data-sr]").forEach(function(sl){var ss=sl.querySelectorAll(".tmm-sl"),bs=sl.querySelectorAll(".tmm-sn button"),i=0;
    function show(n){i=(n+ss.length)%ss.length;ss.forEach(function(s,x){s.classList.toggle("on",x==i)});bs.forEach(function(b,x){b.classList.toggle("on",x==i)})}
    bs.forEach(function(b,x){b.onclick=function(e){e.stopPropagation();show(x)}});
    sl.onclick=function(e){e.stopPropagation();show(i+1)}});

  /* メニューの開閉。ローディング中に押したときは、ローディングを閉じるだけ */
  hm.onclick=function(e){e.stopPropagation();if(ldOn())return ldHide();hm.classList.toggle("o");mn.classList.toggle("o")};
  D.addEventListener("click",function(e){if(!mn.classList.contains("o"))return;if(mn.contains(e.target)||hm.contains(e.target))return;shut()});
  /* ▼④ メニューの項目：閉じてから、そのテーマの最初のページへ */
  mi.forEach(function(m){m.onclick=function(e){e.stopPropagation();shut();var g=m.dataset.g,i=g?first(g):-1;if(i>=0)setTimeout(function(){trans(i)},420)}});
  var fh=D.getElementById("tmmFh");if(fh)fh.onclick=function(e){e.preventDefault();trans(0)};
  if(ld)ld.onclick=ldHide;
  if(si)si.onclick=function(e){e.stopPropagation();ldOn()?ldHide():go(1)};

  /* ▼② スマホ幅のときに、スマホ版の中で起きた操作だけを受ける */
  function inS(e){var t=e.target;return NARROW()&&!!(t&&t.nodeType===1&&R.contains(t))}
  W.addEventListener("wheel",function(e){if(!inS(e))return;
    if(mn.classList.contains("o"))return;e.preventDefault();if(ldOn())return ldHide();if(an)return;
    wa+=e.deltaY;clearTimeout(wT);wT=setTimeout(function(){wa=0},180);if(Math.abs(wa)>60){go(wa>0?1:-1);wa=0}},{passive:false});
  var x=0,y=0,tt=0,tg=0;
  D.addEventListener("touchstart",function(e){tg=inS(e)?1:0;if(!tg)return;
    if(mn.classList.contains("o"))return;x=e.touches[0].clientX;y=e.touches[0].clientY;tt=Date.now()},{passive:true});
  /* 上へ・右へのスワイプで次のページ（Embed と同じ向き） */
  D.addEventListener("touchend",function(e){if(!tg)return;
    if(mn.classList.contains("o"))return;
    var dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y,ax=Math.abs(dx),ay=Math.abs(dy);
    if(ldOn())return void(Math.max(ax,ay)>=30&&ldHide());
    if(an||Math.max(ax,ay)<40||Date.now()-tt>800)return;
    go(ay>ax?(dy<0?1:-1):(dx>0?1:-1))},{passive:true});
  D.addEventListener("keydown",function(e){if(!NARROW())return;
    /* ▼③ */
    var t=e.target,g=t&&t.tagName;
    if(e.metaKey||e.ctrlKey||e.altKey||g=="INPUT"||g=="TEXTAREA"||g=="SELECT"||(t&&t.isContentEditable))return;
    if(an)return;
    if(e.key=="Escape"&&mn.classList.contains("o"))return shut();
    if(mn.classList.contains("o"))return;
    if(ldOn()){e.preventDefault();return ldHide()}
    if(e.key=="ArrowDown"||e.key=="ArrowRight"||e.key==" "){e.preventDefault();go(1)}
    if(e.key=="ArrowUp"||e.key=="ArrowLeft"){e.preventDefault();go(-1)}});

  /* ローディングは 4.8秒で自動的に閉じる（タップ・スワイプ・キーでも閉じる） */
  setTimeout(ldHide,4800);label();ui();
}
D.readyState=="loading"?D.addEventListener("DOMContentLoaded",boot):boot();
/* ▼① PC幅からスマホ幅へ狭めたときに起動する */
try{var q=W.matchMedia("(max-width:768px)"),f=function(e){if(e.matches)boot()};
  q.addEventListener?q.addEventListener("change",f):q.addListener(f)}catch(e){}
})();


/* ============ 2. Instagram（日々のあれこれ。4件・2列） ============ */
(function(){var D=document,W=window,ok=0;
/* ▼ここだけ編集。取得先と保存名（igCache）は PC版の book.v12.js と同じ
   FEED_URL : GAS のURL ／ CACHE_MIN : 同期間隔（分） ／ COUNT : 表示件数 */
var FEED_URL="https://script.google.com/macros/s/AKfycbyREpbMLNwyhlj_dGmAW832bUxwt_2K3oOv6Le3jB8-npNpyJb97vnx6hyV2eOpHFNBIg/exec",
    CACHE_MIN=30,COUNT=4,KEY="igCache";
function p2(n){return n<10?"0"+n:""+n}
function fmt(t){var d=new Date(t);return isNaN(d)?"":d.getFullYear()+"."+p2(d.getMonth()+1)+"."+p2(d.getDate())}
function norm(j){return((j&&j.data)||[]).map(function(p){return{img:p.media_url||p.thumbnail_url||"",date:p.timestamp||"",cap:p.caption||"",url:p.permalink||"#"}}).filter(function(p){return p.img})}
function render(l){var g=D.getElementById("tmmIg");if(!g)return;g.innerHTML="";
  l.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date)}).slice(0,COUNT).forEach(function(p){
    var a=D.createElement("a");a.href=p.url;a.target="_blank";a.rel="noopener";
    var i=new Image();i.src=p.img;i.alt="";i.loading="lazy";a.appendChild(i);
    var d=D.createElement("b");d.textContent=fmt(p.date);a.appendChild(d);
    var c=D.createElement("p");c.textContent=p.cap;a.appendChild(c);g.appendChild(a)})}
function demo(){var a=[],i,im="data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5'%3E%3Crect width='4' height='5' fill='%23e7e1d5'/%3E%3C/svg%3E";
  for(i=0;i<COUNT;i++)a.push({img:im,date:new Date(Date.now()-i*864e5).toISOString(),cap:"連携が完了すると最新の投稿が表示されます（ダミー）",url:"#"});return a}
function last(){try{var c=JSON.parse(localStorage.getItem(KEY)||"null");return c?{t:c.t,list:norm(c.j)}:null}catch(e){return null}}
function load(){if(!FEED_URL)return render(demo());var c=last();
  if(c&&Date.now()-c.t<CACHE_MIN*6e4&&c.list.length)return render(c.list);
  fetch(FEED_URL).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){var l=norm(j);if(!l.length)throw 0;
    try{localStorage.setItem(KEY,JSON.stringify({t:Date.now(),j:j}))}catch(e){}render(l)})
  .catch(function(){render(c&&c.list.length?c.list:demo())})}
/* ▼① スマホ幅のときだけ。グリッドが無いページでは動かない（PC版の④⑤と同じ考え方） */
function init(){if(ok||!W.matchMedia("(max-width:768px)").matches||!D.getElementById("tmmIg"))return;ok=1;load();setInterval(load,CACHE_MIN*6e4)}
D.readyState=="loading"?D.addEventListener("DOMContentLoaded",init):init();
try{var q=W.matchMedia("(max-width:768px)"),f=function(e){if(e.matches)init()};
  q.addEventListener?q.addEventListener("change",f):q.addListener(f)}catch(e){}
})();
