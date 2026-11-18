// Meu Treino v8 — reordenação por toque e arraste
(function(){
  let drag=null;
  let holdTimer=null;
  let started=false;

  const style=document.createElement('style');
  style.textContent=`
    .plan-drag-row{transition:opacity .12s,transform .12s}
    .plan-drag-row.is-dragging{opacity:.35;transform:scale(.985)}
    .plan-drag-handle{border:0;background:transparent;color:var(--muted);font-size:24px;line-height:1;padding:8px 10px;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
    .plan-drag-handle:active{color:var(--accent)}
    .plan-drop-target{border-top:2px solid var(--accent)}
    .plan-drag-hint{font-size:11px;color:var(--muted);margin:0 0 8px}
  `;
  document.head.appendChild(style);

  window.planItemsHtml=function(plan){
    if(!plan.items.length)return '<div class="empty">Adicione os exercícios desta ficha.</div>';
    return '<div class="plan-drag-hint">Segure no ícone ⠿ e arraste para mudar a ordem.</div>'+
      plan.items.map((item,index)=>{
        const exercise=allExercises().find(e=>e.id===item.exerciseId)||{name:'Exercício',group:'',muscles:''};
        return `<div class="ex plan-drag-row" data-plan-id="${plan.id}" data-item-id="${item.id}" style="align-items:center">
          <button type="button" class="plan-drag-handle" aria-label="Segurar e arrastar exercício" title="Segure e arraste" onpointerdown="beginPlanDrag(event,'${plan.id}','${item.id}')">⠿</button>
          <div class="grow">
            <div class="ex-title">${index+1}. ${esc(exercise.name)}</div>
            <div class="ex-meta">${esc(exercise.group)} · ${esc(exercise.muscles)}</div>
            <div class="row" style="margin-top:8px">
              <input style="width:90px" type="number" min="1" value="${item.sets}" onchange="updateItem('${plan.id}','${item.id}','sets',this.value)">
              <input value="${esc(item.reps)}" placeholder="Reps" onchange="updateItem('${plan.id}','${item.id}','reps',this.value)">
              <button class="btn small danger" onclick="removeItem('${plan.id}','${item.id}')">✕</button>
            </div>
          </div>
        </div>`;
      }).join('');
  };

  window.beginPlanDrag=function(event,planId,itemId){
    if(event.button!==undefined&&event.button!==0)return;
    event.preventDefault();
    clearTimeout(holdTimer);
    const handle=event.currentTarget;
    holdTimer=setTimeout(()=>{
      started=true;
      drag={planId,itemId,pointerId:event.pointerId,source:handle.closest('.plan-drag-row')};
      drag.source.classList.add('is-dragging');
      if(navigator.vibrate)navigator.vibrate(25);
    },180);
    const cancel=()=>{clearTimeout(holdTimer);if(!started)drag=null;};
    const move=e=>{
      if(!started||!drag||e.pointerId!==drag.pointerId)return;
      e.preventDefault();
      document.querySelectorAll('.plan-drop-target').forEach(x=>x.classList.remove('plan-drop-target'));
      const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('.plan-drag-row');
      if(el&&el.dataset.planId===planId&&el!==drag.source)el.classList.add('plan-drop-target');
    };
    const up=e=>{
      clearTimeout(holdTimer);
      document.removeEventListener('pointermove',move);
      document.removeEventListener('pointerup',up);
      document.removeEventListener('pointercancel',up);
      if(started&&drag&&e.pointerId===drag.pointerId){
        const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.plan-drag-row');
        const plan=state.plans.find(p=>p.id===planId);
        if(plan&&target&&target.dataset.planId===planId&&target.dataset.itemId!==itemId){
          const from=plan.items.findIndex(i=>i.id===itemId);
          const to=plan.items.findIndex(i=>i.id===target.dataset.itemId);
          if(from>=0&&to>=0){const [moved]=plan.items.splice(from,1);plan.items.splice(to,0,moved);save();}
        }
        document.querySelectorAll('.plan-drag-row,.plan-drop-target').forEach(x=>x.classList.remove('is-dragging','plan-drop-target'));
        if(started)editPlan(planId);
      }
      started=false;drag=null;
    };
    document.addEventListener('pointermove',move,{passive:false});
    document.addEventListener('pointerup',up);
    document.addEventListener('pointercancel',up);
  };
})();