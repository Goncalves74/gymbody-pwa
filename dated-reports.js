'use strict';
/* Integrates dated plans with reporting and native PDF sharing. */
(function(){
const esc=h,fmtDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s.slice(8)+'/'+s.slice(5,7)+'/'+s.slice(0,4):s;
const ascii=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\xFF]/g,'?');
const safe=s=>ascii(s).replace(/[^a-z0-9_-]+/gi,'_').slice(0,50);
const plans=()=>Array.isArray(db.planosDatados)?db.planosDatados:[];
window.GymBodyImageDimensions=window.GymBodyImageDimensions||new Map();
async function imageJPEG(src){
 if(!src)return null;
 try{
 const img=new Image();img.crossOrigin='anonymous';img.src=src;await img.decode();
 const w=Math.max(1,img.naturalWidth),hh=Math.max(1,img.naturalHeight),scale=Math.min(1,720/Math.max(w,hh));
 const canvas=document.createElement('canvas');canvas.width=Math.round(w*scale);canvas.height=Math.round(hh*scale);
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
 const data=canvas.toDataURL('image/jpeg',.8);window.GymBodyImageDimensions.set(data,{width:canvas.width,height:canvas.height});return {data,w:canvas.width,h:canvas.height};
 }catch(_){return null}
}
async function pdf(plan){
 if(!window.GymBodyPDF)throw Error('O gerador de PDF não está disponível.');
 const doc=new GymBodyPDF();let y=23;
 const write=(s,x=20,size=10,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(23,59,56);doc.text(ascii(s),x,y)};
 const page=()=>{doc.addPage();y=24;doc.setFillColor(12,112,104);doc.rect(0,0,210,9,'F')};
 const need=n=>{if(y+n>276)page()};
 const c=get('clientes',plan.clienteId);
 doc.setFillColor(12,112,104);doc.rect(0,0,210,9,'F');
 write(db.config?.ginasio||'GymBody',20,17,true);y+=12;
 write('GUIAO INDIVIDUAL DE TREINO',20,14,true);y+=11;
 write('Cliente: '+(c?.nome||'Cliente removido'));y+=7;
 write('N.º cliente: '+(c?.numero||'—'));y+=7;
 write('Personal Trainer: '+(db.config?.pt||'Nao definido'));y+=7;
 write('Sessao: '+plan.nome);y+=7;
 write('Data: '+fmtDate(plan.data));y+=13;
 for(const [i,row] of plan.exercicios.entries()){
  const ex=get('exercicios',row.exercicioId),label=(i+1)+'. '+(ex?.nome||'Exercicio removido');
  const illustration=await imageJPEG(ex?.foto||ex?.repdbImage);const height=illustration?66:37;need(height);
  doc.setFillColor(234,246,242);doc.rect(19,y-6,172,9,'F');write(label.slice(0,72),22,10,true);y+=12;
  write('Series: '+row.series+'    Repeticoes: '+row.reps+'    Carga: '+String(row.carga).replace('.',',')+' kg',22,9);y+=7;
  write('Descanso: '+(row.descanso||0)+' segundos',22,9);y+=8;if(illustration){const w=Math.min(60,illustration.w*48/illustration.h),hh=w*illustration.h/illustration.w;doc.addImage(illustration.data,'JPEG',22,y,w,hh);y+=hh+4}
  doc.setDrawColor(190,212,205);doc.line(22,y,188,y);y+=10;
 }
 need(20);write('Notas / observacoes:',20,9,true);y+=9;doc.setDrawColor(190,212,205);doc.line(20,y,190,y);
 const blob=doc.output('blob'),filename='GymBody_Treino_'+safe(c?.nome||'Cliente')+'_'+plan.data+'.pdf';
 return {blob,filename};
}
async function deliver(plan,share){
 const {blob,filename}=await pdf(plan);
 const file=new File([blob],filename,{type:'application/pdf'});
 if(share&&navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Guiao de treino '+fmtDate(plan.data)});return}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 if(share)alert('PDF guardado. Podes enviá-lo pelo WhatsApp ou por e-mail a partir de Ficheiros.');
}
function sessions(){
 if(view!=='sessoes')return;
 const picker=document.querySelector('#sessionPlan');if(!picker)return;
 const client=document.querySelector('#sessionClient')?.value;
 const rows=plans().filter(p=>p.clienteId===client).sort((a,b)=>a.data.localeCompare(b.data));
 picker.innerHTML='<option value="">Selecionar treino agendado</option>'+rows.map(p=>'<option value="'+esc(p.id)+'">'+esc(fmtDate(p.data)+' · '+p.nome)+'</option>').join('');
 picker.addEventListener('change',event=>{
  const p=plans().find(x=>x.id===event.target.value);if(!p)return;
  sessionPlan=p.nome+' · '+fmtDate(p.data);
  sessionDraft=p.exercicios.map(x=>({exerciseId:x.exercicioId,planId:x.exercicioId,sets:Array.from({length:Number(x.series)||1},()=>({reps:Number(x.reps),carga:Number(x.carga),done:false}))}));
  sessionMode='livre';render();
  const date=document.querySelector('#sessionDate');if(date)date.value=p.data;
 },true);
}
window.GymBodyDatedPDF={deliver};
// PDF sharing is invoked directly from each dated plan card.
})();
