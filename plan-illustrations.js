'use strict';
/* Bridge illustrated exercise catalog to individual training plans. */
(function(){
let pending=null;
window.GymBodyChooseExercise=function(exerciseId){
 pending=exerciseId;
 view='planos';render();window.scrollTo(0,0);
};
function enhance(){
 if(view!=='planos')return;
 const form=document.getElementById('plano');if(!form)return;
 const exercise=form.querySelector('[name="exercicioId"]'),client=form.querySelector('[name="clienteId"]');
 if(!exercise||!client)return;
 if(pending&&db.exercicios.some(x=>x.id===pending)){exercise.value=pending;pending=null}
 const info=document.createElement('div');info.id='planExercisePreview';info.style.cssText='margin:12px 0;padding:12px;border:1px solid #d8e8e3;border-radius:12px;background:#f4faf8';
 exercise.closest('div')?.after(info);
 const draw=()=>{
  const x=db.exercicios.find(e=>e.id===exercise.value);
  if(!x){info.innerHTML='<p class="muted">Escolhe um exercício da biblioteca para ver a imagem.</p>';return}
  const image=x.foto||x.repdbImage;
  info.innerHTML='<strong>'+h(x.nome)+'</strong>'+(image?'<div style="margin-top:10px"><img src="'+h(image)+'" alt="Imagem do exercício" style="max-width:180px;max-height:150px;object-fit:contain;border-radius:9px"></div>':'<p class="muted">Este exercício não tem fotografia guardada.</p>');
 };
 exercise.addEventListener('change',draw);draw();
 const list=document.createElement('section');list.id='planIllustratedList';list.innerHTML='<h2>Exercícios do plano</h2><div id="planIllustratedItems"></div>';
 form.closest('section')?.after(list);
 const update=()=>{
  const target=list.querySelector('#planIllustratedItems');
  const rows=db.planos.filter(x=>!client.value||x.clienteId===client.value);
  target.innerHTML=rows.map(x=>{
   const ex=db.exercicios.find(z=>z.id===x.exercicioId),img=ex?.foto||ex?.repdbImage;
   return '<div class="item" style="display:flex;gap:12px;align-items:center">'+(img?'<img src="'+h(img)+'" alt="" style="width:74px;height:74px;object-fit:contain;border-radius:8px">':'')+'<div><strong>'+h(ex?.nome||'Exercício')+'</strong><p>'+h(x.sessao)+' · '+h(x.series)+' séries × '+h(x.reps)+' · '+h(String(x.carga).replace('.',','))+' kg</p></div></div>';
  }).join('')||'<p class="muted">Ainda não há exercícios neste plano.</p>';
 };
 client.addEventListener('change',update);update();
 const go=document.createElement('button');go.type='button';go.className='secondary';go.textContent='Escolher exercício com imagens';go.addEventListener('click',()=>{view='exercicios';render();window.scrollTo(0,0)});
 form.querySelector('.actions')?.appendChild(go);
}
const old=render;render=function(){old();enhance()};enhance();
})();
