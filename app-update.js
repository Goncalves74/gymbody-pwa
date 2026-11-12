'use strict';
/* GymBody v49: manual update without clearing user data. */
(function(){
 const css=document.createElement('style');
 css.textContent='#gymUpdatePanel{border:2px solid var(--primary,#087f7a)}#gymForceUpdate{width:100%;margin:10px 0 6px}#gymUpdateStatus{min-height:1.4em}';
 document.head.appendChild(css);
 const oldConfig=screens.config;
 screens.config=()=>'<section id="gymUpdatePanel"><h2>Atualização da aplicação</h2><p class="muted">Versão 52 · Verifica e descarrega a versão mais recente do GymBody, sem eliminar os dados dos clientes.</p><button type="button" id="gymForceUpdate">Forçar atualização</button><p class="muted" id="gymUpdateStatus" role="status" aria-live="polite">É necessária uma ligação à internet.</p></section>'+oldConfig();
 const oldRender=render;
 render=function(){oldRender();if(view==='config')document.getElementById('gymForceUpdate')?.addEventListener('click',update)};
 async function update(){
  const button=document.getElementById('gymForceUpdate'),status=document.getElementById('gymUpdateStatus');
  if(!button||!status)return;
  button.disabled=true;status.textContent='A verificar a versão publicada…';
  try{
   const probe=await fetch('./index.html?gym-update='+Date.now(),{cache:'no-store'});
   if(!probe.ok)throw Error('Não foi possível contactar o servidor ('+probe.status+').');
   const html=await probe.text();
   if(!html.includes('<title>GymBody PWA</title>'))throw Error('A resposta do servidor não corresponde ao GymBody.');
   status.textContent='A descarregar os ficheiros atualizados…';
   if('serviceWorker' in navigator){
    const registration=await navigator.serviceWorker.getRegistration();
    if(registration){
     await registration.update();
     if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
    }
   }
   // Apenas caches de ficheiros da aplicação. Nunca remove localStorage/IndexedDB.
   if('caches' in window){
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('gymbody-v')).map(k=>caches.delete(k)));
   }
   status.textContent='Atualização concluída. A reiniciar o GymBody…';
   const url=new URL(location.href);url.searchParams.set('updated',String(Date.now()));
   location.replace(url.toString());
  }catch(err){
   status.textContent='Não foi possível atualizar: '+(err?.message||err)+'. Verifica a internet e tenta novamente.';
   button.disabled=false;
  }
 }
})();
