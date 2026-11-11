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
 const doc=new GymBodyPDF(),c=get('clientes',plan.clienteId),rows=plan.exercicios||[];
 const ink=[23,59,56],green=[12,112,104],pale=[234,246,242],border=[195,218,211];
 const txt=(v,x,y,size=9,bold=false,color=ink)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(ascii(v),x,y)};
 const fit=(v,max,size=9)=>{let t=ascii(v);const limit=Math.max(4,Math.floor(max*2.83/(size*.54)));return t.length>limit?t.slice(0,limit-1)+'…':t};
 const setRows=row=>Array.from({length:Math.max(1,Math.min(20,Number(row.series)||1))},(_,i)=>row.seriesDetalhe?.[i]||{reps:row.reps,carga:row.carga});
 const prepared=await Promise.all(rows.map(async(row,i)=>{const ex=get('exercicios',row.exercicioId);return {row,i,name:ex?.nome||'Exercicio removido',image:await imageJPEG(ex?.foto||ex?.repdbImage),sets:setRows(row)}}));
 const header=()=>{doc.setFillColor(...green);doc.rect(0,0,210,9,'F');txt(fit(db.config?.ginasio||'GymBody',130,11),12,17,11,true);txt('GUIAO DE TREINO',198,17,10,true);doc.setDrawColor(...border);doc.line(12,20,198,20);
 txt(fit('Cliente: '+(c?.nome||'Cliente removido'),113,9),12,27,9,true);txt('Data: '+fmtDate(plan.data),198,27,9,true);
 txt(fit('Sessao: '+(plan.nome||''),186,8),12,34,8);
 if(plan.tipo)txt(fit('Tipo de treino: '+plan.tipo,186,8),12,41,8);
 txt(fit('PT: '+(db.config?.pt||'Nao definido'),186,8),12,plan.tipo?48:41,8);
 };
 const top=plan.tipo?55:48,footer=282, gap=4,left=12,colW=91, usable=footer-top;
 const cardHeight=(entry,compact)=>{const count=entry.sets.length;const perRow=compact?3:2;const lines=Math.ceil(count/perRow);return (compact?22:28)+lines*(compact?6.2:7.2)+(entry.image?(compact?21:29):0)};
 let layout=null;
 for(const compact of [false,true]){
   const cols=[[],[]],heights=[0,0];
   for(const item of prepared){const h=cardHeight(item,compact);const k=heights[0]<=heights[1]?0:1;cols[k].push({item,y:top+heights[k],h});heights[k]+=h+gap}
   if(Math.max(...heights)<=usable){layout={cols,compact};break}
 }
 // For long programmes, use extra pages instead of shrinking text until it becomes illegible.
 const compact=layout?.compact??true;
 const pages=[];if(layout){pages.push(layout.cols)}else{
   let cols=[[],[]],heights=[0,0];
   for(const item of prepared){const h=cardHeight(item,true);let k=heights[0]<=heights[1]?0:1;
     if(heights[k]+h>usable&&heights[1-k]+h<=usable)k=1-k;
     if(heights[k]+h>usable){pages.push(cols);cols=[[],[]];heights=[0,0];k=0}
     cols[k].push({item,y:top+heights[k],h});heights[k]+=h+gap;
   }pages.push(cols)
 }
 const drawCard=(box,k)=>{const {item,y,h}=box,{row,i,name,image,sets}=item,x=left+k*(colW+4),small=compact;
   doc.setDrawColor(...border);doc.setLineWidth(.3);doc.rect(x,y,colW,h);
   doc.setFillColor(...pale);doc.rect(x+.3,y+.3,colW-.6,small?12:15,'F');
   doc.setFillColor(...green);doc.rect(x+2,y+2,10,10,'F');txt(String(i+1),x+7,y+9,10,true,[255,255,255]);
   txt(fit(name,colW-17,small?8.4:9),x+14,y+9,small?8.4:9,true);
   let yy=y+(small?17:20);
   txt('Descanso: '+(row.descanso||0)+' s',x+3,yy,7.5);yy+=small?6:7;
   const per=small?3:2,cell=(colW-6)/per;
   sets.forEach((set,j)=>{const col=j%per,line=Math.floor(j/per),sx=x+3+col*cell,sy=yy+line*(small?6.2:7.2);txt((j+1)+': '+set.reps+' x '+String(set.carga).replace('.',',')+' kg',sx,sy,small?7.1:8)});
   if(image){const iw=small?25:34,ih=small?17:24,ratio=image.w/image.h;const dw=Math.min(iw,ih*ratio),dh=Math.min(ih,iw/ratio);doc.addImage(image.data,'JPEG',x+colW-dw-3,y+h-dh-2,dw,dh)}
 };
 pages.forEach((cols,pageIndex)=>{if(pageIndex)doc.addPage();header();for(let k=0;k<2;k++)for(const box of cols[k])drawCard(box,k);
   doc.setDrawColor(...border);doc.line(12,286,198,286);txt('GymBody  |  Exercicios por ordem numerica',12,292,7.5);txt('Pagina '+(pageIndex+1)+'/'+pages.length,198,292,7.5);
 });
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
