/* ================= LOOP ================= */
reset();
let last=performance.now();
function frame(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;
  update(dt);draw();
  if(mode==='play'||mode==='modal'){
    autosaveClock+=dt;
    if(autosaveClock>=4){autosaveClock=0;saveGame()}
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
addEventListener('pagehide',saveGame);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame()});
})();
