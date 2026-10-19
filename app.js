(function(){
'use strict';
const SB_URL='https://knmnbkxtnqfedxunteid.supabase.co';
const SB_KEY='sb_publishable_MS3j3ZKFm_5ix6PFkITojg_qg_K16yX';

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,10);
const nowHM=()=>{const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fmtDate=s=>{if(!s)return '';const d=new Date(s+'T12:00:00');return isNaN(d)?s:d.toLocaleDateString('sv-SE',{day:'numeric',month:'short',year:'numeric'})};
const monthKey=s=>{if(!s)return 'UTAN DATUM';const d=new Date(s+'T12:00:00');return isNaN(d)?s:d.toLocaleDateString('sv-SE',{month:'long',year:'numeric'}).toUpperCase()};
const timeOf=ms=>{const d=new Date(ms);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const num=v=>{const n=parseInt(String(v).replace(/\D/g,''),10);return isNaN(n)?'':n};
const fmtNum=n=>n===''||n==null?'–':Number(n).toLocaleString('sv-SE');
const FORETAG='Techcom Consulting AB';
const toMin=t=>{const m=/^(\d{1,2}):(\d{2})/.exec(t||'');return m?(+m[1])*60+(+m[2]):null};
/* Fotboll: 2 x 45 min. Utan tid för andra halvlek räknar vi med 15 min paus. */
function matchMinute(r,tid){
 const a=toMin(r&&r.start1),t=toMin(tid);if(a==null||t==null)return '';
 const d=t-a;if(d<0)return 'Före match';
 const b=toMin(r.start2);
 const second=(m,ca)=>m<45?(ca?'ca ':'')+(46+m)+"'":m<=54?(ca?'ca ':'')+'90+'+(m-44)+"'":'Efter match';
 if(b!=null){if(t>=b)return second(t-b,false);if(d<45)return (d+1)+"'";return d-44<=8?'45+'+(d-44)+"'":'Halvtid'}
 if(d<45)return (d+1)+"'";if(d<50)return '45+'+(d-44)+"'";if(d<60)return 'Halvtid';return second(d-60,true);
}
const KAT={hemma:'Vakter hemma',borta:'Vakter borta',ovrig:'Övrig personal'};
const ICON={
 back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
 shield:'<svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
 users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.5 3.5 5.2"/></svg>',
 plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
 pdf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 15V3M7 8l5-5 5 5"/></svg>',
 search:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
 close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

const sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true}});

const S={me:null,rows:[],guards:[],shares:[],view:'login',report:null,owner:null,readOnly:true,
 pending:{},timer:null,saveState:'idle',lastSaved:null,q:'',regTab:'hemma',delArm:null,online:navigator.onLine};
const K=n=>'sr_'+n+'_'+(S.me?S.me.id:'x');
function savePending(){LS.set(K('pending'),S.pending)}

function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,2800)}

/* ---------------- inloggning ---------------- */
function renderLogin(mode,msg){
 S.view='login';
 $('#head').innerHTML='<span class="iconbtn" style="width:30px">'+ICON.shield+'</span><h1>Säkerhetsrapport</h1>';
 const ny=mode==='ny';
 $('#main').innerHTML='<form class="login" id="lf" novalidate>'
  +'<div class="eyebrow">'+FORETAG+'</div><h2>'+(ny?'Skapa konto':'Logga in')+'</h2>'
  +(msg?'<div class="err" role="alert">'+esc(msg)+'</div>':'')
  +'<label class="f">E-post<input id="le" type="email" autocomplete="email" inputmode="email" required></label>'
  +'<label class="f">Lösenord'+(ny?' (minst 8 tecken)':'')+'<input id="lp" type="password" autocomplete="'+(ny?'new-password':'current-password')+'" required></label>'
  +'<button class="btn primary" id="lb" type="submit">'+(ny?'Skapa konto':'Logga in')+'</button>'
  +'<button class="link" type="button" id="lt">'+(ny?'Har du redan konto? Logga in':'Ny här? Skapa konto')+'</button>'
  +(ny?'<p class="empty">Har någon bjudit in dig? Använd samma e-post som de skrev in.</p>':'')
  +'</form>';
 $('#dock').hidden=true;
 const last=LS.get('sr_last_email');if(last)$('#le').value=last;
 $('#lt').onclick=()=>renderLogin(ny?'in':'ny');
 $('#lf').onsubmit=async e=>{e.preventDefault();
  const email=$('#le').value.trim().toLowerCase(),pw=$('#lp').value;
  if(!email||!pw){renderLogin(mode,'Fyll i e-post och lösenord.');return}
  const b=$('#lb');b.disabled=true;b.textContent='Vänta…';
  try{
   if(ny){const r=await fetch(SB_URL+'/functions/v1/skapa-konto',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify({email,losen:pw})});
    const j=await r.json().catch(()=>({}));if(!r.ok){renderLogin('ny',j.fel||'Kontot kunde inte skapas.');$('#le').value=email;return}}
   const {error}=await sb.auth.signInWithPassword({email,password:pw});
   if(error){renderLogin('in',/invalid/i.test(error.message)?'Fel e-post eller lösenord.':'Inloggningen misslyckades. Kontrollera nätet.');$('#le').value=email;return}
   LS.set('sr_last_email',email);
  }catch(err){renderLogin(mode,'Ingen kontakt med servern. Kontrollera nätet.');$('#le').value=email}
 };
}

/* ---------------- data ---------------- */
function summary(r){return {datum:r.datum||'',hemmalag:r.hemmalag||'',bortalag:r.bortalag||'',publik:r.publik===''?'':r.publik,
 vakter:(r.vakterHemma||[]).length+(r.vakterBorta||[]).length,ovrig:(r.ovrig||[]).length,handelser:(r.logg||[]).length,status:r.status||'pagaende',rapportor:r.rapportor||''}}

async function loadAll(){
 const [a,b,c]=await Promise.all([
  sb.from('rapporter').select('id,agare,uppdaterad,sammanfattning').order('uppdaterad',{ascending:false}).limit(2000),
  sb.from('vakter').select('id,namn,nr,kat,roll'),
  sb.from('delningar').select('agare,email,skapad')]);
 if(!a.error){S.rows=a.data;LS.set(K('rows'),S.rows)}
 if(!b.error){S.guards=b.data;LS.set(K('guards'),S.guards)}
 if(!c.error){S.shares=c.data}
 if(a.error)setOnline(false);
}
function setOnline(v){S.online=v}

function localSave(r){S.pending[r.id]=r;savePending()}
function touch(){if(!S.report||S.readOnly)return;S.report.uppdaterad=Date.now();localSave(S.report);setSave('saving');clearTimeout(S.timer);S.timer=setTimeout(flush,450)}
async function pushReport(r){
 const {error}=await sb.from('rapporter').upsert({id:r.id,agare:S.me.id,data:r,sammanfattning:summary(r),uppdaterad:r.uppdaterad});
 if(error)return false;
 const i=S.rows.findIndex(x=>x.id===r.id);const row={id:r.id,agare:S.me.id,uppdaterad:r.uppdaterad,sammanfattning:summary(r)};
 if(i>=0)S.rows[i]=row;else S.rows.unshift(row);LS.set(K('rows'),S.rows);
 const cur=S.pending[r.id];if(cur&&cur.uppdaterad===r.uppdaterad){delete S.pending[r.id];savePending()}
 return true;
}
let flushing=false;
async function flush(){
 clearTimeout(S.timer);if(!S.me)return;
 if(flushing){S.timer=setTimeout(flush,600);return}
 const ids=Object.keys(S.pending);if(!ids.length){setSave('saved');return}
 flushing=true;let ok=true;
 for(const id of ids){const r=S.pending[id];if(!r)continue;let res=false;try{res=await pushReport(JSON.parse(JSON.stringify(r)))}catch(e){res=false}if(!res)ok=false}
 flushing=false;
 if(ok){S.lastSaved=Date.now();setSave('saved')}else{setSave('offline');clearTimeout(S.retry);S.retry=setTimeout(flush,8000)}
 if(S.view==='list')renderList();
}
function setSave(st){S.saveState=st;const el=$('#savestate');if(el)el.outerHTML=saveHTML()}
function saveHTML(){
 if(S.view!=='report'||S.readOnly)return '<span id="savestate"></span>';
 if(S.saveState==='saving')return '<span class="save" id="savestate" role="status"><span class="dot"></span>Sparar…</span>';
 if(S.saveState==='offline')return '<span class="save warn" id="savestate" role="status"><span class="dot"></span>Sparat i mobilen</span>';
 const t=S.lastSaved||(S.report&&S.report.uppdaterad);
 return '<span class="save ok" id="savestate" role="status"><span class="dot"></span>Sparat'+(t?' '+timeOf(t):'')+'</span>';
}
window.addEventListener('online',()=>{flush();if(S.view==='list')refresh()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();else if(S.view==='list')refresh()});
window.addEventListener('pagehide',flush);
async function refresh(){if(!S.me)return;await loadAll();if(S.view==='list')renderList()}

async function saveGuard(g){
 const {error}=await sb.from('vakter').upsert({id:g.id,agare:S.me.id,namn:g.namn,nr:g.nr||'',kat:'',roll:''});
 if(error){toast('Kunde inte spara. Kontrollera nätet.');return false}
 if(!S.guards.some(y=>y.id===g.id))S.guards.push(g);LS.set(K('guards'),S.guards);return true;
}
async function deleteGuard(id){
 const {error}=await sb.from('vakter').delete().eq('id',id);
 if(error){toast('Kunde inte ta bort. Kontrollera nätet.');return false}
 S.guards=S.guards.filter(g=>g.id!==id);LS.set(K('guards'),S.guards);return true;
}

/* ---------------- lista ---------------- */
function allReports(){
 const out={};
 for(const r of S.rows)out[r.id]=Object.assign({id:r.id,owner:r.agare,uppdaterad:r.uppdaterad},r.sammanfattning||{});
 for(const id in S.pending){const r=S.pending[id];if(r)out[id]=Object.assign({id,owner:S.me.id,uppdaterad:r.uppdaterad},summary(r))}
 return Object.values(out);
}
function rcard(r){
 const mine=r.owner===S.me.id,live=r.status!=='klar';
 const pill=live&&mine?'<span class="pill live">Pågående</span>':mine?'<span class="pill edit">Din rapport</span>':'<span class="pill read">Bara läsa</span>';
 return '<button class="rcard'+(live&&mine?' live':'')+'" data-open="'+esc(r.id)+'" data-owner="'+esc(r.owner)+'">'
  +'<span class="row between" style="width:100%"><span class="mono">'+esc(fmtDate(r.datum))+(live&&mine&&r.uppdaterad?' · sparat '+timeOf(r.uppdaterad):'')+'</span>'+pill+'</span>'
  +'<span class="teams">'+esc((r.hemmalag||'Hemmalag')+' – '+(r.bortalag||'Bortalag'))+'</span>'
  +'<span class="meta"><span>Publik '+esc(fmtNum(r.publik))+'</span><span>Vakter '+esc(r.vakter||0)+'</span><span>'+esc(r.handelser||0)+' händelser</span>'+(r.rapportor?'<span>'+esc(r.rapportor)+'</span>':'')+'</span>'
  +(live&&mine?'<span style="font-weight:700;color:var(--accent-ink)">Fortsätt skriva →</span>':'')+'</button>';
}
function renderList(){
 if(S.view!=='list')return;
 $('#head').innerHTML='<span class="iconbtn" style="width:30px">'+ICON.shield+'</span><h1>Säkerhetsrapport</h1><button class="iconbtn" id="toReg" aria-label="Vaktregister">'+ICON.users+'</button>';
 $('#toReg').onclick=()=>go('reg');
 const q=S.q.trim().toLowerCase();
 let reps=allReports().filter(r=>!q||[r.hemmalag,r.bortalag,r.datum,fmtDate(r.datum),r.rapportor].join(' ').toLowerCase().includes(q));
 reps.sort((a,b)=>(b.datum||'').localeCompare(a.datum||'')||(b.uppdaterad||0)-(a.uppdaterad||0));
 const live=reps.filter(r=>r.status!=='klar'&&r.owner===S.me.id),rest=reps.filter(r=>!live.includes(r));
 let h='';
 if(Object.keys(S.pending).length&&S.saveState==='offline')h+='<div class="banner warn"><span class="dot"></span>Ingen kontakt. Allt är sparat i mobilen och skickas när nätet är tillbaka.</div>';
 h+='<label class="search">'+ICON.search+'<input id="q" type="search" placeholder="Sök lag, datum eller rapportör" value="'+esc(S.q)+'" aria-label="Sök rapporter"></label>';
 if(!reps.length)h+=q?'<p class="empty">Inga rapporter matchar sökningen.</p>':'<div class="card" style="padding:18px;display:flex;flex-direction:column;gap:8px"><strong style="font-size:18px">Inga rapporter än</strong><span class="empty">Tryck på <b>Ny rapport</b> efter matchen. Allt du skriver sparas direkt.</span></div>';
 if(live.length)h+='<div class="eyebrow">Pågående</div>'+live.map(rcard).join('');
 let m='';for(const r of rest){const k=monthKey(r.datum);if(k!==m){m=k;h+='<div class="eyebrow">'+esc(k)+'</div>'}h+=rcard(r)}
 h+='<div class="foot"><span>'+FORETAG+'<br>Inloggad som '+esc(S.me.email)+'</span><button class="link" id="out">Logga ut</button></div>';
 $('#main').innerHTML=h;
 const qi=$('#q');qi.oninput=()=>{S.q=qi.value;const p=qi.selectionStart;renderList();const n=$('#q');n.focus();try{n.setSelectionRange(p,p)}catch(e){}};
 document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openReport(b.dataset.open,b.dataset.owner));
 $('#out').onclick=logout;
 $('#dock').hidden=false;$('#dockin').innerHTML='<button class="btn primary" id="newRep">'+ICON.plus+'Ny rapport</button>';$('#newRep').onclick=newReport;
}
async function logout(){
 await flush();
 if(Object.keys(S.pending).length){toast('Vänta tills allt är skickat innan du loggar ut.');return}
 await sb.auth.signOut();
}

/* ---------------- rapport ---------------- */
function newReport(){
 const r={id:uid(),foretag:FORETAG,datum:today(),rapportor:LS.get(K('namn'))||'',hemmalag:'',bortalag:'',publik:'',vakterHemma:[],vakterBorta:[],ovrig:[],logg:[],
  utkast:{tid:'',text:'',vakter:[]},status:'pagaende',skapad:Date.now(),uppdaterad:Date.now()};
 S.report=r;S.owner=S.me.id;S.readOnly=false;S.view='report';S.lastSaved=null;localSave(r);flush();renderReport();window.scrollTo(0,0);
}
async function openReport(id,owner){
 S.view='report';S.owner=owner;S.readOnly=owner!==S.me.id;
 let r=S.pending[id]||null;
 if(!r){$('#main').innerHTML='<p class="empty">Hämtar rapporten…</p>';$('#dock').hidden=true;
  const {data,error}=await sb.from('rapporter').select('data').eq('id',id).maybeSingle();
  if(!error&&data){r=data.data;LS.set('sr_r_'+id,r)}else r=LS.get('sr_r_'+id);}
 if(!r){toast('Rapporten kunde inte hämtas. Kontrollera nätet.');go('list');return}
 S.report=JSON.parse(JSON.stringify(r));S.lastSaved=S.pending[id]?null:r.uppdaterad;S.saveState=S.pending[id]?'offline':'saved';
 renderReport();window.scrollTo(0,0);
}
const allStaff=r=>[].concat(r.vakterHemma||[],r.vakterBorta||[],r.ovrig||[]);
function renderReport(keep){
 const r=S.report,ro=S.readOnly,dis=ro?' disabled':'';
 $('#head').innerHTML='<button class="iconbtn" id="back" aria-label="Tillbaka till alla rapporter">'+ICON.back+'</button><h1>Rapport</h1>'+saveHTML();
 $('#back').onclick=()=>{flush();go('list')};
 let h='';
 if(ro)h+='<div class="banner read"><span class="dot"></span>Bara läsa. Skapad av '+esc(r.rapportor||'någon annan')+'.</div>';
 else if(r.status!=='klar')h+='<div class="banner live"><span class="dot"></span>Pågående. Allt sparas direkt när du skriver.</div>';
 else h+='<div class="banner read"><span class="dot"></span>Avslutad. Du kan fortfarande ändra.</div>';
 h+='<div class="eyebrow">Match</div><div class="grid2">'
  +'<label class="f">Datum<input id="f_datum" type="date" value="'+esc(r.datum)+'"'+dis+'></label>'
  +'<label class="f">Rapportör<input id="f_rapportor" type="text" value="'+esc(r.rapportor)+'" autocomplete="name" placeholder="Ditt namn"'+dis+'></label>'
  +'<label class="f">Hemmalag<input id="f_hemmalag" type="text" value="'+esc(r.hemmalag)+'" placeholder="Hemmalag"'+dis+'></label>'
  +'<label class="f">Bortalag<input id="f_bortalag" type="text" value="'+esc(r.bortalag)+'" placeholder="Bortalag"'+dis+'></label></div>'
  +'<label class="f">Publiksiffra<input id="f_publik" type="text" inputmode="numeric" value="'+esc(r.publik)+'" placeholder="0"'+dis+'></label>'
  +'<div class="grid2"><label class="f">Avspark<input id="f_start1" type="time" value="'+esc(r.start1||'')+'"'+dis+'></label>'
  +'<label class="f">Avspark 2:a halvlek<input id="f_start2" type="time" value="'+esc(r.start2||'')+'"'+dis+'></label></div>'
  +(ro?'':'<span class="empty">Fyll i avspark så räknas matchminuten ut för varje händelse.</span>');
 h+='<div class="eyebrow" style="margin-top:6px">Personal</div><div class="card staff" id="staff">'+staffHTML()+'</div>';
 h+='<div class="row between" style="margin-top:6px"><span class="eyebrow">Händelselogg</span><span class="empty">Senaste överst</span></div>';
 if(!ro)h+='<div class="composer" id="composer">'+composerHTML()+'</div>';
 h+='<div class="card log" id="log">'+logHTML()+'</div>';
 const y=window.scrollY;$('#main').innerHTML=h;if(keep)window.scrollTo(0,y);
 if(!ro){
  for(const k of ['start1','start2']){const el=$('#f_'+k);el.addEventListener('input',()=>{S.report[k]=el.value;touch();$('#log').innerHTML=logHTML();wireLog();updMin()})}
  for(const k of ['datum','rapportor','hemmalag','bortalag','publik']){const el=$('#f_'+k);el.addEventListener('input',()=>{
   S.report[k]=k==='publik'?num(el.value):el.value;if(k==='publik'&&String(el.value)!==String(S.report.publik))el.value=S.report.publik;
   if(k==='rapportor')LS.set(K('namn'),el.value);touch()})}
  wireComposer();
 }
 wireStaff();wireLog();
 $('#dock').hidden=false;
 $('#dockin').innerHTML=(ro?'':(r.status!=='klar'?'<button class="btn dark" id="finish">Avsluta rapport</button>':'<button class="btn ghost" id="reopen">Öppna igen</button>'))+'<button class="btn '+(ro?'primary':'ghost')+'" id="toShare">'+ICON.pdf+'PDF / Dela</button>';
 const f=$('#finish');if(f)f.onclick=()=>{S.report.status='klar';touch();flush();toast('Rapporten är avslutad och sparad');renderReport(true)};
 const o=$('#reopen');if(o)o.onclick=()=>{S.report.status='pagaende';touch();renderReport(true)};
 $('#toShare').onclick=()=>{flush();go('share')};
}
function staffHTML(){
 const r=S.report,ro=S.readOnly;
 return ['hemma','borta','ovrig'].map(k=>{const key=k==='hemma'?'vakterHemma':k==='borta'?'vakterBorta':'ovrig';const list=r[key]||[];
  return '<div class="grp"><div class="row between"><h3>'+KAT[k]+' ('+list.length+')</h3>'+(ro?'':'<button class="link" data-pick="'+k+'">+ Hämta från register</button>')+'</div>'
   +(list.length?'<div class="chips">'+list.map(g=>'<span class="chip">'+esc(g.namn)+(g.roll?' · '+esc(g.roll):'')+'</span>').join('')+'</div>':'<span class="empty">Ingen vald</span>')+'</div>'}).join('');
}
function wireStaff(){document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>openPicker(b.dataset.pick))}
function composerHTML(){
 const u=S.report.utkast||{tid:'',text:'',vakter:[]},staff=allStaff(S.report);
 return '<div class="row" style="align-items:flex-start"><span style="display:flex;flex-direction:column;gap:4px"><label class="f tid">Tid<input id="c_tid" type="time" value="'+esc(u.tid||nowHM())+'"></label><span class="mono" id="c_min" aria-live="polite">'+esc(minLabel(u.tid||nowHM()))+'</span></span>'
  +'<label class="f" style="flex:1">Vad hände?<textarea id="c_text" rows="2" placeholder="Skriv händelsen">'+esc(u.text)+'</textarea></label></div>'
  +'<div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:14px;font-weight:600">Ingripande vakter</span>'
  +(staff.length?'<div class="chips">'+staff.map(g=>{const on=(u.vakter||[]).includes(g.id);return '<button type="button" class="chip'+(on?' on':'')+'" data-tog="'+esc(g.id)+'" aria-pressed="'+on+'">'+esc(g.namn)+'</button>'}).join('')+'</div>':'<span class="empty">Lägg till vakter under Personal först.</span>')+'</div>'
  +'<button type="button" class="btn primary small" id="c_add">Lägg till i loggen</button>';
}
function minLabel(t){const m=matchMinute(S.report,t);return m?'Matchminut: '+m:''}
function updMin(){const c=$('#c_min'),t=$('#c_tid');if(c&&t)c.textContent=minLabel(t.value)}
function wireComposer(){
 const u=S.report.utkast=S.report.utkast||{tid:'',text:'',vakter:[]};
 const t=$('#c_tid'),x=$('#c_text');
 t.oninput=()=>{u.tid=t.value;touch();updMin()};x.oninput=()=>{u.text=x.value;touch()};
 document.querySelectorAll('[data-tog]').forEach(b=>b.onclick=()=>{const id=b.dataset.tog;u.vakter=u.vakter||[];const i=u.vakter.indexOf(id);if(i>=0)u.vakter.splice(i,1);else u.vakter.push(id);b.classList.toggle('on',i<0);b.setAttribute('aria-pressed',String(i<0));touch()});
 $('#c_add').onclick=()=>{
  if(!x.value.trim()){x.focus();toast('Skriv vad som hände först');return}
  const staff=allStaff(S.report);S.report.logg=S.report.logg||[];
  S.report.logg.push({id:uid(),tid:t.value||nowHM(),text:x.value.trim(),vakter:staff.filter(g=>(u.vakter||[]).includes(g.id)).map(g=>({id:g.id,namn:g.namn}))});
  S.report.utkast={tid:'',text:'',vakter:[]};touch();flush();
  $('#composer').innerHTML=composerHTML();wireComposer();$('#log').innerHTML=logHTML();wireLog();toast('Händelsen är sparad');
 };
}
const sortedLog=()=>(S.report.logg||[]).slice().sort((a,b)=>(b.tid||'').localeCompare(a.tid||''));
function logHTML(){
 const L=sortedLog();if(!L.length)return '<div class="e"><span class="empty">Inga händelser än.</span></div>';
 return L.map(e=>{const mm=matchMinute(S.report,e.tid);return '<div class="e"><span class="t">'+esc(e.tid)+(mm?'<br><span style="font-size:12px;color:var(--muted)">'+esc(mm)+'</span>':'')+'</span><span class="x"><span>'+esc(e.text)+'</span>'
  +((e.vakter||[]).length?'<span class="who">Ingrep: '+esc(e.vakter.map(v=>v.namn).join(', '))+'</span>':'')+'</span>'
  +(S.readOnly?'':'<button class="del'+(S.delArm===e.id?' sure':'')+'" data-del="'+esc(e.id)+'">'+(S.delArm===e.id?'Säker?':'Ta bort')+'</button>')+'</div>'}).join('');
}
function wireLog(){document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const id=b.dataset.del;
 if(S.delArm===id){S.report.logg=S.report.logg.filter(e=>e.id!==id);S.delArm=null;touch();toast('Händelsen är borttagen')}
 else{S.delArm=id;clearTimeout(S.delT);S.delT=setTimeout(()=>{S.delArm=null;if(S.view==='report'&&$('#log')){$('#log').innerHTML=logHTML();wireLog()}},4000)}
 $('#log').innerHTML=logHTML();wireLog()})}

/* ---------------- välj vakter ---------------- */
function openPicker(kat){
 const key=kat==='hemma'?'vakterHemma':kat==='borta'?'vakterBorta':'ovrig';
 const chosen=new Set((S.report[key]||[]).map(g=>g.id));let q='';
 const otherGroup={};for(const k2 of ['vakterHemma','vakterBorta','ovrig'])if(k2!==key)for(const g of (S.report[k2]||[]))otherGroup[g.id]=KAT[k2==='vakterHemma'?'hemma':k2==='vakterBorta'?'borta':'ovrig'];
 function draw(){
  const list=S.guards.filter(g=>!q||(g.namn+' '+(g.nr||'')).toLowerCase().includes(q)).sort((a,b)=>a.namn.localeCompare(b.namn,'sv'));
  const extra=(S.report[key]||[]).filter(g=>!S.guards.some(x=>x.id===g.id));
  $('#sheet').innerHTML='<div class="sheet-bg" id="sbg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh">'
   +'<div class="hd"><h2 id="sh">'+KAT[kat]+'</h2><button class="iconbtn" id="sx" aria-label="Stäng">'+ICON.close+'</button></div>'
   +'<div class="bd"><label class="search">'+ICON.search+'<input id="sq" type="search" placeholder="Sök namn eller nummer" value="'+esc(q)+'" aria-label="Sök i registret"></label>'
   +'<div class="card">'+(list.concat(extra).map(g=>{const busy=otherGroup[g.id];return '<label class="pick"'+(busy?' style="opacity:.55"':'')+'><input type="checkbox" data-g="'+esc(g.id)+'"'+(chosen.has(g.id)?' checked':'')+(busy?' disabled':'')+'><span style="display:flex;flex-direction:column"><span class="n">'+esc(g.namn)+'</span><span class="s">'+esc(busy?'Redan vald i '+busy.toLowerCase():(g.nr?'Nr '+g.nr:' '))+'</span></span></label>'}).join('')||'<div class="pick"><span class="empty">Registret är tomt. Lägg till nedan.</span></div>')+'</div>'
   +'<div class="card" style="padding:12px;display:flex;flex-direction:column;gap:10px"><strong>Ny person i registret</strong><div class="grid2"><label class="f">Namn<input id="nn" type="text"></label><label class="f">Vakt-nr (valfritt)<input id="nx" type="text"></label></div><button class="btn ghost small" id="nadd">Lägg till och välj</button></div>'
   +'</div><div class="ft"><button class="btn primary" id="sdone" style="width:100%">Klar ('+chosen.size+' valda)</button></div></div></div>';
  const sq=$('#sq');sq.oninput=()=>{q=sq.value.toLowerCase();draw();const n=$('#sq');n.focus();try{n.setSelectionRange(n.value.length,n.value.length)}catch(e){}};
  document.querySelectorAll('[data-g]').forEach(c=>c.onchange=()=>{if(c.checked)chosen.add(c.dataset.g);else chosen.delete(c.dataset.g);$('#sdone').textContent='Klar ('+chosen.size+' valda)'});
  $('#nadd').onclick=async()=>{const n=$('#nn').value.trim();if(!n){$('#nn').focus();return}const x=$('#nx').value.trim();
   const g={id:uid(),namn:n,nr:x};if(await saveGuard(g)){chosen.add(g.id);draw()}};
  $('#sx').onclick=close;$('#sbg').onclick=e=>{if(e.target.id==='sbg')close()};
  $('#sdone').onclick=()=>{const pool=S.guards.concat(extra);
   S.report[key]=[...chosen].map(id=>{const g=pool.find(x=>x.id===id);return g?{id:g.id,namn:g.namn,nr:g.nr||'',roll:g.roll||''}:null}).filter(Boolean);
   touch();close();$('#staff').innerHTML=staffHTML();wireStaff();const c=$('#composer');if(c){c.innerHTML=composerHTML();wireComposer()}};
 }
 function close(){$('#sheet').innerHTML='';document.removeEventListener('keydown',esck)}
 function esck(e){if(e.key==='Escape')close()}
 document.addEventListener('keydown',esck);draw();
}

/* ---------------- vaktregister ---------------- */
function renderReg(){
 $('#head').innerHTML='<button class="iconbtn" id="back" aria-label="Tillbaka">'+ICON.back+'</button><h1>Vaktregister</h1>';
 $('#back').onclick=()=>go('list');
 const list=S.guards.slice().sort((a,b)=>a.namn.localeCompare(b.namn,'sv'));
 let h='<form class="card" id="rf" style="padding:14px;display:flex;flex-direction:column;gap:10px"><strong>Lägg till person</strong><div class="grid2"><label class="f">Namn<input id="rn" type="text"></label><label class="f">Vakt-nr (valfritt)<input id="rx" type="text"></label></div><button class="btn primary small" type="submit">Lägg till</button></form>';
 h+='<div class="eyebrow">Alla i registret ('+list.length+')</div>';
 h+='<div class="card">'+(list.map(g=>'<div class="pick"><span style="flex:1;display:flex;flex-direction:column;min-width:0"><span class="n">'+esc(g.namn)+'</span><span class="s">'+esc(g.nr?'Nr '+g.nr:' ')+'</span></span><button class="link" data-rm="'+esc(g.id)+'">'+(S.delArm===g.id?'Säker?':'Ta bort')+'</button></div>').join('')||'<div class="pick"><span class="empty">Registret är tomt. Lägg till den första ovan.</span></div>')+'</div>';
 h+='<p class="empty">I varje rapport väljer du om personen jobbar hemma, borta eller som övrig personal. Gamla rapporter ändras inte om du tar bort någon här.</p>';
 $('#main').innerHTML=h;$('#dock').hidden=true;
 document.querySelectorAll('[data-rm]').forEach(b=>b.onclick=async()=>{const id=b.dataset.rm;if(S.delArm===id){S.delArm=null;await deleteGuard(id);renderReg()}else{S.delArm=id;renderReg()}});
 $('#rf').onsubmit=async e=>{e.preventDefault();const n=$('#rn').value.trim();if(!n){$('#rn').focus();return}const x=$('#rx').value.trim();
  const g={id:uid(),namn:n,nr:x};if(await saveGuard(g)){toast(n+' är tillagd');renderReg();$('#rn').focus()}};
}

/* ---------------- dela / pdf ---------------- */
function renderShare(){
 const r=S.report,mine=!S.readOnly;
 $('#head').innerHTML='<button class="iconbtn" id="back" aria-label="Tillbaka till rapporten">'+ICON.back+'</button><h1>PDF och dela</h1>';
 $('#back').onclick=()=>{S.view='report';renderReport()};
 const myShares=S.shares.filter(s=>s.agare===S.me.id);
 let h='<div class="eyebrow">Skicka rapporten</div>'
  +'<div class="card" style="padding:14px;display:flex;flex-direction:column;gap:4px"><strong style="font-size:18px">'+esc((r.hemmalag||'Hemmalag')+' – '+(r.bortalag||'Bortalag'))+'</strong><span class="mono">'+esc(fmtDate(r.datum))+' · '+esc((r.logg||[]).length)+' händelser</span></div>'
  +'<button class="btn primary" id="share">'+ICON.pdf+'Dela PDF (Mejl, Messenger…)</button>'
  +'<button class="btn ghost" id="dl">Ladda ner PDF</button>';
 if(mine){
  h+='<div class="eyebrow" style="margin-top:12px">Bjud in – bara läsa</div>'
   +'<form class="row" id="sf" style="align-items:flex-end"><label class="f" style="flex:1">E-post<input id="se" type="email" inputmode="email" placeholder="namn@exempel.se" autocomplete="off"></label><button class="btn dark small" type="submit" style="min-height:48px">Bjud in</button></form>'
   +'<div class="card">'+(myShares.length?myShares.map(s=>'<div class="pick"><span style="flex:1;min-width:0;overflow-wrap:anywhere">'+esc(s.email)+'</span><span class="pill read">Bara läsa</span><button class="link" data-unshare="'+esc(s.email)+'">'+(S.delArm==='sh:'+s.email?'Säker?':'Ta bort')+'</button></div>').join(''):'<div class="pick"><span class="empty">Ingen inbjuden än.</span></div>')+'</div>'
   +'<p class="empty">De inbjudna kan läsa alla dina rapporter men inte ändra. Skicka länken till appen och be dem skapa konto med samma e-post.</p>'
   +'<button class="btn ghost small" id="copy">Kopiera länken till appen</button>';
 }
 $('#main').innerHTML=h;$('#dock').hidden=true;
 $('#share').onclick=()=>pdfOut(true);$('#dl').onclick=()=>pdfOut(false);
 if(mine){
  $('#sf').onsubmit=async e=>{e.preventDefault();const em=$('#se').value.trim().toLowerCase();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){toast('Skriv en riktig e-postadress');return}
   if(em===S.me.email){toast('Det är din egen e-post');return}
   const {error}=await sb.from('delningar').upsert({agare:S.me.id,email:em});
   if(error){toast('Kunde inte bjuda in. Kontrollera nätet.');return}
   if(!S.shares.some(s=>s.agare===S.me.id&&s.email===em))S.shares.push({agare:S.me.id,email:em});toast(em+' kan nu läsa');renderShare()};
  document.querySelectorAll('[data-unshare]').forEach(b=>b.onclick=async()=>{const em=b.dataset.unshare;
   if(S.delArm!=='sh:'+em){S.delArm='sh:'+em;renderShare();return}
   S.delArm=null;const {error}=await sb.from('delningar').delete().eq('agare',S.me.id).eq('email',em);
   if(error){toast('Kunde inte ta bort. Kontrollera nätet.');return}
   S.shares=S.shares.filter(s=>!(s.agare===S.me.id&&s.email===em));renderShare()});
  $('#copy').onclick=async()=>{const link=location.origin+location.pathname;try{await navigator.clipboard.writeText(link);toast('Länken är kopierad')}catch(e){toast(link)}};
 }
}
function buildPdf(r){
 const J=window.jspdf&&window.jspdf.jsPDF;if(!J)return null;
 const d=new J({unit:'mm',format:'a4'});const W=210,H=297,M=16,CW=W-2*M;let y;
 const ink=[20,24,31],mut=[84,89,98],acc=[194,65,12],line=[220,221,214],soft=[242,242,238];
 const teams=(r.hemmalag||'Hemmalag')+' - '+(r.bortalag||'Bortalag');
 const firma=r.foretag||FORETAG;
 function head(first){
  d.setFillColor(...ink);d.rect(0,0,W,first?32:16,'F');d.setFillColor(...acc);d.rect(0,first?32:16,W,1.4,'F');
  d.setTextColor(255,255,255);d.setFont('helvetica','bold');
  if(first){d.setFontSize(8.5);d.text('SÄKERHETSRAPPORT  ·  '+firma.toUpperCase(),M,11);d.setFontSize(19);d.text(d.splitTextToSize(teams,CW-55)[0],M,23);
   d.setFont('helvetica','normal');d.setFontSize(9.5);d.text(fmtDate(r.datum),W-M,13,{align:'right'});d.text('Rapportör: '+(r.rapportor||'-'),W-M,19,{align:'right'});
   d.text((r.start1?'Avspark '+r.start1+'  ·  ':'')+(r.status==='klar'?'Avslutad':'Pågående'),W-M,25,{align:'right'});y=44}
  else{d.setFontSize(10);d.text(firma+' · Säkerhetsrapport · '+teams+' · '+fmtDate(r.datum),M,10);y=26}
  d.setTextColor(...ink);
 }
 function need(h){if(y+h>H-18){d.addPage();head(false)}}
 head(true);
 const stats=[['PUBLIK',fmtNum(r.publik)],['VAKTER HEMMA',String((r.vakterHemma||[]).length)],['VAKTER BORTA',String((r.vakterBorta||[]).length)],['ÖVRIG PERSONAL',String((r.ovrig||[]).length)]];
 const bw=(CW-9)/4;stats.forEach((s,i)=>{const x=M+i*(bw+3);d.setFillColor(...soft);d.roundedRect(x,y,bw,19,2,2,'F');d.setFont('helvetica','bold');d.setFontSize(7);d.setTextColor(...mut);d.text(s[0],x+4,y+6.5);d.setFontSize(15);d.setTextColor(...ink);d.text(s[1],x+4,y+15)});
 y+=28;
 const cols=[['Vakter hemma',r.vakterHemma||[]],['Vakter borta',r.vakterBorta||[]],['Övrig personal',r.ovrig||[]]],cw=(CW-12)/3;let maxH=0;
 cols.forEach((c,i)=>{const x=M+i*(cw+6);let yy=y;d.setFont('helvetica','bold');d.setFontSize(9.5);d.text(c[0],x,yy);yy+=5.5;d.setFont('helvetica','normal');
  if(!c[1].length){d.setTextColor(...mut);d.text('-',x,yy);d.setTextColor(...ink);yy+=5}
  c[1].forEach(g=>{const t=g.namn+(g.nr?' (nr '+g.nr+')':'')+(g.roll?' - '+g.roll:'');d.splitTextToSize(t,cw).forEach(l=>{d.text(l,x,yy);yy+=4.6})});maxH=Math.max(maxH,yy-y)});
 y+=maxH+8;
 need(16);d.setFont('helvetica','bold');d.setFontSize(8.5);d.setTextColor(...mut);d.text('HÄNDELSELOGG',M,y);y+=3;d.setDrawColor(...line);d.setLineWidth(.3);d.line(M,y,W-M,y);y+=6;d.setTextColor(...ink);
 const L=(r.logg||[]).slice().sort((a,b)=>(a.tid||'').localeCompare(b.tid||''));
 if(!L.length){d.setFont('helvetica','normal');d.setFontSize(10);d.setTextColor(...mut);d.text('Inga händelser registrerade.',M,y);y+=6}
 L.forEach(e=>{d.setFont('helvetica','normal');d.setFontSize(10);const tl=d.splitTextToSize(e.text||'',CW-20);
  const who=(e.vakter||[]).length?d.splitTextToSize('Ingrep: '+e.vakter.map(v=>v.namn).join(', '),CW-20):[];
  need(Math.max(tl.length*4.8+who.length*4.4,9)+5);
  d.setFont('courier','bold');d.setFontSize(10.5);d.setTextColor(...acc);d.text(e.tid||'',M,y);const mm=matchMinute(r,e.tid);if(mm){d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(...mut);d.text(mm,M,y+4.2)}
  d.setFont('helvetica','normal');d.setFontSize(10);d.setTextColor(...ink);tl.forEach((l,i)=>d.text(l,M+20,y+i*4.8));let yy=y+tl.length*4.8;
  if(who.length){d.setFont('helvetica','bold');d.setFontSize(8.8);d.setTextColor(...mut);who.forEach(l=>{d.text(l,M+20,yy);yy+=4.4})}
  y=Math.max(yy,y+5.5)+1.5;d.setDrawColor(...line);d.line(M,y,W-M,y);y+=5.5;d.setTextColor(...ink)});
 const n=d.getNumberOfPages();for(let i=1;i<=n;i++){d.setPage(i);d.setFont('helvetica','normal');d.setFontSize(8);d.setTextColor(...mut);d.setDrawColor(...line);d.line(M,H-13,W-M,H-13);d.text('Rapporten är upprättad av '+firma,M,H-8.5);d.text('Sida '+i+' av '+n,W-M,H-8.5,{align:'right'})}
 return d;
}
async function pdfOut(share){
 const r=S.report,d=buildPdf(r);if(!d){toast('PDF-verktyget laddade inte. Ladda om sidan.');return}
 const clean=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const name='Sakerhetsrapport_'+(r.datum||'')+'_'+(clean(r.hemmalag)||'Hemma')+'-'+(clean(r.bortalag)||'Borta')+'.pdf';
 const blob=d.output('blob');
 if(share){
  try{const file=new File([blob],name,{type:'application/pdf'});
   if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Säkerhetsrapport',text:(r.hemmalag||'')+' – '+(r.bortalag||'')+', '+fmtDate(r.datum)});return}}
  catch(e){if(e&&e.name==='AbortError')return}
  toast('Den här webbläsaren kan inte dela filer. PDF:en laddas ner i stället.');
 }
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}

/* ---------------- navigering ---------------- */
function go(v){
 S.view=v;S.delArm=null;$('#sheet').innerHTML='';
 if(v==='list'){S.report=null;renderList()}else if(v==='reg')renderReg();else if(v==='share')renderShare();
 window.scrollTo(0,0);
}

/* ---------------- start ---------------- */
async function enter(user){
 if(S.me&&S.me.id===user.id)return;
 S.me={id:user.id,email:(user.email||'').toLowerCase()};
 S.pending=LS.get(K('pending'))||{};S.rows=LS.get(K('rows'))||[];S.guards=LS.get(K('guards'))||[];
 S.view='list';renderList();
 await loadAll();
 for(const id in S.pending){const loc=S.pending[id];const row=S.rows.find(x=>x.id===id);if(row&&(row.uppdaterad||0)>=(loc.uppdaterad||0)){delete S.pending[id]}}
 savePending();flush();renderList();
}
sb.auth.onAuthStateChange((ev,session)=>{
 if(session&&session.user)setTimeout(()=>enter(session.user),0);
 else if(ev==='SIGNED_OUT'){S.me=null;S.rows=[];S.guards=[];S.shares=[];S.pending={};renderLogin('in')}
});
(async()=>{const {data}=await sb.auth.getSession();if(data&&data.session)enter(data.session.user);else renderLogin('in')})();

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
