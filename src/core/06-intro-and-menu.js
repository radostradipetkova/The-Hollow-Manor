/* ================= INTRO ================= */
const V=(file,rate,pitch,shake,gap,say)=>({file,rate,pitch,shake,gap,say});
const CARDS=[
  ['VOICEMAIL // 3 DAYS AGO','"Hey, it\u2019s Mara. I\u2019m at the old Vane estate. The research I told you about... it\u2019s bigger than I thought. Come if you can. Bring a lantern, the power out here is..."\n\n[message ends]',
    V('audio/mara1.mp3',.95,1.05,0,320,[["Hey, it's Mara.",1],["I'm at the old Vane estate.",1],["The research I told you about... it's bigger than I thought.",1],["Come if you can. Bring a lantern. The power out here is...",.92]]),55],
  ['VOICEMAIL // YESTERDAY','"Don\u2019t trust the lock. Whatever you do, don\u2019t trust the lock. I keep seeing you at the gate. That can\u2019t be right. Can it?"\n\n[message ends]',
    V('audio/mara2.mp3',1.12,1.25,.03,150,[["Don't trust the lock.",1],["Whatever you do, don't trust the lock.",1.1],["I keep seeing you at the gate.",1],["That can't be right.",1.1],["Can it?",.85]]),48],
  ['VOICEMAIL // 20 MINUTES AGO','"Please don\u2019t come in. Please. I can hear you in the hall. That\u2019s not possible. You\u2019re not here yet. You\u2019re not here yet!"\n\n[message ends]',
    V('audio/mara3.mp3',1.3,1.5,.05,70,[["Please don't come in.",1.1],["Please.",.85],["I can hear you in the hall.",1.2],["That's not possible.",1.3],["You're not here yet.",1.2],["You're not here yet!",1.45]]),40],
  ['GATE CAMERA // 19:42','Dusk. The Vane estate waits at the end of a drive you feel you have walked before. The iron gate is already open.'],
  ['GATE CAMERA // 19:58 // CYCLE 04','The front door closes behind you. The bolt slides home on its own.'],
  ['RECORDING CONTINUES','\u00a0']
];
/* voice-over: recorded files if present, otherwise the browser voice, more frightened each message */
let voiceOn=true,VA=null,vq=0;
function stopVoice(){vq++;try{speechSynthesis.cancel()}catch(e){}if(VA){VA.pause();VA=null}}
function pickVoice(){
  let v=[];try{v=speechSynthesis.getVoices()}catch(e){}
  return v.find(x=>/^en/i.test(x.lang)&&/(female|zira|samantha|susan|hazel|aria|jenny|karen|moira|victoria|google uk english female)/i.test(x.name))||v.find(x=>/^en/i.test(x.lang))||null;
}
function speak(cfg){
  stopVoice();const id=vq;
  if(muted||!voiceOn||!cfg)return;
  noise(.35,.12,2500);
  let used=false;
  const tts=()=>{
    if(used||!('speechSynthesis' in window))return;used=true;
    let i=0;
    const next=()=>{
      if(id!==vq||i>=cfg.say.length)return;
      const u=new SpeechSynthesisUtterance(cfg.say[i][0]),vo=pickVoice();
      if(vo)u.voice=vo;u.lang='en-US';u.rate=cfg.rate*cfg.say[i][1];u.pitch=Math.min(2,cfg.pitch+i*cfg.shake);u.volume=Math.min(1,vol*1.1);
      u.onend=()=>{i++;setTimeout(next,cfg.gap)};speechSynthesis.speak(u);
    };
    next();
  };
  try{const a=new Audio(cfg.file);a.volume=vol;VA=a;a.onerror=tts;a.play().catch(tts)}catch(e){tts()}
}
let I={i:-1,t:null,full:'',pos:0};
let DECK=null,DONE=null;
function runIntro(deck,done){DECK=deck||CARDS;DONE=done||null;
  mode='intro';I={i:-1,t:null,full:'',pos:0};
  let el=$('intro');
  if(!el){
    el=document.createElement('div');el.id='intro';
    el.style.cssText='position:absolute;inset:0;z-index:8;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6%;text-align:center;cursor:pointer';
    el.innerHTML='<div id="iHead" style="font:700 clamp(11px,2vw,14px) \'Courier New\',monospace;letter-spacing:.14em;color:#6fbf8a;margin-bottom:1.4em"></div><div id="iBody" style="font:italic clamp(16px,3vw,26px)/1.6 Georgia,serif;color:#eee3cf;max-width:30em;min-height:6em;white-space:pre-line"></div><div style="position:absolute;bottom:4%;font:13px system-ui,sans-serif;color:#8a8070">Click or press Enter to continue. Esc to skip.</div>';
    $('view').appendChild(el);el.onclick=nextCard;
  }
  el.style.display='flex';nextCard();
}
function nextCard(){
  if(I.t){clearInterval(I.t);I.t=null;$('iBody').textContent=I.full;return}
  I.i++;
  if(I.i>=DECK.length){endIntro();return}
  I.full=DECK[I.i][1];I.pos=0;$('iHead').textContent=DECK[I.i][0];$('iBody').textContent='';
  I.t=setInterval(()=>{I.pos++;$('iBody').textContent=I.full.slice(0,I.pos);if(I.pos>=I.full.length){clearInterval(I.t);I.t=null}},DECK[I.i][3]||30);
  speak(DECK[I.i][2]);
}
function endIntro(){stopVoice();
  if(I.t){clearInterval(I.t);I.t=null}
  const el=$('intro');if(el)el.style.display='none';
  if(DONE){const f=DONE;DONE=null;f()}else beginPlay();
}

/* ================= MENU, SAVE, OPTIONS ================= */
function toast(t){
  let el=$('toast');
  if(!el){el=document.createElement('div');el.id='toast';el.style.cssText='position:absolute;right:12px;top:12px;padding:6px 14px;background:rgba(13,10,16,.88);border:1px solid var(--line);border-radius:999px;font:600 12px var(--ui);color:var(--gold);letter-spacing:.06em;text-transform:uppercase;opacity:0;transition:opacity .4s;pointer-events:none;z-index:6';$('view').appendChild(el)}
  el.textContent=t;el.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>{el.style.opacity=0},2600);
}
function saveGame(n,x){try{localStorage.setItem('hm',JSON.stringify(Object.assign({c:n,n:notes},x||{})));toast('Checkpoint saved')}catch(e){}}
function cpLabel(c){return c===8?'The Maze':c===7?'Cycle 02':'Stage '+c+': '+STN[c-1]}
function refreshContinue(){let ok=false,lab='';try{const d=JSON.parse(localStorage.getItem('hm'));ok=!!(d&&d.c>1);if(ok)lab=cpLabel(d.c)}catch(e){}$('bContinue').hidden=!ok;if(ok)$('bContinue').textContent='Continue: '+lab;refreshTitleExtras()}
function continueGame(){
  let d=null;try{d=JSON.parse(localStorage.getItem('hm'))}catch(e){}
  if(!d||!(d.c>1)){start();return}
  ['title','over','win'].forEach(i=>$(i).classList.remove('on'));
  reset();notes=Array.isArray(d.n)?d.n:[];mode='play';initAudio();
  if(d.c===7){if(d.w){notes=Array.isArray(d.jb)?d.jb.slice():[];startCycle2(true)}else startCycle2();return}
  if(d.c===8){startMaze();return}
  beginStage(d.c);updateHUD();
}
function openMenu(){
  if(mode!=='play')return;
  $('vol').value=Math.round(vol*100);$('bSound').textContent='Sound: '+(muted?'off':'on');$('bVoice').textContent='Voice-over: '+(voiceOn?'on':'off');
  openModal('menu',c=>{if(c==='Escape'||c==='KeyP')closeModal()});
}
function restartStage(){
  closeModal();$('over').classList.remove('on');
  if(chapter===1)start(true);else if(chapter===7)startCycle2(!!T.wiped&&!T.jok);else if(chapter===8)startMaze(true);else{mode='play';beginStage(chapter)}
}
function quitToTitle(){
  closeModal();['over','win'].forEach(i=>$(i).classList.remove('on'));$('msg').classList.remove('show');
  reset();mode='title';$('title').classList.add('on');
}
$('bMenu').onclick=e=>{e.currentTarget.blur();if(mode==='play')openMenu();else if(modal&&modal.id==='menu')closeModal()};
$('mResume').onclick=closeModal;$('mStage').onclick=restartStage;$('mQuit').onclick=quitToTitle;$('bQuit2').onclick=quitToTitle;
$('bVoice').onclick=e=>{e.currentTarget.blur();voiceOn=!voiceOn;e.currentTarget.textContent='Voice-over: '+(voiceOn?'on':'off');if(!voiceOn)stopVoice()};
$('bRetry').onclick=restartStage;$('bContinue').onclick=continueGame;
$('vol').oninput=e=>{vol=e.target.value/100;if(master&&!muted)master.gain.value=vol};

