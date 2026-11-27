'use strict';
/* GymBody v67: configuração local e preparação explícita de avisos Telegram.
   Não envia mensagens automaticamente nem expõe credenciais. */
(function(){
 const bot='GymBodyMiguelBot';
 const escape=s=>h(String(s??''));
 const offsets=[15,30,60,120,1440];
 const defaultText='Olá {cliente}, recordamos que tens um treino marcado para {data} às {hora}. Até breve!';
 function format(m){
  const c=get('clientes',m.clienteId);
  return String(m.avisoTexto||defaultText).replace(/\{cliente\}/g,c?.nome||'').replace(/\{data\}/g,new Date(m.data+'T12:00:00').toLocaleDateString('pt-PT')).replace(/\{hora\}/g,m.hora);
 }
 const previous=screens.agenda;
 screens.agenda=function(){
  const active=db.marcacoes.find(x=>x.id===document.body.dataset.gymAvisoEdit);
  const current=active||null;
  const enabled=!!current?.avisoTelegram;
  const html='<section><h2>Lembretes Telegram — preparação</h2><p class="muted">As preferências ficam guardadas apenas neste dispositivo. A entrega automática ainda não está ativa; não serão enviados avisos sem confirmação.</p><label>Marcação</label><select id="gymAvisoBooking"><option value="">Selecionar marcação</option>'+db.marcacoes.filter(x=>x.data===document.querySelector('#agDay')?.value||x.data===new Date().toISOString().slice(0,10)).map(x=>'<option value="'+escape(x.id)+'" '+(x.id===current?.id?'selected':'')+'>'+escape(x.hora+' — '+(get('clientes',x.clienteId)?.nome||'Cliente'))+'</option>').join('')+'</select>'+(current?'<label><input type="checkbox" id="gymAvisoEnabled" '+(enabled?'checked':'')+'> Preparar lembrete para esta marcação</label><label>Antecedência</label><select id="gymAvisoOffset">'+offsets.map(n=>'<option value="'+n+'" '+((current.avisoMinutos||60)===n?'selected':'')+'>'+(n===1440?'1 dia':n>=60?n/60+' h':n+' min')+'</option>').join('')+'</select><label>Mensagem</label><textarea id="gymAvisoText" maxlength="500">'+escape(current.avisoTexto||defaultText)+'</textarea><p class="muted">Campos: {cliente}, {data}, {hora}. Para receber avisos, o cliente terá de iniciar conversa com o bot e autorizar as mensagens.</p><div class="actions"><button type="button" id="gymAvisoSave">Guardar preferências</button><button type="button" class="secondary" id="gymAvisoCopy">Copiar mensagem</button><button type="button" class="secondary" id="gymAvisoOpen">Abrir bot Telegram</button></div>':'<p class="muted">Seleciona uma marcação para configurar o aviso.</p>')+'</section>';
  return previous()+html;
 };
 const previousWire=wire;
 wire=function(){
  previousWire();
  if(view!=='agenda')return;
  const by=x=>document.getElementById(x);
  by('gymAvisoBooking')?.addEventListener('change',e=>{document.body.dataset.gymAvisoEdit=e.target.value;render()});
  by('gymAvisoSave')?.addEventListener('click',()=>{
   const m=db.marcacoes.find(x=>x.id===document.body.dataset.gymAvisoEdit);if(!m)return;
   const before={...m};
   m.avisoTelegram=by('gymAvisoEnabled').checked;
   m.avisoMinutos=Number(by('gymAvisoOffset').value);
   m.avisoTexto=by('gymAvisoText').value.slice(0,500);
   if(!save()){Object.assign(m,before);return}
   alert('Preferências guardadas localmente. O envio automático ainda não está ativo.');
  });
  by('gymAvisoCopy')?.addEventListener('click',async()=>{
   const m=db.marcacoes.find(x=>x.id===document.body.dataset.gymAvisoEdit);if(!m)return;
   try{await navigator.clipboard.writeText(format({...m,avisoTexto:by('gymAvisoText').value}));alert('Mensagem copiada.')}catch{alert('Não foi possível copiar automaticamente.')}
  });
  by('gymAvisoOpen')?.addEventListener('click',()=>{window.open('https://t.me/'+bot,'_blank','noopener,noreferrer')});
 };
})();