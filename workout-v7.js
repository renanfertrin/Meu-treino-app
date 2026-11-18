// Meu Treino v7 — reorganização da ordem dos exercícios nas fichas
(function(){
  window.movePlanItem=function(planId,itemId,direction){
    const plan=state.plans.find(p=>p.id===planId);
    if(!plan)return;
    const index=plan.items.findIndex(i=>i.id===itemId);
    if(index<0)return;
    const target=index+direction;
    if(target<0||target>=plan.items.length)return;
    [plan.items[index],plan.items[target]]=[plan.items[target],plan.items[index]];
    save();
    editPlan(planId);
  };

  window.planItemsHtml=function(plan){
    if(!plan.items.length)return '<div class="empty">Adicione os exercícios desta ficha.</div>';
    return plan.items.map((item,index)=>{
      const exercise=allExercises().find(e=>e.id===item.exerciseId)||{name:'Exercício',group:'',muscles:''};
      return `<div class="ex" style="align-items:center">
        <div style="display:flex;flex-direction:column;gap:5px">
          <button class="btn small" aria-label="Mover para cima" title="Mover para cima" ${index===0?'disabled':''} onclick="movePlanItem('${plan.id}','${item.id}',-1)">↑</button>
          <button class="btn small" aria-label="Mover para baixo" title="Mover para baixo" ${index===plan.items.length-1?'disabled':''} onclick="movePlanItem('${plan.id}','${item.id}',1)">↓</button>
        </div>
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
})();