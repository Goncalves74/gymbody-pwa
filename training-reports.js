'use strict';
/* GymBody v43: independent training-progress report; read-only against existing data. */
(function(){
let reportMode='corpo',trainingClient='',metric='volume',exercise='',from='',to='';
const esc=h;
const number=v=>{const n=Number(String(v??0).replace(',','.'));return Number.isFinite(n)?n:0};
const format=n=>Number(n).toLocaleString('pt-PT',{maximumFractionDigits:1});
const day=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s.slice(8)+'/'+s.slice(5,7)+'/'+s.slice(0,4):String(s||'');
const completed=s=>s.done===true;
function rows(){
 const sessions=(db.sessoes||[]).filter(s=>s.clienteId===trainingClient&&Array.isArray(s.exercicios));
 const result=[];
 for(const s of sessions){
  if(from&&s.data<from||to&&s.data>to)continue;
  const chosen=s.exercicios.filter(e=>!exercise||e.exercicioId===exercise);
  const sets=chosen.flatMap(e=>(e.series||[]).filter(completed));
  if(!sets.length)continue;
  result.push({id:s.id,data:s.data,exercicios:chosen.filter(e=>(e.series||[]).some(completed)).length,series:sets.length,repeticoes:sets.reduce((n,x)=>n+number(x.reps),0),volume:sets.reduce((n,x)=>n+number(x.reps)*number(x.carga),0)});
 }
 return result.sort((a,b)=>a.data.localeCompare(b.data));
}
function plot(data){
 if(!data.length)return '<p class="muted">Ainda não existem sessões concluídas com séries assinaladas para este filtro.</p>';
 const key=metric,values=data.map(r=>r[key]),maximum=Math.max(1,...values),width=620,height=220,left=52,right=20,top=20,bottom=48;
 const x=i=>left+(data.length===1?(width-left-right)/2:i*(width-left-right)/(data.length-1));
 const y=v=>height-bottom-v/maximum*(height-top-bottom);
 const points=data.map((r,i)=>x(i).toFixed(1)+','+y(r[key]).toFixed(1)).join(' ');
 return '<div style="overflow:hidden"><svg viewBox="0 0 620 220" style="width:100%;height:auto" role="img" aria-label="Evolução de '+esc(key)+'"><line x1="52" y1="20" x2="52" y2="172" stroke="#9dbdb6"/><line x1="52" y1="172" x2="600" y2="172" stroke="#9dbdb6"/>'+[0,.5,1].map(t=>'<text x="45" y="'+(176-t*152)+'" text-anchor="end" font-size="12" fill="#496c66">'+esc(format(maximum*t))+'</text>').join('')+'<polyline points="'+points+'" fill="none" stroke="#087f7a" stroke-width="3"/>'+data.map((r,i)=>'<circle cx="'+x(i)+'" cy="'+y(r[key])+'" r="5" fill="#087f7a"><title>'+esc(day(r.data)+' — '+format(r[key]))+'</title></circle>').join('')+'<text x="52" y="196" font-size="12" fill="#496c66">'+esc(day(data[0].data))+'</text><text x="600" y="196" text-anchor="end" font-size="12" fill="#496c66">'+esc(day(data.at(-1).data))+'</text></svg></div>';
}
function trainingScreen(){
 const data=rows(),totals=data.reduce((a,r)=>{for(const k of ['exercicios','series','repeticoes','volume'])a[k]+=r[k];return a},{exercicios:0,series:0,repeticoes:0,volume:0});
 const optionsExercise='<option value="">Todos os exercícios</option>'+(db.exercicios||[]).map(x=>'<option value="'+esc(x.id)+'" '+(exercise===x.id?'selected':'')+'>'+esc(x.nome)+'</option>').join('');
 return '<section><h2>Evolução dos treinos</h2><label>Cliente</label><select id="trainingClient">'+options('clientes',trainingClient)+'</select><label>Exercício</label><select id="trainingExercise">'+optionsExercise+'</select><div class="grid"><div><label>Desde</label><input id="trainingFrom" type="date" value="'+esc(from)+'"></div><div><label>Até</label><input id="trainingTo" type="date" value="'+esc(to)+'"></div></div><label>Indicador do gráfico</label><select id="trainingMetric">'+[['volume','Volume (kg)'],['repeticoes','Repetições'],['series','Séries'],['exercicios','Exercícios']].map(([v,t])=>'<option value="'+v+'" '+(metric===v?'selected':'')+'>'+t+'</option>').join('')+'</select><div class="actions"><button type="button" id="trainingPDF">Gerar e partilhar PDF</button></div><p class="muted">Volume = soma de repetições × carga. Apenas são contabilizadas as séries marcadas como realizadas.</p></section>'+(trainingClient?'<section><h2>Resumo do período</h2><div class="stat-grid">'+[['Sessões',data.length],['Exercícios',totals.exercicios],['Séries',totals.series],['Repetições',totals.repeticoes],['Volume (kg)',format(totals.volume)]].map(([k,v])=>'<div class="stat"><strong>'+esc(v)+'</strong><span>'+k+'</span></div>').join('')+'</div><h2>Evolução — '+esc(({volume:'Volume (kg)',repeticoes:'Repetições',series:'Séries',exercicios:'Exercícios'})[metric])+'</h2>'+plot(data)+(data.length?'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr>'+['Data','Exerc.','Séries','Repet.','Volume kg'].map(x=>'<th style="padding:8px;border-bottom:1px solid #ddd">'+x+'</th>').join('')+'</tr></thead><tbody>'+data.map(r=>'<tr>'+[day(r.data),r.exercicios,r.series,r.repeticoes,format(r.volume)].map(x=>'<td style="padding:8px;border-bottom:1px solid #eee">'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'')+'</section>':'<section><p>Seleciona um cliente para consultar os treinos realizados.</p></section>');
}
const oldScreen=screens.relatorios;
screens.relatorios=()=>'<section><h2>Tipo de relatório</h2><div class="actions"><button type="button" id="reportBodyMode" class="'+(reportMode==='corpo'?'':'secondary')+'">Evolução corporal</button><button type="button" id="reportTrainingMode" class="'+(reportMode==='treinos'?'':'secondary')+'">Evolução dos treinos</button></div></section>'+(reportMode==='corpo'?oldScreen():trainingScreen());
const previousWire=wire;
wire=function(){previousWire();if(view!=='relatorios')return;
 const on=(id,event,fn)=>document.getElementById(id)?.addEventListener(event,fn);
 on('reportBodyMode','click',()=>{reportMode='corpo';render()});
 on('reportTrainingMode','click',()=>{reportMode='treinos';render()});
 if(reportMode!=='treinos')return;
 on('trainingClient','change',e=>{trainingClient=e.target.value;render()});
 on('trainingExercise','change',e=>{exercise=e.target.value;render()});
 on('trainingFrom','change',e=>{from=e.target.value;render()});
 on('trainingTo','change',e=>{to=e.target.value;render()});
 on('trainingMetric','change',e=>{metric=e.target.value;render()});
 on('trainingPDF','click',exportPDF);
};
async function exportPDF(){
 if(!trainingClient)return alert('Seleciona primeiro um cliente.');
 if(!window.GymBodyPDF)return alert('O gerador de PDF não está disponível.');
 const c=get('clientes',trainingClient),data=rows(),doc=new GymBodyPDF();
 const text=(v,x,y,size=9,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(22,65,60);doc.text(String(v).replace(/[^\x20-\x7e\xA0-\xFF]/g,'?'),x,y)};
 const label=({volume:'Volume (kg)',repeticoes:'Repetições',series:'Séries',exercicios:'Exercícios'})[metric];
 const header=()=>{doc.setFillColor(12,112,104);doc.rect(0,0,210,9,'F');text('GYMBODY - EVOLUCAO DOS TREINOS',12,19,13,true);text('Cliente: '+(c?.nome||''),12,28,10,true);text('PT: '+(db.config?.pt||''),12,35,9);text('Indicador: '+label,12,42,9);text('Periodo: '+(from?day(from):'Inicio')+' a '+(to?day(to):'Hoje'),12,49,9)};
 header();let y=60;
 const max=Math.max(1,...data.map(r=>r[metric]));
 if(data.length){
  doc.setDrawColor(185,205,200);doc.line(20,135,195,135);doc.line(20,62,20,135);
  const xx=i=>data.length===1?108:22+i*170/(data.length-1),yy=v=>135-v/max*67;
  doc.setDrawColor(12,112,104);
  for(let i=1;i<data.length;i++)doc.line(xx(i-1),yy(data[i-1][metric]),xx(i),yy(data[i][metric]));
  for(let i=0;i<data.length;i++)doc.circle(xx(i),yy(data[i][metric]),1.4,'F');
  text('0',12,136,8);text(format(max),6,66,8);text(day(data[0].data),20,145,8);text(day(data.at(-1).data),155,145,8);y=156;
 }
 text('Data',12,y,9,true);text('Exerc.',48,y,9,true);text('Series',80,y,9,true);text('Repet.',113,y,9,true);text('Volume kg',149,y,9,true);y+=6;
 for(const r of data){if(y>277){doc.addPage();header();y=60}text(day(r.data),12,y,8);text(r.exercicios,48,y,8);text(r.series,80,y,8);text(r.repeticoes,113,y,8);text(format(r.volume),149,y,8);y+=7}
 if(!data.length)text('Sem sessoes concluidas para o periodo selecionado.',12,75,10);
 const blob=doc.output('blob'),filename='GymBody_Evolucao_Treinos_'+String(c?.nome||'Cliente').replace(/[^a-z0-9]/gi,'_')+'.pdf',file=new File([blob],filename,{type:'application/pdf'});
 try{if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Evolução dos treinos'});return}}catch(e){if(e.name==='AbortError')return}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
})();