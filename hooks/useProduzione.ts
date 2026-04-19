// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO PRODUZIONE — Hook dati + CRUD (S27)
// hooks/useProduzione.ts
// ═══════════════════════════════════════════════════════════
import {useState,useEffect,useMemo,useCallback} from 'react';
import {createClient} from '@supabase/supabase-js';
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// ── Status maps ──
export const MACHINE_STATI:Record<string,{l:string,c:string}>={
libera:{l:'Libera',c:'#1A9E73'},in_setup:{l:'Setup',c:'#D08008'},in_lavorazione:{l:'In lavoro',c:'#28A0A0'},
pausa:{l:'Pausa',c:'#6B7280'},guasto:{l:'Guasto',c:'#DC4444'},attesa_materiale:{l:'Att. materiale',c:'#D08008'},
attesa_operatore:{l:'Att. operatore',c:'#7C3AED'},manutenzione:{l:'Manutenzione',c:'#3B7FE0'},
spenta:{l:'Spenta',c:'#999'},fuori_servizio:{l:'Fuori servizio',c:'#444'}};

export const WO_STATI:Record<string,{l:string,c:string}>={
pianificato:{l:'Pianificato',c:'#6B7280'},pronto:{l:'Pronto',c:'#3B7FE0'},in_setup:{l:'Setup',c:'#D08008'},
in_lavorazione:{l:'In lavoro',c:'#28A0A0'},pausa:{l:'Pausa',c:'#6B7280'},bloccato:{l:'Bloccato',c:'#DC4444'},
completato:{l:'Completato',c:'#1A9E73'},annullato:{l:'Annullato',c:'#999'}};

export const BLOCCO_CAUSE=['manca_materiale','manca_conferma','macchina_guasta','attrezzo_assente',
'operatore_assente','priorita_cambiata','qualita_non_conforme','attesa_decisione',
'attesa_cliente','attesa_fornitore','attesa_trasporto'];

export const PRIORITA=[{id:'bassa',c:'#6B7280'},{id:'normale',c:'#28A0A0'},{id:'alta',c:'#D08008'},{id:'urgente',c:'#DC4444'},{id:'critica',c:'#DC4444'}];

export const FASI_PRODUZIONE=['taglio','saldatura','assemblaggio','pulizia','vetro','ferramenta',
'sigillatura','guarnizioni','imballo','collaudo','spedizione','verniciatura','lavorazione_custom'];

export function stOf(id:string,map:Record<string,{l:string,c:string}>){return map[id]||{l:id,c:'#999'}}

export default function useProduzione(){
const[loading,setLoading]=useState(true);
const[wo,setWo]=useState<any[]>([]);
const[macchine,setMacchine]=useState<any[]>([]);
const[reparti,setReparti]=useState<any[]>([]);
const[attrezzi,setAttrezzi]=useState<any[]>([]);
const[mezzi,setMezzi]=useState<any[]>([]);
const[blocchi,setBlocchi]=useState<any[]>([]);
const[events,setEvents]=useState<any[]>([]);
const[assegnazioni,setAssegnazioni]=useState<any[]>([]);
const[skills,setSkills]=useState<any[]>([]);
const[routing,setRouting]=useState<any[]>([]);
const[routingSteps,setRoutingSteps]=useState<any[]>([]);
const[quality,setQuality]=useState<any[]>([]);
const[manutenzioni,setManutenzioni]=useState<any[]>([]);
const[turni,setTurni]=useState<any[]>([]);
const[toolCheckouts,setToolCheckouts]=useState<any[]>([]);
const[toast,setToast]=useState<{msg:string,type:string}|null>(null);

const showToast=useCallback((msg:string,type='ok')=>{setToast({msg,type});setTimeout(()=>setToast(null),3500)},[]);

// ── Load ──
const reload=useCallback(async()=>{
const[r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15]=await Promise.all([
sb.from('prod_work_orders').select('*').order('created_at',{ascending:false}).limit(300),
sb.from('prod_macchine').select('*').eq('attivo',true).order('nome'),
sb.from('prod_reparti').select('*').eq('attivo',true).order('ordine'),
sb.from('prod_attrezzi').select('*').eq('attivo',true).order('nome'),
sb.from('prod_mezzi').select('*').eq('attivo',true).order('nome'),
sb.from('prod_blocchi').select('*').order('aperto_il',{ascending:false}).limit(100),
sb.from('prod_events').select('*').order('created_at',{ascending:false}).limit(200),
sb.from('prod_assegnazioni').select('*').is('fine',null).order('inizio',{ascending:false}),
sb.from('prod_skills').select('*').order('operatore_nome'),
sb.from('prod_routing').select('*').eq('attivo',true).order('nome'),
sb.from('prod_routing_steps').select('*').order('ordine'),
sb.from('prod_quality').select('*').order('created_at',{ascending:false}).limit(100),
sb.from('prod_manutenzioni').select('*').order('data_prevista').limit(100),
sb.from('prod_turni').select('*').order('data',{ascending:false}).limit(200),
sb.from('prod_tool_checkout').select('*').is('checkin_at',null).order('checkout_at',{ascending:false})]);
setWo(r1.data||[]);setMacchine(r2.data||[]);setReparti(r3.data||[]);setAttrezzi(r4.data||[]);
setMezzi(r5.data||[]);setBlocchi(r6.data||[]);setEvents(r7.data||[]);setAssegnazioni(r8.data||[]);
setSkills(r9.data||[]);setRouting(r10.data||[]);setRoutingSteps(r11.data||[]);setQuality(r12.data||[]);
setManutenzioni(r13.data||[]);setTurni(r14.data||[]);setToolCheckouts(r15.data||[]);
setLoading(false)},[]);

useEffect(()=>{reload()},[]);

// ── KPI ──
const kpi=useMemo(()=>{
const attivi=wo.filter(w=>['in_lavorazione','in_setup'].includes(w.stato));
const bloccati=wo.filter(w=>w.stato==='bloccato');
const ritardo=wo.filter(w=>w.data_fine_prevista&&new Date(w.data_fine_prevista)<new Date()&&!['completato','annullato'].includes(w.stato));
const completatiOggi=wo.filter(w=>w.stato==='completato'&&w.data_fine_reale&&new Date(w.data_fine_reale).toDateString()===new Date().toDateString());
const macchineLavoro=macchine.filter(m=>m.stato==='in_lavorazione');
const macchineFerme=macchine.filter(m=>['guasto','manutenzione','attesa_materiale','attesa_operatore'].includes(m.stato));
const opAttivi=assegnazioni.filter(a=>a.stato==='in_lavorazione');
const blocchiAperti=blocchi.filter(b=>b.stato==='aperto');
const manScadute=manutenzioni.filter(m=>m.stato==='pianificata'&&m.data_prevista&&new Date(m.data_prevista)<new Date());
const qualityFail=quality.filter(q=>q.esito==='non_conforme');
return{attivi:attivi.length,bloccati:bloccati.length,ritardo:ritardo.length,completatiOggi:completatiOggi.length,
macchineLavoro:macchineLavoro.length,macchineTotal:macchine.length,macchineFerme:macchineFerme.length,
opAttivi:opAttivi.length,blocchiAperti:blocchiAperti.length,
woTotali:wo.filter(w=>!['completato','annullato'].includes(w.stato)).length,
manScadute:manScadute.length,qualityFail:qualityFail.length,
skillsTotal:skills.length,routingTotal:routing.length}
},[wo,macchine,blocchi,assegnazioni,manutenzioni,quality,skills,routing]);

// ── Log event helper ──
const logEvent=useCallback(async(woId:string|null,tipo:string,dati?:any,risorsa_tipo?:string,risorsa_id?:string)=>{
try{const{data:ev}=await sb.from('prod_events').insert({work_order_id:woId,tipo,dati:dati||{},
operatore:'Operatore',risorsa_tipo,risorsa_id}).select().single();
if(ev)setEvents(p=>[ev,...p])}catch{}},[]);

// ══════════════════════════════════════════════════════════
// WORK ORDERS CRUD
// ══════════════════════════════════════════════════════════
const createWO=useCallback(async(data:any)=>{
const codice='WO-'+new Date().getFullYear()+'-'+String(wo.length+1).padStart(4,'0');
const obj={...data,codice,stato:'pianificato',stato_dal:new Date().toISOString()};
try{const{data:nw,error}=await sb.from('prod_work_orders').insert(obj).select().single();if(error)throw error;
setWo(p=>[nw,...p]);await logEvent(nw.id,'wo.created',{codice});
showToast('WO '+codice+' creato');return nw}catch(e:any){showToast('Errore: '+e.message,'error');return null}},[wo.length]);

const updateWOStato=useCallback(async(woId:string,stato:string,note?:string)=>{
try{const updates:any={stato,stato_dal:new Date().toISOString()};
if(stato==='in_lavorazione'&&!wo.find(w=>w.id===woId)?.data_inizio_reale)updates.data_inizio_reale=new Date().toISOString();
if(stato==='completato')updates.data_fine_reale=new Date().toISOString();
const{error}=await sb.from('prod_work_orders').update(updates).eq('id',woId);if(error)throw error;
setWo(p=>p.map(w=>w.id===woId?{...w,...updates}:w));
await logEvent(woId,'wo.'+stato,{note});
showToast('Stato: '+stOf(stato,WO_STATI).l)}catch(e:any){showToast('Errore','error')}},[wo]);

const updateWOField=useCallback(async(woId:string,field:string,value:any)=>{
try{const{error}=await sb.from('prod_work_orders').update({[field]:value}).eq('id',woId);if(error)throw error;
setWo(p=>p.map(w=>w.id===woId?{...w,[field]:value}:w));showToast('Aggiornato')}catch(e:any){showToast('Errore','error')}},[]);

const assignWO=useCallback(async(woId:string,operatore:string,macchinaId?:string)=>{
try{await sb.from('prod_work_orders').update({operatore_nome:operatore,macchina_id:macchinaId||null}).eq('id',woId);
setWo(p=>p.map(w=>w.id===woId?{...w,operatore_nome:operatore,macchina_id:macchinaId}:w));
// Create assignment
const wo_=wo.find(w=>w.id===woId);
await sb.from('prod_assegnazioni').insert({operatore_nome:operatore,work_order_id:woId,
macchina_id:macchinaId||null,reparto_id:wo_?.reparto_id,stato:'assegnato'}).select().single()
.then(({data:a})=>{if(a)setAssegnazioni(p=>[a,...p])});
await logEvent(woId,'wo.assigned',{operatore,macchina:macchinaId});
showToast(operatore+' assegnato')}catch(e:any){showToast('Errore','error')}},[wo]);

// ══════════════════════════════════════════════════════════
// BLOCCHI
// ══════════════════════════════════════════════════════════
const createBlocco=useCallback(async(woId:string,causa:string,descrizione?:string,impatto?:string)=>{
try{const{data:nb,error}=await sb.from('prod_blocchi').insert({work_order_id:woId,causa,
descrizione:descrizione||causa,impatto:impatto||'medio',aperto_da:'Operatore',stato:'aperto'}).select().single();
if(error)throw error;setBlocchi(p=>[nb,...p]);
await updateWOStato(woId,'bloccato',causa);
showToast('Blocco registrato','warn');return nb}catch(e:any){showToast('Errore','error');return null}},[]);

const risolviBlocco=useCallback(async(bId:string,azione?:string)=>{
try{await sb.from('prod_blocchi').update({stato:'risolto',chiuso_il:new Date().toISOString(),
chiuso_da:'Operatore',azione_risolutiva:azione}).eq('id',bId);
const blocco=blocchi.find(b=>b.id===bId);
setBlocchi(p=>p.map(b=>b.id===bId?{...b,stato:'risolto'}:b));
if(blocco?.work_order_id){
const altriAperti=blocchi.filter(b=>b.work_order_id===blocco.work_order_id&&b.id!==bId&&b.stato==='aperto');
if(altriAperti.length===0)await updateWOStato(blocco.work_order_id,'pronto','Blocco risolto')}
showToast('Blocco risolto')}catch(e:any){showToast('Errore','error')}},[blocchi]);

// ══════════════════════════════════════════════════════════
// MACCHINE
// ══════════════════════════════════════════════════════════
const createMachine=useCallback(async(nome:string,tipo?:string,repartoId?:string)=>{
try{const{data:nm,error}=await sb.from('prod_macchine').insert({nome,tipo,reparto_id:repartoId||null,stato:'spenta',attivo:true}).select().single();
if(error)throw error;setMacchine(p=>[...p,nm]);showToast('Macchina aggiunta');return nm}catch(e:any){showToast('Errore','error');return null}},[]);

const updateMachineStato=useCallback(async(mId:string,stato:string)=>{
try{await sb.from('prod_macchine').update({stato,stato_dal:new Date().toISOString()}).eq('id',mId);
setMacchine(p=>p.map(m=>m.id===mId?{...m,stato}:m));
await logEvent(null,'machine.'+stato,{},  'machine',mId);
showToast(stOf(stato,MACHINE_STATI).l)}catch(e:any){showToast('Errore','error')}},[]);

const linkMachineToWO=useCallback(async(mId:string,woId:string)=>{
try{await sb.from('prod_macchine').update({job_corrente_id:woId}).eq('id',mId);
setMacchine(p=>p.map(m=>m.id===mId?{...m,job_corrente_id:woId}:m))}catch{}},[]);

// ══════════════════════════════════════════════════════════
// REPARTI
// ══════════════════════════════════════════════════════════
const createReparto=useCallback(async(nome:string,colore?:string,capacita?:number)=>{
try{const{data:nr,error}=await sb.from('prod_reparti').insert({nome,colore:colore||'#28A0A0',
ordine:reparti.length,capacita_ore_giorno:capacita||8,attivo:true}).select().single();
if(error)throw error;setReparti(p=>[...p,nr]);showToast('Reparto creato');return nr}catch(e:any){showToast('Errore','error');return null}},[reparti.length]);

// ══════════════════════════════════════════════════════════
// ATTREZZI + MEZZI
// ══════════════════════════════════════════════════════════
const createAttrezzo=useCallback(async(nome:string,categoria?:string,repartoId?:string)=>{
try{const{data:na,error}=await sb.from('prod_attrezzi').insert({nome,categoria,reparto_id:repartoId||null,stato:'disponibile',attivo:true}).select().single();
if(error)throw error;setAttrezzi(p=>[...p,na]);showToast('Attrezzo aggiunto');return na}catch(e:any){showToast('Errore','error');return null}},[]);

const checkoutTool=useCallback(async(attrezzoId:string,operatore:string)=>{
try{await sb.from('prod_attrezzi').update({stato:'in_uso',assegnato_a:operatore,ultimo_uso:new Date().toISOString()}).eq('id',attrezzoId);
const{data:tc}=await sb.from('prod_tool_checkout').insert({attrezzo_id:attrezzoId,operatore}).select().single();
if(tc)setToolCheckouts(p=>[tc,...p]);
setAttrezzi(p=>p.map(a=>a.id===attrezzoId?{...a,stato:'in_uso',assegnato_a:operatore}:a));
showToast(operatore+' ha preso l\'attrezzo')}catch(e:any){showToast('Errore','error')}},[]);

const checkinTool=useCallback(async(attrezzoId:string)=>{
try{await sb.from('prod_attrezzi').update({stato:'disponibile',assegnato_a:null}).eq('id',attrezzoId);
await sb.from('prod_tool_checkout').update({checkin_at:new Date().toISOString()}).eq('attrezzo_id',attrezzoId).is('checkin_at',null);
setAttrezzi(p=>p.map(a=>a.id===attrezzoId?{...a,stato:'disponibile',assegnato_a:null}:a));
setToolCheckouts(p=>p.filter(tc=>tc.attrezzo_id!==attrezzoId));
showToast('Attrezzo restituito')}catch(e:any){showToast('Errore','error')}},[]);

const createMezzo=useCallback(async(nome:string,tipo?:string,targa?:string)=>{
try{const{data:nm,error}=await sb.from('prod_mezzi').insert({nome,tipo,targa,stato:'in_sede',attivo:true}).select().single();
if(error)throw error;setMezzi(p=>[...p,nm]);showToast('Mezzo aggiunto');return nm}catch(e:any){showToast('Errore','error');return null}},[]);

const updateMezzoStato=useCallback(async(mId:string,stato:string,autista?:string,destinazione?:string)=>{
try{await sb.from('prod_mezzi').update({stato,autista:autista||null,destinazione:destinazione||null}).eq('id',mId);
setMezzi(p=>p.map(m=>m.id===mId?{...m,stato,autista,destinazione}:m));
showToast('Mezzo: '+stato.replace(/_/g,' '))}catch(e:any){showToast('Errore','error')}},[]);

// ══════════════════════════════════════════════════════════
// ROUTING TEMPLATES
// ══════════════════════════════════════════════════════════
const createRouting=useCallback(async(nome:string,famiglia?:string,steps?:{fase:string,tempo_stimato_min:number,reparto_id?:string}[])=>{
try{const{data:nr,error}=await sb.from('prod_routing').insert({nome,famiglia,attivo:true}).select().single();
if(error)throw error;
if(steps?.length&&nr){
const stepsData=steps.map((s,i)=>({routing_id:nr.id,ordine:i+1,fase:s.fase,tempo_stimato_min:s.tempo_stimato_min,reparto_id:s.reparto_id||null}));
const{data:ns}=await sb.from('prod_routing_steps').insert(stepsData).select();
if(ns)setRoutingSteps(p=>[...p,...ns])}
setRouting(p=>[...p,nr]);showToast('Routing "'+nome+'" creato');return nr}catch(e:any){showToast('Errore','error');return null}},[]);

const getRoutingSteps=useCallback((routingId:string)=>{
return routingSteps.filter(s=>s.routing_id===routingId).sort((a,b)=>a.ordine-b.ordine)},[routingSteps]);

// ══════════════════════════════════════════════════════════
// SKILLS
// ══════════════════════════════════════════════════════════
const addSkill=useCallback(async(operatore:string,skill:string,livello?:number)=>{
try{const{data:ns,error}=await sb.from('prod_skills').insert({operatore_nome:operatore,skill,livello:livello||1}).select().single();
if(error)throw error;setSkills(p=>[...p,ns]);showToast('Skill aggiunta');return ns}catch(e:any){showToast('Errore','error');return null}},[]);

const getOperatoreSkills=useCallback((nome:string)=>{return skills.filter(s=>s.operatore_nome===nome)},[skills]);

const findOperatoriBySkill=useCallback((skill:string,minLivello?:number)=>{
return skills.filter(s=>s.skill===skill&&s.livello>=(minLivello||1))},[skills]);

// ══════════════════════════════════════════════════════════
// QUALITY
// ══════════════════════════════════════════════════════════
const addQualityCheck=useCallback(async(woId:string,fase:string,esito:string,checklist?:any[],note?:string)=>{
try{const{data:nq,error}=await sb.from('prod_quality').insert({work_order_id:woId,fase,esito,
checklist:checklist||[],operatore:'Operatore',note}).select().single();
if(error)throw error;setQuality(p=>[nq,...p]);
await logEvent(woId,'wo.quality_'+esito,{fase});
if(esito==='non_conforme')showToast('Non conformita registrata','warn');
else showToast('Controllo qualita OK');return nq}catch(e:any){showToast('Errore','error');return null}},[]);

// ══════════════════════════════════════════════════════════
// MANUTENZIONI
// ══════════════════════════════════════════════════════════
const createManutenzione=useCallback(async(risorsa_tipo:string,risorsa_id:string,tipo:string,descrizione:string,data_prevista?:string)=>{
try{const{data:nm,error}=await sb.from('prod_manutenzioni').insert({risorsa_tipo,risorsa_id,tipo,
descrizione,data_prevista:data_prevista||null,stato:'pianificata'}).select().single();
if(error)throw error;setManutenzioni(p=>[nm,...p]);showToast('Manutenzione pianificata');return nm}catch(e:any){showToast('Errore','error');return null}},[]);

const completaManutenzione=useCallback(async(mId:string,eseguita_da?:string,costo?:number)=>{
try{await sb.from('prod_manutenzioni').update({stato:'completata',data_esecuzione:new Date().toISOString(),
eseguita_da:eseguita_da||'Operatore',costo:costo||0}).eq('id',mId);
setManutenzioni(p=>p.map(m=>m.id===mId?{...m,stato:'completata'}:m));
showToast('Manutenzione completata')}catch(e:any){showToast('Errore','error')}},[]);

// ══════════════════════════════════════════════════════════
// TURNI
// ══════════════════════════════════════════════════════════
const addTurno=useCallback(async(operatore:string,data:string,ora_inizio?:string,ora_fine?:string,repartoId?:string)=>{
try{const{data:nt,error}=await sb.from('prod_turni').insert({operatore_nome:operatore,data,
ora_inizio:ora_inizio||'08:00',ora_fine:ora_fine||'17:00',reparto_id:repartoId||null,stato:'pianificato'}).select().single();
if(error)throw error;setTurni(p=>[nt,...p]);return nt}catch(e:any){showToast('Errore','error');return null}},[]);

const getTurniOggi=useCallback(()=>{
const oggi=new Date().toISOString().split('T')[0];
return turni.filter(t=>t.data===oggi)},[turni]);

// ══════════════════════════════════════════════════════════
// ASSEGNAZIONI
// ══════════════════════════════════════════════════════════
const closeAssignment=useCallback(async(aId:string)=>{
try{await sb.from('prod_assegnazioni').update({fine:new Date().toISOString()}).eq('id',aId);
setAssegnazioni(p=>p.filter(a=>a.id!==aId));
showToast('Assegnazione chiusa')}catch(e:any){showToast('Errore','error')}},[]);

// ── Computed: operatori unici dalle assegnazioni + skills + turni ──
const operatori=useMemo(()=>{
const nomi=new Set<string>();
assegnazioni.forEach(a=>{if(a.operatore_nome)nomi.add(a.operatore_nome)});
skills.forEach(s=>{if(s.operatore_nome)nomi.add(s.operatore_nome)});
turni.forEach(t=>{if(t.operatore_nome)nomi.add(t.operatore_nome)});
return[...nomi].sort().map(nome=>({
nome,
skills:skills.filter(s=>s.operatore_nome===nome),
assegnazione:assegnazioni.find(a=>a.operatore_nome===nome&&!a.fine),
turnoOggi:turni.find(t=>t.operatore_nome===nome&&t.data===new Date().toISOString().split('T')[0])
}))},[assegnazioni,skills,turni]);

// ── Computed: saturazione reparti ──
const saturazioneReparti=useMemo(()=>{
return reparti.map(r=>{
const woRep=wo.filter(w=>w.reparto_id===r.id&&['in_lavorazione','in_setup','pronto'].includes(w.stato));
const macRep=macchine.filter(m=>m.reparto_id===r.id);
const macAttive=macRep.filter(m=>m.stato==='in_lavorazione');
const caricoMin=woRep.reduce((s,w)=>s+(w.tempo_stimato_min||0),0);
const capacitaMin=(r.capacita_ore_giorno||8)*60;
return{...r,woAttivi:woRep.length,macchineTotal:macRep.length,macchineAttive:macAttive.length,
caricoMin,capacitaMin,saturazione:capacitaMin>0?Math.round(caricoMin/capacitaMin*100):0}
})},[reparti,wo,macchine]);

return{
// Data
loading,wo,macchine,reparti,attrezzi,mezzi,blocchi,events,assegnazioni,
skills,routing,routingSteps,quality,manutenzioni,turni,toolCheckouts,
// Computed
kpi,operatori,saturazioneReparti,
// Toast
toast,showToast,setToast,
// WO
createWO,updateWOStato,updateWOField,assignWO,
// Blocchi
createBlocco,risolviBlocco,
// Macchine
createMachine,updateMachineStato,linkMachineToWO,
// Reparti
createReparto,
// Attrezzi
createAttrezzo,checkoutTool,checkinTool,
// Mezzi
createMezzo,updateMezzoStato,
// Routing
createRouting,getRoutingSteps,
// Skills
addSkill,getOperatoreSkills,findOperatoriBySkill,
// Quality
addQualityCheck,
// Manutenzioni
createManutenzione,completaManutenzione,
// Turni
addTurno,getTurniOggi,
// Assegnazioni
closeAssignment,
// Log
logEvent,
// Reload
reload,
// Setters for direct updates
setWo,setMacchine,setReparti,setAttrezzi,setMezzi,setBlocchi,setEvents,
setAssegnazioni,setSkills,setRouting,setRoutingSteps,setQuality,setManutenzioni,setTurni
}}
