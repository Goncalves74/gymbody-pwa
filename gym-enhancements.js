'use strict';
/* GymBody v44: local display preference and read-only attendance dashboard. */
(function(){
 const THEME_KEY='gymbody-theme-v1';
 let theme='auto',attendanceClient='',attendancePeriod='month',attendanceRange='6',attendanceMetric='sessions';
 try{const stored=localStorage.getItem(THEME_KEY);if(['light','dark','auto'].includes(stored))theme=stored}catch{}
 const css=`
 html[data-gym-theme="dark"]{color-scheme:dark;--bg:#10181b;--ink:#eaf5f3;--muted:#a4bec0;--line:#35494b}
 html[data-gym-theme="dark"] body{background:#10181b;color:#eaf5f3}
 html[data-gym-theme="dark"] section,html[data-gym-theme="dark"] .stat,html[data-gym-theme="dark"] .feature,html[data-gym-theme="dark"] .client-card,html[data-gym-theme="dark"] .item{background:#1c292d!important;color:#eaf5f3!important;border-color:#35494b!important}
 html[data-gym-theme="dark"] #nav{background:#182528f5!important;border-color:#35494b!important}
 html[data-gym-theme="dark"] #nav button{color:#afc4c5!important}
 html[data-gym-theme="dark"] #nav button.active{background:#244b49!important;color:#8de2d5!important}
 html[data-gym-theme="dark"] input,html[data-gym-theme="dark"] select,html[data-gym-theme="dark"] textarea{background:#263539!important;color:#eaf5f3!important;border-color:#496063!important}
 html[data-gym-theme="dark"] input::placeholder,html[data-gym-theme="dark"] textarea::placeholder{color:#a4bec0}
 html[data-gym-theme="dark"] .stat strong,html[data-gym-theme="dark"] .feature strong{color:#82d9ca!important}
 html[data-gym-theme="dark"] .muted,html[data-gym-theme="dark"] .feature small,html[data-gym-theme="dark"] .stat span{color:#afc5c6!important}
 html[data-gym-theme="dark"] .chip,html[data-gym-theme="dark"] .feature-icon,html[data-gym-theme="dark"] .avatar{background:#244b49!important;color:#9ce5d9!important}
 html[data-gym-theme="dark"] .share-panel{background:#203d3b!important;border-color:#466865!important}
 html[data-gym-theme="dark"] .share-panel p{color:#b9d3d0!important}
 html[data-gym-theme="dark"] .attendance-axis{stroke:#5a7778}
 html[data-gym-theme="dark"] .attendance-label{fill:#c0d5d5}

 /* Contraste consistente em todos os formulários e cartões no modo escuro. */
 html[data-gym-theme="dark"] section label,html[data-gym-theme="dark"] .custom-exercise-form label,html[data-gym-theme="dark"] .custom-exercise-form h2,html[data-gym-theme="dark"] .custom-exercise-form h3{color:#eef8f6!important}
 html[data-gym-theme="dark"] .custom-exercise-form,html[data-gym-theme="dark"] .custom-card,html[data-gym-theme="dark"] .exercise-card,html[data-gym-theme="dark"] .exercise-detail{background:#1c292d!important;color:#eef8f6!important;border-color:#496063!important}
 html[data-gym-theme="dark"] .custom-exercise-form input,html[data-gym-theme="dark"] .custom-exercise-form select,html[data-gym-theme="dark"] .custom-exercise-form textarea{background:#263539!important;color:#fff!important;border-color:#668184!important}
 html[data-gym-theme="dark"] .custom-exercise-form input[type=file]{color:#eef8f6!important}
 html[data-gym-theme="dark"] .custom-exercise-form input[type=file]::file-selector-button{background:#355450;color:#fff;border:1px solid #72948e;border-radius:8px;padding:7px 10px}
 html[data-gym-theme="dark"] .photo-hint,html[data-gym-theme="dark"] .catalog-intro,html[data-gym-theme="dark"] .catalog-legend,html[data-gym-theme="dark"] .exercise-card small,html[data-gym-theme="dark"] .exercise-card .card-copy small{color:#c4d9d6!important}
 html[data-gym-theme="dark"] .exercise-card .art,html[data-gym-theme="dark"] .exercise-detail .detail-art,html[data-gym-theme="dark"] .photo-thumb{background:#29423f!important}
 html[data-gym-theme="dark"] .exercise-tag{color:#91e2d5!important}
 html[data-gym-theme="dark"] .exercise-detail .secondary{background:#355450!important;color:#fff!important}
 html[data-gym-theme="dark"] .item p,html[data-gym-theme="dark"] footer{color:#c4d9d6!important}
 html[data-gym-theme="dark"] input:focus-visible,html[data-gym-theme="dark"] select:focus-visible,html[data-gym-theme="dark"] textarea:focus-visible{outline:2px solid #8ce4d4;outline-offset:2px}
 .attendance-chart{overflow-x:auto;max-width:100%}
 .attendance-chart svg{display:block;width:100%;height:auto;min-width:320px}
 .attendance-bars rect{fill:#0c827a}
 html[data-gym-theme="dark"] .attendance-bars rect{fill:#56bdb0}
 @media print{html[data-gym-theme="dark"] body{background:white!important;color:black!important}html[data-gym-theme="dark"] #clientPlanPrint{color:#173d3b!important}}
 `;
 const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
 const media=window.matchMedia?.('(prefers-color-scheme: dark)');
 function apply(){document.documentElement.dataset.gymTheme=theme==='auto'?(media?.matches?'dark':'light'):theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',document.documentElement.dataset.gymTheme==='dark'?'#10181b':'#163f3b')}
 apply();media?.addEventListener?.('change',()=>{if(theme==='auto')apply()});
 const escape=h;
 const sessionRows=()=>Array.isArray(db.sessoes)?db.sessoes.filter(s=>s&&typeof s.data==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s.data)&&s.clienteId===attendanceClient&&Array.isArray(s.exercicios)&&s.exercicios.some(e=>Array.isArray(e.series)&&e.series.some(x=>x.done===true))):[];
 const pad=n=>String(n).padStart(2,'0');
 const weekStart=d=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()-(x.getDay()+6)%7);return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())};
 const monthStart=d=>d.slice(0,7);
 const periodKey=d=>attendancePeriod==='week'?weekStart(d):monthStart(d);
 const formatPeriod=d=>attendancePeriod==='week'?'Sem. '+d.slice(8)+'/'+d.slice(5,7):new Date(d+'-01T12:00:00').toLocaleDateString('pt-PT',{month:'short',year:'2-digit'});
 function periods(){const now=new Date(),length=Number(attendanceRange);const result=[];for(let i=length-1;i>=0;i--){const d=new Date(now);if(attendancePeriod==='week')d.setDate(d.getDate()-i*7);else d.setMonth(d.getMonth()-i,1);const iso=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());result.push(periodKey(iso))}return result}
 function summary(){
 const keys=periods(),sessions=sessionRows(),groups=keys.map(k=>({key:k,count:0,sets:0,reps:0,volume:0}));
 const index=new Map(groups.map(x=>[x.key,x]));
 for(const s of sessions){const row=index.get(periodKey(s.data));if(!row)continue;row.count++;for(const e of s.exercicios)for(const set of e.series||[]){if(!set.done)continue;row.sets++;const reps=Number(String(set.reps||0).replace(',','.'))||0,load=Number(String(set.carga||0).replace(',','.'))||0;row.reps+=reps;row.volume+=reps*load}}
 return groups
 }
 const format=n=>Number(n).toLocaleString('pt-PT',{maximumFractionDigits:1});
 function graph(data){const key=attendanceMetric,max=Math.max(1,...data.map(x=>x[key])),n=data.length,w=620,h=235,base=183,left=42,usable=550,slot=usable/n,bar=Math.max(8,Math.min(38,slot*.58));
 const bars=data.map((x,i)=>{const height=x[key]/max*135,xx=left+i*slot+(slot-bar)/2,yy=base-height;return '<rect x="'+xx.toFixed(1)+'" y="'+yy.toFixed(1)+'" width="'+bar.toFixed(1)+'" height="'+height.toFixed(1)+'" rx="3"><title>'+escape(formatPeriod(x.key)+': '+format(x[key]))+'</title></rect>'}).join('');
 const every=Math.max(1,Math.ceil(n/7)),labels=data.map((x,i)=>i%every===0||i===n-1?'<text class="attendance-label" x="'+(left+i*slot+slot/2).toFixed(1)+'" y="205" text-anchor="middle" font-size="11">'+escape(formatPeriod(x.key))+'</text>':'').join('');
 return '<div class="attendance-chart"><svg viewBox="0 0 620 235" role="img" aria-label="Gráfico de assiduidade"><line class="attendance-axis" x1="42" y1="183" x2="605" y2="183" stroke="#9dbdb6"/><line class="attendance-axis" x1="42" y1="38" x2="42" y2="183" stroke="#9dbdb6"/>'+[0,.5,1].map(v=>'<text class="attendance-label" x="36" y="'+(187-v*135)+'" text-anchor="end" font-size="12" fill="#496c66">'+format(max*v)+'</text>').join('')+'<g class="attendance-bars">'+bars+'</g>'+labels+'</svg></div>'}
 function attendance(){
 const data=summary(),total=data.reduce((s,r)=>s+r.count,0),sets=data.reduce((s,r)=>s+r.sets,0);
 return '<section><h2>Assiduidade e atividade</h2><p class="muted">Apenas sessões concluídas com séries marcadas como realizadas. Os planos agendados não contam como presenças.</p><label>Cliente</label><select id="attendanceClient">'+options('clientes',attendanceClient)+'</select><div class="grid"><div><label>Período</label><select id="attendancePeriod"><option value="week" '+(attendancePeriod==='week'?'selected':'')+'>Semanal</option><option value="month" '+(attendancePeriod==='month'?'selected':'')+'>Mensal</option></select></div><div><label>Últimos períodos</label><select id="attendanceRange">'+[3,6,12].map(n=>'<option value="'+n+'" '+(attendanceRange===String(n)?'selected':'')+'>'+n+'</option>').join('')+'</select></div></div><label>Indicador</label><select id="attendanceMetric">'+[['sessions','Sessões realizadas'],['sets','Séries realizadas'],['reps','Repetições'],['volume','Volume (kg)']].map(([v,t])=>'<option value="'+v+'" '+(attendanceMetric===v?'selected':'')+'>'+t+'</option>').join('')+'</select>'+(attendanceClient?'<div class="stat-grid"><div class="stat"><strong>'+total+'</strong><span>Sessões no período</span></div><div class="stat"><strong>'+sets+'</strong><span>Séries realizadas</span></div></div>'+graph(data)+'<p class="muted">Média: '+format(total/data.length)+' sessões por '+(attendancePeriod==='week'?'semana':'mês')+'.</p>':'<p class="muted">Seleciona um cliente para consultar o gráfico.</p>')+'</section>'
 }
 const priorReports=screens.relatorios;
 screens.relatorios=()=>priorReports()+attendance();
 const priorConfig=screens.config;
 screens.config=()=>priorConfig()+'<section><h2>Aspeto da aplicação</h2><label>Modo de apresentação</label><select id="gymTheme"><option value="auto" '+(theme==='auto'?'selected':'')+'>Automático (iPhone)</option><option value="light" '+(theme==='light'?'selected':'')+'>Claro</option><option value="dark" '+(theme==='dark'?'selected':'')+'>Escuro</option></select><p class="muted">A escolha é guardada neste dispositivo e não altera os dados dos clientes.</p></section>';
 const previousRender=render;
 render=function(){previousRender();apply();
  if(view==='config')document.getElementById('gymTheme')?.addEventListener('change',e=>{theme=e.target.value;try{localStorage.setItem(THEME_KEY,theme)}catch{}apply()});
  if(view==='relatorios')for(const [key,set] of [['attendanceClient',v=>attendanceClient=v],['attendancePeriod',v=>attendancePeriod=v],['attendanceRange',v=>attendanceRange=v],['attendanceMetric',v=>attendanceMetric=v]])document.getElementById(key)?.addEventListener('change',e=>{set(e.target.value);render()});
 };
})();
