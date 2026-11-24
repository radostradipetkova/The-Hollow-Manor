/* ===== Restructured route: every path leads into Cycle 02; refusing the offer wipes your journal ===== */
let JB=null;
const FOOL_DESTROY=[
  ['YOU CHOOSE TO DESTROY IT','The machine hums, patient, almost amused.',null,45],
  ['THE MACHINE','You cannot destroy what you do not remember.',null,50],
  ['THE MACHINE','You fool. You were never the one choosing.',null,70],
  ['THE HOLLOW MANOR','WELCOME BACK.\n\nYou have done this before.',null,55],
  ['CYCLE 02','Your journal is gone.',null,60]];
const FOOL_RESCUE=[
  ['YOU CHOOSE TO RESCUE HER','Mara presses a hand against the glass.',null,45],
  ['THE MACHINE','You cannot rescue someone you have forgotten.',null,50],
  ['THE MACHINE','You fool. You were never the one choosing.',null,70],
  ['THE HOLLOW MANOR','WELCOME BACK.\n\nYou have done this before.',null,55],
  ['CYCLE 02','Your journal is gone.',null,60]];
const JOURNAL_CARDS=[
  ['YOUR JOURNAL','The pages come back one by one. Candles. A clock. A lullaby. A face you did not recognise at first.',null,45],
  ['YOUR JOURNAL','You remember. Not everything. But the shape of it.',null,55]];
const C2MAZE=[
  ['THE MACHINE','Then end me, if you can. I am not in this room. I am beneath the house, where the stairs go down.',null,40],
  ['THE MANOR','Ten rooms. Ten mechanisms. Find them, and the way down will open.',null,45]];
function restoreJournal(){
  const old=JB||[],cur=notes.slice();
  notes=[...old,...cur.filter(n=>!old.some(o=>o.title===n.title))];
  T.jok=true;updateHUD();sfx.solve();heal();
  playCards(JOURNAL_CARDS,()=>{mode='play';say('Your journal is whole again, in your own handwriting.',6)});
}
{const lb=ROOMS.foyer2.objs.find(o=>o.label==='Pry up the loose board');
 lb.act=()=>{T.mnote=true;sfx.pick();const tx=MARA2+(T.wiped&&!T.jok?'\n\nShe has added a line at the bottom, in a hurry: "You will ask where your journal is. You hid it from yourself, so the next you could not read it. The key is in the dining room, taped where the guests never sat. The drawer is in the library."':'');addNote('Mara\u2019s note',tx);showNote('Mara\u2019s note',tx)}}
ROOMS.dining2.objs.push({...glint(500,300,'Take the small key','jkey','You find a small brass key taped under the lip of the table.'),when:()=>T.wiped&&!T.jkey});
ROOMS.library2.objs.push({x:230,y:222,w:40,h:30,solid:true,label:'Search the little drawer',
  draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#5a3a24');rect(c,o.x,o.y,o.w,4,'#7a5a3a');rect(c,o.x+16,o.y+14,8,6,'#c9a24a')},
  act:()=>{
    if(!T.wiped||T.jok){say('A little drawer. Empty.',3);return}
    if(!T.jkey){say('Locked. The lock is tiny and brass. The key must be somewhere in this house.',5);return}
    restoreJournal();
  }});
{const md=ROOMS.thresh.objs.find(o=>o.label==='Open the machine door');
 md.act=()=>{
   if(!T.seals3){say('Three seals hold the door shut.',4);return}
   if(T.wiped&&!T.jok){say('You stand before the door with a mind full of holes. You cannot face the machine without your memories. Find your journal.',7);return}
   changeRoom('heart2',320,310);say('The machine is awake. It has been waiting for you.',5)}}
{const mc=ROOMS.heart2.objs.find(o=>o.label==='Face the machine');
 mc.act=()=>{
   if(!T.talk){playCards(MACHINE_CARDS,()=>{mode='play';T.talk=true;say('Her cylinder glows. She is watching you.',5)});return}
   if(!T.mara){say('Mara is waiting. Go to her.',4);return}
   if(!T.placed){say('The four slots at its base are empty. You have nothing to answer it with.',5);return}
   playCards(C2MAZE,startMaze);
 }}
/* ===== Cycle 02 control room: the recordings must be played in order A, B, C, D ===== */
{const mons=ROOMS.ctrl2.objs.filter(o=>o.label==='Replay the recording');
 mons.forEach((o,k)=>{
  const [t,h,txt]=MON[k],L=h.slice(-1);
  o.draw=(c,m)=>{
    rect(c,m.x,m.y,m.w,m.h,'#2a3236');rect(c,m.x+5,m.y+5,m.w-10,m.h-10,'#07100f');
    const on=T.ctrl||(T.ms2||[]).includes(k),sn=T.ctrl||(T.seen||[])[k];
    for(let i=0;i<7;i++){c.fillStyle=on?'rgba(90,230,160,.25)':'rgba(120,170,170,'+(.08+.1*Math.abs(Math.sin(time*7+i+k*2))).toFixed(2)+')';c.fillRect(m.x+7,m.y+8+i*5,m.w-14,2)}
    c.textAlign='center';c.fillStyle=on?'#8af0b0':'#6fbf8a';c.font='bold 11px "Courier New",monospace';c.fillText(t,m.x+m.w/2,m.y+m.h-9);
    if(sn){c.fillStyle='#ffe9a8';c.font='bold 22px Georgia';c.fillText(L,m.x+m.w/2,m.y+30)}};
  o.act=()=>{
    if(T.ctrl){say('The screens show a single word: SUBJECT.',3);return}
    (T.seen=T.seen||[])[k]=true;
    const q=T.ms2=T.ms2||[];
    if(q.includes(k)){say('That recording has already played in this run.',2);return}
    sfx.light();addNote('Recording '+h.slice(-4),h+' ['+t+']: '+txt);
    if(L!=='ABCD'[q.length]){T.ms2=[];sfx.bad();say('That was experiment 07-'+L+'. The recordings only play in order, starting with A. The screens reset, but they remember their letters.',7);return}
    q.push(k);say(h+' ['+t+']: '+txt,8);
    if(q.length===4){T.ctrl=true;heal();sfx.solve();shake=.5;addNote('The four experiments',EXPTXT);showNote('The four experiments',EXPTXT,()=>say('At the east end of the room, a steel door unlocks with a heavy clunk.',6))}
  };
 });
 ROOMS.ctrl2.objs.push({x:300,y:150,w:44,h:22,label:'Read the plate',draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#8a6a2a');rect(c,o.x+3,o.y+3,o.w-6,o.h-6,'#c9a24a')},act:()=>say('A brass plate under the monitors: "EXPERIMENTS 07-A TO 07-D. REPLAY IN ORDER." The screens do not say which is which until they play.',8)})}
