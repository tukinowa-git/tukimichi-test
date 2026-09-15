/* book.v10.4.js — 月みちて、山となる。 PC版 スクリプト本体
   2026-09-15 / 10見開き構成（CSS は book.v10.4.css）

   ■ v10.1 → v10.2（Safari の表裏重なり対策。GEN さん考案の方式を採用）
     ㉑ めくっている間、「いま手前を向いている面」だけを表示します。
        v10.1 まではめくり中に .tn/.st を外して両面を出し、どちらを見せるかは
        CSS の backface-visibility に任せていました。Safari はここで両面を
        描いてしまうことがあり、それが残像の正体と考えられます。
        回転角が 90度 を越えた瞬間に表示する面を入れ替えるので、
        backface-visibility に頼らなくても片面しか出ません。
        90度は紙が真横（見かけの幅がゼロ）なので、入れ替わりは見えません。
        ・切り替えを「変化したコマだけ」に絞ってあります（毎コマの
          classList 操作をやめ、1回のめくりで2回だけ走ります）
        ・最終状態は従来どおり onComplete の z()→fc() が決めます。
          途中の指定は一時的なもので、ズレは持ち越しません

   ★中身は book.v9.js と完全に同じです。版番号を CSS とそろえるためだけの
     ファイル名変更で、動きは1行も変えていません。
     v10.0 で入れた Safari 対策（紙に奥行きを与える／will-change を動的にする）は
     Chrome でノドに線を出し、クリック判定を壊したため、すべて取り消しました。
     1) ページ遷移エンジン（GSAP依存）
     2) Instagramフィード連携（右=最新1件／左=次の6件）
     3) お問い合わせフォーム（入力の反応・確認・GASへの送信）
     4) 地図（近づいたら読み込む／最初から操作できる）
   ※ 埋め込み側のブートストラップ（画像パス展開・初期表示解除）は含みません

   ■ v8 → v9 の変更（2点だけ。1〜3章の動きは v8 のまま）
     ⑳ 地図を最初から操作できるようにしました（クリックして待つ必要がありません）。
        拡大・縮小・移動がその場でできます。
     ⑧' そのぶん、地図の上ではホイールで本がめくれません（地図の拡大が優先）。
        地図から外にカーソルを出せば、これまでどおりめくれます。
     ※「ご利用はこちら」（たべる→ためす）のようなページ内ジャンプは、
        v8 から入っている [data-go] のしくみをそのまま使っています。JSの追加はありません。

   ■ v6.1 → v8 の変更（1〜2章の動きは v6.1 のまま。v7 はCSSと画像だけの版でした）
     ⑮ 裏返っている面を隠す（紙に .tn / .st を付ける。CSS 2章とセット）。
        Chrome は backface-visibility で見えなくなった面にもクリックを届けるため、
        お問い合わせのフォームの上に同じ紙の表面（すまう左）がかぶり、入力できませんでした。
        めくっている最中の紙だけは両方を外して、両面が見える状態でめくります。
     ⑯ 左ナビの選択マークは、とまる〜すまう の見開きでだけ付ける。
        v6.1 はお問い合わせ（9）でも「すまう」に印が残っていました。
     ⑰ キー操作：フォームの中ではめくらない。ボタンやリンクの上の Space はボタンに譲る。
     ⑱ 紙がめくれ始めたら、ページ内の入力欄のフォーカスを外す（見えない欄に文字が入らないように）。
     ⑲ めくる行き先を "tk:near" イベントで知らせる（地図の遅延読み込みに使う）。
        いまの見開き番号は window.__CS にも置く。
     フォーム（3章）と地図（4章）は作り直し。詳細は各章の冒頭を参照。

   ■ v6.1 での変更
     ⑫' URLを一切変えずに、戻り先を覚える（sessionStorage の tkcs と、
        詳細ページからの一回限りの指示 tkgo）。/#s4 で直接開かれた場合も動く。

   ■ v6.0 以前から引き継いでいるしくみ
     ①  ホイール／タッチ／キーは「本の内側で起きた操作」に限定。フォーム（.fm）の中ではめくらない
     ②  #root が無いときの再試行は250回（約15秒）まで
     ③  めくり影（.fs）の生成は起動が確定してから一度だけ
     ④  Instagram連携は #gf と #gl が両方あるときだけ起動
     ⑤  スマホ幅（768px以下）ではPC版の本を起動しない。
         768 の値は embed側の @media と、STUDIO の SP用Embed の表示切替と必ず揃えること
     ⑥  起動が終わった瞬間に window.__ENGINE() を呼び、root から "pre" を外す
     ⑦⑧ 地図はクリックするまで操作を受けない。操作中の地図の上ではめくらない
     ⑨  ディープリンク起動（ローディング演出を飛ばしてその見開きから始める）
     ⑩⑪ data-leave のリンクは中身だけを送り出してから遷移。bfcache から戻ったら静かに戻す
     ⑬  横方向のホイールは横取りしない（ブラウザの「戻る」ジェスチャに譲る）
     ⑭  離脱の待ち時間 190ms

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

/* ▼⑮ めくり終わった紙は表面を、まだの紙は裏面を隠す（見えていない面にクリックを届けない） */
function fc(){pp.forEach((p,i)=>{const t=i<cs;p.classList.toggle("tn",t);p.classList.toggle("st",!t)})}
function z(){pp.forEach((p,i)=>{p.style.zIndex=i<cs?i*10+5:(T-i)*10});fc()}
/* ▼⑲ 行き先の見開き番号を知らせる（地図の読み込みなどに使う） */
function emit(t){try{D.dispatchEvent(new CustomEvent("tk:near",{detail:t}))}catch(e){}}
/* ▼⑫' いま開いている見開きを、このタブの中だけの控えに記録する。URLは変えない */
function mark(){try{if(cs>=1)sessionStorage.setItem("tkcs",cs)}catch(e){}}
function n(){
  mark();
  R.classList.toggle("hn",cs>=NAVAT);
  R.classList.toggle("hcn",cs>=NAVAT&&cs<=BTNTO);
  R.classList.toggle("last",cs>=TS-1);
  /* ▼⑯ 印が付くのは data-p が一致する見開き（3〜8）だけ。9（お問い合わせ）ではどれにも付けない */
  nav.forEach(x=>x.classList.toggle("on",+x.dataset.p===cs));
  window.__CS=cs;emit(cs);
}
function rt(){if(tr||!toc.length)return;tr=1;gsap.to(toc,{opacity:1,y:0,duration:.9,ease:"power3.out",stagger:.08,delay:.12})}

function flip(d,dur,cb){
  if(d<0)cs--;
  const p=pp[cs],f=p.querySelector(".pf:not(.b) .fs"),b=p.querySelector(".pf.b .fs"),
        h=dur/2,a=d>0?f:b,c=d>0?b:f;
  /* ▼㉑ めくり始めは「出発面」だけを出す（d>0 は表から、d<0 は裏から）
     ▼⑱ ページ内の入力欄にフォーカスが残っていたら外す */
  p.classList.toggle("tn",d<0);
  p.classList.toggle("st",d>0);
  let bk=d<0;
  const ae=D.activeElement;if(ae&&ae!==D.body&&ae.closest&&ae.closest(".pp"))try{ae.blur()}catch(e){}
  p.style.zIndex=1e3;
  gsap.timeline({onComplete(){if(d>0)cs++;z();n();cb&&cb()}})
  .to(p,{rotationY:d>0?180:0,duration:dur,ease:"power2.inOut",
    /* ▼㉑ 90度を境に、見えている面だけを残す */
    onUpdate(){var b=gsap.getProperty(p,"rotationY")>=90;
      if(b!==bk){bk=b;p.classList.toggle("tn",b);p.classList.toggle("st",!b)}}
  },0)
  .to(p,{z:30,duration:h,ease:"sine.inOut"},0)
  .to(p,{z:0,duration:h,ease:"sine.inOut"},h)
  .fromTo(a,{opacity:0},{opacity:.9,duration:h},0)
  .to(a,{opacity:0,duration:dur*.11},h)
  .fromTo(c,{opacity:.9},{opacity:0,duration:h},h);
}
/* 手動めくり（ホイール／スワイプ／キー） */
function turn(d,auto){
  if(an||(lk&&!auto)||(d>0&&cs>=TS-1)||(d<0&&cs<=1))return;
  an=1;emit(cs+d);if(auto)R.classList.remove("ld");
  flip(d,SD,()=>{if(auto){lk=0;IR&&IR.classList.add("cd");rt()}an=0});
}
/* メニュー・目次選択：1枚ずつ順にパラパラと */
function go(t){
  if(an||lk||t===cs||t<1||t>=TS)return;
  an=1;emit(t);const d=t>cs?1:-1;
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
/* ▼⑧' フォームの中／地図の上では本をめくらない（v9：地図は常に操作できます） */
function inF(t){return !!(t&&t.closest&&(t.closest(".fm")||t.closest(".fmapc")))}
function typing(t){if(!t)return false;var g=t.tagName;
  return g=="INPUT"||g=="TEXTAREA"||g=="SELECT"||t.isContentEditable===true}

addEventListener("wheel",e=>{if(!inR(e)||inF(e.target))return;
  /* ▼⑬ 横方向が優勢なホイール＝2本指の横スワイプ。ブラウザの「戻る」に譲る */
  if(Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
  e.preventDefault();if(an||lk)return;
  wa+=e.deltaY;if(Math.abs(wa)>70){turn(wa>0?1:-1);wa=0}},{passive:false});
addEventListener("touchstart",e=>{tg=(inR(e)&&!inF(e.target))?1:0;if(!tg)return;
  tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
addEventListener("touchend",e=>{if(!tg)return;tg=0;if(an||lk)return;
  const x=tx-e.changedTouches[0].clientX,y=ty-e.changedTouches[0].clientY;
  if(Math.abs(x)>50&&Math.abs(x)>Math.abs(y))turn(x<0?1:-1);
  else if(Math.abs(y)>50)turn(y>0?1:-1)},{passive:true});
addEventListener("keydown",e=>{if(typing(e.target)||inF(e.target)||an||lk)return;
  /* ▼⑰ ボタンやリンクにフォーカスがあるときの Space は、そのボタンを押す操作に譲る */
  if(e.key===" "&&e.target&&e.target.closest&&e.target.closest("a,button,label"))return;
  if(["ArrowRight","ArrowDown"," "].includes(e.key)){e.preventDefault();turn(1)}
  if(["ArrowLeft","ArrowUp"].includes(e.key)){e.preventDefault();turn(-1)}});

nav.forEach(x=>x.addEventListener("click",()=>go(+x.dataset.p)));
toc.forEach(it=>it.addEventListener("click",()=>{if(an||lk)return;
  gsap.to(it,{opacity:.45,duration:.13,yoyo:true,repeat:1,ease:"power1.inOut"});go(+it.dataset.p)}));
jump.forEach(b=>b.addEventListener("click",e=>{e.preventDefault();go(+b.dataset.go)}));
si&&si.addEventListener("click",()=>turn(1));

/* ▼⑪ 別ページへ出ていくリンク（data-leave）。
       中身だけを送り出してから遷移する。額縁（背景・ナビ・ボタン・写真枠）は動かさない。
       ⌘/Ctrl/Shift/中クリック・target付きは横取りしない（新しいタブが壊れるため）。 */
const LVD=190;
function restore(){R.classList.remove("lv");R.classList.add("ar");setTimeout(()=>R.classList.remove("ar"),1200)}
function leave(u){if(R.classList.contains("lv"))return;
  /* ▼⑫' 控えに記録する。sessionStorage が使えない環境でだけ、
          最後の手段としてURLに印を残す（通常はここを通りません） */
  try{sessionStorage.setItem("tkcs",cs)}
  catch(e){try{if(cs>=1)history.replaceState(null,"","#s"+cs)}catch(e2){}}
  R.classList.add("lv");
  setTimeout(()=>{location.href=u},LVD);
  /* 通信断などで遷移が起きなかったとき、中身が消えたまま取り残されないようにする */
  setTimeout(()=>{if(R.classList.contains("lv"))restore()},6000)}
D.querySelectorAll("a[data-leave]").forEach(a=>{
  a.addEventListener("click",e=>{
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    if(a.target&&a.target!=="_self")return;
    const u=a.getAttribute("href");if(!u||u.charAt(0)==="#")return;
    e.preventDefault();leave(u)});
  /* マウスが乗った時点で先読み。遷移中に空の本を見せる時間を短くする */
  a.addEventListener("mouseenter",()=>{
    const u=a.getAttribute("href");if(!u||u.charAt(0)==="#")return;
    const l=D.createElement("link");l.rel="prefetch";l.href=u;D.head.appendChild(l)},{once:true})});

/* ▼⑫ 戻るボタンでbfcacheから復元されたとき、⑪ で消した中身が
       消えたままにならないよう、静かに戻す */
addEventListener("pageshow",e=>{if(e.persisted&&R.classList.contains("lv"))restore()});

/* ▼⑨ ディープリンク起動。#s1〜#s9 で来たときはローディングを飛ばす */
const DP=(()=>{
  let v=0;
  /* (3) 詳細ページのナビからの一回限りの指示。読んだら消す */
  try{const one=sessionStorage.getItem("tkgo");
    if(one){sessionStorage.removeItem("tkgo");
      const a=one.split("|");
      if(Date.now()-(+a[1]||0)<30000)v=parseInt(a[0],10)}}catch(e){}
  /* 新しいタブなどで /#s4 を直接開かれた場合。こちらから書くことはない */
  if(!v){const m=/^#s(\d+)$/.exec(location.hash||"");if(m)v=parseInt(m[1],10)}
  /* (1)(2) 戻る・進む・横スワイプで来たときだけ、控えから復元する。
     初回アクセスとリロードは対象外なので、ローディング演出は従来どおり出ます */
  if(!v){try{const nv=performance.getEntriesByType("navigation")[0];
    if(nv&&nv.type==="back_forward")v=parseInt(sessionStorage.getItem("tkcs"),10)}catch(e){}}
  return(v>=1&&v<=TS-1)?v:0})();

/* 古い形式（/#s3）で来た場合は、開いたあとURLから印を消して / に戻す */
if(DP)try{if(/^#s\d+$/.test(location.hash))history.replaceState(null,"",location.pathname+location.search)}catch(e){}

R.classList.add("ld");
pp.forEach((p,i)=>{p.style.zIndex=(T-i)*10;gsap.set(p,{rotationY:0,z:0})});fc();
if(toc.length)gsap.set(toc,{opacity:0,y:20});
n();

if(DP){
  /* 通常のめくりが終わった直後と同じ状態を、アニメーションなしで作る */
  cs=DP;lk=0;tr=1;iv=1;
  R.classList.remove("ld");
  pp.forEach((p,i)=>gsap.set(p,{rotationY:i<cs?180:0,z:0}));
  if(toc.length)gsap.set(toc,{opacity:1,y:0});
  IR&&IR.classList.add("cd");
  z();n();
}

/* ▼⑥ ここまで来れば紙の重なり順と回転が確定している。
       埋め込み側に合図を送り、ローディング以外を隠す "pre" を外してもらう */
try{window.__ENGINE&&window.__ENGINE()}catch(e){}
R.classList.remove("pre");
if(DP){R.classList.remove("dl","dlnav","dlcn");setTimeout(()=>R.classList.remove("ar"),1400)}
else{window.__R?intro():(D.addEventListener("ready",intro),setTimeout(intro,2600))}
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


/* ============ 3. お問い合わせフォーム ============ */
(function(){var D=document;
/* ▼送信先などの設定は、埋め込みコード（STUDIO）側の window.TK_FORM に書きます。
     url   : GAS ウェブアプリのURL（末尾 /exec）
     token : 合言葉。GAS の CONFIG.TOKEN と同じ文字列
     tel   : 送信できなかったときに案内する電話番号（空なら案内しない）
     rc    : reCAPTCHA v3 のサイトキー（使わないなら空）
     pp    : プライバシーポリシーのページURL（入れると同意文の「プライバシーポリシー」がリンクになる）
   このファイルには何も書かなくて大丈夫です。URLを変えるたびにタグを切り直さずに済むよう、
   設定だけを STUDIO 側に出しています。
   ■ 状態クラス（見た目は book.v9.css の 9章）
     .frw.good … 入力済みで問題なし（「※必須」が淡くなる）
     .frw.bad  … 要修正（赤茶の線）。送信を押したあと、または欄を離れたときに付く
     .fsb.rdy  … 必須がそろい同意済み（ボタンの色が深まる）
     .fsb.busy … 送信中 ／ #cf.done … 完了 */
var MAX={name:50,addr:200,tel:20,mail:150,body:3000};
var ORDER=["name","addr","tel","mail","topic","body"];
function nf(v){return v.normalize?v.normalize("NFKC"):v}
var RULES={
  name:function(v){return!v?"お名前をご記入ください。":v.length>MAX.name?"お名前は"+MAX.name+"文字以内でご記入ください。":""},
  addr:function(v){return v.length>MAX.addr?"住所は"+MAX.addr+"文字以内でご記入ください。":""},
  tel:function(v){if(!v)return"";v=nf(v);var n=v.replace(/\D/g,"").length;
    return(n<9||n>15||/[^0-9+()\-ー―‐−\s]/.test(v))?"電話番号をご確認ください（数字とハイフンでご記入ください）。":""},
  mail:function(v){if(!v)return"メールアドレスをご記入ください。";v=nf(v).replace(/\s+/g,"");
    return(v.length>MAX.mail||!/^[^\s@<>()\[\],;:"]+@[^\s@<>()\[\],;:"]+\.[^\s@<>()\[\],;:".]{2,}$/.test(v))?"メールアドレスの形式をご確認ください。":""},
  topic:function(v){return!v?"お問い合わせ項目をお選びください。":""},
  body:function(v){return!v?"内容をご記入ください。":v.length>MAX.body?"内容は"+MAX.body+"文字以内でご記入ください。":""}
};
function cfg(){var c=window.TK_FORM||{};
  return{url:String(c.url||"").trim(),token:String(c.token||""),tel:String(c.tel||"").trim(),rc:String(c.rc||"").trim(),pp:String(c.pp||"").trim()}}

function boot(){
  if(matchMedia("(max-width:768px)").matches)return;/* ▼⑤ スマホはSP版のフォームが担当 */
  var pg=D.getElementById("cf"),f=D.getElementById("cfF");if(!pg||!f||f.__tk)return;f.__tk=1;
  var E=f.elements,er=D.getElementById("cfE"),sb=D.getElementById("cfS"),sbl=sb&&(sb.querySelector("span")||sb),
      ag=f.querySelector(".fag"),C=cfg(),t0=0,tried=0,sending=0,sid="",rcS=0;
  if(!sb)return;
  function el(k){return E[k]||null}
  function val(k){var x=el(k);return x?String(x.value||"").trim():""}
  function agreed(){return!!(E.agree&&E.agree.checked)}
  function msg(t){if(!er)return;er.textContent=t||"";er.classList.toggle("on",!!t)}
  /* 全角の英数字・＠・ハイフンを半角に（メールと電話だけ）。欄を離れたときに整える */
  function tidy(k){var x=el(k);if(!x||(k!="mail"&&k!="tel"))return;
    var v=nf(x.value);if(k=="mail")v=v.replace(/\s+/g,"");if(v!==x.value)x.value=v}
  /* mode 0=入力中（直ったら赤を消すだけ）／1=欄を離れた／2=送信を押した */
  function judge(k,mode){var x=el(k);if(!x)return"";
    var v=val(k),m=RULES[k](v),w=x.closest?x.closest(".frw"):null,b;if(!w)return m;
    w.classList.toggle("good",!m&&v!=="");
    b=w.classList.contains("bad");
    b=mode==2?!!m:mode==1?(!!m&&(v!==""||!!tried)):(b&&!!m);
    w.classList.toggle("bad",b);x.setAttribute("aria-invalid",b?"true":"false");
    return m}
  function first(){for(var i=0;i<ORDER.length;i++){var k=ORDER[i],x=el(k),m;if(x&&(m=RULES[k](val(k))))return{x:x,m:m}}return null}
  function ready(){var ok=!first()&&agreed();sb.classList.toggle("rdy",ok);return ok}
  /* 一度送信を押したあとは、直すたびに「残っている最初の問題」に表示を更新する */
  function recheck(){if(!tried||!er||!er.classList.contains("on")||sending)return;
    var fe=first();msg(fe?fe.m:agreed()?"":"プライバシーポリシーへの同意が必要です。")}

  f.addEventListener("focusin",function(){if(!t0)t0=Date.now();rcPre()});
  f.addEventListener("input",function(e){var k=e.target&&e.target.name;if(RULES[k])judge(k,0);ready();recheck()});
  f.addEventListener("change",function(e){var t=e.target,k=t&&t.name;if(!k)return;
    if(k=="agree"){if(ag)ag.classList.toggle("bad",tried&&!t.checked)}
    else if(RULES[k]){tidy(k);judge(k,1)}
    ready();recheck()});
  f.addEventListener("focusout",function(e){var k=e.target&&e.target.name;if(RULES[k]){tidy(k);judge(k,1);ready();recheck()}});
  /* Enter で次の欄へ（うっかり送信を防ぐ）。日本語変換中の Enter は対象外 */
  f.addEventListener("keydown",function(e){
    if(e.key!=="Enter"||e.isComposing||e.keyCode===229)return;
    var t=e.target;if(!t||t.tagName!=="INPUT"||t.type=="checkbox")return;
    e.preventDefault();
    var l=[].filter.call(f.querySelectorAll("input,select,textarea"),function(x){return x.type!="hidden"&&!x.closest(".fhp")}),i=l.indexOf(t);
    if(i>-1&&l[i+1])l[i+1].focus()});

  function busy(on){sending=on?1:0;sb.disabled=!!on;sb.classList.toggle("busy",!!on);
    sbl.textContent=on?"送信中":"送信";pg.classList.toggle("sending",!!on)}
  function done(id){busy(0);msg("");pg.classList.add("done");
    var s=D.getElementById("cfId");if(s)s.textContent=id?"受付番号　"+id:"";
    var h=pg.querySelector(".fok b");if(h){h.tabIndex=-1;try{h.focus({preventScroll:true})}catch(x){}}}
  function fail(t){busy(0);
    msg((t||"送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。")+(C.tel?"（お急ぎの場合は tel. "+C.tel+"）":""))}
  function warn(t){try{console.warn("[お問い合わせ] "+t)}catch(x){}}

  function rcPre(){if(!C.rc||rcS)return;rcS=1;var s=D.createElement("script");
    s.src="https://www.google.com/recaptcha/api.js?render="+encodeURIComponent(C.rc);s.async=true;D.head.appendChild(s)}
  function rcToken(cb){if(!C.rc)return cb("");rcPre();var fin=0,end=function(t){if(fin)return;fin=1;cb(t||"")};
    setTimeout(function(){end("")},8000);
    var n=0,iv=setInterval(function(){
      if(window.grecaptcha&&window.grecaptcha.execute){clearInterval(iv);
        try{grecaptcha.ready(function(){grecaptcha.execute(C.rc,{action:"contact"}).then(end,function(){end("")})})}catch(x){end("")}}
      else if(++n>80){clearInterval(iv);end("")}},100)}
  /* 同意文の「プライバシーポリシー」をリンクにする（TK_FORM.pp があるときだけ）。
     リンクを押してもチェックは切り替わらない（label の中のリンクはブラウザがそう扱う） */
  if(C.pp&&(/^https?:\/\//.test(C.pp)||/^\/[^\/]/.test(C.pp))){var ts=ag&&ag.querySelector("span:not(.fck)"),w="プライバシーポリシー",i2;
    if(ts&&(i2=ts.textContent.indexOf(w))>-1){var tx=ts.textContent,a=D.createElement("a");
      a.href=C.pp;a.target="_blank";a.rel="noopener";a.textContent=w;ts.textContent="";
      ts.appendChild(D.createTextNode(tx.slice(0,i2)));ts.appendChild(a);ts.appendChild(D.createTextNode(tx.slice(i2+w.length)))}}
  if(C.rc){var p=D.createElement("p");p.className="frc";
    p.innerHTML='このフォームは reCAPTCHA で保護されており、Google の<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">プライバシーポリシー</a>と<a href="https://policies.google.com/terms" target="_blank" rel="noopener">利用規約</a>が適用されます。';
    sb.insertAdjacentElement("afterend",p)}

  /* 送信。text/plain にするとブラウザの事前確認（プリフライト）が起きず、GAS がそのまま受け取れる。
     応答が読めないときに「送れたことにする」予備経路は持たない（届いていないのに完了と出るのを防ぐ）。
     通信が途切れたときは1回だけ自動で再送。同じ _sid を付けるので、GAS側で二重登録にはならない */
  var WHY={rate:"短い時間に続けて送信されたため、受付を一時停止しています。10分ほどおいて、もう一度お試しください。",
    required:"入力内容をご確認のうえ、もう一度送信してください。",mail:"メールアドレスの形式をご確認ください。",
    toolong:"入力内容が長すぎます。短くしてからお試しください。",busy:"ただいま混み合っています。少し時間をおいて、もう一度お試しください。",
    recaptcha:"自動送信の疑いがあるため送信を停止しました。時間をおいて、もう一度お試しください。"};
  function send(d,again){
    var ac=typeof AbortController=="function"?new AbortController():null,tm=setTimeout(function(){ac&&ac.abort()},30000);
    fetch(C.url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(d),credentials:"omit",signal:ac?ac.signal:void 0})
    .then(function(r){return r.text()})
    .then(function(t){clearTimeout(tm);var j=null;try{j=JSON.parse(t)}catch(x){}
      if(!j){warn("GASの応答を読み取れませんでした。デプロイの「アクセスできるユーザー」が「全員」になっているか確認してください。");return fail()}
      if(j.ok)return done(j.id||"");
      if(j.error=="token")warn("合言葉が一致しません。埋め込みコードの TK_FORM.token と GAS の CONFIG.TOKEN をそろえてください。");
      else warn("GASがエラーを返しました: "+j.error);
      fail(WHY[j.error])})
    .catch(function(x){clearTimeout(tm);
      if(!again)return setTimeout(function(){send(d,1)},1200);
      warn("GASに届きませんでした（"+(x&&x.name||"network")+"）。URLとデプロイの設定を確認してください。");fail()})}

  f.addEventListener("submit",function(e){
    e.preventDefault();if(sending)return;tried=1;C=cfg();
    if(E._hp&&E._hp.value){done("");return}/* 人には見えない欄が埋まっている＝機械。静かに終える */
    ORDER.forEach(function(k){tidy(k);judge(k,2)});
    var fe=first(),ok=agreed();
    if(ag)ag.classList.toggle("bad",!ok);
    if(fe||!ok){msg(fe?fe.m:"プライバシーポリシーへの同意が必要です。");
      try{(fe?fe.x:E.agree).focus({preventScroll:true})}catch(x){}ready();return}
    if(!/^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+\/|macros\/)s\/[\w-]+\/exec\/?$/.test(C.url)){
      warn("送信先が未設定です。埋め込みコードの window.TK_FORM の url に、GASのウェブアプリURL（末尾 /exec）を入れてください。");
      msg("ただいま送信の準備中です。"+(C.tel?"お手数ですが tel. "+C.tel+" までご連絡ください。":"時間をおいて、もう一度お試しください。"));return}
    msg("");busy(1);if(!sid)sid=Date.now().toString(36)+Math.random().toString(36).slice(2,9);
    rcToken(function(tk){
      send({name:val("name"),addr:val("addr"),tel:val("tel"),mail:val("mail"),topic:val("topic"),body:val("body"),
        _tk:C.token,_rc:tk,_hp:"",_sid:sid,_el:t0?Math.round((Date.now()-t0)/1000):-1,_ua:String(navigator.userAgent||"").slice(0,200),src:"pc"})})});

  /* 戻るボタンなどで値が残っていた場合に、最初から状態をそろえておく */
  ORDER.forEach(function(k){judge(k,0)});ready();
}
D.readyState=="loading"?D.addEventListener("DOMContentLoaded",boot):boot();
})();


/* ============ 4. 地図（近づいたら読み込む／最初から操作できる） ============ */
(function(){var D=document,ld=0;
/* ▼v8：iframe の src は data-src に置いておき、お問い合わせの見開きが近づいてから入れる。
       ローディング演出と同時に地図2枚（数MB）を読み込まないため */
function load(){if(ld)return;ld=1;
  D.querySelectorAll(".fmapc iframe[data-src]").forEach(function(f){f.src=f.getAttribute("data-src");f.removeAttribute("data-src")})}
function boot(){
  var l=D.querySelectorAll(".fmapc");if(!l.length)return;
  /* ▼⑳ v9：クリックを待たずに操作できます。カーソルが乗ったところで読み込みを前倒し */
  l.forEach(function(c){c.addEventListener("mouseenter",load,{once:true})});
  /* めくりエンジンが「7（つくる）より先へ向かう」と知らせてきたら読み込む。
     すでに着いている場合（詳細ページからの戻りなど）は window.__CS を見る */
  if((+window.__CS||0)>=7)load();
  D.addEventListener("tk:near",function(e){if((+e.detail||0)>=7)load()});
  /* 保険：エンジンが動かない環境でも、ページが落ち着いたら読み込む */
  var later=function(){setTimeout(load,12000)};
  D.readyState=="complete"?later():addEventListener("load",later);
}
D.readyState=="loading"?D.addEventListener("DOMContentLoaded",boot):boot();
})();
