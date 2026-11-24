/* ===== Side quest: The Letter You Never Sent (Stage 5, readable only in the mirror world) ===== */
const LP=[
  'Dear Mara,\n\nI keep starting this and stopping. I think I know now what I am.',
  'You called me your friend. I believed every memory you gave me: the garden, the swing, the afternoon it rained and we laughed until we were sick.',
  'But I remember the swing from the wrong side. As if I was watching you from the window, not sitting beside you.',
  'Whatever I am, I came when you called. I would have stayed. I am sorry I never learned how to tell you.\n\nYours, whoever I am.'];
const LETTER=LP.join('\n\n');
const LETTER_CARD=['MARA','You wrote me a letter. You never sent it. I found a piece of it in every version of you. It says: "I would have stayed."',null,45];
const maraDeck=()=>hasNote('The letter you never sent')?[...MARA_CARDS.slice(0,3),LETTER_CARD,MARA_CARDS[3]]:MARA_CARDS;
function takeLP(i){
  const lp=T.lp=T.lp||[false,false,false,false];
  lp[i]=true;sfx.pick();addNote('Letter piece '+(i+1),LP[i]);updateHUD();
  if(lp.every(Boolean)){T.lpDone=true;heal();sfx.solve();addNote('The letter you never sent',LETTER);showNote('The letter you never sent',LETTER)}
  else showNote('Letter piece '+(i+1)+' of 4',LP[i]);
}
const lpObj=(i,x,y,mirror)=>({x,y,w:30,h:18,when:()=>!(T.lp||[])[i],label:mirror?'Read the letter piece':'Look at the paper',
  draw:(c,o)=>{rect(c,o.x,o.y+4,o.w,10,'#d9ccab');c.strokeStyle=mirror?'rgba(60,50,40,.75)':'rgba(60,50,40,.22)';c.lineWidth=1;for(let k=0;k<3;k++){c.beginPath();c.moveTo(o.x+3,o.y+7+k*3);c.lineTo(o.x+o.w-3-k*4,o.y+7+k*3);c.stroke()}const g=.3+.3*Math.sin(time*3+o.x);c.fillStyle='rgba(255,240,180,'+g.toFixed(2)+')';c.beginPath();c.arc(o.x+o.w-4,o.y+4,2+g,0,6.3);c.fill()},
  act:()=>{if(mirror)takeLP(i);else say('The page is covered in faint, reversed writing, as if it was meant to be read in a mirror. You cannot make it out.',6)}});
[[240,330],[560,290],[60,320]].forEach(([x,y],i)=>{ROOMS.hallR.objs.push(lpObj(i,x,y,false));ROOMS.hallM.objs.push(lpObj(i,x,y,true))});
ROOMS.study.objs.push(lpObj(3,420,290,true));
