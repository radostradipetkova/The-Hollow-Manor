(()=>{
'use strict';
const W=640,H=384;
const $=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
const dk=document.createElement('canvas');dk.width=W;dk.height=H;
const dx=dk.getContext('2d');
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rdist=(px,py,o)=>Math.hypot(Math.max(o.x-px,0,px-(o.x+o.w)),Math.max(o.y-py,0,py-(o.y+o.h)));
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ================= AUDIO ================= */
let AC=null,master=null,muted=false,vol=.8;
function initAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return}
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();master.gain.value=muted?0:vol;master.connect(AC.destination);
    const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=170;lp.connect(master);
    const g=AC.createGain();g.gain.value=0.07;g.connect(lp);
    [43,43.7,64.5].forEach((f,i)=>{const o=AC.createOscillator();o.type=i<2?'sawtooth':'triangle';o.frequency.value=f;o.connect(g);o.start()});
    const lfo=AC.createOscillator(),lg=AC.createGain();lfo.frequency.value=0.07;lg.gain.value=0.035;lfo.connect(lg);lg.connect(g.gain);lfo.start();
  }catch(e){AC=null}
}
function tone(f,d,type='sine',v=0.2,slide=0){
  if(!AC||muted)return;
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+slide),t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+d+0.03);
}
function noise(d,v=0.2,freq=800){
  if(!AC||muted)return;
  const n=Math.floor(AC.sampleRate*d),b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);
  for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource();s.buffer=b;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=freq;
  const g=AC.createGain();g.gain.value=v;
  s.connect(f);f.connect(g);g.connect(master);s.start();
}
const sfx={
  door(){noise(.5,.25,500);tone(90,.4,'sawtooth',.06,-30)},
  pick(){tone(660,.5,'sine',.15);tone(990,.7,'sine',.08)},
  solve(){[392,494,587,784].forEach((f,i)=>setTimeout(()=>tone(f,.8,'triangle',.12),i*140))},
  bad(){tone(120,.5,'sawtooth',.12,-60)},
  scare(){noise(.9,.5,3000);tone(70,1,'sawtooth',.25,-40);tone(900,.5,'square',.08,-600)},
  beat(){tone(62,.16,'sine',.5,-25);setTimeout(()=>tone(54,.18,'sine',.4,-20),170)},
  light(){noise(.25,.12,2500)},
  step(){tone(60+Math.random()*25,.05,'square',.025)},
  bell(){tone(520,.7,'sine',.16);tone(1040,.5,'sine',.05)}
};
function toggleMute(){
  muted=!muted;if(muted)stopVoice();if(master)master.gain.value=muted?0:vol;
  $('bSound').textContent='Sound: '+(muted?'off':'on');
}

/* ================= STATE ================= */
let mode='title',time=0,playTime=0,chapter=1,T={},redMode=false,noteCb=null;
let S,notes,hearts,lit,seq,roomId,player,ghost,invuln,shake,flash,fade,roomT,lightsOut,eventT,beatT,stepT,doorCool,near,msgT,modal;
const keys={};
const STANDS=[{col:'gray',c:'#8a8a92'},{col:'red',c:'#c0392b'},{col:'blue',c:'#6fa0e0'},{col:'white',c:'#ebe6d8'}];
const SOL=['red','white','blue','gray'];

function reset(){chapter=1;T={};redMode=false;
  S={diary:false,page:false,brass:false,safe:false,iron:false,clock:false,altar:false,clockHour:12};
  notes=[];hearts=3;lit=[false,false,false,false];seq=[];
  roomId='foyer';player={x:320,y:250,dir:'up',step:0,moving:false};
  ghost={on:false,x:0,y:0,a:0,ph:0,life:0,timer:Infinity};
  invuln=0;shake=0;flash=0;fade=1;roomT=2.5;lightsOut=0;eventT=30;beatT=0;stepT=0;doorCool=0;near=null;msgT=0;modal=null;playTime=0;
  updateHUD();refreshContinue();
}

/* ================= HUD & MESSAGES ================= */
const STN=['The Hollow Manor','The Forgotten Wing','The Underground Laboratory','The Nursery','The Mirror Realm','The Heart of the Manor'];
function updateHUD(){$('stageName').textContent=chapter===8?'The Maze Beneath':chapter===7?'Cycle 02: The Changed Hall':'Stage '+chapter+' of 6: '+STN[chapter-1];
  $('hearts').innerHTML=[0,1,2].map(i=>'<span class="heart'+(i<hearts?'':' off')+'">&#9829;</span>').join('');
  let h='';
  if(S.brass)h+='<span class="chip key">Brass key</span>';
  if(S.iron)h+='<span class="chip key">Iron key</span>';
  {const fc=notes.filter(n=>n.title.startsWith('Fragment')).length;if(fc)h+='<span class="chip key">Fragments '+fc+'/8</span>'}
  if(typeof T!=='undefined'&&T&&T.tags)h+='<span class="chip key">Name tags '+T.tags+'/4</span>';
  if(typeof T!=='undefined'&&T&&T.lp&&!T.lpDone&&T.lp.some(Boolean))h+='<span class="chip key">Letter '+T.lp.filter(Boolean).length+'/4</span>';
  if(typeof T!=='undefined'&&T&&T.dolls&&!T.dollsDone&&T.dolls.some(Boolean))h+='<span class="chip key">Dolls '+T.dolls.filter(Boolean).length+'/5</span>';
  if(typeof T!=='undefined'&&T&&T.obj)h+='<span class="chip key">Objective: '+T.obj+'</span>';
  if(typeof T!=='undefined'&&T&&T.parts&&T.parts.filter(Boolean).length)h+='<span class="chip key">Maze finds '+T.parts.filter(Boolean).length+'/10</span>';
  if(typeof T!=='undefined'&&T&&chapter===3&&T.held!=null)h+='<span class="chip key">Holding: bottle '+'ABC'[T.held]+'</span>';
  if(notes.length)h+='<span class="chip">'+notes.length+(notes.length>1?' notes':' note')+'</span>';
  $('inv').innerHTML=h;
}
function say(t,sec=4){const m=$('msg');m.textContent=t;m.classList.add('show');msgT=sec}
function heal(){if(hearts<3){hearts++;updateHUD()}}
function addNote(title,text){if(!notes.some(n=>n.title===title))notes.push({title,text});updateHUD()}

