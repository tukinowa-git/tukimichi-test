/* book-sp.v13.1.js — 月みちて、山となる。 スマホ版（正式版）動き
   2026-10-30 / タグ v13.1.0。デザイン「SP横長_1026」にもとづく正式版の2つ目
   （見た目は book-sp.v13.1.css。HTML はトップ・嘉左衛門それぞれの「スマホ版の枠」）

   ■ v13.0 → v13.1 の変更（4章・5章・6-2章）
     1. 帯の最後まで届かずに次の帯へ移ってしまう不具合を直した
        原因：帯の長さ（どこまで流せるか）を、ページを開いた瞬間の1回しか測っていなかった。
              書体（本文・見出し）や写真があとから届いて帯の中身が伸びると、測った長さが短いまま残り、
              本当の端より手前で「端に着いた」と判断して、次のスワイプで次の帯へ移っていた。
              また、惰性で端へ向かっている途中・端に着いた直後のスワイプも、そのまま次の帯への合図になっていた
        直し：中身の大きさが変わるたびに測り直す（ResizeObserver）。端で触れたときは、その場でもう一度測る。
              はみ出した中身も帯の長さに入れる。次の帯へ移るのは、帯が端に着いて 0.15 秒（EDGE）たってから
              始めたスワイプだけ（惰性のまま次の帯へ飛ばない）
     2. 帯の動きをなめらかに：指を離した瞬間の速さをそのまま引き継いで減速する惰性（速さが途中で跳ねない。
        離した瞬間に1フレームで2歩ぶん進んだり、一瞬止まったりしない。速さは指が動いた時刻で測る）。
        端では勢いのぶんだけ少し行き過ぎて、ばねのように静かに戻る。指の動きは1フレームごとにまとめて描く。
        ホイールは目標へ毎フレーム近づける。帯の中の文字・写真の出方は、ぼかしを使わない軽いものに（CSS）
     3. 帯から帯へは、ほかのページと同じ「紙を一枚重ねる」切り替え（フェードのスクロールスナップ）に
     4. 目次のカード：横に流せることの合図（細い線が位置を示す。はじめて来たときに一度だけ少し流れて戻る）

   ■ 起動するのはスマホ幅（768px以下）のときだけ。PC幅では何もしません。
     768 の値は5か所そろえること：下の NARROW、スマホ版の枠の <link media> と @media、
     PC版の枠の @media、book.v12.2.js の NARROW
   ■ 写真は img/ の sp-*.webp（スマホ用に切り出したもの）。ただし嘉左衛門の外観だけは
     PC版の stay-kazaemon-xs.webp を、PC版と同じURLで読みます（data-pi。嘉左衛門ページの
     PC版の枠が必ず読み込む写真なので、二重に読まず、トップから移ったときもすぐ出る）
   ■ PC版には触れません
     ・文章はPC版の枠にある1組を、スマホ幅のあいだだけスマホ版の箱（data-s）へ移し、
       PC幅に戻った瞬間に元の場所へ戻します（移す前の場所に目印のコメントを置いて戻す）
     ・スマホでは要らない改行などは、移しているあいだだけ印（class）を付けて隠し、戻すときに外します
     ・PC版のJS（book.v12.2.js）の操作・フォーム・小窓の処理は、スマホ幅のあいだは届かないように止めます
       （PC幅で開いてからスマホ幅へ狭めた場合も、二重に動かない）
     ・PC版の名前（tk:near・ready・__CS・tkgo・tkcs・__GO・__R・__ENGINE）は使いません。
       こちらの控えは sessionStorage の tmmgo（嘉左衛門から戻る行き先）と tmmcs（戻る・進むの控え）
   ■ 動き
     ・ファーストビュー以降は、縦のスワイプで1ページずつ。次のページは「紙を一枚重ねる」ように
       下から静かに浮かび、紙の上端に淡い影が差し、文字は墨がにじむように右から順に出ます
     ・目次の写真カードは横のスワイプで自由に流せます。押すとそのテーマへ
     ・テーマの帯（とまる〜すまう・嘉左衛門）は絵巻。縦のスワイプで横に進みます（横のスワイプでも可）
       帯の端で止まったら、次のスワイプで次のテーマへ。帯から帯へも「紙を一枚重ねる」切り替え
     ・動きを減らす設定の人には、短いフェードだけにします
   ■ 目次
     0 設定と小道具 ／ 1 ページの器と寸法 ／ 2 PC版の文章を移す・戻す ／ 3 ページの切り替え
     4 帯（絵巻）の動き ／ 5 操作（タッチ・ホイール・キー・クリック） ／ 6 メニュー ／ 6-2 目次のカードの合図
     7 Instagram ／ 8 お問い合わせフォーム ／ 9 プライバシーポリシーの小窓 ／ 10 起動と切り替え
*/
(function(){"use strict";
var D=document,W=window,MQ=W.matchMedia("(max-width:768px)");
function NARROW(){return MQ.matches}

/* ===================== 0. 設定と小道具 ===================== */
/* 画像の置き場所は、このファイルと同じ場所の img/（タグを切り直してもここは直さなくてよい） */
var CS=D.currentScript,SRC=(CS&&CS.src)||"",
    BASE=/\/book-sp\.[^\/]*\.js(\?.*)?$/.test(SRC)?SRC.replace(/[^\/]*$/,""):"https://cdn.jsdelivr.net/gh/tukinowa-git/tukimichi-test@v13.1.0/",
    IMG=BASE+"img/",IMG2="https://tukinowa-git.github.io/tukimichi-test/img/";
var HOLD=3600,      /* ローディング → ファーストビューへ自動で進むまで（ms） */
    T_SHEET=1050,   /* 紙を一枚重ねる切り替えの長さ（ms）。帯から帯もこれ */
    SWIPE=46,       /* ページを送るのに要る指の移動（px） */
    INK=110,        /* 文字が順に出る間隔（ms） */
    EDGE=150,       /* 帯が端に着いてから、次のテーマへ移るスワイプを受け付けるまで（ms）。惰性のまま次へ飛ばないため */
    TAU=300;        /* 帯の惰性の減り方（ms。大きいほど長く滑る）。1回で進むのは画面0.9枚ぶんまで（release） */
/* PC版の番号（#s3・data-go="6"・data-p="3"）→ スマホ版のページ */
var NUM={"1":"toc","2":"ig","3":"stay","4":"eat","5":"know","6":"try","7":"make","8":"live","9":"contact"},
    GON={stay:3,eat:4,know:5,"try":6,make:7,live:8};

function $(s,r){return(r||D).querySelector(s)}
function $$(s,r){return[].slice.call((r||D).querySelectorAll(s))}
function now(){return Date.now()}
function clamp(v,a,b){return v<a?a:v>b?b:v}
function calm(){try{return W.matchMedia("(prefers-reduced-motion:reduce)").matches}catch(e){return false}}
function typing(t){var g=t&&t.tagName;return g==="INPUT"||g==="TEXTAREA"||g==="SELECT"||!!(t&&t.isContentEditable)}
function ses(k,v){try{var S=W.sessionStorage;if(v===undefined)return S.getItem(k);if(v===null)S.removeItem(k);else S.setItem(k,v)}catch(e){}return null}
function anim(el,kf,o){try{if(el&&el.animate)return el.animate(kf,o)}catch(e){}return null}
function warn(t){try{console.warn("[スマホ版] "+t)}catch(e){}}

var R=null,PC=null,KIND="top",on=0,built=0,first=1,rc=0,
    BK,MB,PN,MN,SW,pages=[],cur=-1,busy=0,RUN=[],FIN=null,menuOpen=0,LDT=0,
    U=1,VW=0,VH=0,OX=0,OY=0;

/* ===================== 1. ページの器と寸法 ===================== */
/* デザインの1画面（375×700）を、画面の幅・高さの小さい方に合わせる。--u はデザインの1pt */
function measure(force){
  var w=W.innerWidth||D.documentElement.clientWidth||375,h=W.innerHeight||D.documentElement.clientHeight||700,a=D.activeElement;
  /* 入力中（キーボードが出ている）に高さだけ変わったときは組み直さない */
  if(!force&&a&&typing(a)&&R.contains(a)&&Math.abs(w-VW)<2)return false;
  if(!force&&w===VW&&h===VH)return false;
  var u0=U;VW=w;VH=h;U=Math.min(w/375,h/700);OX=Math.max(0,(w-375*U)/2);OY=Math.max(0,(h-700*U)/2);
  /* 帯の位置は、大きさが変わった割合だけ伸び縮みさせる（relayout で使う） */
  if(built&&u0>0)SC*=U/u0;
  var s=R.style;s.setProperty("--u",U+"px");s.setProperty("--k",String(U));s.setProperty("--ox",OX+"px");s.setProperty("--oy",OY+"px");
  return true}

function build(){
  BK=$("#tmmBk",R);MB=$("#tmmMb",R);PN=$("#tmmPn",R);MN=$("#tmmMn",R);SW=$("#tmmSw",R);
  pages=$$(".tmm-pg",BK).map(function(el,i){
    var o={el:el,i:i,id:el.getAttribute("data-id")||"",strip:el.classList.contains("tmm-sp"),h:el.getAttribute("data-h")||"2",
           sw:el.getAttribute("data-sw")!=="0",lbl:el.getAttribute("data-lbl")||"",p:0,max:0,w:0,items:[],ld:0};
    if(o.strip)o.sr=$(".tmm-sr",el);
    /* 紙を重ねるときの、紙の上端の影 */
    var e=D.createElement("i");e.className="tmm-ed";e.setAttribute("aria-hidden","true");el.appendChild(e);o.ed=e;
    return o});
  if(MN)MN.setAttribute("inert","")}
function idx(id){for(var i=0;i<pages.length;i++)if(pages[i].id===id)return i;return -1}

/* 写真は近づいたページから読み込む（見えていないページのぶんを最初に読まない）
   data-si＝スマホ用の写真（このファイルと同じタグの img/）／data-pi＝PC版の写真（PC版と同じURL） */
var PCB=null;
function pcBase(){if(PCB!==null)return PCB||IMG;PCB="";
  /* PC版の枠の紙の地（--bg）と同じ場所。読めなければPC版の写真の src から */
  try{var m=/url\(\s*["']?([^"')]*\/)bg-paper\.webp/.exec(PC?getComputedStyle(PC).getPropertyValue("--bg"):"");if(m)PCB=m[1]}catch(e){}
  if(!PCB&&PC)$$("img[src]",PC).some(function(x){var u=x.getAttribute("src");if(/\/img\/[^\/?#]+$/.test(u)){PCB=u.replace(/[^\/]+$/,"");return true}});
  return PCB||IMG}
function need(o){if(!o||o.ld)return;o.ld=1;
  $$("img[data-si],img[data-pi]",o.el).forEach(function(im){if(im.getAttribute("src"))return;var p=im.getAttribute("data-pi"),f=p||im.getAttribute("data-si");
    im.decoding="async";im.onerror=function(){im.onerror=null;im.src=IMG2+f};im.src=(p?pcBase():IMG)+f;
    /* ★v13.1：見える前に絵を用意しておく（帯を流している最中に、写真を開く手間で引っかからない） */
    try{if(im.decode)im.decode().catch(function(){})}catch(e){}})}
function needAround(i){need(pages[i]);need(pages[i+1]);need(pages[i+2]);need(pages[i-1])}

/* ===================== 2. PC版の文章を移す・戻す =====================
   [スマホ版の箱(data-s), PC版の中での場所(#root から), 何番目か]
   PC版の枠の作りを変えたときは、ここの場所を合わせて直します */
var MAPT=[
 ["ld","#p0>.pf:not(.b) .itx"],
 ["fv-t","#ir .itl"],["fv-m","#ir .ilh.r img"],
 ["in-h","#p0>.pf.b .hh"],["in-b","#p0>.pf.b .hb"],["in-a","#p0>.pf.b .ab"],
 ["ig-h","#p1>.pf.b .igt"],
 ["tc-l","#p1>.pf:not(.b) .tl"],
 ["tc-3",'.tls>.ti[data-p="3"]'],["tc-4",'.tls>.ti[data-p="4"]'],["tc-5",'.tls>.ti[data-p="5"]'],
 ["tc-6",'.tls>.ti[data-p="6"]'],["tc-7",'.tls>.ti[data-p="7"]'],["tc-8",'.tls>.ti[data-p="8"]'],
 ["stay-kw","#p2>.pf.b .kw"],["stay-le","#p2>.pf.b .lead"],["stay-bd","#p2>.pf.b .bd"],
 ["stay-i1","#p3>.pf:not(.b) .ib",0],["stay-i2","#p3>.pf:not(.b) .ib",1],
 ["eat-kw","#p3>.pf.b .kw"],["eat-le","#p3>.pf.b .lead"],["eat-bd","#p3>.pf.b .bd"],
 /* たべる：PCは cafe → アクセス → チャレンジキッチン。スマホはデザインどおり cafe → キッチン → アクセス */
 ["eat-i1","#p4>.pf:not(.b) .ib",0],["eat-i2","#p4>.pf:not(.b) .ib",2],["eat-i3","#p4>.pf:not(.b) .ib",1],
 ["know-kw","#p4>.pf.b .kw"],["know-le","#p4>.pf.b .lead"],["know-bd","#p4>.pf.b .bd"],
 /* しる：画面の順（体験ツアー → ワークショップ）に並べる */
 ["know-i1","#p5>.pf:not(.b) .ibs.c .ib"],["know-i2","#p5>.pf:not(.b) .ibs.b .ib"],
 ["try-kw","#p5>.pf.b .kw"],["try-le","#p5>.pf.b .lead"],["try-bd","#p5>.pf.b .bd"],
 ["try-i1","#p6>.pf:not(.b) .ibs.a .ib"],["try-i2","#p6>.pf:not(.b) .ibs.b .ib"],
 ["make-kw","#p6>.pf.b .kw"],["make-le","#p6>.pf.b .lead"],["make-bd","#p6>.pf.b .bd"],
 ["make-i1","#p7>.pf:not(.b) .ib",0],["make-i2","#p7>.pf:not(.b) .ib",1],
 ["live-kw","#p7>.pf.b .kw"],["live-le","#p7>.pf.b .lead"],["live-bd","#p7>.pf.b .bd"],
 ["live-i1","#p8>.pf:not(.b) .ibs.a .ib"],["live-i2","#p8>.pf:not(.b) .ibs.b .ib"],
 ["cf-h","#cf .fh"],["cf-f","#cfF"],
 ["ok-t",".fL .fbr"],["ok-f",".fL .fft"]
];
var MAPK=[
 ["kz-lg",".kzR .kzlg"],["kz-k",".kzR .ibk"],["kz-bd",".kzR .bd"],
 ["kz-f1",".kzfp.f1 img"],["kz-l1",".kzfl.f1"],["kz-f2",".kzfp.f2 img"],["kz-l2",".kzfl.f2"],
 ["kz-h",".kzi .kzh"],["kz-g1",".kzi .kzg",0],["kz-g2",".kzi .kzg",1],["kz-ln",".kzi .kzln"],
 ["kz-g3",".kzi .kzg",2],["kz-g4",".kzi .kzg",3]
];
/* PC版の改行のうち、スマホの列（1列14字）では要らないもの。
   all＝すべて隠す／k＝「※」の前だけ残す／after:文字＝その文字のすぐあとの改行だけ隠す */
var BRT=[["eat-i1",".ibd","after:LINE"],["know-i2",".ibd","all"],["try-i1",".ibn","all"],["try-i1",".ibd","k"],["try-i2",".ibd","k"],
         ["make-i1",".ibd","all"],["live-i1",".ibn","all"],["live-i2",".ibn","all"]],
    BRK=[["kz-g2",".kzg","k"]];
/* スマホだけの改行（デザインの区切り）。[箱, 中の場所, この文字のあとで改行] */
var SBT=[["make-le",".lead","寄り添う"],["cf-f","label.fl","メール"],["cf-f","label.fl","問い合わせ"]];

var UNDO=[];
function mv(node,slot){var ph=D.createComment("tmm");node.parentNode.insertBefore(ph,node);slot.appendChild(node);
  UNDO.push(function(){if(ph.parentNode)ph.parentNode.replaceChild(node,ph)})}
function brx(el,mode){$$("br",el).forEach(function(b){
  var n=b.nextSibling;while(n&&n.nodeType===3&&!/\S/.test(n.nodeValue))n=n.nextSibling;
  var t=n?(n.nodeType===3?n.nodeValue:n.textContent||""):"",q=b.previousSibling,pt=q?(q.nodeType===3?q.nodeValue:q.textContent||""):"",
      hide=mode==="all"?1:mode.indexOf("after:")===0?pt.slice(-(mode.length-6))===mode.slice(6):t.replace(/^[\s　]+/,"").charAt(0)!=="※";
  if(hide){var had=b.hasAttribute("class");b.classList.add("tmm-bx");
    UNDO.push(function(){b.classList.remove("tmm-bx");if(!had&&!b.className)b.removeAttribute("class")})}})}
function sbr(scope,sel,anchor){var els=$$(sel,scope);for(var i=0;i<els.length;i++){
  var w=D.createTreeWalker(els[i],4,null),n;
  while((n=w.nextNode())){var k=n.nodeValue.indexOf(anchor);
    if(k>=0&&k+anchor.length<n.nodeValue.length){var rest=n.splitText(k+anchor.length),br=D.createElement("br"),p=n.parentNode;
      br.className="tmm-sb";p.insertBefore(br,rest);
      UNDO.push(function(){if(br.parentNode)br.parentNode.removeChild(br);p.normalize()});return}}}}
/* 嘉左衛門の「◎客室　個室…」：見出し（◎客室）を1行にしたとき、続く全角スペースを隠す */
function lsp(el){$$("b",el).forEach(function(b){var n=b.nextSibling;
  if(n&&n.nodeType===3&&n.nodeValue.charAt(0)==="　"){n.splitText(1);var sp=D.createElement("span"),p=n.parentNode;
    sp.className="tmm-ls";p.insertBefore(sp,n);sp.appendChild(n);
    UNDO.push(function(){var q=sp.parentNode;if(!q)return;q.insertBefore(n,sp);q.removeChild(sp);q.normalize()})}})}
function mount(){
  PC=D.getElementById("root");if(!PC){warn("PC版の枠（#root）が見つかりません。文章を移せないので、写真だけが出ます。");return}
  /* 先に全部の行き先を決めてから移す（移すと「何番目か」がずれるため） */
  (KIND==="kz"?MAPK:MAPT).map(function(m){var slot=$('[data-s="'+m[0]+'"]',R),n=slot&&$$(m[1],PC)[m[2]||0];
    if(slot&&!n)warn("PC版に "+m[1]+" が見つかりません");return[n,slot]})
  .forEach(function(x){if(x[0]&&x[1])mv(x[0],x[1])});
  (KIND==="kz"?BRK:BRT).forEach(function(t){var s=$('[data-s="'+t[0]+'"]',R),el=s&&$(t[1],s);if(el)brx(el,t[2])});
  if(KIND==="top")SBT.forEach(function(t){var s=$('[data-s="'+t[0]+'"]',R);if(s)sbr(s,t[1],t[2])});
  else ["kz-g1","kz-g2"].forEach(function(k){var s=$('[data-s="'+k+'"]',R);if(s)lsp(s)});
  /* 写真の説明（alt）はPC版の同じ写真から写す（文章を2か所に書かないため） */
  $$("img[data-ai]",R).forEach(function(im){if(im.getAttribute("alt"))return;var f=im.getAttribute("data-ai"),a="";
    $$("img",PC).some(function(x){var s=x.getAttribute("data-i")||x.getAttribute("src")||"";if(s.slice(-f.length)===f&&x.alt){a=x.alt;return true}});
    if(a)im.alt=a});
}
function unmount(){for(var i=UNDO.length-1;i>=0;i--){try{UNDO[i]()}catch(e){}}UNDO=[]}

/* ===================== 3. ページの切り替え ===================== */
function ink(el,d){el.style.transitionDelay=d?(d/1000)+"s":"";el.classList.add("in")}
function resetInk(o){o.el.classList.add("tmm-now");
  $$(".tmm-k",o.el).forEach(function(k){k.classList.remove("in");k.style.transitionDelay=""});
  o.items.forEach(function(it){it.done=0});if(o.id==="ld")o.el.classList.remove("tmm-go");
  void o.el.offsetWidth;o.el.classList.remove("tmm-now")}
/* 見えている文字・写真を、動きなしで出しておく（戻るとき・帯から帯へ） */
function showVis(o){o.el.classList.add("tmm-now");
  if(o.strip){var x0=VW-OX-o.w+o.p;o.items.forEach(function(it){var x=x0+it.l;if(x<VW&&x+it.w>0){it.done=1;it.el.style.transitionDelay="";it.el.classList.add("in")}})}
  else $$(".tmm-k",o.el).forEach(function(k){k.style.transitionDelay="";k.classList.add("in")});
  if(o.id==="ld")o.el.classList.add("tmm-go");
  void o.el.offsetWidth;o.el.classList.remove("tmm-now")}
/* 写真（.tmm-p）だけ先に出しておく。帯は見えている範囲だけ */
function inkPhotos(o){o.el.classList.add("tmm-now");
  if(o.strip){var x0=VW-OX-o.w+o.p;o.items.forEach(function(it){if(!it.el.classList.contains("tmm-p"))return;var x=x0+it.l;
    if(x<VW&&x+it.w>0){it.done=1;it.el.style.transitionDelay="";it.el.classList.add("in")}})}
  else $$(".tmm-k.tmm-p",o.el).forEach(function(k){k.style.transitionDelay="";k.classList.add("in")});
  void o.el.offsetWidth;o.el.classList.remove("tmm-now")}
/* 着いたページの文字を、右（読みはじめ）から順ににじませる */
function arrive(o){if(!on)return;
  if(o.id==="ld"){o.el.classList.remove("tmm-go");void o.el.offsetWidth;o.el.classList.add("tmm-go");
    clearTimeout(LDT);LDT=setTimeout(function(){if(on&&cur===0&&!busy&&!menuOpen)step(1)},HOLD);return}
  if(o.strip){reveal(o,1);return}
  var j=0;$$(".tmm-k",o.el).forEach(function(k){if(k.classList.contains("in"))return;ink(k,j++*INK*(o.id==="fv"?4:1))});
  if(o.id==="toc"){tocUpd();tocNudge(o)}}

/* ヘッダー（0 なし／1 メニュー／2 すべて）・swipe・ページ名 */
var LBL=null;
function hdr(o,dir){R.setAttribute("data-h",o.h);SWV=o.sw&&(o.i<pages.length-1||o.strip)?"1":"0";R.setAttribute("data-sw",SWV);label(o.lbl,dir)}
function label(t,dir){if(!PN||t===LBL)return;LBL=t;
  var old=PN.lastElementChild,n=D.createElement("span");n.textContent=t;PN.appendChild(n);
  if(!old)return;
  if(calm()){PN.removeChild(old);return}
  var y=dir<0?-100:100;old.style.position="absolute";old.style.left="0";old.style.top="0";
  anim(n,[{transform:"translateY("+y+"%)",opacity:0},{transform:"translateY(0)",opacity:1}],{duration:760,easing:"cubic-bezier(.16,1,.3,1)",fill:"backwards"});
  anim(old,[{transform:"translateY(0)",opacity:1},{transform:"translateY("+(-y)+"%)",opacity:0}],{duration:480,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"});
  setTimeout(function(){if(old.parentNode)old.parentNode.removeChild(old)},500)}

function track(a){if(a)RUN.push(a);return a}
function settle(){if(FIN){var f=FIN;FIN=null;f()}}
function finish(A,B){FIN=function(){var l=RUN;RUN=[];
  A.el.classList.remove("on");A.el.style.zIndex="";B.el.style.zIndex="";
  l.forEach(function(a){try{a.cancel()}catch(e){}});
  resetInk(A);if(A.strip)A.items.forEach(function(it){it.done=0});
  busy=0;needAround(B.i);mark()}}
function prep(o,at){need(o);if(o.strip){metrics(o);o.p=posFor(o,at);paint(o);o.zone=null;o.edgeAt=0}}

/* 紙を一枚重ねる（dir 1：次のページが下から浮かぶ／-1：いまの紙が下へ退き、前のページが現れる） */
function sheet(A,B,dir,at){
  busy=1;var c=calm(),T=c?320:T_SHEET,E="cubic-bezier(.16,1,.3,1)",O="cubic-bezier(.4,0,.6,1)";
  prep(B,at);B.el.classList.add("on");hdr(B,dir);
  if(dir>0){
    /* 写真は紙といっしょに浮かび、文字はあとから墨のようににじむ（ファーストビューだけは全部あとから） */
    resetInk(B);if(B.id!=="fv")inkPhotos(B);A.el.style.zIndex=1;B.el.style.zIndex=2;
    if(c)track(anim(B.el,[{opacity:0},{opacity:1}],{duration:T,fill:"both"}));
    else{track(anim(B.el,[{transform:"translate3d(0,13%,0)"},{transform:"translate3d(0,0,0)"}],{duration:T,easing:E,fill:"both"}));
      track(anim(B.el,[{opacity:0},{opacity:1}],{duration:T*.46,easing:"cubic-bezier(.25,.6,.3,1)",fill:"both"}));
      track(anim(B.ed,[{opacity:.95},{opacity:0}],{duration:T*1.1,easing:"cubic-bezier(.5,0,.75,1)",fill:"both"}))}
    track(anim(A.el,c?[{opacity:1},{opacity:0}]:[{opacity:1,transform:"translate3d(0,0,0)"},{opacity:0,transform:"translate3d(0,-4%,0)"}],{duration:T*.8,easing:O,fill:"both"}));
    setTimeout(function(){if(cur===B.i)arrive(B)},c?40:300);
  }else{
    showVis(B);A.el.style.zIndex=2;B.el.style.zIndex=1;
    track(anim(B.el,c?[{opacity:0},{opacity:1}]:[{opacity:0,transform:"translate3d(0,-4%,0)"},{opacity:1,transform:"translate3d(0,0,0)"}],{duration:T*.95,easing:E,fill:"both"}));
    track(anim(A.el,c?[{opacity:1},{opacity:0}]:[{opacity:1,transform:"translate3d(0,0,0)"},{opacity:0,transform:"translate3d(0,13%,0)"}],{duration:T*.72,easing:O,fill:"both"}));
    if(!c)track(anim(A.ed,[{opacity:0},{opacity:1}],{duration:T*.72,easing:O,fill:"both"}));
  }
  finish(A,B);setTimeout(settle,T+40)}

/* ★v13.1：帯から帯へも、ほかのページと同じ「紙を一枚重ねる」切り替え（v13.0 の「一段おりる」stair はやめた）
   進むときは次の帯の1画面目へ、戻るときは前の帯の最後（端）へ */
function step(dir){if(busy||cur<0||!on)return;var n=cur+dir,A=pages[cur],B=pages[n];
  if(!B||B.id==="ld")return;clearTimeout(LDT);stopMV();
  cur=n;sheet(A,B,dir,dir>0?"start":"end")}
function jump(n,at){if(typeof n!=="number")n=idx(n);if(n<0||!on)return;
  if(busy)settle();clearTimeout(LDT);
  if(n===cur){var o=pages[n];if(o.strip)animP(o,posFor(o,at||"start"),700);return}
  stopMV();
  var A=pages[cur];cur=n;sheet(A,pages[n],n>A.i?1:-1,at||"start")}
/* その場で表示（起動時・PC幅から戻ったとき） */
function show(o,at){pages.forEach(function(x){if(x!==o){x.el.classList.remove("on");x.el.style.zIndex=""}});
  cur=o.i;prep(o,at);o.el.classList.add("on");hdr(o,1);needAround(o.i)}

/* 戻る・進むで来たときの控え（URLは変えない） */
function mark(){if(KIND!=="top"||cur<0)return;var o=pages[cur],id=o.id==="ld"?"fv":o.id;
  ses("tmmcs",id+(o.strip?"|"+(o.max?o.p/o.max:0).toFixed(3):""))}
function target(){
  var g=ses("tmmgo");if(g){ses("tmmgo",null);var a=g.split("|");if(now()-(+a[1]||0)<30000&&a[0])return a[0]}
  /* 戻る・進むで来たときは、離れたときの場所（tmmcs）を先に見る */
  try{var nv=performance.getEntriesByType("navigation")[0];if(nv&&nv.type==="back_forward"){var c=ses("tmmcs");if(c)return c}}catch(e){}
  var m=/^#s(\d)$/.exec(location.hash||"");if(m&&NUM[m[1]])return NUM[m[1]];
  return ""}
function resolve(t){var at="start",id=String(t||"");
  if(id.indexOf(":")>0){at=id.split(":")[1];id=id.split(":")[0]}
  else if(id.indexOf("|")>0){at=parseFloat(id.split("|")[1])||0;id=id.split("|")[0]}
  var n=idx(NUM[id]||id);if(n<0)n=Math.max(0,idx("toc"));return{o:pages[n],at:at}}

/* ===================== 4. 帯（絵巻）の動き =====================
   帯の右端が1画面目。p（px）だけ帯を右へずらすと、左の続きが見えてくる
   ★v13.1
   ・帯の長さ（max）は、帯の中身がいちばん左まで届く位置から測る（箱からはみ出した中身も含める）。
     中身の大きさが変わったら（書体・写真が後から届いた、画面が変わった）その帯だけすぐ測り直す（ResizeObserver）。
     端で触れたときは、触れた瞬間にもう一度測ってから「端かどうか」を決める
   ・動きは1本の流れ（MV）で描く：coast＝指を離した速さをそのまま引き継いで減速する惰性、
     spring＝端で少し行き過ぎて静かに戻る、ease＝ホイールの目標へ近づく、tween＝決まった長さで移る（キー・ボタン）
   ・次のテーマへ移るのは、帯が端に着いてから EDGE 以上たって始めたスワイプだけ。
     端へ向かって動いている途中や、端に着いた瞬間に重なったスワイプは、帯の中で受ける（端で少したわんで戻る） */
var AF=0,MV=null,TQ=0,RO=null,SC=1,SWV=null;
function pnow(){try{return performance.now()}catch(e){return now()}}
/* 指の動きが起きた時刻（ブラウザが処理するのが遅れても、速さを正しく測るため）。使えない環境では今の時刻 */
function evt(e){var t=e&&e.timeStamp,n=pnow();return t>0&&Math.abs(n-t)<1000?Math.min(t,n):n}
function offL(el,anc){var x=0;while(el&&el!==anc){x+=el.offsetLeft;el=el.offsetParent}return x}
function metrics(o){if(!o.strip)return;var sr=o.sr,r=sr.getBoundingClientRect(),pad=16*U,L=r.left+pad;o.w=sr.offsetWidth;
  /* いちばん左まで描かれている所を探す。縦書きの文字が箱から左へあふれている場合（端末によって起きる）も拾う */
  $$("*",sr).forEach(function(k){var b=k.getBoundingClientRect();if(!b.width&&!b.height)return;var l=b.left;
    if(k.scrollWidth>k.clientWidth+1&&/^vertical/.test(getComputedStyle(k).writingMode||""))l=Math.min(l,b.right-k.scrollWidth);
    if(l<L)L=l});
  o.max=Math.max(0,Math.max(o.w,r.right-L+pad)-375*U);o.dirty=0;
  o.items=$$(".tmm-k",sr).map(function(k){return{el:k,l:offL(k,sr),w:k.offsetWidth,done:k.classList.contains("in")}})}
function paint(o){o.sr.style.transform="translate3d("+o.p.toFixed(2)+"px,0,0)"}
function setP(o,p){o.p=p;paint(o);if(o.i===cur&&!busy)reveal(o,0);
  /* 端（はじめ・おわり）に入った時刻を控える。次のテーマへ移ってよいかの判断に使う */
  var z=p>=o.max-1?1:p<=1?-1:0;if(z!==o.zone){o.zone=z;o.edgeAt=now()}
  if(KIND==="kz"){var v=p<o.max-4?"1":"0";if(v!==SWV){SWV=v;R.setAttribute("data-sw",v)}}}
/* 画面に入ってきた文字・写真をにじませる */
function reveal(o,stag){if(!o.strip)return;var x0=VW-OX-o.w+o.p,l=[];
  o.items.forEach(function(it){if(it.done)return;var x=x0+it.l;if(x<VW-4&&x+it.w>4){it.done=1;l.push(it)}});
  l.sort(function(a,b){return b.l-a.l});l.forEach(function(it,j){ink(it.el,stag?j*INK:0)})}
function posFor(o,at){if(!o.strip)return 0;
  if(at==="end")return o.max;
  if(at==="kz"){var s=$('[data-s="stay-i1"]',o.sr);if(s)return clamp(o.w-offL(s,o.sr)-s.offsetWidth/2-187.5*U,0,o.max);return 0}
  if(typeof at==="number")return clamp(o.max*at,0,o.max);
  return 0}
function stopMV(){if(AF){cancelAnimationFrame(AF);AF=0}MV=null}
function stopAF(){stopMV()}
function rest(o){mark()}
/* 動きの1本の流れ。毎フレーム、前のフレームからの時間（dt）ぶんだけ進める（フレームが飛んでも速さは変わらない） */
function run(o,st){stopMV();var me=MV={o:o,st:st},last=0,t0=0;
  function f(ts){if(MV!==me)return;
    /* 指を離した瞬間に、まだ描いていない指の動きが残っていたときは、このフレームはそれだけを描き、惰性は次のフレームから
       （1フレームで「指の動き＋惰性」の2歩ぶん進んで、離した瞬間だけ速く見えるのを防ぐ） */
    if(me.st.hold){me.st.hold=0;last=t0=ts;AF=requestAnimationFrame(f);return}
    var s=me.st,dt=last?Math.min(40,ts-last):16,p=o.p,done=0;last=ts;if(!t0)t0=ts;
    if(s.k==="coast"){var e=Math.exp(-dt/s.tau);p=o.p+s.v*s.tau*(1-e);s.v*=e;
      if(p>o.max||p<0){s.k="spring";s.to=p>o.max?o.max:0;s.v=clamp(s.v,-1.6,1.6)}
      else if(Math.abs(s.v)<.025)done=1}
    else if(s.k==="spring"){/* 減衰の強いばね（行き過ぎは1回だけ・戻りは静か） */
      var w=.021,x=o.p-s.to,e2=Math.exp(-w*dt),c=s.v+w*x;p=s.to+(x+c*dt)*e2;s.v=(s.v-c*w*dt)*e2;
      if(Math.abs(p-s.to)<.25&&Math.abs(s.v)<.02){p=s.to;done=1}}
    else if(s.k==="ease"){var k=1-Math.exp(-dt/s.tau);p=o.p+(s.to-o.p)*k;if(Math.abs(s.to-p)<.25){p=s.to;done=1}}
    else{var q=Math.min(1,(ts-t0)/s.dur);p=s.from+(s.to-s.from)*(1-Math.pow(1-q,3));if(q>=1)done=1}
    setP(o,p);
    if(done){MV=null;AF=0;if(o.p<0||o.p>o.max)setP(o,clamp(o.p,0,o.max));rest(o);return}
    AF=requestAnimationFrame(f)}
  AF=requestAnimationFrame(f)}
function animP(o,t,dur){if(Math.abs(t-o.p)<.5){stopMV();setP(o,t);rest(o);return}run(o,{k:"tween",from:o.p,to:t,dur:dur})}
/* 端を越えて引いたときの手ごたえ（指の動きを縮める）と、その逆 */
function rb(x){return 52*(1-1/(x/150+1))}
function rbi(y){y=Math.min(y,51);return 150*(1/(1-y/52)-1)}
function rubber(p,max){return p<0?-rb(-p):p>max?max+rb(p-max):p}
function unrubber(p,max){return p<0?-rbi(-p):p>max?max+rbi(p-max):p}
/* 指を離したとき：端を越えていればばねで戻す。速さがあれば、その速さのまま惰性で（1回で進むのは画面0.9枚ぶんまで。
   それ以上の勢いは、滑る長さではなく減り方を強めて吸収するので、離した瞬間の速さは変わらない） */
function release(o,v,hold){var p=o.p;
  if(p<0||p>o.max){run(o,{k:"spring",to:p<0?0:o.max,v:clamp(v,-1.6,1.6),hold:hold});return}
  if(Math.abs(v)<.06){rest(o);return}
  run(o,{k:"coast",v:v,tau:Math.min(TAU,VW*.9/Math.abs(v)),hold:hold})}
function relayout(){var sc=SC;SC=1;
  pages.forEach(function(o){if(!o.strip)return;if(sc!==1)o.p*=sc;metrics(o);if(!(MV&&MV.o===o)){o.p=clamp(o.p,0,o.max);paint(o)}});
  if(cur>=0&&pages[cur].strip&&!busy)reveal(pages[cur],0);tocUpd()}
/* 帯の中身の大きさが変わったら、その帯だけ測り直す（書体や写真が後から届いたとき） */
function watch(){if(RO||!W.ResizeObserver)return;
  RO=new ResizeObserver(function(es){if(!on)return;var hit=[];
    es.forEach(function(e){pages.forEach(function(o){if(o.strip&&o.sr.contains(e.target)&&hit.indexOf(o)<0)hit.push(o)})});
    hit.forEach(function(o){metrics(o);if(!(MV&&MV.o===o)&&o.p>o.max){o.p=o.max;paint(o)}if(o.i===cur&&!busy)reveal(o,0)})});
  pages.forEach(function(o){if(!o.strip)return;RO.observe(o.sr);$$(".tmm-mc,.tmm-rs,.tmm-row,.tmm-tx",o.sr).forEach(function(x){RO.observe(x)})})}

/* ===================== 5. 操作 ===================== */
var G=null;
function blocked(t){if(menuOpen||DLG.open)return true;if(!t||!t.closest)return false;if(t.closest(".pvm,.tmm-mn"))return true;
  /* 内容欄は、入力中か、中身がはみ出してスクロールできるときだけ指をゆずる */
  var ta=t.closest("textarea");return!!(ta&&(ta===D.activeElement||ta.scrollHeight>ta.clientHeight+2))}
function onTS(e){G=null;if(!on||e.touches.length!==1)return;var t=e.target;if(!R.contains(t)||blocked(t))return;
  var a=D.activeElement;
  /* 入力中にほかの所を触ったら、キーボードを閉じるだけ（ページは送らない） */
  if(a&&typing(a)&&R.contains(a)&&a!==t&&!(t.closest&&t.closest("input,select,textarea,label"))){a.blur();return}
  if(busy)return;var o=pages[cur],p=e.touches[0];stopMV();
  /* ★v13.1：端にいるとき（または測り直しの印があるとき）は、触れた瞬間に帯の長さを測り直す */
  if(o.strip&&(o.dirty||o.p>=o.max-1||o.p<=1))metrics(o);
  var tc=!!(t.closest&&t.closest(".tmm-tcs"));if(tc)tocTouch();
  G={x:p.clientX,y:p.clientY,ax:"",mode:"",p0:o.strip?unrubber(o.p,o.max):0,tp:o.p,fired:0,tc:tc,
     /* 次のテーマへ移ってよいのは、触れたときにはもう端に着いていて、着いてから EDGE たっているときだけ */
     rest:now()-(o.edgeAt||0)>=EDGE,h:[]}}
function onTM(e){if(!G||!on)return;var o=pages[cur],p=e.touches[0],dx=p.clientX-G.x,dy=p.clientY-G.y;
  if(!G.ax){if(Math.abs(dx)<8&&Math.abs(dy)<8)return;G.ax=Math.abs(dy)>=Math.abs(dx)?"v":"h";
    if(G.ax==="h"&&G.tc){G.mode="native";return}
    if(o.strip){var fw=G.ax==="v"?dy<0:dx>0,nb=pages[cur+(fw?1:-1)];G.dir=fw?1:-1;
      G.mode=(G.rest&&(fw?o.p>=o.max-1:o.p<=1)&&nb&&nb.id!=="ld")?"page":"strip";
      /* 帯を動かすときは、向きが決まった位置を起点にする（動きはじめに 8px 飛ばない） */
      if(G.mode==="strip"){G.x=p.clientX;G.y=p.clientY;dx=dy=0}}
    else if(G.ax==="v"){G.mode="page";G.dir=dy<0?1:-1}
    else G.mode="none"}
  if(G.mode==="strip"){var raw=G.p0+(G.ax==="v"?-dy:dx);G.tp=rubber(raw,o.max);G.h.push([evt(e),raw]);if(G.h.length>20)G.h.shift();
    /* 描くのは次のフレームで1回だけ（指の動きが細かく届いても、フレームごとにまとめる） */
    if(!TQ)TQ=requestAnimationFrame(function(){TQ=0;if(G&&G.mode==="strip"&&pages[cur]===o)setP(o,G.tp)})}
  else if(G.mode==="page"&&!G.fired&&!busy){if((G.ax==="v"?Math.abs(dy):Math.abs(dx))>SWIPE){G.fired=1;step(G.dir)}}}
/* 離す直前（およそ 0.05 秒）の指の速さ（px/ms）。指を止めてから離したときは 0。
   直前の速さを使うので、離した瞬間に帯が急に速くなったり、一瞬止まったりしない */
function vel(h){var n=h.length;if(n<2)return 0;var b=h[n-1];if(pnow()-b[0]>70)return 0;
  var i=n-1;while(i>0&&b[0]-h[i-1][0]<=60)i--;if(i===n-1)i=n-2;var a=h[i];return b[0]-a[0]<8?0:(b[1]-a[1])/(b[0]-a[0])}
function onTE(){if(!G)return;var g=G;G=null;if(TQ){cancelAnimationFrame(TQ);TQ=0}
  if(!on||g.mode!=="strip")return;var o=pages[cur];if(!o.strip)return;
  var hold=o.p!==g.tp;if(hold)setP(o,g.tp);release(o,vel(g.h),hold)}
/* 指が途中で取り上げられたとき（iOS の画面端のジェスチャーなど）は、速さなしで静かに収める */
function onTC(){var g=G;G=null;if(TQ){cancelAnimationFrame(TQ);TQ=0}
  if(!on||!g||g.mode!=="strip")return;var o=pages[cur];if(o&&o.strip)release(o,0)}

var WA=0,WT=0,WM="";
function onWh(e){if(!on)return;var t=e.target;if(!R.contains(t)||menuOpen||DLG.open)return;
  if(t.closest&&t.closest("textarea,.pvm"))return;
  var k=e.deltaMode===1?32:e.deltaMode===2?VH:1,dy=e.deltaY*k,dx=e.deltaX*k;
  if(t.closest&&t.closest(".tmm-tcs")&&Math.abs(dx)>Math.abs(dy))return;
  e.preventDefault();var tn=now(),gap=tn-WT;WT=tn;if(gap>220)WM="";if(busy)return;
  var o=pages[cur];
  if(o.strip){var d=Math.abs(dy)>=Math.abs(dx)?dy:-dx;
    /* ひと続きの回し始め（前の回しから 0.22 秒あいた）で、向きを決める。端で止まっていれば次・前のテーマへ */
    if(!WM){WA=0;if(o.dirty||o.p>=o.max-1||o.p<=1)metrics(o);var ok=now()-(o.edgeAt||0)>=EDGE;
      WM=(ok&&d>0&&o.p>=o.max-1&&pages[cur+1])?"next":(ok&&d<0&&o.p<=1&&pages[cur-1]&&pages[cur-1].id!=="ld")?"prev":"scroll"}
    /* ★v13.1：回したぶんだけ目標を進め、帯は毎フレームそこへ近づく（段差なく流れる） */
    if(WM==="scroll"){var s=MV&&MV.o===o&&MV.st.k==="ease"?MV.st:null,to=clamp((s?s.to:o.p)+d,0,o.max);
      if(s)s.to=to;else run(o,{k:"ease",to:to,tau:85})}
    else if(WM!=="done"){WA+=d;if(Math.abs(WA)>60){WM="done";step(WA>0?1:-1)}}}
  else{if(!WM){WM="acc";WA=0}if(WM==="acc"){WA+=dy;if(Math.abs(WA)>50){WM="done";step(WA>0?1:-1)}}}}

/* キー。PC版の本に届かないよう、スマホ幅のあいだは先に受けて止める */
function onKey(e){if(!on)return;var t=e.target;if(DLG.open)return;
  if((e.key==="Escape"||e.key==="Esc")&&menuOpen){e.preventDefault();menu(0);return}
  if(menuOpen||e.metaKey||e.ctrlKey||e.altKey||typing(t))return;
  var k=e.key,f=k==="ArrowDown"||k==="PageDown"||k==="ArrowLeft"||(k===" "&&!e.shiftKey),b=k==="ArrowUp"||k==="PageUp"||k==="ArrowRight"||(k===" "&&e.shiftKey);
  if(!f&&!b)return;if(k===" "&&t&&t.closest&&t.closest("a,button,label"))return;
  e.preventDefault();e.stopPropagation();if(busy||cur<0)return;
  var o=pages[cur],d=f?1:-1;
  if(o.strip&&((d>0&&o.p<o.max-1)||(d<0&&o.p>1))){animP(o,clamp(o.p+d*375*U*.72,0,o.max),640);return}
  step(d)}
/* Tab キーなどで、帯の先のリンクにフォーカスが移ったとき：ブラウザが箱ごとずらすのを戻し、帯を送って見せる */
function onFocus(e){if(!on)return;var t=e.target;if(!t||!R.contains(t)||!t.closest)return;
  requestAnimationFrame(function(){[R,BK].concat(pages.map(function(o){return o.el})).forEach(function(x){if(x&&(x.scrollLeft||x.scrollTop)){x.scrollLeft=0;x.scrollTop=0}});
    var o=pages[cur];if(!o||!o.strip||busy||!o.sr.contains(t))return;
    var x=VW-OX-o.w+o.p+offL(t,o.sr),w=t.offsetWidth;
    if(x<OX||x+w>VW-OX)animP(o,clamp(o.w-offL(t,o.sr)-w/2-187.5*U,0,o.max),500)})}
function swipeNext(){if(busy||cur<0)return;var o=pages[cur];
  if(o.strip&&o.p<o.max-1){animP(o,clamp(o.p+375*U*.72,0,o.max),700);return}step(1)}

/* クリック。スマホ版の中のリンク・ボタンは、PC版の処理に届く前にここで受ける */
function onClick(e){if(!on)return;var t=e.target,el;if(!t||!t.closest)return;
  if(t.closest(".tmm-mb")){e.preventDefault();menu(!menuOpen);return}
  if(t.closest(".tmm-sw")){e.preventDefault();swipeNext();return}
  if(cur===0&&pages[0]&&pages[0].id==="ld"&&t.closest(".tmm-ld")){step(1);return}
  if((el=t.closest(".pvl"))&&KIND==="top"){e.preventDefault();e.stopPropagation();dlgOpen(el);return}
  if((el=t.closest("a[data-leave]"))){var u=el.getAttribute("href");
    if(!u||u.charAt(0)==="#"||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||(el.target&&el.target!=="_self"))return;
    e.preventDefault();e.stopPropagation();leaveTo(u);return}
  el=t.closest("[data-go],.ti[data-p],a[href^='#s']");if(!el||!R.contains(el))return;
  var g=el.getAttribute("data-go")||el.getAttribute("data-p")||(el.getAttribute("href")||"").replace(/^#s/,"");
  g=NUM[g]||g;e.preventDefault();e.stopPropagation();
  if(KIND==="kz"){if(menuOpen)menu(0);navTop(g==="back"?"stay:kz":g);return}
  if(menuOpen){menu(0);setTimeout(function(){jump(g,"start")},180);return}
  jump(g,"start")}

/* トップ → 嘉左衛門：中身を静かに消してから移る。戻ってきたら（bfcache）そのまま元の場所 */
function leaveTo(u){mark();R.classList.add("tmm-lv");setTimeout(function(){location.href=u},170);
  setTimeout(function(){R.classList.remove("tmm-lv")},6000)}
/* 嘉左衛門 → トップ。行き先は tmmgo で伝える。トップから来ていれば「戻る」で帰る（読み込み直さない） */
function fromTop(){try{if(!D.referrer)return 0;var u=new URL(D.referrer);
  return(u.origin===location.origin&&(u.pathname==="/"||u.pathname==="")&&history.length>1)?1:0}catch(e){return 0}}
function navTop(t){ses("tmmgo",t+"|"+now());R.classList.add("tmm-lv");var back=fromTop();
  setTimeout(function(){if(!back){location.href="/";return}
    var tm=setTimeout(function(){location.href="/"},700);W.addEventListener("pagehide",function(){clearTimeout(tm)},{once:true});history.back()},170);
  setTimeout(function(){R.classList.remove("tmm-lv")},6000)}

/* ===================== 6. メニュー ===================== */
function menu(o){o=!!o;if(o===!!menuOpen||!MN)return;menuOpen=o?1:0;R.classList.toggle("tmm-mo",o);
  MB.setAttribute("aria-expanded",o?"true":"false");
  if(o){MN.removeAttribute("inert");G=null;
    var c=pages[cur]&&pages[cur].id;if(KIND==="kz")c="stay";
    $$(".tmm-mi",MN).forEach(function(b){b.classList.toggle("on",b.getAttribute("data-go")===c)});
    setTimeout(function(){try{($(".tmm-mi.on",MN)||$(".tmm-mi",MN)).focus({preventScroll:true})}catch(e){}},80)}
  else{var f=MN.contains(D.activeElement);MN.setAttribute("inert","");if(f)try{MB.focus({preventScroll:true})}catch(e){}}}
/* メニューのリード・サブタイトルは、目次（PC版の .ti）の文字を写して作る（読み上げは目次の側） */
function menuText(){if(!MN)return;$$(".tmm-mi",MN).forEach(function(b){var x=$(".tmm-mx",b);if(!x||x.childNodes.length)return;
  var ti=$('.ti[data-p="'+GON[b.getAttribute("data-go")]+'"]',R);if(!ti)return;
  [".ts",".tg"].forEach(function(s){var e=$(s,ti);if(e){var sp=D.createElement("span");sp.textContent=e.textContent;x.appendChild(sp)}})})}

/* ===================== 6-2. 目次のカード：横に流せることの合図（v13.1） =====================
   ・カードの下の細い線（.tmm-tcb）の濃い部分が、いま見ている範囲。カードを流すと動く（右から読むので、はじめは右端）
   ・はじめて目次に来たときだけ（このタブで1回）、カード列が少し右へ流れて次のカードをのぞかせ、静かに戻る。
     指で触れたら、すぐにやめる。動きを減らす設定の人には出さない */
var TC={S:null,row:null,th:null,n:0,a:null};
function tocInit(){var S=$("#tmmTc",R);if(!S||TC.S)return;TC.S=S;TC.row=$(".tmm-tcr",S);
  var bar=$(".tmm-tcb",R);TC.th=bar&&bar.firstElementChild;S.addEventListener("scroll",tocUpd,{passive:true});tocUpd()}
function tocUpd(){var S=TC.S,th=TC.th;if(!S||!th||!on)return;var sw=S.scrollWidth,cw=S.clientWidth;if(!sw||!cw)return;
  var vis=Math.min(1,cw/sw),mx=sw-cw,f=mx>0?Math.min(1,Math.abs(S.scrollLeft)/mx):0;
  th.style.width=(vis*100).toFixed(2)+"%";th.style.transform="translate3d("+(-f*(1-vis)/vis*100).toFixed(2)+"%,0,0)"}
/* 触れたら合図をやめる。動いている途中なら、その位置から静かに戻す（ぱっと戻ると跳ねて見えるため） */
function tocTouch(){TC.n=2;var A=TC.a;TC.a=null;if(!A)return;
  A.forEach(function(a){try{var el=a.effect&&a.effect.target,t=el&&a.playState==="running"?getComputedStyle(el).transform:"none";a.cancel();
    if(t&&t!=="none")anim(el,[{transform:t},{transform:"translate3d(0,0,0)"}],{duration:260,easing:"cubic-bezier(.2,.7,.3,1)"})}catch(e){}})}
function tocNudge(o){if(TC.n||!TC.row||calm()||ses("tmmtcn"))return;TC.n=1;
  setTimeout(function(){if(TC.n!==1||!on||pages[cur]!==o||busy||menuOpen)return;TC.n=2;ses("tmmtcn","1");
    var S=TC.S,mx=S.scrollWidth-S.clientWidth;if(mx<4||Math.abs(S.scrollLeft)>4)return;
    var dx=Math.min(46*U,mx),go="cubic-bezier(.45,0,.2,1)",back="cubic-bezier(.4,0,.2,1)",
        kf=function(v){return[{transform:"translate3d(0,0,0)",easing:go},{transform:"translate3d("+v+",0,0)",offset:.4},
                               {transform:"translate3d("+v+",0,0)",offset:.5,easing:back},{transform:"translate3d(0,0,0)"}]};
    TC.a=[anim(TC.row,kf(dx.toFixed(1)+"px"),{duration:2200})];
    if(TC.th){var vis=S.clientWidth/S.scrollWidth;TC.a.push(anim(TC.th,kf((-(dx/mx)*(1-vis)/vis*100).toFixed(2)+"%"),{duration:2200}))}
    TC.a=TC.a.filter(Boolean);setTimeout(tocUpd,2300)},1300)}

/* ===================== 7. Instagram（日々のあれこれ。4件・2列） =====================
   取得先と保存名（igCache）はPC版の book.v12.2.js と同じ */
var FEED_URL="https://script.google.com/macros/s/AKfycbyREpbMLNwyhlj_dGmAW832bUxwt_2K3oOv6Le3jB8-npNpyJb97vnx6hyV2eOpHFNBIg/exec",
    CACHE_MIN=30,IGN=4,IGK="igCache",igOn=0;
function igFmt(t){var d=new Date(t);function p2(n){return n<10?"0"+n:""+n}return isNaN(d)?"":d.getFullYear()+"."+p2(d.getMonth()+1)+"."+p2(d.getDate())}
function igNorm(j){return((j&&j.data)||[]).map(function(p){return{img:p.media_url||p.thumbnail_url||"",date:p.timestamp||"",cap:p.caption||"",url:p.permalink||"#"}}).filter(function(p){return p.img})}
function igRender(l){var g=D.getElementById("tmmIg");if(!g)return;g.textContent="";
  l.slice().sort(function(a,b){return new Date(b.date)-new Date(a.date)}).slice(0,IGN).forEach(function(p){
    var a=D.createElement("a");a.className="tmm-igc";a.href=p.url;a.target="_blank";a.rel="noopener";
    var i=new Image();i.alt="";i.decoding="async";i.src=p.img;a.appendChild(i);
    var d=D.createElement("span");d.className="tmm-igd";d.textContent=igFmt(p.date);a.appendChild(d);
    var c=D.createElement("p");c.className="tmm-igp";c.textContent=p.cap;a.appendChild(c);g.appendChild(a)})}
function igDemo(){var a=[],i,im="data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3Crect width='4' height='3' fill='%23e7e1d5'/%3E%3C/svg%3E";
  for(i=0;i<IGN;i++)a.push({img:im,date:new Date(now()-i*864e5).toISOString(),cap:"連携が完了すると最新の投稿が表示されます（ダミー）",url:"#"});return a}
function igLast(){try{var c=JSON.parse(W.localStorage.getItem(IGK)||"null");return c?{t:c.t,list:igNorm(c.j)}:null}catch(e){return null}}
function igLoad(){if(!FEED_URL){igRender(igDemo());return}var c=igLast();
  if(c&&now()-c.t<CACHE_MIN*6e4&&c.list.length){igRender(c.list);return}
  fetch(FEED_URL).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){var l=igNorm(j);if(!l.length)throw 0;
    try{W.localStorage.setItem(IGK,JSON.stringify({t:now(),j:j}))}catch(e){}igRender(l)})
  .catch(function(){igRender(c&&c.list.length?c.list:igDemo())})}
function igInit(){if(igOn||!D.getElementById("tmmIg"))return;igOn=1;var c=igLast();if(c&&c.list.length)igRender(c.list);
  var go=function(){igLoad();setInterval(function(){if(on)igLoad()},CACHE_MIN*6e4)};
  D.readyState==="complete"?setTimeout(go,600):W.addEventListener("load",function(){setTimeout(go,600)})}

/* ===================== 8. お問い合わせフォーム =====================
   送り先などの設定は、PC版の枠の window.TK_FORM（url・token・tel・rc）をそのまま使います。
   スマホ幅のあいだは、PC版の送信処理（book.v12.2.js の3章）に届かないよう、ここで先に受けて止めます。
   GAS には src:"sp" を付けて送ります（PC版は "pc"） */
var MAX={name:50,addr:200,tel:20,mail:150,body:3000},ORDER=["name","addr","tel","mail","topic","body"];
function nf(v){return v.normalize?v.normalize("NFKC"):v}
var RULES={
  name:function(v){return!v?"お名前をご記入ください。":v.length>MAX.name?"お名前は"+MAX.name+"文字以内でご記入ください。":""},
  addr:function(v){return v.length>MAX.addr?"住所は"+MAX.addr+"文字以内でご記入ください。":""},
  tel:function(v){if(!v)return"";v=nf(v);var n=v.replace(/\D/g,"").length;
    return(n<9||n>15||/[^0-9+()\-ー―‐−\s]/.test(v))?"電話番号をご確認ください（数字とハイフンでご記入ください）。":""},
  mail:function(v){if(!v)return"メールアドレスをご記入ください。";v=nf(v).replace(/\s+/g,"");
    return(v.length>MAX.mail||!/^[^\s@<>()\[\],;:"]+@[^\s@<>()\[\],;:"]+\.[^\s@<>()\[\],;:".]{2,}$/.test(v))?"メールアドレスの形式をご確認ください。":""},
  topic:function(v){return!v?"お問い合わせ項目をお選びください。":""},
  body:function(v){return!v?"内容をご記入ください。":v.length>MAX.body?"内容は"+MAX.body+"文字以内でご記入ください。":""}};
var WHY={rate:"短い時間に続けて送信されたため、受付を一時停止しています。10分ほどおいて、もう一度お試しください。",
  required:"入力内容をご確認のうえ、もう一度送信してください。",mail:"メールアドレスの形式をご確認ください。",
  toolong:"入力内容が長すぎます。短くしてからお試しください。",busy:"ただいま混み合っています。少し時間をおいて、もう一度お試しください。",
  recaptcha:"自動送信の疑いがあるため送信を停止しました。時間をおいて、もう一度お試しください。"};
var FS={w:null,sec:null,tried:0,sending:0,sid:"",t0:0,rcS:0};
function cfg(){var c=W.TK_FORM||{};return{url:String(c.url||"").trim(),token:String(c.token||""),tel:String(c.tel||"").trim(),rc:String(c.rc||"").trim()}}
function fF(){return D.getElementById("cfF")}
function fEl(k){var f=fF();return f&&f.elements[k]||null}
function fVal(k){var x=fEl(k);return x?String(x.value||"").trim():""}
function fAgreed(){var x=fEl("agree");return!!(x&&x.checked)}
function fMsg(t){var er=D.getElementById("cfE");if(!er)return;er.textContent=t||"";er.classList.toggle("on",!!t)}
function fTidy(k){var x=fEl(k);if(!x||(k!=="mail"&&k!=="tel"))return;var v=nf(x.value);if(k==="mail")v=v.replace(/\s+/g,"");if(v!==x.value)x.value=v}
function fJudge(k,mode){var x=fEl(k);if(!x)return"";var v=fVal(k),m=RULES[k](v),w=x.closest?x.closest(".frw"):null,b;if(!w)return m;
  w.classList.toggle("good",!m&&v!=="");b=w.classList.contains("bad");
  b=mode===2?!!m:mode===1?(!!m&&(v!==""||!!FS.tried)):(b&&!!m);
  w.classList.toggle("bad",b);x.setAttribute("aria-invalid",b?"true":"false");return m}
function fFirst(){for(var i=0;i<ORDER.length;i++){var k=ORDER[i],x=fEl(k),m;if(x&&(m=RULES[k](fVal(k))))return{x:x,m:m}}return null}
function fReady(){var sb=D.getElementById("cfS"),ok=!fFirst()&&fAgreed();if(sb)sb.classList.toggle("rdy",ok);return ok}
function fRecheck(){var er=D.getElementById("cfE");if(!FS.tried||!er||!er.classList.contains("on")||FS.sending)return;
  var fe=fFirst();fMsg(fe?fe.m:fAgreed()?"":"プライバシーポリシーへの同意が必要です。")}
function fState(c,v){var pg=D.getElementById("cf");if(FS.sec)FS.sec.classList.toggle(c,v);if(pg)pg.classList.toggle(c,v)}
function fBusy(o){FS.sending=o?1:0;var sb=D.getElementById("cfS"),sl=sb&&(sb.querySelector("span")||sb);
  if(sb){sb.disabled=!!o;sb.classList.toggle("busy",!!o)}if(sl)sl.textContent=o?"送信中":"送信";fState("sending",!!o)}
function fDone(id){fBusy(0);fMsg("");fState("done",true);var s=D.getElementById("cfId");if(s)s.textContent=id?"受付番号　"+id:"";
  var f=fF(),h=f&&f.querySelector(".fok b");if(h){h.tabIndex=-1;try{h.focus({preventScroll:true})}catch(x){}}}
function fFail(t){var C=cfg();fBusy(0);fMsg((t||"送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。")+(C.tel?"（お急ぎの場合は tel. "+C.tel+"）":""))}
function rcPre(){var C=cfg();if(!C.rc||FS.rcS)return;FS.rcS=1;if(D.querySelector('script[src*="recaptcha/api.js"]'))return;
  var s=D.createElement("script");s.src="https://www.google.com/recaptcha/api.js?render="+encodeURIComponent(C.rc);s.async=true;D.head.appendChild(s)}
function rcToken(C,cb){if(!C.rc)return cb("");rcPre();var fin=0,end=function(t){if(fin)return;fin=1;cb(t||"")};setTimeout(function(){end("")},8000);
  var n=0,iv=setInterval(function(){if(W.grecaptcha&&W.grecaptcha.execute){clearInterval(iv);
    try{grecaptcha.ready(function(){grecaptcha.execute(C.rc,{action:"contact"}).then(end,function(){end("")})})}catch(x){end("")}}
    else if(++n>80){clearInterval(iv);end("")}},100)}
function fSend(C,d,again){var ac=typeof AbortController==="function"?new AbortController():null,tm=setTimeout(function(){if(ac)ac.abort()},30000);
  fetch(C.url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(d),credentials:"omit",signal:ac?ac.signal:void 0})
  .then(function(r){return r.text()})
  .then(function(t){clearTimeout(tm);var j=null;try{j=JSON.parse(t)}catch(x){}
    if(!j){warn("GASの応答を読み取れませんでした。デプロイの「アクセスできるユーザー」が「全員」になっているか確認してください。");return fFail()}
    if(j.ok)return fDone(j.id||"");
    if(j.error==="token")warn("合言葉が一致しません。PC版の枠の TK_FORM.token と GAS の CONFIG.TOKEN をそろえてください。");else warn("GASがエラーを返しました: "+j.error);
    fFail(WHY[j.error])})
  .catch(function(x){clearTimeout(tm);if(!again)return setTimeout(function(){fSend(C,d,1)},1200);
    warn("GASに届きませんでした（"+(x&&x.name||"network")+"）。URLとデプロイの設定を確認してください。");fFail()})}
function fSubmit(){var f=fF();if(!f||FS.sending)return;FS.tried=1;var C=cfg(),E=f.elements,ag=f.querySelector(".fag");
  if(E._hp&&E._hp.value){fDone("");return}
  ORDER.forEach(function(k){fTidy(k);fJudge(k,2)});
  var fe=fFirst(),ok=fAgreed();if(ag)ag.classList.toggle("bad",!ok);
  if(fe||!ok){fMsg(fe?fe.m:"プライバシーポリシーへの同意が必要です。");try{(fe?fe.x:E.agree).focus({preventScroll:true})}catch(x){}fReady();return}
  if(!/^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+\/|macros\/)s\/[\w-]+\/exec\/?$/.test(C.url)){
    warn("送信先が未設定です。PC版の枠の window.TK_FORM の url に、GASのウェブアプリURL（末尾 /exec）を入れてください。");
    fMsg("ただいま送信の準備中です。"+(C.tel?"お手数ですが tel. "+C.tel+" までご連絡ください。":"時間をおいて、もう一度お試しください。"));return}
  fMsg("");fBusy(1);if(!FS.sid)FS.sid=now().toString(36)+Math.random().toString(36).slice(2,9);
  rcToken(C,function(tk){fSend(C,{name:fVal("name"),addr:fVal("addr"),tel:fVal("tel"),mail:fVal("mail"),topic:fVal("topic"),body:fVal("body"),
    _tk:C.token,_rc:tk,_hp:"",_sid:FS.sid,_el:FS.t0?Math.round((now()-FS.t0)/1000):-1,_ua:String(navigator.userAgent||"").slice(0,200),src:"sp"})})}
function formEv(e){if(!on)return;e.stopPropagation();var t=e.target,k=t&&t.name,ty=e.type;
  if(ty==="submit"){e.preventDefault();fSubmit();return}
  if(ty==="focusin"){if(!FS.t0)FS.t0=now();rcPre();return}
  if(ty==="input"){if(RULES[k])fJudge(k,0);fReady();fRecheck();return}
  if(ty==="change"){if(k==="agree"){var ag=t.closest(".fag");if(ag)ag.classList.toggle("bad",!!FS.tried&&!t.checked)}
    else if(RULES[k]){fTidy(k);fJudge(k,1)}fReady();fRecheck();return}
  if(ty==="focusout"){if(RULES[k]){fTidy(k);fJudge(k,1);fReady();fRecheck()}
    /* iOS：キーボードが閉じたら、ずれた画面を戻す */
    setTimeout(function(){var a=D.activeElement;if(on&&!(a&&typing(a))){try{W.scrollTo(0,0)}catch(x){}if(measure(false))relayout()}},80);return}
  if(ty==="keydown"){/* Enter で次の欄へ（うっかり送信を防ぐ）。日本語変換中の Enter は対象外 */
    if(e.key!=="Enter"||e.isComposing||e.keyCode===229||!t||t.tagName!=="INPUT"||t.type==="checkbox")return;e.preventDefault();
    var f=fF(),l=[].filter.call(f.querySelectorAll("input,select,textarea"),function(x){return x.type!=="hidden"&&!x.closest(".fhp")}),i=l.indexOf(t);
    if(i>-1&&l[i+1])l[i+1].focus()}}
function formInit(){var w=$('[data-s="cf-f"]',R);if(!w||FS.w)return;FS.w=w;FS.sec=w.closest(".tmm-pg");
  ["submit","input","change","focusin","focusout","keydown"].forEach(function(t){w.addEventListener(t,formEv,true)});
  var C=cfg(),sb=D.getElementById("cfS");
  if(C.rc&&sb&&!D.querySelector(".frc")){var p=D.createElement("p");p.className="frc";
    p.innerHTML='このフォームは reCAPTCHA で保護されており、Google の<a href="https://policies.google.com/privacy" target="_blank" rel="noopener">プライバシーポリシー</a>と<a href="https://policies.google.com/terms" target="_blank" rel="noopener">利用規約</a>が適用されます。';
    sb.insertAdjacentElement("afterend",p)}
  ORDER.forEach(function(k){fJudge(k,0)});fReady()}
function formSync(){var pg=D.getElementById("cf");if(FS.sec&&pg){FS.sec.classList.toggle("done",pg.classList.contains("done"));FS.sec.classList.toggle("sending",pg.classList.contains("sending"))}}

/* ===================== 9. プライバシーポリシーの小窓 =====================
   小窓（#pvD）は3つ目の枠。スマホで開いている間だけ #tmm の中へ移し、閉じたら元の場所へ戻す */
var DLG={open:0,M:null,ph:null,ret:null,tm:0,mm:0};
function dlgBind(M){if(M.__tmm)return;M.__tmm=1;var P=$(".pvp",M),X=$(".pvx",M),dn=0;
  if(X)X.addEventListener("click",function(){if(DLG.open)dlgClose()});
  M.addEventListener("pointerdown",function(e){dn=!P.contains(e.target)});
  M.addEventListener("click",function(e){if(DLG.open&&dn&&!P.contains(e.target))dlgClose();dn=0});
  M.addEventListener("keydown",function(e){if(DLG.open&&(e.key==="Escape"||e.key==="Esc")){e.preventDefault();dlgClose()}});
  M.addEventListener("cancel",function(e){if(DLG.open){e.preventDefault();dlgClose()}})}
function dlgOpen(a){if(DLG.open||!on)return;var M=D.getElementById("pvD"),P=M&&$(".pvp",M);
  if(!M||!P){warn("プライバシーポリシーの小窓（#pvD）が見つかりません。3つ目の枠を確認してください。");return}
  clearTimeout(DLG.tm);DLG.open=1;DLG.M=M;DLG.ret=a||null;G=null;
  if(M.parentNode!==R){if(DLG.ph&&DLG.ph.parentNode)DLG.ph.parentNode.removeChild(DLG.ph);DLG.ph=D.createComment("tmm-pv");M.parentNode.insertBefore(DLG.ph,M);R.appendChild(M)}
  dlgBind(M);
  if(!M.open){DLG.mm=0;if(typeof M.showModal==="function"){try{M.showModal();DLG.mm=1}catch(e){}}if(!DLG.mm)M.setAttribute("open","")}
  void P.offsetWidth;var S=$(".pvs",M);if(S)S.scrollTop=0;M.classList.add("on");
  try{(S||P).focus({preventScroll:true})}catch(e){}}
function dlgClose(now){var M=DLG.M;if(!M)return;if(DLG.open){DLG.open=0;M.classList.remove("on")}clearTimeout(DLG.tm);
  var fin=function(){if(DLG.open)return;if(M.open){if(DLG.mm){try{M.close()}catch(e){M.removeAttribute("open")}}else M.removeAttribute("open")}
    if(DLG.ph&&DLG.ph.parentNode){if(M.parentNode===R)DLG.ph.parentNode.replaceChild(M,DLG.ph);else DLG.ph.parentNode.removeChild(DLG.ph)}DLG.ph=null;
    var r=DLG.ret;DLG.ret=null;if(r&&on){try{r.focus({preventScroll:true})}catch(e){}}};
  if(now)fin();else DLG.tm=setTimeout(fin,calm()?220:460)}

/* ===================== 10. 起動と切り替え ===================== */
var bound=0;
function bindOnce(){if(bound)return;bound=1;
  R.addEventListener("click",onClick,true);
  D.addEventListener("touchstart",onTS,{passive:true});D.addEventListener("touchmove",onTM,{passive:true});
  D.addEventListener("touchend",onTE,{passive:true});D.addEventListener("touchcancel",onTC,{passive:true});
  W.addEventListener("wheel",onWh,{passive:false});
  W.addEventListener("keydown",onKey,true);
  R.addEventListener("focusin",onFocus);
  var rz=0;function onRs(){if(!on||rz)return;rz=requestAnimationFrame(function(){rz=0;if(on&&measure(false))relayout()})}
  W.addEventListener("resize",onRs);W.addEventListener("orientationchange",onRs);
  /* 書体が届いたら、帯の長さを測り直す（ResizeObserver が無い古い端末でも効くように、こちらでも） */
  if(D.fonts&&D.fonts.addEventListener)D.fonts.addEventListener("loadingdone",function(){pages.forEach(function(o){o.dirty=1});if(on)relayout()});
  watch();
  /* 戻るボタンで（bfcache から）戻ったとき */
  W.addEventListener("pageshow",function(e){if(!e.persisted||!R)return;R.classList.remove("tmm-lv");if(!on||KIND!=="top")return;
    var g=ses("tmmgo");if(!g)return;ses("tmmgo",null);var a=g.split("|");if(now()-(+a[1]||0)>30000||!a[0])return;
    var r=resolve(a[0]);if(r.o.i===cur){if(r.o.strip)animP(r.o,posFor(r.o,r.at),600)}else jump(r.o.i,r.at)});
}
function cssOk(){try{return getComputedStyle(R).getPropertyValue("--tmmok").trim()==="1"}catch(e){return true}}
function shieldOff(){var s=D.getElementById("tmmSh");if(!s||s.__off)return;s.__off=1;s.classList.add("off");s.style.opacity="0";
  setTimeout(function(){s.style.display="none"},800)}
function whenReady(cb){var done=0,f=function(){if(!done){done=1;cb()}};setTimeout(f,1400);
  try{D.fonts.ready.then(function(){setTimeout(f,60)})}catch(e){f()}}
function begin(){
  var t=KIND==="kz"?"kz":target(),r=t?resolve(t):{o:pages[0],at:"start"};
  show(r.o,r.at);resetInk(r.o);
  whenReady(function(){if(!on)return;relayout();if(r.o.strip){r.o.p=posFor(r.o,r.at);paint(r.o)}shieldOff();setTimeout(function(){arrive(r.o)},140)})}
function enterSP(){
  if(on||!NARROW())return;R=R||D.getElementById("tmm");if(!R)return;
  on=1;D.documentElement.classList.add("tmmL");R.classList.add("tmm-on");
  measure(true);mount();
  /* 紙の地：PC版の枠が使っている bg-paper.webp（--bg）をそのまま使う。PC版の枠が無ければ同じ場所の img/ */
  if(!R.style.getPropertyValue("--bg")){var bg="";try{bg=PC?getComputedStyle(PC).getPropertyValue("--bg").trim():""}catch(e){}
    R.style.setProperty("--bg",/^url\(/.test(bg)?bg:'url("'+IMG+'bg-paper.webp")')}
  if(!built){build();bindOnce();built=1;if(KIND==="top"){formInit();igInit();tocInit()}}
  if(KIND==="top"){menuText();formSync()}
  /* PC幅から戻ったときは、帯の位置を「どこまで読んだか」の割合で引き継ぐ */
  var rr=pages.map(function(o){return o.strip&&o.max?o.p/o.max:0});
  pages.forEach(metrics);SC=1;pages.forEach(function(o,i){if(o.strip)o.p=clamp(rr[i]*o.max,0,o.max)});
  if(first){first=0;begin()}
  else{var o=pages[cur]||pages[0];show(o,o.strip?(o.max?o.p/o.max:0):"start");showVis(o);if(o.strip)reveal(o,0);shieldOff();tocUpd()}}
function leaveSP(){if(!on)return;settle();stopMV();if(TQ){cancelAnimationFrame(TQ);TQ=0}tocTouch();menu(0);dlgClose(1);clearTimeout(LDT);G=null;on=0;
  unmount();R.classList.remove("tmm-on");D.documentElement.classList.remove("tmmL")}
function boot(){if(!NARROW())return;R=D.getElementById("tmm");if(!R){if(++rc<200)setTimeout(boot,50);return}
  KIND=R.getAttribute("data-pg")==="kz"?"kz":"top";
  var t0=now();(function wait(){if(!NARROW())return;if(cssOk()||now()-t0>4000)enterSP();else setTimeout(wait,30)})()}
D.readyState==="loading"?D.addEventListener("DOMContentLoaded",boot):boot();
/* 画面幅が 768px をまたいだとき：スマホ幅へ → 起動／PC幅へ → 文章を元へ戻して休む */
try{var mq=function(e){if(e.matches){R?enterSP():boot()}else leaveSP()};MQ.addEventListener?MQ.addEventListener("change",mq):MQ.addListener(mq)}catch(e){}
})();
