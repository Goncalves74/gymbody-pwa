'use strict';
/* v66: native JSON backup sharing and non-destructive weekly reminder. */
(function(){
 const LAST='gymbody-backup-last-prepared-v1';
 const REMIND='gymbody-backup-last-reminder-v1';
 const WEEK=7*24*60*60*1000;
 const readTime=k=>{try{return Number(localStorage.getItem(k))||0}catch{return 0}};
 const writeTime=(k,t)=>{try{localStorage.setItem(k,String(t))}catch{}};
 const hasRecords=()=>['clientes','avaliacoes','planos','planosDatados','sessoes','registos','modelosTreino'].some(k=>Array.isArray(db[k])&&db[k].length>0);
 const stamp=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')+'_'+[d.getHours(),d.getMinutes(),d.getSeconds()].map(n=>String(n).padStart(2,'0')).join('-')};
 function makeFile(){const json=JSON.stringify({version:2,data:db},null,2);return new File([json],'gymbody-backup-'+stamp()+'.json',{type:'application/json'})}
 function download(file){const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
 async function exportBackup(){
  if(blocked){alert('Os dados locais estão ilegíveis. Não é seguro exportar uma base vazia.');return}
  const file=makeFile();
  // Mark as prepared only; iOS does not confirm whether the user saved the file.
  writeTime(LAST,Date.now());
  if(navigator.share&&navigator.canShare?.({files:[file]})){
   try{await navigator.share({files:[file],title:'Cópia de segurança GymBody'});return}
   catch(err){if(err?.name==='AbortError')return;/* fall back to download */}
  }
  download(file);
  alert('Foi preparado um ficheiro JSON. Confirma que ficou guardado em Ficheiros, iCloud Drive ou Google Drive. O GymBody não consegue confirmar o destino.');
 }
 function close(){document.getElementById('gymBackupReminder')?.remove()}
 function showReminder(){
  if(document.getElementById('gymBackupReminder')||!hasRecords()||blocked)return;
  const now=Date.now(),last=readTime(LAST),reminded=readTime(REMIND);
  if((last&&now-last<WEEK)||(reminded&&now-reminded<WEEK))return;
  writeTime(REMIND,now);
  const dialog=document.createElement('div');dialog.id='gymBackupReminder';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','gymBackupTitle');
  dialog.innerHTML='<div class="gym-backup-dialog"><h2 id="gymBackupTitle">Recorda-te de fazer uma cópia de segurança</h2><p>Os dados dos clientes estão guardados neste dispositivo. Guarda um ficheiro JSON no iCloud Drive ou Google Drive para os proteger.</p><p class="muted">A partilha abre as opções do iPhone. Confirma manualmente que o ficheiro ficou guardado.</p><div class="actions"><button type="button" id="gymBackupNow">Fazer cópia de segurança</button><button type="button" class="secondary" id="gymBackupLater">Mais tarde</button></div></div>';
  document.body.appendChild(dialog);
  dialog.querySelector('#gymBackupLater').addEventListener('click',close);
  dialog.querySelector('#gymBackupNow').addEventListener('click',()=>{close();exportBackup()});
  dialog.querySelector('#gymBackupNow').focus();
 }
 const style=document.createElement('style');style.textContent='#gymBackupReminder{position:fixed;inset:0;background:#061d22b9;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}#gymBackupReminder .gym-backup-dialog{background:#fff;color:#173b40;width:min(100%,460px);border-radius:18px;padding:24px;box-shadow:0 20px 80px #0006}#gymBackupReminder .gym-backup-dialog h2{margin:0 0 14px;font-size:1.2rem}#gymBackupReminder .gym-backup-dialog p{line-height:1.55}#gymBackupReminder .actions{display:flex;flex-wrap:wrap;gap:9px}html[data-gym-theme="dark"] #gymBackupReminder .gym-backup-dialog{background:#1c292d;color:#eef8f6}';document.head.appendChild(style);
 // Capture the existing export button without changing the legacy data import.
 document.addEventListener('click',e=>{const button=e.target.closest?.('#export,[data-gym-export-backup]');if(!button)return;e.preventDefault();e.stopImmediatePropagation();exportBackup()},true);
 const oldData=screens.dados;
 screens.dados=()=>oldData().replace('Exportar JSON','Guardar ou partilhar JSON')+'<section><h2>Cópia de segurança</h2><p class="muted">Última preparação de ficheiro: '+(readTime(LAST)?new Date(readTime(LAST)).toLocaleString('pt-PT'):'Sem registo')+'. O destino do ficheiro não pode ser confirmado automaticamente.</p><p>Ao exportar no iPhone, escolhe Guardar em Ficheiros (iCloud Drive) ou Google Drive, se estiver disponível.</p></section>';
 // On first use, prompt if there are records; after that at most once per seven days.
 window.addEventListener('load',()=>setTimeout(showReminder,1800));
 window.GymBodyBackup={exportBackup,showReminder};
})();
