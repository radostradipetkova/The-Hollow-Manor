/* ===== Experiment 04: a form on the facility's archive screen (selects, not counters) ===== */
const LF={ok:null,done:false};
function lfGo(){
  const rig=$('lfRig').value,tm=$('lfTime').value,bed=$('lfBed').value,f=$('lfF');
  if(LF.done)return;
  if(!rig||!tm||!bed){f.textContent='Fill every field before restoring the record.';f.style.color='#c9a24a';sfx.bad();return}
  if(rig==='08'&&tm==='07:00'&&bed==='BED 6'){
    LF.done=true;f.textContent='Archive integrity: restored';f.style.color='#5fd35f';sfx.solve();
    setTimeout(()=>{if(modal&&modal.id==='logform'){closeModal();LF.ok()}},900);
  }else{f.textContent='Entry rejected: it does not fit the pattern of the other records.';f.style.color='#d0584a';sfx.bad();shake=.2}
}
function openLogForm(ok){
  let el=$('logform');
  if(!el){
    el=document.createElement('div');el.className='screen';el.id='logform';
    const opt=a=>'<option value="">Select</option>'+a.map(v=>'<option value="'+v+'">'+v+'</option>').join('');
    const rigs=[...Array(12)].map((_,i)=>String(i+1).padStart(2,'0')),times=[...Array(12)].map((_,i)=>String(i+1).padStart(2,'0')+':00'),beds=[...Array(10)].map((_,i)=>'BED '+(i+1));
    el.innerHTML='<div class="card lf"><div class="lf-top"><span>Vane Research Facility</span><span class="lf-tools"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d9bfb6" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/></svg><button class="lf-x" id="lfX" type="button" aria-label="Step back" title="Step back">\u00d7</button></span></div><div class="lf-body"><h2>Experiment 04</h2><p class="lf-sub">Reconstruct the missing patient record.</p><div class="lf-panel"><div class="lf-row"><label for="lfRig">Rig assignment</label><select id="lfRig" class="lf-sel">'+opt(rigs)+'</select></div><div class="lf-row"><label for="lfTime">Session time</label><select id="lfTime" class="lf-sel">'+opt(times)+'</select></div><div class="lf-row"><label for="lfBed">Patient bed</label><select id="lfBed" class="lf-sel">'+opt(beds)+'</select></div></div><details class="lf-ex"><summary>Archive extract</summary><pre>EXP 1   RIG 02   01:00   BED 9\nEXP 2   RIG 04   03:00   BED 8\nEXP 3   RIG 06   05:00   BED 7\nEXP 4   [ PAGE TORN OUT ]\nEXP 5   RIG 10   09:00   BED 5\nEXP 6   RIG 12   11:00   BED 4</pre></details><button class="lf-btn" id="lfGo" type="button">Restore record</button><div class="lf-foot" id="lfF">Archive integrity: compromised</div></div></div>';
    $('view').appendChild(el);
    el.querySelector('#lfGo').onclick=lfGo;el.querySelector('#lfX').onclick=closeModal;
  }
  LF.ok=ok;LF.done=false;['lfRig','lfTime','lfBed'].forEach(i=>{$(i).value=''});
  $('lfF').textContent='Archive integrity: compromised';$('lfF').style.color='';
  openModal('logform',c=>{if(c==='Escape')closeModal();else if(c==='Enter')lfGo()});
}
