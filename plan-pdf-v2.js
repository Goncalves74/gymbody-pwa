'use strict';
/* GymBody: single PDF workflow for training plans, independent of print CSS. */
(function(){
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ascii=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\xFF]/g,'?');
const formatDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s.slice(8)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'Não definida';
const fmt=v=>String(v??'—').replace('.',',');
const clean=s=>ascii(s).replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,65);
const pdfColor=s=>{const m=/^#([0-9a-f]{6})$/i.exec(s||'');return m?[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)):[8,111,104]};
function chosen(){
 const clientId=document.getElementById('shareClient')?.value,group=document.getElementById('shareGroup')?.value;
 if(!clientId||!group)throw Error('Seleciona um cliente e um treino.');
 const client=db.clientes.find(c=>c.id===clientId);
 const items=db.planos.filter(p=>p.clienteId===clientId&&p.sessao===group);
 if(!client||!items.length)throw Error('O plano selecionado não contém exercícios.');
 return {client,group,items};
}
async function logoData(){
 const src=db.config?.logo;if(!src||!/^data:image\/(png|jpeg|webp);base64,/.test(src))return null;
 const img=new Image();img.src=src;await img.decode();
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=250;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,960,250);
 const scale=Math.min(900/img.naturalWidth,210/img.naturalHeight);
 ctx.drawImage(img,(960-img.naturalWidth*scale)/2,(250-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);
 return canvas.toDataURL('image/jpeg',.83);
}
async function buildPlan(p,plannedDate){
 if(!window.GymBodyPDF)throw Error('O módulo PDF não está disponível. Atualiza a aplicação.');
 const doc=new window.GymBodyPDF(),primary=pdfColor(db.config?.cor);
 const dated=(db.planosDatados||[]).filter(x=>x.clienteId===p.client.id&&x.data===plannedDate).sort((a,b)=>b.exercicios.length-a.exercicios.length)[0];
 let y=18,page=1;
 const line=(t,x=20,size=10,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(35,59,57);doc.text(ascii(t),x,y)};
 const newPage=()=>{doc.addPage();page++;y=21;doc.setFillColor(...primary);doc.rect(17,12,176,2,'F')};
 const need=(height)=>{if(y+height>273)newPage()};
 doc.setFillColor(...primary);doc.rect(0,0,210,10,'F');
 const logo=await logoData().catch(()=>null);
 if(logo){doc.addImage(logo,'JPEG',20,15,170,44);y=68}
 else {y=28;line(db.config?.ginasio||'GYMBODY',20,19,true);y=43}
 doc.setDrawColor(...primary);doc.setLineWidth(.65);doc.line(20,y,190,y);y+=12;
 line('PLANO INDIVIDUAL DE TREINO',20,17,true);y+=12;
 line('Ginasio: '+(db.config?.ginasio||'GymBody'));y+=7;
 line('Personal Trainer: '+(db.config?.pt||'Nao configurado'));y+=7;
 line('Cliente: '+p.client.nome);y+=7;
 line('Numero de cliente: '+(p.client.numero||'—'));y+=7;
 line('Treino: '+p.group,20,11,true);y+=7;
 if(dated){line('Nome da sessao: '+dated.nome,20,10,true);y+=7;if(dated.tipo){line('Tipo de treino: '+dated.tipo,20,10,true);y+=7}}
 line('Data prevista: '+formatDate(plannedDate),20,11,true);y+=7;
 line('Emitido em: '+new Date().toLocaleDateString('pt-PT'));y+=13;
 const headings=()=>{doc.setFillColor(231,244,240);doc.rect(20,y-6,170,10,'F');line('EXERCICIO',23,8,true);line('SER.',119,8,true);line('REP.',137,8,true);line('CARGA',159,8,true);y+=11};
 headings();
 p.items.forEach((item,i)=>{
  const name=get('exercicios',item.exercicioId)?.nome||'Exercicio removido';
  const words=ascii((i+1)+'. '+name).split(/\s+/);const rows=[];let str='';
  for(const word of words){if((str+' '+word).length>42){rows.push(str);str=word}else str+=(str?' ':'')+word}if(str)rows.push(str);
  const height=Math.max(11,rows.length*5+5);need(height+8);
  if(y<33)headings();
  rows.forEach((row,j)=>{line(row,23,8);if(j===0){line(item.series,121,8);line(item.reps,139,8);line(fmt(item.carga)+' kg',160,8)}y+=5});
  doc.setDrawColor(223,233,230);doc.line(20,y+2,190,y+2);y+=7;
 });
 need(23);y+=7;line('Notas do PT:',20,9,true);y+=8;doc.setDrawColor(210,222,218);doc.line(20,y,190,y);
 for(let i=0;i<doc.pages.length;i++){doc.setFontSize(8);doc.setTextColor(100,118,113);doc.text(ascii('GymBody · '+(db.config?.pt||'Personal Trainer')),20,286);break}
 const filename='Plano_Treino_'+clean(p.client.nome)+'_'+(plannedDate||'sem_data')+'.pdf';
 return {blob:doc.output('blob'),filename};
}
async function deliver(blob,filename,share){
 const file=new File([blob],filename,{type:'application/pdf'});
 if(share&&navigator.share&&navigator.canShare?.({files:[file]})){
  await navigator.share({files:[file],title:'Plano de treino em PDF'});return;
 }
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 if(share)alert('PDF criado. Abre o ficheiro em Ficheiros e partilha-o no WhatsApp ou por e-mail.');
}
async function execute(btn,share){
 if(btn.disabled)return;
 btn.disabled=true;const old=btn.textContent;btn.textContent='A preparar PDF…';
 try{
  const p=chosen(),date=document.getElementById('sharePlanDate')?.value;
  if(!date)throw Error('Indica a data prevista do treino.');
  const result=await buildPlan(p,date);
  await deliver(result.blob,result.filename,share);
 }catch(e){if(e?.name!=='AbortError')alert('Não foi possível preparar o plano: '+(e?.message||e))}
 finally{btn.disabled=false;btn.textContent=old}
}
function enhance(){
 const panel=document.querySelector('.share-panel');
 if(!panel||panel.dataset.pdfV2)return;
 panel.dataset.pdfV2='1';
 const group=panel.querySelector('#shareGroup');
 const label=document.createElement('label');label.textContent='Data prevista do treino';label.htmlFor='sharePlanDate';
 const date=document.createElement('input');date.id='sharePlanDate';date.type='date';date.required=true;date.value=today();
 group.after(label,date);
 const actions=panel.querySelector('.actions');
 const pdf=panel.querySelector('#sharePdf'),wa=panel.querySelector('#shareWhatsapp');
 if(!pdf||!wa)return;
 const pdfNew=pdf.cloneNode(true),waNew=wa.cloneNode(true);
 pdf.replaceWith(pdfNew);wa.replaceWith(waNew);
 pdfNew.textContent='Gerar PDF / Guardar';waNew.textContent='Enviar PDF / WhatsApp';
 pdfNew.addEventListener('click',()=>execute(pdfNew,false));
 waNew.addEventListener('click',()=>execute(waNew,true));
 const hint=document.createElement('p');hint.className='muted';hint.textContent='É criado um ficheiro PDF real. No iPhone, a partilha abre as aplicações disponíveis, incluindo WhatsApp quando compatível.';actions.after(hint);
}
const previous=render;render=function(){previous();enhance()};enhance();
})();
