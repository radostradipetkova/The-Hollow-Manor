/* ================= LOOP ================= */
reset();
let last=performance.now();
function frame(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;
  update(dt);draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
