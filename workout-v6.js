// Meu Treino v6 — peso/repetições + importar/exportar fichas
(function(){
  function numOrBlank(v){
    if(v===undefined||v===null||v==='') return '';
    return String(v);
  }
  function norm(s){
    return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  }

  // Registro realizado durante o treino
  window.startSession=function(pid){
    const p=state.plans.find(x=>x.id===pid);
    state.session={
      id:crypto.randomUUID(), planId:pid, startedAt:new Date().toISOString(),
      items:p.items.map(i=>({...i,sourceExerciseId:i.exerciseId,done:false,substituted:false,weightUsed:'',repsDone:''}))
    };
    save(); openSession();
  };

  window.updateSessionRecord=function(id,key,value){
    const item=state.session?.items.find(x=>x.id===id);
    if(!item)return;
    if(key==='weightUsed') item.weightUsed=value===''?'':Math.max(0,Number(String(value).replace(',','.'))||0);
    if(key==='repsDone') item.repsDone=value;
    save();
  };

  window.sessionItemsHtml=function(){
    return state.session.items.map((i,idx)=>{
      const e=allExercises().find(x=>x.id===i.exerciseId)||{name:'Exercício',group:'',muscles:''};
      return `<div class="ex ${i.done?'done':''}"><input class="check" type="checkbox" ${i.done?'checked':''} onchange="toggleDone('${i.id}',this.checked)"><div class="grow"><div class="ex-title">${idx+1}. ${esc(e.name)} ${i.substituted?'<span class="badge">SUBSTITUÍDO</span>':''}</div><div class="ex-meta">Planejado: ${i.sets} séries × ${esc(i.reps)} reps · ${esc(e.group)}</div><div class="muted" style="font-size:12px;margin-top:4px">${esc(e.muscles)}</div><div class="row wrap" style="margin-top:10px;align-items:flex-end"><div class="field grow" style="margin:0;min-width:120px"><label>Peso usado (kg)</label><input type="number" min="0" step="0.5" inputmode="decimal" value="${esc(numOrBlank(i.weightUsed))}" placeholder="Ex.: 40" onchange="updateSessionRecord('${i.id}','weightUsed',this.value)"></div><div class="field grow" style="margin:0;min-width:140px"><label>Repetições feitas</label><input value="${esc(i.repsDone||'')}" placeholder="Ex.: 12, 11, 10" onchange="updateSessionRecord('${i.id}','repsDone',this.value)"></div></div><button class="btn small" style="margin-top:8px" onclick="chooseExercise('${state.session.planId}','${i.id}')">↔ Trocar exercício</button></div></div>`;
    }).join('');
  };

  window.finishSession=function(){
    const s=state.session,p=state.plans.find(x=>x.id===s.planId);
    state.history.push({id:s.id,planName:p?.name||'Treino',finishedAt:new Date().toISOString(),completed:s.items.filter(i=>i.done).length,total:s.items.length,substitutions:s.items.filter(i=>i.substituted).length,items:s.items.map(i=>{const e=allExercises().find(x=>x.id===i.exerciseId);return {exerciseId:i.exerciseId,exerciseName:e?.name||'Exercício',group:e?.group||'',sets:i.sets,plannedReps:i.reps,weightUsed:i.weightUsed??'',repsDone:i.repsDone??'',done:!!i.done,substituted:!!i.substituted};})});
    state.session=null; save(); closeModal(); setTab('history');
  };

  window.historyView=function(){
    if(!state.history.length)return '<div class="card empty">Você ainda não concluiu nenhum treino.</div>';
    return state.history.slice().reverse().map(h=>{const details=Array.isArray(h.items)&&h.items.length?`<div style="margin-top:10px">${h.items.map(i=>`<div class="ex"><div class="grow"><div class="ex-title">${esc(i.exerciseName||'Exercício')}</div><div class="ex-meta">${i.sets||'-'} séries × ${esc(i.plannedReps||'-')} planejadas${i.substituted?' · substituído':''}</div><div style="margin-top:5px"><span class="pill">${i.weightUsed!==''&&i.weightUsed!==undefined?esc(i.weightUsed)+' kg':'Peso não registrado'}</span> <span class="pill">${i.repsDone?esc(i.repsDone)+' reps':'Reps não registradas'}</span></div></div></div>`).join('')}</div>`:'';return `<div class="card"><div class="row between"><div><div class="sheet-title">${esc(h.planName)}</div><div class="muted">${new Date(h.finishedAt).toLocaleString('pt-BR')}</div></div><span class="pill">${h.completed}/${h.total}</span></div>${h.substitutions?`<div class="muted" style="margin-top:8px">${h.substitutions} substituição(ões) durante o treino</div>`:''}${details}</div>`;}).join('');
  };

  // Exportar/importar fichas
  const originalPlansView=window.plansView;
  window.plansView=function(){
    const tools=`<div class="row" style="margin-bottom:12px"><button class="btn grow" onclick="exportWorkouts()">⬆️ Exportar fichas</button><button class="btn grow" onclick="openImportWorkouts()">⬇️ Importar fichas</button></div>`;
    return tools+originalPlansView();
  };

  function exerciseSnapshot(id){
    const e=allExercises().find(x=>x.id===id);
    return e?{name:e.name,group:e.group,muscles:e.muscles,equipment:e.equipment}:{name:'Exercício',group:'Não informado',muscles:'Não informado',equipment:'Não informado'};
  }

  window.exportWorkouts=function(){
    if(!state.plans.length){alert('Você não possui fichas para exportar.');return;}
    const payload={format:'meu-treino-fichas',version:1,exportedAt:new Date().toISOString(),plans:state.plans.map(p=>({name:p.name,items:p.items.map(i=>({exercise:exerciseSnapshot(i.exerciseId),sets:i.sets,reps:i.reps}))}))};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    const d=new Date(),date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    a.href=url;a.download=`meu-treino-fichas-${date}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  window.openImportWorkouts=function(){
    openModal(`<h2>Importar fichas</h2><div class="muted" style="margin-bottom:12px">Escolha um arquivo exportado pelo Meu Treino. Exercícios que não existirem na sua biblioteca serão adicionados automaticamente.</div><div class="field"><label>Arquivo .json</label><input id="workoutImportFile" type="file" accept="application/json,.json"></div><button class="btn primary" style="width:100%;margin-bottom:8px" onclick="importWorkouts('add')">Adicionar às minhas fichas</button><button class="btn danger" style="width:100%" onclick="importWorkouts('replace')">Substituir minhas fichas</button><div class="muted" style="font-size:12px;margin-top:10px">“Adicionar” mantém as fichas atuais. “Substituir” troca somente as fichas; seu histórico continua salvo.</div>`);
  };

  function ensureExercise(ex){
    const data=ex&&typeof ex==='object'?ex:{};
    const name=String(data.name||'').trim();
    if(!name)throw new Error('Há um exercício sem nome no arquivo.');
    let found=allExercises().find(e=>norm(e.name)===norm(name));
    if(found)return found.id;
    const created={id:'c'+crypto.randomUUID(),name,group:String(data.group||'Não informado'),muscles:String(data.muscles||'Não informado'),equipment:String(data.equipment||'Não informado'),custom:true};
    state.customExercises.push(created);return created.id;
  }

  function validatePayload(data){
    if(!data||data.format!=='meu-treino-fichas'||!Array.isArray(data.plans))throw new Error('Este arquivo não é uma exportação válida do Meu Treino.');
    if(!data.plans.length)throw new Error('O arquivo não contém nenhuma ficha.');
    for(const p of data.plans){if(!p||typeof p.name!=='string'||!Array.isArray(p.items))throw new Error('O arquivo possui uma ficha inválida.');}
  }

  window.importWorkouts=async function(mode){
    const input=document.getElementById('workoutImportFile'),file=input?.files?.[0];
    if(!file){alert('Escolha primeiro o arquivo .json.');return;}
    try{
      const data=JSON.parse(await file.text());validatePayload(data);
      if(mode==='replace'){
        const msg=state.session?'Existe um treino em andamento. Ao substituir as fichas, esse treino será cancelado. Continuar?':'Isso substituirá todas as suas fichas atuais. Seu histórico será mantido. Continuar?';
        if(!confirm(msg))return;
      }
      const imported=data.plans.map(p=>({id:crypto.randomUUID(),name:p.name.trim()||'Ficha importada',items:p.items.map(i=>({id:crypto.randomUUID(),exerciseId:ensureExercise(i.exercise),sets:Math.max(1,Number(i.sets)||3),reps:String(i.reps??'10-12')}))}));
      if(mode==='replace'){state.plans=imported;state.session=null;}else state.plans.push(...imported);
      save();closeModal();render();
      alert(`${imported.length} ficha${imported.length===1?' importada':'s importadas'} com sucesso.`);
    }catch(err){alert('Não foi possível importar: '+(err?.message||'arquivo inválido.'));}
  };
})();
