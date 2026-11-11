'use strict';
window.GymBodyExerciseVisual=function(group,name){
const n=(name||'').toLocaleLowerCase('pt-PT');
const prone=/supino|crucifixo com|hip thrust|ponte de glúteos|crunch|dead bug|flexão de pernas deitado/.test(n);
const seated=/sentad|máquina|leg press|bicicleta|remo ergómetro/.test(n);
const bent=/remada curvada|peso morto|bird dog|flexões de braços|prancha/.test(n);
const lunge=/afundo|búlgaro|step-up/.test(n);
const overhead=/press militar|press de ombros|arnold|tríceps francês|acima da cabeça|elevação frontal|puxada|elevações na barra/.test(n);
const armsSide=/elevação lateral|crucifixo|crossover|face pull|abdução/.test(n);
const squat=/agachamento|leg press/.test(n);
const pull=/remada|puxada|curl|pull-over|face pull/.test(n);
const machine=/polia|máquina|chest press|leg press|elíptica|passadeira/.test(n);
const bar=/barra|agachamento livre|peso morto|elevações na barra/.test(n);
const dumbbell=/halter|martelo/.test(n);
const equipment=machine?'Máquina / cabo':bar?'Barra':dumbbell?'Halteres':/bicicleta|passadeira|elíptica|remo ergómetro/.test(n)?'Cardio':'Peso corporal';
let joints;
if(prone)joints=[[95,78],[114,78],[84,106],[128,107],[72,128],[140,128],[88,150],[117,150],[72,190],[132,190]];
else if(seated)joints=[[88,80],[112,80],[78,108],[124,108],[75,135],[132,135],[94,151],[119,151],[120,178],[155,177]];
else if(bent)joints=[[96,91],[123,84],[92,115],[143,104],[82,137],[160,122],[110,144],[139,139],[89,181],[158,180]];
else if(lunge)joints=[[88,77],[112,77],[79,110],[124,110],[70,138],[133,138],[90,147],[117,147],[68,185],[160,180]];
else joints=[[89,75],[111,75],[80,105],[120,105],[72,135],[128,135],[90,145],[110,145],[84,188],[119,188]];
if(overhead&&!prone){joints[2]=[77,65];joints[3]=[123,65];joints[4]=[72,33];joints[5]=[128,33]}
if(armsSide&&!prone){joints[2]=[58,81];joints[3]=[142,81];joints[4]=[35,70];joints[5]=[165,70]}
if(pull&&!prone&&!overhead){joints[2]=[73,96];joints[3]=[127,96];joints[4]=[91,107];joints[5]=[109,107]}
if(squat&&!seated){joints[6]=[77,140];joints[7]=[123,140];joints[8]=[57,169];joints[9]=[143,169]}
const [sl,sr,el,er,wl,wr,hl,hr,fl,fr]=joints;
const line=(a,b,w=12,col='#a8c9c3')=>'<path d="M'+a.join(' ')+'L'+b.join(' ')+'" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round"/>';
const muscle={Peito:'<path d="M84 76Q94 72 100 85Q106 72 116 76L113 96Q100 104 87 96Z"/>',Costas:'<path d="M86 83L98 97L96 124L82 112ZM114 83L102 97L104 124L118 112Z"/>',Pernas:'<path d="M89 145L100 148L94 171L82 165ZM111 145L121 145L124 165L112 171Z"/>',Ombros:'<circle cx="87" cy="79" r="11"/><circle cx="113" cy="79" r="11"/>',Braços:'<path d="M79 103L87 108L77 133L68 130ZM121 103L129 108L135 130L126 133Z"/>',Core:'<rect x="89" y="99" width="22" height="28" rx="7"/>',Glúteos:'<ellipse cx="92" cy="142" rx="13" ry="10"/><ellipse cx="109" cy="142" rx="13" ry="10"/>',Cardio:'<path d="M87 92L113 92L116 124L84 124Z"/>'};
const gear=machine?'<path d="M35 184V48H48M35 184H169M48 48H158V183" stroke="#7b9a9b" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="35" cy="48" r="6" fill="#537f83"/>':bar?'<path d="M42 '+(overhead?28:108)+'H158" stroke="#567b7b" stroke-width="5"/><rect x="36" y="'+(overhead?18:98)+'" width="7" height="20" rx="2" fill="#365e64"/><rect x="157" y="'+(overhead?18:98)+'" width="7" height="20" rx="2" fill="#365e64"/>':dumbbell?'<g fill="#55787d"><rect x="35" y="120" width="7" height="20" rx="2"/><rect x="158" y="120" width="7" height="20" rx="2"/></g>':'';
const bench=prone?'<path d="M49 149H153M66 149L56 192M138 149L148 192" stroke="#648a8c" stroke-width="7" stroke-linecap="round"/>':seated?'<path d="M91 147H145V101M104 147V185" stroke="#648a8c" stroke-width="7" fill="none"/>':'';
const arrow=overhead?'<path d="M176 116V51m-9 9 9-9 9 9"/>':pull?'<path d="M163 139L142 139m8-8-8 8 8 8"/>':prone?'<path d="M165 91V52m-8 8 8-8 8 8"/>':'<path d="M165 139V105m-8 8 8-8 8 8"/>';
return '<svg viewBox="0 0 200 218" role="img" aria-label="Esquema do exercício '+String(name).replace(/[&<>"]/g,'')+'"><rect x="2" y="2" width="196" height="214" rx="15" fill="#edf7f5"/><path d="M20 191H180" stroke="#c5dcda" stroke-width="2"/>'+gear+bench+line(hl,hr,24)+line(sl,sr,32)+line([100,83],[100,134],33)+line(sl,el,13)+line(el,wl,11)+line(sr,er,13)+line(er,wr,11)+line(hl,fl,15)+line(hr,fr,15)+'<circle cx="100" cy="48" r="19" fill="#b2ccc6" stroke="#7ea6a0" stroke-width="2"/><g fill="#e76867" stroke="#c34849" stroke-width="1.2">'+(muscle[group]||'')+'</g><path d="'+arrow.match(/d="([^"]+)/)[1]+'" stroke="#0c918b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="100" y="208" text-anchor="middle" font-size="9" fill="#4d7776">'+equipment+'</text></svg>';
};