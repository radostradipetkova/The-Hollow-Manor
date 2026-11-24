/* ===== Cycle 02: the second confrontation ===== */
const MACHINE_CARDS=[
  ['THE MACHINE','You said yes. I remember.',null,45],
  ['THE MACHINE','You were given four choices. You believed one of them would free you.',null,40],
  ['THE MACHINE','How many times must we repeat this experiment before you understand?',null,40],
  ['THE MACHINE','You were never the one choosing.',null,70],
  ['THE MACHINE','Look at her. She has been choosing for you the whole time.',null,45]];
const MARA_CARDS=[
  ['MARA, BEHIND THE GLASS','I remember you. Every one of you.',null,50],
  ['MARA','I did not know how to keep a friend. So I made one. And when he left, I made another.',null,40],
  ['MARA','I told them to say yes because yes was the only answer that stayed.',null,40],
  ['MARA','I am so tired of choosing for you. Please. Choose for yourself.',null,50]];
const YES_CARDS=[['YOU SAY YES','The machine hums. Mara smiles, relieved. The hall resets.',null,45],['CYCLE 03','You have done this before.',null,70]];
const NO_CARDS=[['YOU SAY NO','Mara cannot keep the ones who say no. The lights go out, one by one.',null,45],['TRY AGAIN','Nothing you remember is yours. Nothing you choose is final.',null,50]];
const TOGETHER_CARDS=[
  ['WE CHOOSE','Four coats. Four name tags. Four copies of you, standing behind you in the dark.',null,40],
  ['07-A, 07-B, 07-C, 07-D','"I carried her out." "I broke it." "I said yes." "I remembered."',null,40],
  ['ALL OF YOU','Not yes. Not no. Together: we choose to leave, and to take her with us.',null,45],
  ['THE MACHINE','Impossible. The subject cannot choose.',null,70]];
const backToPlay=()=>{mode='play'};
function openFinal5(){
  let ch=$('final5');
  if(!ch){
    ch=document.createElement('div');ch.className='screen';ch.id='final5';
    ch.innerHTML='<div class="card" style="text-align:center"><h2>The Last Choice</h2><p style="color:var(--muted)">The machine waits. Mara waits. Behind you, in the dark, so do the others.</p><div class="row" style="flex-direction:column;align-items:stretch"></div></div>';
    [['yes','Say yes, again'],['no','Say no'],['together','We choose together']].forEach(([k,l])=>{
      const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=l;
      b.onclick=()=>{closeModal();
        if(k==='yes')playCards(YES_CARDS,quitToTitle);
        else if(k==='no')playCards(NO_CARDS,quitToTitle);
        else{markEnding('together');playCards(TOGETHER_CARDS,()=>startEnding('together'))}};
      ch.querySelector('.row').appendChild(b)});
    $('view').appendChild(ch);
  }
  ch.querySelector('.row').children[2].hidden=!T.placed;
  openModal('final5',c=>{if(c==='Escape')closeModal()});
}
const mach=ROOMS.machine.objs.find(o=>o.label==='Face the machine');
ROOMS.heart2={name:'The Heart, Again',paint:paintMach,lights:()=>[{x:320,y:110,r:240,a:.65,col:'60,200,200'},{x:110,y:150,r:90,a:.6,col:'200,220,255'}],objs:[
  {...mach,act:()=>{
    if(!T.talk){playCards(MACHINE_CARDS,()=>{mode='play';T.talk=true;say('Her cylinder glows. She is watching you.',5)});return}
    if(!T.mara){say('Mara is waiting. Go to her.',4);return}
    openFinal5();
  }},
  {x:80,y:90,w:60,h:90,solid:true,label:'Speak to Mara',
    draw:(c,o)=>{c.fillStyle='rgba(160,210,230,.25)';c.fillRect(o.x,o.y,o.w,o.h);c.strokeStyle='#8ab0c0';c.lineWidth=2;c.strokeRect(o.x+1,o.y+1,o.w-2,o.h-2);c.fillStyle='rgba(235,235,245,.85)';c.beginPath();c.arc(o.x+30,o.y+32,10,0,6.3);c.fill();c.fillRect(o.x+19,o.y+43,22,34);rect(c,o.x-4,o.y+o.h,o.w+8,8,'#3a4448')},
    act:()=>{
      if(!T.talk){say('Mara looks at you through the glass. Her lips move. You cannot hear her yet.',5);return}
      if(T.mara){say('Mara watches you, and waits for you to choose.',4);return}
      playCards(maraDeck(),()=>{mode='play';T.mara=true;say('At the base of the machine, four slots glow. Each is shaped like a name tag.',6)});
    }},
  {x:280,y:230,w:80,h:40,solid:true,label:'Place the name tags',
    draw:(c,o)=>{rect(c,o.x,o.y,o.w,o.h,'#2a3236');rect(c,o.x,o.y,o.w,5,'#4a5458');for(let i=0;i<4;i++)rect(c,o.x+6+i*18,o.y+14,14,18,(T.placed?'#5fd35f':(T.tags||0)>i?'#4a6a70':'#10181a'))},
    act:()=>{
      if(T.placed){say('The four tags glow in their slots. SUBJECT 07-A, B, C, D.',4);return}
      if((T.tags||0)<4){say('Four slots, each shaped like a name tag. You are carrying '+(T.tags||0)+'. The cells hold the rest.',5);return}
      T.placed=true;heal();sfx.solve();shake=.5;say('One by one you press the four name tags into the slots. 07-A. 07-B. 07-C. 07-D. The machine falls silent, as if listening.',8);
    }},
  D(296,336,48,16,'thresh',320,200)]};
{const md=ROOMS.thresh.objs.find(o=>o.label==='Open the machine door');
 md.act=()=>{if(!T.seals3){say('Three seals hold the door shut.',4);return}changeRoom('heart2',320,310);say('The machine is awake. It has been waiting for you.',5)}}
/* hiding places and distractions for the ghosts that are back in the library and dining room */
ROOMS.library2.objs.push(lockerO(44,250),lureO(500,110,'Ring the desk bell','A bell rings from the far corner. The thing drifts toward the sound.'));
ROOMS.dining2.objs.push(lockerO(44,240),lureO(520,260,'Knock over the tea set','Porcelain shatters across the floor. The thing glides toward the noise.'));
function startCycle2(wiped){wiped=wiped===true;
  ['title','over','win'].forEach(i=>$(i).classList.remove('on'));
  if(wiped){JB=notes.length?notes.slice():(JB||[]);try{localStorage.setItem('hmJB',JSON.stringify(JB))}catch(e){}}
  let nn=wiped?[]:notes;try{const d=JSON.parse(localStorage.getItem('hmCP'));if(!wiped&&d&&Array.isArray(d.n)&&!nn.length)nn=d.n}catch(e){}
  reset();notes=nn;chapter=7;T={wiped,jok:!wiped};saveGame(7,{w:wiped,jb:JB||[]});mode='play';initAudio();roomId='foyer2';player.x=320;player.y=300;player.dir='up';
  ghost.on=false;ghost.timer=Infinity;fade=1;roomT=3;hearts=3;updateHUD();
  say(wiped?'You are back in the entrance hall. Your journal is gone, and your head feels strangely empty, like a room someone has cleared. Something here must remember for you.':'You are back in the entrance hall. The portraits are still there. The library, the dining room. But something is different.',9);
}
