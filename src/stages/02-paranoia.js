/* ===== Stage 2 paranoia: doors that drift when you look away, and footsteps that are not yours ===== */
function corrParanoia(dt){
  if(!T.candle)return;
  const away=player.dir!=='up';
  T.away=away?(T.away||0)+dt:0;
  if(away&&T.away>1.3){
    T.pt=(T.pt==null?2:T.pt)-dt;
    if(T.pt<=0){
      T.pt=2.2+Math.random()*2.2;
      const n=cXs().length,i=Math.floor(Math.random()*n),off=T.off=T.off||[0,0,0,0];
      let d=(Math.random()<.5?-1:1)*(4+Math.random()*7);
      if(Math.abs(off[i]+d)>18)d=-d;
      off[i]=Math.max(-18,Math.min(18,off[i]+d));
      tone(90+Math.random()*30,.3,'sawtooth',.03,-25);
      if(!T.para){T.para=1;say('Behind you, wood creaks, as if a door has shifted.',3.5)}
    }
  }
}
function archiveParanoia(dt){
  if(player.moving){
    T.still=0;T.foot=0;T.echo=(T.echo==null?.4:T.echo)-dt;
    if(T.echo<=0){T.echo=.34;if(Math.random()<.45)setTimeout(()=>{if(roomId==='archive'&&mode==='play')tone(46+Math.random()*12,.07,'square',.03)},560)}
  }else{
    T.still=(T.still||0)+dt;
    if(T.still>3.5&&!T.foot&&time-(T.footAt||-99)>25){
      T.foot=1;T.footAt=time;
      [0,600,1200].forEach((ms,i)=>setTimeout(()=>{if(roomId==='archive')tone(44+i*2,.08,'square',.025+i*.012)},ms));
      if(!T.footMsg){T.footMsg=1;setTimeout(()=>{if(roomId==='archive')say('Footsteps. Not yours. You have not moved.',4)},1500)}
    }
  }
}
