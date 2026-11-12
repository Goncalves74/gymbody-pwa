'use strict';
/* GymBody v45 — painel informativo, sem modificar a base de dados. */
(function(){
 const LIMIT=5*1024*1024;
 const fmtBytes=n=>n<1024?Math.round(n)+' B':n<1024*1024?(n/1024).toLocaleString('pt-PT',{maximumFractionDigits:1})+' KB':(n/1024/1024).toLocaleString('pt-PT',{maximumFractionDigits:2})+' MB';
 const fmt=n=>Number(n||0).toLocaleString('pt-PT');
 const categories=[['Clientes','clientes'],['Avaliações','avaliacoes'],['Planos','planos'],['Planos datados','planosDatados'],['Modelos','modelosTreino'],['Sessões','sessoes'],['Registos','registos'],['Exercícios','exercicios']];
 const oldConfig=screens.config;
 function dashboard(){
   let raw='';
   try{raw=localStorage.getItem(KEY)||''}catch(e){}
   const bytes=new Blob([raw]).size;
   const percent=Math.min(100,bytes/LIMIT*100);
   const entries=categories.map(([name,key])=>({name,key,count:Array.isArray(db[key])?db[key].length:0,bytes:new Blob([JSON.stringify(Array.isArray(db[key])?db[key]:[])]).size}));
   const max=Math.max(1,...entries.map(x=>x.bytes));
   const totalSessions=Array.isArray(db.sessoes)?db.sessoes.length:0;
   return '<section id="storageDashboard"><h2>Estado do armazenamento</h2><p class="muted">Informação calculada neste dispositivo. Não é enviada para nenhum servidor.</p><div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;flex-wrap:wrap"><span>Dados guardados</span><strong>'+fmtBytes(bytes)+' / ~5 MB</strong></div><div role="progressbar" aria-label="Utilização estimada do armazenamento local" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(percent)+'" style="height:11px;border-radius:99px;background:#a8b8b733;overflow:hidden;margin:12px 0 18px"><div style="height:100%;width:'+percent.toFixed(2)+'%;background:'+(percent>85?'#b94b43':percent>60?'#c58a25':'#269b8b')+';border-radius:99px"></div></div><div class="stat-grid"><div class="stat"><strong>'+fmt(db.clientes?.length)+'</strong><span>Clientes</span></div><div class="stat"><strong>'+fmt(totalSessions)+'</strong><span>Sessões</span></div><div class="stat"><strong>'+fmt(db.avaliacoes?.length)+'</strong><span>Avaliações</span></div><div class="stat"><strong>'+fmt(db.planosDatados?.length)+'</strong><span>Planos datados</span></div></div><h3 style="margin-top:20px">Distribuição dos dados</h3><div style="display:grid;gap:12px">'+entries.filter(x=>x.count>0).map(x=>'<div><div style="display:flex;justify-content:space-between;gap:8px"><span>'+h(x.name)+' ('+fmt(x.count)+')</span><strong>'+fmtBytes(x.bytes)+'</strong></div><div style="height:8px;border-radius:10px;background:#9aa9a922;overflow:hidden;margin-top:5px"><div style="height:100%;width:'+Math.max(1,x.bytes/max*100).toFixed(2)+'%;background:#279a90;border-radius:10px"></div></div></div>').join('')+'</div><p class="muted" style="margin-top:18px">O limite de ~5 MB é uma referência habitual para localStorage, não uma medição da quota do iPhone. Os valores por categoria são aproximados e podem incluir pequenas diferenças face ao total.</p>'+(percent>=75?'<p style="font-weight:700;color:#b35b24">Atenção: o armazenamento está a aproximar-se do limite. Exporta uma cópia JSON e evita acrescentar muitos registos até resolvermos a capacidade.</p>':'')+'<button type="button" id="storageRefresh" class="secondary">Atualizar valores</button></section>';
 }
 screens.config=()=>oldConfig()+dashboard();
 const oldWire=wire;
 wire=function(){oldWire();if(view==='config')document.getElementById('storageRefresh')?.addEventListener('click',()=>render())};
})();
