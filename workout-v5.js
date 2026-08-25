// Meu Treino v5 — registro de peso e repetições realizadas
(function(){
  function numOrBlank(v){
    if(v===undefined||v===null||v==='') return '';
    return String(v);
  }

  window.startSession=function(pid){
    const p=state.plans.find(x=>x.id===pid);
    state.session={
      id:crypto.randomUUID(),
      planId:pid,
      startedAt:new Date().toISOString(),
      items:p.items.map(i=>({
        ...i,
        sourceExerciseId:i.exerciseId,
        done:false,
        substituted:false,
        weightUsed:'',
        repsDone:''
      }))
    };
    save();
    openSession();
  };

  window.updateSessionRecord=function(id,key,value){
    const item=state.session?.items.find(x=>x.id===id);
    if(!item) return;
    if(key==='weightUsed'){
      item.weightUsed=value===''?'':Math.max(0,Number(value)||0);
    }else if(key==='repsDone'){
      item.repsDone=value;
    }
    save();
  };

  window.sessionItemsHtml=function(){
    return state.session.items.map((i,idx)=>{
      const e=allExercises().find(x=>x.id===i.exerciseId) || {name:'Exercício',group:'',muscles:''};
      return `<div class="ex ${i.done?'done':''}">
        <input class="check" type="checkbox" ${i.done?'checked':''} onchange="toggleDone('${i.id}',this.checked)">
        <div class="grow">
          <div class="ex-title">${idx+1}. ${esc(e.name)} ${i.substituted?'<span class="badge">SUBSTITUÍDO</span>':''}</div>
          <div class="ex-meta">Planejado: ${i.sets} séries × ${esc(i.reps)} reps · ${esc(e.group)}</div>
          <div class="muted" style="font-size:12px;margin-top:4px">${esc(e.muscles)}</div>
          <div class="row wrap" style="margin-top:10px;align-items:flex-end">
            <div class="field grow" style="margin:0;min-width:120px">
              <label>Peso usado (kg)</label>
              <input type="number" min="0" step="0.5" inputmode="decimal" value="${esc(numOrBlank(i.weightUsed))}" placeholder="Ex.: 40" onchange="updateSessionRecord('${i.id}','weightUsed',this.value)">
            </div>
            <div class="field grow" style="margin:0;min-width:140px">
              <label>Repetições feitas</label>
              <input value="${esc(i.repsDone||'')}" placeholder="Ex.: 12, 11, 10" onchange="updateSessionRecord('${i.id}','repsDone',this.value)">
            </div>
          </div>
          <button class="btn small" style="margin-top:8px" onclick="chooseExercise('${state.session.planId}','${i.id}')">↔ Trocar exercício</button>
        </div>
      </div>`;
    }).join('');
  };

  window.finishSession=function(){
    const s=state.session;
    const p=state.plans.find(x=>x.id===s.planId);
    state.history.push({
      id:s.id,
      planName:p?.name||'Treino',
      finishedAt:new Date().toISOString(),
      completed:s.items.filter(i=>i.done).length,
      total:s.items.length,
      substitutions:s.items.filter(i=>i.substituted).length,
      items:s.items.map(i=>{
        const e=allExercises().find(x=>x.id===i.exerciseId);
        return {
          exerciseId:i.exerciseId,
          exerciseName:e?.name||'Exercício',
          group:e?.group||'',
          sets:i.sets,
          plannedReps:i.reps,
          weightUsed:i.weightUsed??'',
          repsDone:i.repsDone??'',
          done:!!i.done,
          substituted:!!i.substituted
        };
      })
    });
    state.session=null;
    save();
    closeModal();
    setTab('history');
  };

  window.historyView=function(){
    if(!state.history.length) return '<div class="card empty">Você ainda não concluiu nenhum treino.</div>';
    return state.history.slice().reverse().map(h=>{
      const details=Array.isArray(h.items)&&h.items.length
        ? `<div style="margin-top:10px">${h.items.map(i=>`<div class="ex"><div class="grow"><div class="ex-title">${esc(i.exerciseName||'Exercício')}</div><div class="ex-meta">${i.sets||'-'} séries × ${esc(i.plannedReps||'-')} planejadas${i.substituted?' · substituído':''}</div><div style="margin-top:5px"><span class="pill">${i.weightUsed!==''&&i.weightUsed!==undefined?esc(i.weightUsed)+' kg':'Peso não registrado'}</span> <span class="pill">${i.repsDone?esc(i.repsDone)+' reps':'Reps não registradas'}</span></div></div></div>`).join('')}</div>`
        : '';
      return `<div class="card"><div class="row between"><div><div class="sheet-title">${esc(h.planName)}</div><div class="muted">${new Date(h.finishedAt).toLocaleString('pt-BR')}</div></div><span class="pill">${h.completed}/${h.total}</span></div>${h.substitutions?`<div class="muted" style="margin-top:8px">${h.substitutions} substituição(ões) durante o treino</div>`:''}${details}</div>`;
    }).join('');
  };
})();
