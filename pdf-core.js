'use strict';
/* Minimal self-contained PDF writer for GymBody reports. No network dependency. */
(function(){
const enc=new TextEncoder(),mm=v=>v*72/25.4,fmt=v=>Number(v).toFixed(3),W=mm(210),H=mm(297);
const esc=s=>String(s??'').replace(/[^\x20-\x7e\xA0-\xFF]/g,'?').replace(/[\\()]/g,'\\$&');
const latin=s=>{const arr=[];for(const ch of String(s)){const n=ch.charCodeAt(0);arr.push(n<=255?n:63)}return Uint8Array.from(arr)};
const join=arrays=>{let length=arrays.reduce((a,b)=>a+b.length,0),out=new Uint8Array(length),i=0;for(const a of arrays){out.set(a,i);i+=a.length}return out};
class GymPDF{
constructor(){this.pages=[[]];this.page=0;this.fontSize=10;this.font='F1';this.draw=[0,0,0];this.fill=[0,0,0];this.ink=[0,0,0];this.width=.3;this.images=[]}
cmd(s){this.pages[this.page].push(s)}
setDrawColor(r,g,b){this.draw=[r,g,b]}
setFillColor(r,g,b){this.fill=[r,g,b]}
setTextColor(r,g,b){this.ink=[r,g,b]}
setLineWidth(v){this.width=v}
setFontSize(v){this.fontSize=v}
setFont(name,style){this.font=style==='bold'?'F2':'F1'}
rgb(a,op){return a.map(v=>fmt(v/255)).join(' ')+op}
line(x1,y1,x2,y2){this.cmd(this.rgb(this.draw,' RG')+' '+fmt(mm(this.width))+' w '+fmt(mm(x1))+' '+fmt(H-mm(y1))+' m '+fmt(mm(x2))+' '+fmt(H-mm(y2))+' l S')}
rect(x,y,w,h,mode){this.cmd(this.rgb(mode==='F'?this.fill:this.draw,mode==='F'?' rg':' RG')+' '+fmt(mm(x))+' '+fmt(H-mm(y+h))+' '+fmt(mm(w))+' '+fmt(mm(h))+' re '+(mode==='F'?'f':'S'))}
roundedRect(x,y,w,h,r1,r2,mode){this.rect(x,y,w,h,mode)}
circle(x,y,r,mode){const k=.55228475,xx=mm(x),yy=H-mm(y),rr=mm(r),c=rr*k;this.cmd(this.rgb(mode==='F'?this.fill:this.draw,mode==='F'?' rg':' RG')+' '+[fmt(xx+rr),fmt(yy),'m',fmt(xx+rr),fmt(yy+c),fmt(xx+c),fmt(yy+rr),fmt(xx),fmt(yy+rr),'c',fmt(xx-c),fmt(yy+rr),fmt(xx-rr),fmt(yy+c),fmt(xx-rr),fmt(yy),'c',fmt(xx-rr),fmt(yy-c),fmt(xx-c),fmt(yy-rr),fmt(xx),fmt(yy-rr),'c',fmt(xx+c),fmt(yy-rr),fmt(xx+rr),fmt(yy-c),fmt(xx+rr),fmt(yy),'c',mode==='F'?'f':'S'].join(' '))}
text(value,x,y,opts){const t=String(value??''),sz=this.fontSize;let width=0;for(const ch of t)width+=(ch===' '?0.25:ch==='i'||ch==='l'?0.27:ch==='W'||ch==='M'?0.9:0.52)*sz;if(opts?.align==='center')x-=width/2/(72/25.4);if(opts?.align==='right')x-=width/(72/25.4);this.cmd(this.rgb(this.ink,' rg')+' BT /'+this.font+' '+fmt(sz)+' Tf 1 0 0 1 '+fmt(mm(x))+' '+fmt(H-mm(y))+' Tm ('+esc(t)+') Tj ET')}
addPage(){this.pages.push([]);this.page=this.pages.length-1}
addImage(data,type,x,y,w,h){if(type!=='JPEG')throw Error('Imagem PDF deve ser JPEG');const b64=data.split(',')[1];if(!b64)throw Error('Imagem JPEG inválida');const bin=atob(b64),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));const dimensions=window.GymBodyImageDimensions?.get(data)||{width:1000,height:290};const im={bytes,width:dimensions.width,height:dimensions.height,name:'Im'+(this.images.length+1)};this.images.push(im);this.cmd('q '+fmt(mm(w))+' 0 0 '+fmt(mm(h))+' '+fmt(mm(x))+' '+fmt(H-mm(y+h))+' cm /'+im.name+' Do Q')}
output(kind){if(kind!=='blob')throw Error('Formato não suportado');const objects=[];const put=(id,parts)=>{objects[id]=parts};const pagesId=2,rootId=1,fontId=3,boldId=4;put(rootId,enc.encode('<< /Type /Catalog /Pages 2 0 R >>'));put(fontId,enc.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'));put(boldId,enc.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'));
let next=5;const imageIds=this.images.map(()=>next++);const pageIds=this.pages.map(()=>next++);const contentIds=this.pages.map(()=>next++);
this.images.forEach((im,i)=>put(imageIds[i],join([enc.encode('<< /Type /XObject /Subtype /Image /Width '+im.width+' /Height '+im.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+im.bytes.length+' >>\nstream\n'),im.bytes,enc.encode('\nendstream')])));
this.pages.forEach((commands,i)=>{const body=latin(commands.join('\n')+'\n');put(contentIds[i],join([enc.encode('<< /Length '+body.length+' >>\nstream\n'),body,enc.encode('endstream')]));const images=this.images.map((im,j)=>'/'+im.name+' '+imageIds[j]+' 0 R').join(' ');put(pageIds[i],enc.encode('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+fmt(W)+' '+fmt(H)+'] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << '+images+' >> >> /Contents '+contentIds[i]+' 0 R >>'))});
put(pagesId,enc.encode('<< /Type /Pages /Count '+this.pages.length+' /Kids ['+pageIds.map(i=>i+' 0 R').join(' ')+'] >>'));
const chunks=[enc.encode('%PDF-1.4\n%GYMBODY\n')],offsets=[0];let position=chunks[0].length;for(let i=1;i<objects.length;i++){const pre=enc.encode(i+' 0 obj\n'),post=enc.encode('\nendobj\n'),body=objects[i];offsets[i]=position;chunks.push(pre,body,post);position+=pre.length+body.length+post.length}const xref=position;let table='xref\n0 '+objects.length+'\n0000000000 65535 f \n';for(let i=1;i<objects.length;i++)table+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';table+='trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';chunks.push(enc.encode(table));return new Blob(chunks,{type:'application/pdf'})}
}
window.GymBodyPDF=GymPDF;
})();
