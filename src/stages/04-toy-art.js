/* ===== The attic toys now look like a bear, a rabbit and a horse (seen from above, head first) ===== */
function toyBear(c){
  c.fillStyle='#8a5a32';[[-9,8],[9,8]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,4,0,6.3);c.fill()});
  [[-12,-2],[12,-2]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,3.6,0,6.3);c.fill()});
  c.fillStyle='#a06a3a';c.beginPath();c.ellipse(0,1,10,11,0,0,6.3);c.fill();
  c.fillStyle='#d8b184';c.beginPath();c.ellipse(0,2,5.5,6.5,0,0,6.3);c.fill();
  c.fillStyle='#a06a3a';c.beginPath();c.arc(0,-11,8,0,6.3);c.fill();
  c.fillStyle='#8a5a32';[[-6,-17],[6,-17]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,3.2,0,6.3);c.fill()});
  c.fillStyle='#d8b184';c.beginPath();c.ellipse(0,-15,3.6,3,0,0,6.3);c.fill();
  c.fillStyle='#1a120c';c.beginPath();c.arc(0,-16,1.3,0,6.3);c.fill();
  [[-3,-11.5],[3,-11.5]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,1,0,6.3);c.fill()});
}
function toyRabbit(c){
  c.fillStyle='#f0ece4';[[-6,9],[6,9]].forEach(([x,y])=>{c.beginPath();c.ellipse(x,y,3,4.5,0,0,6.3);c.fill()});
  c.beginPath();c.ellipse(0,2,8.5,11,0,0,6.3);c.fill();
  c.beginPath();c.arc(0,13,4,0,6.3);c.fill();
  c.beginPath();c.arc(0,-10,6.5,0,6.3);c.fill();
  [-1,1].forEach(k=>{c.save();c.translate(k*3.4,-20);c.rotate(k*.14);c.fillStyle='#f0ece4';c.beginPath();c.ellipse(0,0,2.7,8,0,0,6.3);c.fill();c.fillStyle='#e8a0b0';c.beginPath();c.ellipse(0,0,1.2,6,0,0,6.3);c.fill();c.restore()});
  c.fillStyle='#e8a0b0';c.beginPath();c.arc(0,-15.5,1.5,0,6.3);c.fill();
  c.fillStyle='#1a120c';[[-3,-10.5],[3,-10.5]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,1,0,6.3);c.fill()});
}
function toyHorse(c){
  c.fillStyle='#6a4426';[[-9,-5],[9,-5],[-9,9],[9,9]].forEach(([x,y])=>c.fillRect(x-2,y-4,4,8));
  c.fillStyle='#b07840';c.beginPath();c.ellipse(0,3,8,14,0,0,6.3);c.fill();
  c.fillStyle='#b8302a';c.fillRect(-6,-1,12,8);c.fillStyle='#e5c279';c.fillRect(-6,1,12,1.4);
  c.fillStyle='#b07840';c.beginPath();c.ellipse(0,-14,5.6,9,0,0,6.3);c.fill();
  c.fillStyle='#e8d2ac';c.beginPath();c.ellipse(0,-21,4,4.6,0,0,6.3);c.fill();
  c.fillStyle='#f4eee2';c.beginPath();c.ellipse(0,-14,1.4,6,0,0,6.3);c.fill();
  c.fillStyle='#3a2412';c.fillRect(-1.6,-19,3.2,18);
  for(let k=0;k<4;k++){c.fillRect(-4,-17+k*4.5,2.4,2.4);c.fillRect(1.6,-17+k*4.5,2.4,2.4)}
  c.beginPath();c.moveTo(-3,16);c.quadraticCurveTo(0,29,3,16);c.fill();
  c.fillStyle='#8a5a30';[-1,1].forEach(k=>{c.beginPath();c.moveTo(k*2.6,-19);c.lineTo(k*6.4,-24);c.lineTo(k*5,-16);c.closePath();c.fill()});
  c.fillStyle='#1a120c';[[-3.8,-15],[3.8,-15]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,1.1,0,6.3);c.fill()});
  [[-1.5,-23],[1.5,-23]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,.8,0,6.3);c.fill()});
}
{const fn={bear:toyBear,rabbit:toyRabbit,horse:toyHorse};
 ROOMS.attic.objs.filter(o=>/^Turn the (bear|rabbit|horse)$/.test(o.label)).forEach(o=>{
  const n=o.label.slice(9),i=['bear','rabbit','horse'].indexOf(n);
  o.draw=(c,m)=>{
    const d=(T.toy||[2,2,2])[i],cx=m.x+22,cy=m.y+18;
    rect(c,m.x,m.y+28,m.w,12,'#4a3a2a');
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(cx,cy+17,17,5,0,0,6.3);c.fill();
    c.save();c.translate(cx,cy);c.rotate(d*Math.PI/2);fn[n](c);c.restore();
    const px=-DY[d],py=DX[d];c.fillStyle='rgba(229,194,121,.85)';c.beginPath();c.moveTo(cx+DX[d]*30,cy+DY[d]*30);c.lineTo(cx+DX[d]*24+px*4,cy+DY[d]*24+py*4);c.lineTo(cx+DX[d]*24-px*4,cy+DY[d]*24-py*4);c.closePath();c.fill();
    if(T.shadow){c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.ellipse(320,40,36,16,0,0,6.3);c.fill();c.fillStyle='#c0392b';c.beginPath();c.arc(320,40,6,0,6.3);c.fill()}
  }})}
