'use strict';
(function(){
const n=v=>v===null||v===undefined||String(v).trim()===''?null:(Number.isFinite(Number(String(v).replace(',','.')))?Number(String(v).replace(',','.')):null);
const fmt=v=>n(v)===null?'—':n(v).toLocaleString('pt-PT',{maximumFractionDigits:2});
const date=s=>{const a=String(s||'').split('-');return a.length===3?a[2]+'/'+a[1]+'/'+a[0]:s||'—'};
const ascii=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7e]/g,'-');
const ink=[6,69,62],green=[0,134,103],mint=[225,248,238],pale=[240,247,246],white=[255,255,255];
function fill(doc,c,x,y,w,h){doc.setFillColor(...c);doc.rect(x,y,w,h,'F')}
function txt(doc,s,x,y,size=9,bold=false,color=ink,align){doc.setTextColor(...color);doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.text(ascii(s),x,y,align?{align}:undefined)}
function line(doc,x,y,xx,yy,color=[214,230,225]){doc.setDrawColor(...color);doc.setLineWidth(.3);doc.line(x,y,xx,yy)}
function title(doc,s,y){fill(doc,ink,12,y,186,11);txt(doc,s,17,y+7.5,12,true,white)}
function getData(){const c=db.clientes.find(x=>x.id===selectedClient);if(!c)throw Error('Seleciona um cliente.');return{c,rows:db.avaliacoes.filter(x=>x.clienteId===c.id).slice().sort((a,b)=>String(a.data).localeCompare(String(b.data)))}}
async function image(){const raw=db.config?.logo;if(typeof raw!=='string'||!raw.startsWith('data:image/'))return null;const im=new Image();im.src=raw;await im.decode();const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=290;const ctx=canvas.getContext('2d');ctx.fillStyle='#003e39';ctx.fillRect(0,0,1000,290);const k=Math.min(920/im.naturalWidth,250/im.naturalHeight);ctx.drawImage(im,(1000-im.naturalWidth*k)/2,(290-im.naturalHeight*k)/2,im.naturalWidth*k,im.naturalHeight*k);return canvas.toDataURL('image/jpeg',.85)}
function header(doc,c,logo){fill(doc,ink,0,0,210,29);if(logo)doc.addImage(logo,'JPEG',12,4,45,19);else{txt(doc,'GYMBODY',13,15,19,true,white);txt(doc,'Avaliacao fisica',13,22,8,false,white)}
txt(doc,'RELATORIO DE EVOLUCAO',198,17,15,true,white,'right');fill(doc,pale,12,35,186,21);
txt(doc,'CLIENTE',17,41,7);txt(doc,c.nome,17,49,10,true);txt(doc,'N. CLIENTE',89,41,7);txt(doc,c.numero||'—',89,49,10,true);txt(doc,'PERSONAL TRAINER',118,41,7);txt(doc,db.config.pt||'Nao configurado',118,49,9,true);txt(doc,'EMITIDO',198,41,7,false,ink,'right');txt(doc,new Date().toLocaleDateString('pt-PT'),198,49,9,true,ink,'right')}
function graph(doc,rows){const x=25,y=78,w=174,h=72,left=39,right=189,top=85,bottom=139;fill(doc,[250,253,252],12,63,186,91);txt(doc,'EVOLUCAO DO PESO',18,73,12,true);const pts=rows.map(r=>({d:r.data,v:n(r.peso)})).filter(p=>p.v!==null&&p.v>=0);
if(pts.length>=2){const first=pts[0].v,last=pts[pts.length-1].v,diff=last-first,pct=first?100*diff/first:null;const label=(diff>0?'+':'')+fmt(diff)+' kg'+(pct===null?'':' ('+(pct>0?'+':'')+fmt(pct)+' %)');fill(doc,mint,139,65,55,10);txt(doc,label,190,72,9,true,ink,'right')}
if(!pts.length){txt(doc,'Sem registos de peso',50,110,11);return}
const vals=pts.map(p=>p.v),min=Math.min(...vals),max=Math.max(...vals),low=Math.max(0,Math.floor((min-3)/5)*5),high=Math.max(low+5,Math.ceil((max+3)/5)*5),range=high-low;
for(let i=0;i<5;i++){const v=low+i*range/4,yy=bottom-i*(bottom-top);line(doc,left,yy,right,yy);txt(doc,fmt(v),left-3,yy+1.5,7,false,ink,'right')}
line(doc,left,top,left,bottom,[102,143,135]);line(doc,left,bottom,right,bottom,[102,143,135]);
const xy=pts.map((p,i)=>({x:left+8+(pts.length===1?(right-left-16)/2:i*(right-left-16)/(pts.length-1)),y:bottom-((p.v-low)/range)*(bottom-top),...p}));
doc.setDrawColor(...green);doc.setLineWidth(.9);for(let i=1;i<xy.length;i++)line(doc,xy[i-1].x,xy[i-1].y,xy[i].x,xy[i].y,green);
for(const p of xy){doc.setFillColor(...green);doc.circle(p.x,p.y,1.7,'F')}
const indices=pts.length<=4?pts.map((_,i)=>i):[0,Math.floor((pts.length-1)/2),pts.length-1];
for(const i of indices){const p=xy[i];txt(doc,fmt(p.v)+' kg',p.x,p.y-4,8,true,ink,'center');txt(doc,date(p.d).slice(0,10),p.x,147,7,false,ink,'center')}
}
const cols=[{label:'Data',key:'data',w:29},{label:'Peso (kg)',key:'peso',w:24},{label:'Gordura (%)',key:'gordura',w:25},{label:'Cintura (cm)',key:'cintura',w:25},{label:'Densidade ossea',key:'densidadeOssea',w:30},{label:'Idade metabolica',key:'idadeMetabolica',w:27},{label:'Hidratacao (%)',key:'hidratacaoMuscular',w:26}];
function tableHeader(doc,y){fill(doc,mint,12,y,186,13);let x=12;for(const col of cols){txt(doc,col.label,x+col.w/2,y+8,7,true,ink,'center');x+=col.w}return y+13}
function tableRow(doc,r,y,i){if(i%2===1)fill(doc,pale,12,y,186,9);let x=12;for(const col of cols){let v=col.key==='data'?date(r.data):fmt(r[col.key]);txt(doc,v,x+col.w/2,y+6,8,i===rows.length-1,ink,'center');x+=col.w}line(doc,12,y+9,198,y+9);return y+9}
function variation(doc,rows,y){fill(doc,mint,12,y,186,12);txt(doc,'VARIACAO - ULTIMA VS. PRIMEIRA AVALIACAO',17,y+8,10,true);y+=16;
const fields=[['Peso','peso','kg'],['Gordura','gordura','p.p.'],['Cintura','cintura','cm'],['Densidade ossea','densidadeOssea',''],['Idade metabolica','idadeMetabolica','anos'],['Hidratacao muscular','hidratacaoMuscular','p.p.']];
const first=rows[0],last=rows[rows.length-1];for(let i=0;i<fields.length;i++){const [label,key,unit]=fields[i],x=12+i*31,a=n(first?.[key]),b=n(last?.[key]);if(i)line(doc,x,y,x,y+27);txt(doc,label,x+15.5,y+6,7,true,ink,'center');txt(doc,a===null||b===null||rows.length<2?'—':(b-a>0?'+':'')+fmt(b-a)+(unit?' '+unit:''),x+15.5,y+19,9,true,green,'center')}return y+32}
function footer(doc){fill(doc,ink,0,288,210,9);txt(doc,'GymBody  |  Relatorio individual  |  Interpretacao a cargo do Personal Trainer',105,294,7,false,white,'center')}
async function makePdf(){if(!window.GymBodyPDF)throw Error('Gerador PDF nao carregado.');const {c,rows}=getData(),doc=new window.GymBodyPDF(),logo=await image().catch(()=>null);header(doc,c,logo);graph(doc,rows);title(doc,'HISTORICO DAS AVALIACOES',160);let y=174;y=tableHeader(doc,y);for(let i=0;i<rows.length;i++){if(y+9>244){footer(doc);doc.addPage();title(doc,'HISTORICO DAS AVALIACOES (CONT.)',15);y=31;y=tableHeader(doc,y)}y=tableRow(doc,rows[i],y,i)}
if(!rows.length){txt(doc,'Ainda nao existem avaliacoes registadas.',18,y+10);y+=15}
if(y+54>281){footer(doc);doc.addPage();y=19}variation(doc,rows,y+8);footer(doc);
const filename='Relatorio_'+ascii(c.nome).replace(/[^a-zA-Z0-9_-]/g,'_')+'_'+new Date().toISOString().slice(0,10)+'.pdf';return{blob:doc.output('blob'),filename}}
async function action(button){button.disabled=true;const old=button.textContent;button.textContent='A gerar PDF…';try{const {blob,filename}=await makePdf();const file=new File([blob],filename,{type:'application/pdf'});if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({files:[file],title:'Relatório de evolução'});return}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);alert('PDF criado. Se não aparecer a partilha, abre o ficheiro descarregado e envia-o pelo WhatsApp ou e-mail.')}catch(e){if(e?.name!=='AbortError')alert('Não foi possível gerar o PDF: '+(e.message||e))}finally{button.disabled=false;button.textContent=old}}
function enhance(){if(view!=='relatorios')return;const old=document.getElementById('printReport');if(!old)return;const button=old.cloneNode(false);button.id='printReport';button.type='button';button.textContent='Gerar e partilhar PDF';old.replaceWith(button);button.addEventListener('click',()=>action(button));document.querySelector('.report-standalone-note')?.remove();const note=document.createElement('p');note.className='muted';note.style.fontSize='.82rem';note.textContent='Cria um ficheiro PDF real com o logótipo, o gráfico do peso e o histórico. Podes enviá-lo por WhatsApp, e-mail ou guardá-lo no iPhone.';button.parentElement?.after(note)}
const prior=render;render=function(){prior();enhance()};enhance();
})();
