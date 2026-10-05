(()=>{var Z="Hi, do you have water?",X=N();function N(){return"Did you drink water?"}var H=[[["aa",.13],["I",.12]],[["DD",.05],["U",.14]],[["I",.05],["U",.14]],[["aa",.12],["FF",.1]],[["U",.06],["aa",.11],["DD",.05],["RR",.14]]],v={sil:[1,0,0],aa:[1,.95,.2],E:[1.1,.5,0],I:[1.15,.3,0],O:[.6,.85,1],U:[.45,.55,1],FF:[1,.18,0],PP:[.8,0,.3],DD:[.9,.35,.2],RR:[.8,.4,.5],TH:[.95,.3,.1],kk:[.9,.4,.2],CH:[.8,.35,.6],SS:[1.05,.2,0],nn:[.9,.25,.1]},V=.34,g=Object.assign({},window.PIXEL_CHARACTER_CONFIG||{},Object.fromEntries(new URLSearchParams(location.search))),a={skin:g.skinColor||"#F3C8A2",hair:g.hairColor||"#4A2C1A",shirt:g.shirtColor||"#F28C28",pants:g.pantsColor||"#3E6192"},B=g.framing||"full",t={mode:"idle",speaking:!1,speechMode:"internal",visemeQueue:[],blinkAt:2,blinkPhase:-1,saccadeAt:0,saccade:[0,0],ask:0,cheer:0,mouth:[1,0,0]},n="#3a2414",M=E(a.shirt,-.18),re=E(a.shirt,.12),O=E(a.pants,.25),A=document.getElementById("character")||document.body;A.innerHTML=`
<svg id="pf-svg" viewBox="0 ${B==="half"?-60:-95} 300 ${B==="half"?340:495}" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" aria-label="PixelFriend">
  <defs>
    <clipPath id="eyeL"><ellipse cx="128" cy="110" rx="11" ry="12"/></clipPath>
    <clipPath id="eyeR"><ellipse cx="172" cy="110" rx="11" ry="12"/></clipPath>
    <linearGradient id="shirtShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".10"/></linearGradient>
  </defs>
  <g id="body">
    <g id="legs" stroke="${n}" stroke-width="2.5">
      <rect x="118" y="262" width="29" height="112" rx="12" fill="${a.pants}"/>
      <rect x="153" y="262" width="29" height="112" rx="12" fill="${a.pants}"/>
      <rect x="117" y="356" width="31" height="16" rx="6" fill="${O}"/>
      <rect x="152" y="356" width="31" height="16" rx="6" fill="${O}"/>
      <path d="M110 384 C110 372 122 368 134 370 C146 370 156 376 156 384 C156 392 146 395 132 395 C120 395 110 392 110 384 Z" fill="#fff"/>
      <path d="M110 386 C120 393 146 393 156 386 L156 390 C150 396 116 396 110 390 Z" fill="${a.shirt}" stroke="none"/>
      <path d="M144 384 C144 372 156 368 168 370 C180 370 190 376 190 384 C190 392 180 395 166 395 C154 395 144 392 144 384 Z" fill="#fff"/>
      <path d="M144 386 C154 393 180 393 190 386 L190 390 C184 396 150 396 144 390 Z" fill="${a.shirt}" stroke="none"/>
      <path d="M122 376 L140 376 M156 376 L174 376" stroke="${n}" stroke-width="2" opacity=".5"/>
    </g>
    <path id="hoodBack" d="M102 176 C102 150 124 140 150 142 C176 140 198 150 198 176 Z" fill="${M}" stroke="${n}" stroke-width="2.5"/>
    <g id="armL" transform="translate(196 186)">
      <g id="armL-upper">
        <line x1="0" y1="0" x2="0" y2="44" stroke="${n}" stroke-width="27" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="0" y2="44" stroke="${a.shirt}" stroke-width="22" stroke-linecap="round"/>
        <g id="armL-fore" transform="translate(0 44)">
          <line x1="0" y1="0" x2="0" y2="40" stroke="${n}" stroke-width="25" stroke-linecap="round"/>
          <line x1="0" y1="0" x2="0" y2="40" stroke="${a.shirt}" stroke-width="20" stroke-linecap="round"/>
          <rect x="-11" y="30" width="22" height="10" rx="4" fill="${M}" stroke="${n}" stroke-width="2"/>
          <g id="handL" transform="translate(0 46)">
            <circle r="12" fill="${a.skin}" stroke="${n}" stroke-width="2.5"/>
            <g class="fingers" stroke="${n}" stroke-width="9.5" stroke-linecap="round"><line x1="-7" y1="6" x2="-9" y2="19"/><line x1="-1" y1="8" x2="-1" y2="22"/><line x1="6" y1="7" x2="8" y2="19"/><line x1="10" y1="2" x2="17" y2="9"/></g>
            <g class="fingers" stroke="${a.skin}" stroke-width="6.5" stroke-linecap="round"><line x1="-7" y1="6" x2="-9" y2="19"/><line x1="-1" y1="8" x2="-1" y2="22"/><line x1="6" y1="7" x2="8" y2="19"/><line x1="10" y1="2" x2="17" y2="9"/></g>
          </g>
        </g>
      </g>
    </g>
    <g id="armR" transform="translate(104 186)">
      <g id="armR-upper">
        <line x1="0" y1="0" x2="0" y2="44" stroke="${n}" stroke-width="27" stroke-linecap="round"/>
        <line x1="0" y1="0" x2="0" y2="44" stroke="${a.shirt}" stroke-width="22" stroke-linecap="round"/>
        <g id="armR-fore" transform="translate(0 44)">
          <line x1="0" y1="0" x2="0" y2="40" stroke="${n}" stroke-width="25" stroke-linecap="round"/>
          <line x1="0" y1="0" x2="0" y2="40" stroke="${a.shirt}" stroke-width="20" stroke-linecap="round"/>
          <rect x="-11" y="30" width="22" height="10" rx="4" fill="${M}" stroke="${n}" stroke-width="2"/>
          <g id="handR" transform="translate(0 46)">
            <circle r="12" fill="${a.skin}" stroke="${n}" stroke-width="2.5"/>
            <g class="fingers" stroke="${n}" stroke-width="9.5" stroke-linecap="round"><line x1="7" y1="6" x2="9" y2="19"/><line x1="1" y1="8" x2="1" y2="22"/><line x1="-6" y1="7" x2="-8" y2="19"/><line x1="-10" y1="2" x2="-17" y2="9"/></g>
            <g class="fingers" stroke="${a.skin}" stroke-width="6.5" stroke-linecap="round"><line x1="7" y1="6" x2="9" y2="19"/><line x1="1" y1="8" x2="1" y2="22"/><line x1="-6" y1="7" x2="-8" y2="19"/><line x1="-10" y1="2" x2="-17" y2="9"/></g>
          </g>
        </g>
      </g>
    </g>
    <g id="torso" stroke="${n}" stroke-width="2.5">
      <rect x="100" y="166" width="100" height="106" rx="28" fill="${a.shirt}"/>
      <rect x="100" y="166" width="100" height="106" rx="28" fill="url(#shirtShade)" stroke="none"/>
      <rect x="116" y="238" width="68" height="30" rx="12" fill="${M}"/>
      <path d="M118 172 C132 160 168 160 182 172 L176 190 C164 180 136 180 124 190 Z" fill="${M}"/>
      <path d="M142 180 L138 212 M158 180 L162 212" stroke="#fff" stroke-width="2.5" opacity=".9"/>
      <rect x="112" y="166" width="14" height="76" rx="7" fill="#8b5a2b"/>
      <rect x="174" y="166" width="14" height="76" rx="7" fill="#8b5a2b"/>
      <path d="M150 198 C144 206 141 210 141 215 A9 9 0 0 0 159 215 C159 210 156 206 150 198 Z" fill="#fff6e6" stroke="none" opacity=".95"/>
    </g>
    <rect id="neck" x="138" y="146" width="24" height="30" rx="8" fill="${a.skin}" stroke="${n}" stroke-width="2.5"/>
    <g id="head">
      <ellipse cx="94" cy="112" rx="9" ry="12" fill="${a.skin}" stroke="${n}" stroke-width="2.5"/>
      <ellipse cx="206" cy="112" rx="9" ry="12" fill="${a.skin}" stroke="${n}" stroke-width="2.5"/>
      <path d="M94 104 C94 62 118 44 150 44 C182 44 206 62 206 104 C206 140 184 164 150 164 C116 164 94 140 94 104 Z" fill="${a.skin}" stroke="${n}" stroke-width="2.5"/>
      <path id="hair" d="M92 104 C86 70 104 42 136 38 C140 26 154 24 160 34 C168 22 184 30 182 42 C204 46 214 72 208 104 C204 90 196 84 186 82 C178 72 170 80 160 78 C150 72 140 80 130 80 C118 78 106 86 102 96 C98 100 95 102 92 104 Z" fill="${a.hair}" stroke="${n}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M118 54 C126 44 140 42 150 44" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".18"/>
      <g id="cheeks" opacity="0.35">
        <ellipse cx="114" cy="130" rx="11" ry="6" fill="#ff7b7b" opacity=".7"/>
        <ellipse cx="186" cy="130" rx="11" ry="6" fill="#ff7b7b" opacity=".7"/>
      </g>
      <g id="brows" stroke="${a.hair}" stroke-width="6" stroke-linecap="round" fill="none">
        <path id="browL" d="M114 86 Q128 78 142 86"/>
        <path id="browR" d="M158 86 Q172 78 186 86"/>
      </g>
      <g id="eyes">
        <ellipse cx="128" cy="110" rx="11" ry="12" fill="#fff"/>
        <ellipse cx="172" cy="110" rx="11" ry="12" fill="#fff"/>
        <g id="pupils">
          <circle cx="129" cy="111" r="7.5" fill="#6b3a1e"/><circle cx="129" cy="111" r="4" fill="#2a1508"/><circle cx="131.5" cy="108" r="2.2" fill="#fff"/>
          <circle cx="173" cy="111" r="7.5" fill="#6b3a1e"/><circle cx="173" cy="111" r="4" fill="#2a1508"/><circle cx="175.5" cy="108" r="2.2" fill="#fff"/>
        </g>
        <rect id="lidL" x="115" y="96" width="27" height="0" fill="${a.skin}" clip-path="url(#eyeL)"/>
        <rect id="lidR" x="159" y="96" width="27" height="0" fill="${a.skin}" clip-path="url(#eyeR)"/>
      </g>
      <g id="glasses" fill="none" stroke="#2a1a10" stroke-width="3.5">
        <circle cx="128" cy="110" r="17"/><circle cx="172" cy="110" r="17"/>
        <path d="M145 108 Q150 104 155 108"/>
        <path d="M111 106 L96 104 M189 106 L204 104"/>
      </g>
      <path d="M147 124 Q150 130 154 124" fill="none" stroke="${n}" stroke-width="2.5" stroke-linecap="round"/>
      <g id="mouthGroup">
        <path id="mouthOpen" d="" fill="#7a2a2a" stroke="${n}" stroke-width="2"/>
        <path id="teeth" d="" fill="#fff"/>
        <path id="tongue" d="" fill="#e4696b"/>
        <path id="mouthLine" d="" fill="none" stroke="${n}" stroke-width="3.5" stroke-linecap="round"/>
      </g>
    </g>
  </g>
</svg>`;function E(e,i){let r=/^#?([0-9a-f]{6})$/i.exec(e||"");if(!r)return e;let s=parseInt(r[1],16),c=o=>Math.max(0,Math.min(255,Math.round(i<0?o*(1+i):o+(255-o)*i)));return"#"+[c(s>>16&255),c(s>>8&255),c(s&255)].map(o=>o.toString(16).padStart(2,"0")).join("")}var Q=document.createElement("style");Q.textContent=`
  #character { position: relative; }
  .pf-bubble { position: absolute; top: 2%; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px;
    background: #fff; color: #2a1a10; border: 3px solid #3a2414; border-radius: 16px; padding: 10px 14px; font: 600 15px/1.2 -apple-system, "Segoe UI", system-ui, sans-serif;
    white-space: normal; text-align: center; max-width: calc(100% - 16px); box-sizing: border-box; box-shadow: 0 6px 18px rgba(0,0,0,.25); z-index: 5; animation: pf-bubble-pop 280ms cubic-bezier(.2,1.4,.4,1) both; }
  .pf-small .pf-bubble { font-size: 12px; padding: 7px 10px; border-width: 2px; border-radius: 12px; gap: 6px; }
  .pf-small .pf-bubble-yes { font-size: 12px; padding: 5px 12px; border-width: 2px; }
  .pf-small .pf-bubble::after { width: 12px; height: 12px; bottom: -8px; border-width: 2px; }
  .pf-bubble::after { content: ''; position: absolute; left: 50%; bottom: -12px; width: 18px; height: 18px; background: #fff; border-right: 3px solid #3a2414; border-bottom: 3px solid #3a2414; transform: translateX(-50%) rotate(45deg); }
  .pf-bubble-yes { font: 700 15px -apple-system, "Segoe UI", system-ui, sans-serif; color: #fff; background: #F28C28; border: 3px solid #3a2414; border-radius: 12px; padding: 7px 18px; cursor: pointer; }
  .pf-bubble-yes:hover { background: #ff9d3a; } .pf-bubble-yes:active { transform: scale(.96); }
  .pf-bubble.hidden { display: none; }
  @keyframes pf-bubble-pop { from { transform: translateX(-50%) scale(.5); opacity: 0; } to { transform: translateX(-50%) scale(1); opacity: 1; } }`;document.head.appendChild(Q);var w=document.createElement("div");w.className="pf-bubble hidden";w.innerHTML=`<span class="pf-bubble-text">${X}</span><button class="pf-bubble-yes" type="button">YES \u{1F4A7}</button>`;A.appendChild(w);w.querySelector(".pf-bubble-yes").addEventListener("click",e=>{e.stopPropagation(),x("celebrate"),I({type:"yes"})});function _(){A.classList.toggle("pf-small",(A.clientWidth||window.innerWidth)<210)}_();window.addEventListener("resize",_);var d=e=>document.getElementById(e),l={body:d("body"),head:d("head"),armR:d("armR"),armRFore:d("armR-fore"),handR:d("handR"),armL:d("armL"),armLFore:d("armL-fore"),handL:d("handL"),pupils:d("pupils"),lidL:d("lidL"),lidR:d("lidR"),brows:d("brows"),cheeks:d("cheeks"),mouthOpen:d("mouthOpen"),teeth:d("teeth"),tongue:d("tongue"),mouthLine:d("mouthLine")},$=e=>1-Math.pow(1-e,3),m=(e,i,r)=>e+(i-e)*r;function W(e,i){let r=$(t.ask),s=$(t.cheer),c=1+Math.sin(e*1.3)*.012,o=s*Math.abs(Math.sin(e*7))*10;l.body.setAttribute("transform",`translate(150 395) scale(${1+s*.02} ${c}) translate(-150 ${-395-o})`);let p=Math.sin(e*.6)*2+r*-7+Math.sin(e*9)*5*s,u=Math.sin(e*1.3)*1.5+r*-3;l.head.setAttribute("transform",`translate(0 ${u}) rotate(${p} 150 156)`)}function j(e,i){t.ask+=((t.mode==="ask"?1:0)-t.ask)*(1-Math.exp(-i*5)),t.cheer+=((t.mode==="celebrate"?1:0)-t.cheer)*(1-Math.exp(-i*7));let r=$(t.ask),s=$(t.cheer),c=Math.sin(e*1.3)*2,o=Math.sin(e*2.6)*4*r,p=Math.max(r,s),u=s>r?165+Math.sin(e*7)*8:140+o,f=m(-8+c,u,p),b=m(4,s>r?10:40,p);l.armR.setAttribute("transform",`translate(104 186) rotate(${f})`),l.armRFore.setAttribute("transform",`translate(0 44) rotate(${b})`),l.handR.setAttribute("transform",`translate(0 46) rotate(${m(0,-8,r)})`);let k=m(8-c,-165-Math.sin(e*7)*8,s);l.armL.setAttribute("transform",`translate(196 186) rotate(${k})`),l.armLFore.setAttribute("transform",`translate(0 44) rotate(${m(-4,-10,s)})`)}function K(e){t.blinkAt=e+2+Math.random()*4}function D(e){t.saccadeAt=e+.8+Math.random()*2.4,t.saccade=[(Math.random()-.5)*6,(Math.random()-.5)*4]}function Y(e,i){let r=$(t.ask),s=$(t.cheer);e>t.saccadeAt&&D(e);let c=r>.5?[0,0]:t.saccade;l.pupils.setAttribute("transform",`translate(${c[0]} ${c[1]})`),t.blinkPhase<0&&e>t.blinkAt&&(t.blinkPhase=0);let o=0;t.blinkPhase>=0&&(t.blinkPhase+=i/.16,o=t.blinkPhase<.5?t.blinkPhase*2:Math.max(0,2-t.blinkPhase*2),t.blinkPhase>=1&&(t.blinkPhase=-1,o=0,K(e)));let p=s*.45,u=Math.max(o,p)*30;for(l.lidL.setAttribute("height",u),l.lidR.setAttribute("height",u),l.brows.setAttribute("transform",`translate(0 ${-7*r-3*s})`),l.cheeks.setAttribute("opacity",String(.35+.65*s));t.visemeQueue.length&&t.visemeQueue[0].until<e;)t.visemeQueue.shift();let f=t.visemeQueue[0],b=f&&v[f.name]||v.sil,k=1-Math.exp(-i*24);t.mouth=t.mouth.map((h,y)=>m(h,b[y],k)),J(t.mouth[0],t.mouth[1],t.mouth[2],.5+.15*r+.6*s)}function J(e,i,r,s){let p=16*e*(1-r*.45)+4,u=14*i+.5,f=6*s*(1-i*.6);if(i<.08){l.mouthOpen.setAttribute("d",""),l.teeth.setAttribute("d",""),l.tongue.setAttribute("d",""),l.mouthLine.setAttribute("d",`M${150-p} ${142-f*.3} Q150 ${142+f*1.6} ${150+p} ${142-f*.3}`);return}l.mouthLine.setAttribute("d","");let b=142-u*.35-f*.2,k=142+u*.75+f*.3,h=p,y=(k-b)/2,S=(b+k)/2;l.mouthOpen.setAttribute("d",`M${150-h} ${S} A${h} ${y} 0 1 0 ${150+h} ${S} A${h} ${y} 0 1 0 ${150-h} ${S} Z`);let z=Math.min(5,y*.5);l.teeth.setAttribute("d",`M${150-h*.75} ${b+1} H${150+h*.75} V${b+1+z} H${150-h*.75} Z`),l.tongue.setAttribute("d",i>.5?`M${150-h*.5} ${k-1} A${h*.5} ${y*.5} 0 0 1 ${150+h*.5} ${k-1} Z`:"")}function F(e,i){let r=H[e];if(!r)return;let s=i;t.visemeQueue=r.map(([c,o])=>({name:c,until:s+=o}))}var P=null,C=()=>performance.now()/1e3;function ee(){if(!("speechSynthesis"in window)){L();return}try{let e=new SpeechSynthesisUtterance(Z);e.rate=.95,e.pitch=1.08;let i=speechSynthesis.getVoices(),r=i.find(o=>/Samantha|Karen|Moira|Zoe|Google US English/i.test(o.name))||i.find(o=>/^en/i.test(o.lang));r&&(e.voice=r);let s=0,c=!1;e.onboundary=o=>{o.name&&o.name!=="word"||(c=!0,F(s++,C()))},e.onstart=()=>{t.speaking=!0,setTimeout(()=>{c||L()},250)},e.onend=()=>R(),e.onerror=()=>L(),speechSynthesis.cancel(),speechSynthesis.speak(e)}catch{L()}}function L(){t.speaking=!0,clearTimeout(P);let e=0,i=()=>{e<H.length?(F(e++,C()),P=setTimeout(i,V*1e3)):P=setTimeout(R,300)};i()}function R(){t.speaking=!1,t.visemeQueue=[],setTimeout(()=>{t.mode==="ask"&&x("wait")},900)}var T=null;function te(){clearTimeout(T),T=setTimeout(()=>{t.mode==="wait"&&(t.mode="ask",setTimeout(()=>{t.mode==="ask"&&x("wait")},1600))},4e4)}function x(e){t.mode=e,e==="celebrate"&&setTimeout(()=>{t.mode==="celebrate"&&x("idle")},2600),e==="wait"?te():clearTimeout(T),e==="ask"||e==="wait"?w.classList.remove("hidden"):w.classList.add("hidden"),I({type:"mode",mode:e})}function q(){t.mode==="ask"||t.mode==="wait"||(x("ask"),t.speechMode==="internal"&&setTimeout(ee,350))}var ie=window.__vscodeApi||(window.acquireVsCodeApi?window.acquireVsCodeApi():null);function I(e){try{ie?.postMessage(e)}catch{}try{window.webkit?.messageHandlers?.character?.postMessage(e)}catch{}}var U=C();function G(){requestAnimationFrame(G);let e=C(),i=Math.min(.05,e-U);U=e,j(e,i),W(e,i),Y(e,i)}D(0);G();window.PixelCharacter={ready:Promise.resolve(),phrase:Z,idle:()=>x("idle"),ask:q,celebrate:()=>x("celebrate"),setSpeech:e=>{t.speechMode=e==="external"?"external":"internal"},isAsking:()=>t.mode==="ask"||t.mode==="wait",wordBoundary:e=>{t.speaking=!0,F(e,C())},speechEnd:()=>R(),_state:t};window.addEventListener("message",e=>{let i=e.data||{};switch(i.type){case"ask":q();break;case"celebrate":x("celebrate");break;case"idle":x("idle");break;case"speech":window.PixelCharacter.setSpeech(i.mode);break;case"word":window.PixelCharacter.wordBoundary(i.index);break;case"speechEnd":R();break}});(g.bg||"clean")==="transparent"&&document.body.classList.add("transparent");I({type:"ready"});})();
