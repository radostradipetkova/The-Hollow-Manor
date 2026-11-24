/* ================= INPUT ================= */
function handleKey(code){
  if(code==='KeyM'){toggleMute();return}
  if(mode==='title'){if(code==='Enter')start();return}
  if(mode==='reveal'){if(code==='Escape'||code==='Enter'||code==='Space')RV.t=Math.max(RV.t,12.4);return}
  if(mode==='intro'){if(code==='Escape')endIntro();else if(code==='Enter'||code==='Space'||code==='KeyE')nextCard();return}
  if(mode==='over'||mode==='win'){if(code==='Enter')start(true);return}
  if(mode==='modal'){if(modal)modal.key(code);return}
  if(mode==='play'){
    if(code==='KeyE')interact();
    else if(code==='KeyH')hint();
    else if(code==='KeyR'&&chapter===3){redMode=!redMode;sfx.light();say(redMode?'Emergency lighting on.':'Normal lighting restored.',2)}
    else if(code==='KeyJ'||code==='Tab')openJournal();
    else if(code==='Escape'||code==='KeyP')openMenu();
  }
}
const GAMEKEYS=['KeyW','KeyA','KeyS','KeyD','KeyE','KeyH','KeyJ','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(GAMEKEYS.includes(e.code)&&mode!=='title')e.preventDefault();
  keys[e.code]=true;
  if(!e.repeat)handleKey(e.code);
});
addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});

$('bStart').onclick=()=>start();$('bAgain').onclick=()=>start(true);
$('bHint').onclick=e=>{e.currentTarget.blur();if(mode==='play')hint()};
$('bJournal').onclick=e=>{e.currentTarget.blur();if(mode==='play')openJournal();else if(modal&&modal.id==='journal')closeModal()};
$('bSound').onclick=e=>{e.currentTarget.blur();initAudio();toggleMute()};
$('noteX').onclick=closeModal;$('jX').onclick=closeModal;$('safeX').onclick=closeModal;
$('clkM').onclick=()=>clkTurn(-1);$('clkP').onclick=()=>clkTurn(1);$('clkSet').onclick=setClock;
$('safeTry').onclick=trySafe;
document.querySelectorAll('[data-hold]').forEach(b=>{
  const k=b.dataset.hold;
  b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{keys[k]=false}));
});
document.querySelectorAll('[data-tap]').forEach(b=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();handleKey(b.dataset.tap)});
});

