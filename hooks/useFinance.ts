// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO FINANCE v2 — Hook COMPLETO (S27)
// hooks/useFinance.ts — Zero commercialista
// ═══════════════════════════════════════════════════════════
import {useState,useEffect,useMemo,useCallback} from 'react';
import {createClient} from '@supabase/supabase-js';
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const TIPI_MOV=['incasso','pagamento','trasferimento','stipendio','f24','leasing','carta','generico'];
export const CAT_COSTO=['materiali','energia','stipendi','affitto','trasporti','manutenzione','tasse','software','assicurazioni','marketing','altro'];
export const STATI_FE=['bozza','emessa','inviata_sdi','accettata','pagata','parziale','scaduta','annullata'];
export const STATI_FR=['ricevuta','registrata','pagata','parziale','contestata'];
export const IVA_ALIQUOTE=[22,10,4,0];

export default function useFinance(){
const[loading,setLoading]=useState(true);
const[conti,setConti]=useState([]);const[movimenti,setMovimenti]=useState([]);
const[fattureE,setFattureE]=useState([]);const[fattureR,setFattureR]=useState([]);
const[scadenze,setScadenze]=useState([]);const[costiFissi,setCostiFissi]=useState([]);
const[margini,setMargini]=useState([]);const[contratti,setContratti]=useState([]);
const[costoMin,setCostoMin]=useState([]);const[cashflow,setCashflow]=useState([]);
const[pianoConti,setPianoConti]=useState([]);const[primaNota,setPrimaNota]=useState([]);
const[registroIva,setRegistroIva]=useState([]);const[liquidazioniIva,setLiquidazioniIva]=useState([]);
const[ritenute,setRitenute]=useState([]);const[budget,setBudget]=useState([]);
const[solleciti,setSolleciti]=useState([]);const[riconciliazione,setRiconciliazione]=useState([]);
const[noteCredito,setNoteCredito]=useState([]);
const[toast,setToast]=useState(null);
const show=useCallback((msg,type='ok')=>{setToast({msg,type});setTimeout(()=>setToast(null),3500)},[]);

useEffect(()=>{(async()=>{const results=await Promise.all([
sb.from('fin_conti').select('*').eq('attivo',true).order('nome'),
sb.from('fin_movimenti').select('*').order('data',{ascending:false}).limit(500),
sb.from('fin_fatture_emesse').select('*').order('data_emissione',{ascending:false}).limit(200),
sb.from('fin_fatture_ricevute').select('*').order('data_ricezione',{ascending:false}).limit(200),
sb.from('fin_scadenze').select('*').order('data_scadenza').limit(300),
sb.from('fin_costi_fissi').select('*').eq('attivo',true).order('nome'),
sb.from('fin_margini').select('*').order('calcolato_il',{ascending:false}).limit(100),
sb.from('fin_contratti').select('*').order('nome'),
sb.from('fin_costo_minuto').select('*').order('tipo'),
sb.from('fin_cashflow').select('*').order('data').limit(200),
sb.from('fin_piano_conti').select('*').eq('attivo',true).order('codice'),
sb.from('fin_prima_nota').select('*').order('data',{ascending:false}).limit(500),
sb.from('fin_registro_iva').select('*').order('data_registrazione',{ascending:false}).limit(300),
sb.from('fin_liquidazione_iva').select('*').order('periodo',{ascending:false}).limit(24),
sb.from('fin_ritenute').select('*').order('data_fattura',{ascending:false}).limit(100),
sb.from('fin_budget').select('*').order('anno',{ascending:false}).limit(120),
sb.from('fin_solleciti').select('*').order('created_at',{ascending:false}).limit(100),
sb.from('fin_riconciliazione').select('*').order('data_operazione',{ascending:false}).limit(300),
sb.from('fin_note_credito').select('*').order('data_emissione',{ascending:false}).limit(50)]);
const d=results.map(r=>r.data||[]);
setConti(d[0]);setMovimenti(d[1]);setFattureE(d[2]);setFattureR(d[3]);setScadenze(d[4]);setCostiFissi(d[5]);
setMargini(d[6]);setContratti(d[7]);setCostoMin(d[8]);setCashflow(d[9]);setPianoConti(d[10]);setPrimaNota(d[11]);
setRegistroIva(d[12]);setLiquidazioniIva(d[13]);setRitenute(d[14]);setBudget(d[15]);setSolleciti(d[16]);
setRiconciliazione(d[17]);setNoteCredito(d[18]);setLoading(false)})()},[]);

// ── KPI ──
const kpi=useMemo(()=>{
const saldoTot=conti.reduce((s,c)=>s+(c.saldo||0),0);
const oggi=new Date().toISOString().split('T')[0];const now=new Date();
const mese=now.getMonth();const anno=now.getFullYear();
const incMese=movimenti.filter(m=>{const d=new Date(m.data);return d.getMonth()===mese&&d.getFullYear()===anno&&m.importo>0}).reduce((s,m)=>s+m.importo,0);
const uscMese=movimenti.filter(m=>{const d=new Date(m.data);return d.getMonth()===mese&&d.getFullYear()===anno&&m.importo<0}).reduce((s,m)=>s+Math.abs(m.importo),0);
const crediti=fattureE.filter(f=>!['pagata','annullata'].includes(f.stato)).reduce((s,f)=>s+(f.residuo||f.totale||0),0);
const debiti=fattureR.filter(f=>!['pagata'].includes(f.stato)).reduce((s,f)=>s+(f.residuo||f.totale||0),0);
const scad7=scadenze.filter(s=>s.stato==='attiva'&&s.data_scadenza&&new Date(s.data_scadenza)<=new Date(Date.now()+7*86400000)).length;
const fattScadute=fattureE.filter(f=>f.data_scadenza&&new Date(f.data_scadenza)<new Date()&&!['pagata','annullata'].includes(f.stato)).length;
const costiFissiMese=costiFissi.reduce((s,c)=>s+(c.importo_mensile||0),0);
const margMedio=margini.length?Math.round(margini.reduce((s,m)=>s+(m.margine_percent||0),0)/margini.length):0;
const inPerdita=margini.filter(m=>m.margine_reale<0).length;
// IVA
const periodo=anno+'-'+String(mese+1).padStart(2,'0');
const ivaVendite=registroIva.filter(r=>r.tipo==='vendite'&&r.periodo===periodo).reduce((s,r)=>s+(r.iva||0),0);
const ivaAcquisti=registroIva.filter(r=>r.tipo==='acquisti'&&r.periodo===periodo).reduce((s,r)=>s+(r.iva||0),0);
const ivaDovuta=ivaVendite-ivaAcquisti;
// Ritenute da versare
const ritDaVersare=ritenute.filter(r=>r.stato==='da_versare').reduce((s,r)=>s+(r.ritenuta||0),0);
// Budget scostamento
const budgetMese=budget.filter(b=>b.anno===anno&&b.mese===mese+1);
const budgetTot=budgetMese.reduce((s,b)=>s+(b.budget_previsto||0),0);
const spesoTot=budgetMese.reduce((s,b)=>s+(b.speso_reale||0),0);
// Solleciti
const sollDaInviare=solleciti.filter(s=>s.stato==='da_inviare').length;
// Riconciliazione
const nonRiconciliati=riconciliazione.filter(r=>r.stato==='non_riconciliato').length;
return{saldoTot,incMese,uscMese,nettoMese:incMese-uscMese,crediti,debiti,scad7,fattScadute,costiFissiMese,
margMedio,inPerdita,ivaVendite,ivaAcquisti,ivaDovuta,ritDaVersare,budgetTot,spesoTot,
budgetScost:budgetTot?Math.round((spesoTot/budgetTot)*100):0,sollDaInviare,nonRiconciliati,periodo}
},[conti,movimenti,fattureE,fattureR,scadenze,costiFissi,margini,registroIva,ritenute,budget,solleciti,riconciliazione]);

// ── Alert ──
const alerts=useMemo(()=>{
const a=[];
fattureE.filter(f=>f.data_scadenza&&new Date(f.data_scadenza)<new Date()&&!['pagata','annullata'].includes(f.stato))
.forEach(f=>a.push({t:'credito_scaduto',m:`${f.cliente} deve ${f.residuo||f.totale}€ — scad. ${f.data_scadenza}`,c:'#DC4444'}));
margini.filter(m=>m.margine_reale<0).forEach(m=>a.push({t:'perdita',m:`${m.commessa_code} in perdita: ${m.margine_reale}€`,c:'#DC4444'}));
if(kpi.ivaDovuta>0)a.push({t:'iva',m:`IVA da versare periodo corrente: ${kpi.ivaDovuta.toFixed(0)}€`,c:'#D08008'});
if(kpi.ritDaVersare>0)a.push({t:'ritenute',m:`Ritenute da versare: ${kpi.ritDaVersare.toFixed(0)}€`,c:'#D08008'});
if(kpi.budgetScost>100)a.push({t:'budget',m:`Budget superato: ${kpi.budgetScost}% del previsto`,c:'#DC4444'});
if(kpi.saldoTot<0)a.push({t:'saldo',m:`Saldo negativo: ${kpi.saldoTot.toFixed(0)}€`,c:'#DC4444'});
if(kpi.sollDaInviare>0)a.push({t:'solleciti',m:`${kpi.sollDaInviare} solleciti da inviare`,c:'#D08008'});
return a},[fattureE,margini,kpi]);

// ── Cashflow 30gg ──
const cashflow30=useMemo(()=>{
const days=[];const today=new Date();
for(let i=0;i<30;i++){const d=new Date(today);d.setDate(d.getDate()+i);const ds=d.toISOString().split('T')[0];
const scG=scadenze.filter(s=>s.data_scadenza===ds&&s.stato==='attiva');
const inc=scG.filter(s=>s.tipo==='credito').reduce((s,x)=>s+x.importo,0);
const usc=scG.filter(s=>s.tipo!=='credito').reduce((s,x)=>s+x.importo,0);
days.push({data:ds,incassi:inc,uscite:usc,netto:inc-usc})}
let r=kpi.saldoTot;days.forEach(d=>{r+=d.netto;d.saldo=r});return days},[scadenze,kpi.saldoTot]);

// ══════════════════════════════════════════════════════════
// CRUD BASE (v1)
// ══════════════════════════════════════════════════════════
const addConto=useCallback(async(nome,tipo,iban,saldo)=>{
try{const{data:n,error}=await sb.from('fin_conti').insert({nome,tipo:tipo||'banca',iban,saldo:saldo||0,attivo:true}).select().single();
if(error)throw error;setConti(p=>[...p,n]);show('Conto aggiunto');return n}catch(e){show(e.message,'error');return null}},[]);

const addMovimento=useCallback(async(data)=>{
try{const{data:n,error}=await sb.from('fin_movimenti').insert(data).select().single();if(error)throw error;
setMovimenti(p=>[n,...p]);
if(data.conto_id){const c=conti.find(x=>x.id===data.conto_id);if(c){const ns=(c.saldo||0)+data.importo;
await sb.from('fin_conti').update({saldo:ns,saldo_aggiornato:new Date().toISOString()}).eq('id',data.conto_id);
setConti(p=>p.map(x=>x.id===data.conto_id?{...x,saldo:ns}:x))}}
// Aggiorna budget
if(data.importo<0&&data.categoria){const now=new Date();const anno=now.getFullYear();const mese=now.getMonth()+1;
const existing=budget.find(b=>b.anno===anno&&b.mese===mese&&b.categoria===data.categoria);
if(existing){const ns=(existing.speso_reale||0)+Math.abs(data.importo);
await sb.from('fin_budget').update({speso_reale:ns,scostamento:ns-(existing.budget_previsto||0)}).eq('id',existing.id);
setBudget(p=>p.map(b=>b.id===existing.id?{...b,speso_reale:ns}:b))}}
show(data.importo>0?'Incasso registrato':'Pagamento registrato');return n}catch(e){show(e.message,'error');return null}},[conti,budget]);

const addFatturaE=useCallback(async(data)=>{
try{const iva=(data.imponibile||0)*(data.iva_percent||22)/100;const tot=(data.imponibile||0)+iva;
const obj={...data,iva,totale:tot,residuo:tot,stato:'emessa'};
const{data:n,error}=await sb.from('fin_fatture_emesse').insert(obj).select().single();if(error)throw error;
setFattureE(p=>[n,...p]);
// Auto-scadenza
if(data.data_scadenza)await sb.from('fin_scadenze').insert({tipo:'credito',controparte:data.cliente,descrizione:'Fatt. '+data.numero+' — '+data.cliente,importo:tot,data_scadenza:data.data_scadenza,fattura_emessa_id:n.id,commessa_id:data.commessa_id});
// Auto-registro IVA
const periodo=new Date(data.data_emissione||new Date()).toISOString().slice(0,7);
await sb.from('fin_registro_iva').insert({tipo:'vendite',periodo,numero_fattura:data.numero,controparte:data.cliente,imponibile:data.imponibile,aliquota_iva:data.iva_percent||22,iva,totale:tot,fattura_emessa_id:n.id});
// Auto-prima nota
await sb.from('fin_prima_nota').insert({data:data.data_emissione||new Date().toISOString().split('T')[0],descrizione:'Fatt. vendita '+data.numero+' — '+data.cliente,conto_dare_nome:'Crediti vs clienti',conto_avere_nome:'Ricavi vendite',importo:tot,fattura_emessa_id:n.id,tipo:'fattura_vendita',periodo});
show('Fattura '+data.numero+' emessa + IVA + Prima Nota');return n}catch(e){show(e.message,'error');return null}},[]);

const addFatturaR=useCallback(async(data)=>{
try{const{data:n,error}=await sb.from('fin_fatture_ricevute').insert({...data,residuo:data.totale,stato:'ricevuta'}).select().single();if(error)throw error;
setFattureR(p=>[n,...p]);
if(data.data_scadenza)await sb.from('fin_scadenze').insert({tipo:'debito',controparte:data.fornitore,descrizione:'Fatt. '+(data.numero||'')+' — '+data.fornitore,importo:data.totale,data_scadenza:data.data_scadenza,fattura_ricevuta_id:n.id});
const periodo=new Date(data.data_ricezione||new Date()).toISOString().slice(0,7);
await sb.from('fin_registro_iva').insert({tipo:'acquisti',periodo,numero_fattura:data.numero,controparte:data.fornitore,imponibile:data.imponibile,aliquota_iva:data.iva_percent||22,iva:data.iva,totale:data.totale,fattura_ricevuta_id:n.id});
await sb.from('fin_prima_nota').insert({data:data.data_ricezione||new Date().toISOString().split('T')[0],descrizione:'Fatt. acquisto '+(data.numero||'')+' — '+data.fornitore,conto_dare_nome:'Acquisti materiali',conto_avere_nome:'Debiti vs fornitori',importo:data.totale,fattura_ricevuta_id:n.id,tipo:'fattura_acquisto',periodo});
// Auto-ritenuta se professionista
if(data.ritenuta_acconto){const rit=(data.imponibile||0)*(data.aliquota_ritenuta||20)/100;
await sb.from('fin_ritenute').insert({fattura_ricevuta_id:n.id,fornitore:data.fornitore,fornitore_cf:data.fornitore_cf,imponibile:data.imponibile,aliquota_ritenuta:data.aliquota_ritenuta||20,ritenuta:rit,netto_pagare:(data.imponibile||0)-rit,data_fattura:data.data_ricezione,periodo}).then(({data:nr})=>{if(nr)setRitenute(p=>[nr,...p])})}
show('Fattura passiva registrata + IVA + Prima Nota');return n}catch(e){show(e.message,'error');return null}},[]);

const registraPagamento=useCallback(async(fattId,tipo,importo,contoId)=>{
try{const table=tipo==='emessa'?'fin_fatture_emesse':'fin_fatture_ricevute';
const fatt=tipo==='emessa'?fattureE.find(f=>f.id===fattId):fattureR.find(f=>f.id===fattId);if(!fatt)return;
const np=(fatt.pagato||0)+importo;const nr=Math.max(0,(fatt.totale||0)-np);const ns=nr<=0?'pagata':'parziale';
await sb.from(table).update({pagato:np,residuo:nr,stato:ns}).eq('id',fattId);
if(tipo==='emessa')setFattureE(p=>p.map(f=>f.id===fattId?{...f,pagato:np,residuo:nr,stato:ns}:f));
else setFattureR(p=>p.map(f=>f.id===fattId?{...f,pagato:np,residuo:nr,stato:ns}:f));
await addMovimento({data:new Date().toISOString().split('T')[0],tipo:tipo==='emessa'?'incasso':'pagamento',importo:tipo==='emessa'?importo:-importo,descrizione:'Pag. fatt. '+(fatt.numero||''),controparte:tipo==='emessa'?fatt.cliente:fatt.fornitore,fattura_id:fattId,conto_id:contoId,commessa_id:fatt.commessa_id,commessa_code:fatt.commessa_code});
await sb.from('fin_scadenze').update({stato:'pagata',pagato_il:new Date().toISOString().split('T')[0]}).or(`fattura_emessa_id.eq.${fattId},fattura_ricevuta_id.eq.${fattId}`);
show('Pagamento registrato')}catch(e){show(e.message,'error')}},[fattureE,fattureR,addMovimento]);

// ══════════════════════════════════════════════════════════
// NUOVI CRUD v2
// ══════════════════════════════════════════════════════════

// Liquidazione IVA
const calcolaLiquidazioneIVA=useCallback(async(periodo)=>{
try{const vendite=registroIva.filter(r=>r.tipo==='vendite'&&r.periodo===periodo).reduce((s,r)=>s+(r.iva||0),0);
const acquisti=registroIva.filter(r=>r.tipo==='acquisti'&&r.periodo===periodo).reduce((s,r)=>s+(r.iva||0),0);
const dovuta=vendite-acquisti;const prevLiq=liquidazioniIva.find(l=>l.periodo<periodo&&(l.debito_versare||0)<0);
const creditoPrec=prevLiq?Math.abs(prevLiq.debito_versare):0;const daVersare=dovuta-creditoPrec;
const{data:n,error}=await sb.from('fin_liquidazione_iva').insert({periodo,iva_vendite:vendite,iva_acquisti:acquisti,iva_dovuta:dovuta,credito_precedente:creditoPrec,debito_versare:daVersare,stato:'calcolata'}).select().single();
if(error)throw error;setLiquidazioniIva(p=>[n,...p]);show('Liquidazione IVA '+periodo+': '+(daVersare>0?'da versare '+daVersare.toFixed(0)+'€':'credito '+Math.abs(daVersare).toFixed(0)+'€'));return n}catch(e){show(e.message,'error');return null}},[registroIva,liquidazioniIva]);

// Solleciti automatici
const generaSolleciti=useCallback(async()=>{
const scadute=fattureE.filter(f=>f.data_scadenza&&new Date(f.data_scadenza)<new Date()&&!['pagata','annullata'].includes(f.stato));
let count=0;
for(const f of scadute){
const gg=Math.floor((Date.now()-new Date(f.data_scadenza).getTime())/86400000);
const existing=solleciti.find(s=>s.fattura_emessa_id===f.id&&s.stato!=='pagato');
if(existing)continue;
const livello=gg>90?3:gg>60?2:1;
const testi=['Gentile cliente, la informiamo che la fattura N.'+f.numero+' di '+f.totale+'€ risulta scaduta da '+gg+' giorni. La preghiamo di provvedere al pagamento.',
'Secondo sollecito: la fattura N.'+f.numero+' risulta non pagata da '+gg+' giorni. Importo dovuto: '+f.residuo+'€. La preghiamo di regolarizzare urgentemente.',
'DIFFIDA: la fattura N.'+f.numero+' è insoluta da '+gg+' giorni. Ci riserviamo di procedere per vie legali se non regolarizzata entro 15 giorni.'];
try{const{data:ns}=await sb.from('fin_solleciti').insert({fattura_emessa_id:f.id,cliente:f.cliente,importo_dovuto:f.residuo||f.totale,giorni_ritardo:gg,livello,stato:'da_inviare',testo:testi[livello-1]}).select().single();
if(ns){setSolleciti(p=>[ns,...p]);count++}}catch{}}
show(count>0?count+' solleciti generati':'Nessun nuovo sollecito','ok')},[fattureE,solleciti]);

const inviaSollecito=useCallback(async(sollId,canale)=>{
try{await sb.from('fin_solleciti').update({stato:'inviato',inviato_il:new Date().toISOString(),canale:canale||'email'}).eq('id',sollId);
setSolleciti(p=>p.map(s=>s.id===sollId?{...s,stato:'inviato'}:s));show('Sollecito inviato')}catch(e){show(e.message,'error')}},[]);

// Riconciliazione — import CSV
const importaEstrattoConto=useCallback(async(righe,contoId)=>{
// righe = [{data, importo, descrizione}] da CSV
let count=0;
for(const r of righe){
// Try auto-match
let matchFattId=null;let matchMovId=null;let auto=false;
const desc=(r.descrizione||'').toLowerCase();
// Match per importo+controparte su fatture
const matchFE=fattureE.find(f=>Math.abs((f.totale||0)-Math.abs(r.importo))<0.01&&r.importo>0);
const matchFR=fattureR.find(f=>Math.abs((f.totale||0)-Math.abs(r.importo))<0.01&&r.importo<0);
if(matchFE){matchFattId=matchFE.id;auto=true}
if(matchFR){matchFattId=matchFR.id;auto=true}
try{await sb.from('fin_riconciliazione').insert({conto_id:contoId,data_operazione:r.data,importo:r.importo,descrizione_banca:r.descrizione,causale_banca:r.causale||'',stato:auto?'riconciliato':'non_riconciliato',fattura_emessa_id:matchFE?.id||null,fattura_ricevuta_id:matchFR?.id||null,match_automatico:auto});count++}catch{}}
show(count+' movimenti importati, '+(righe.filter((_,i)=>i<count).length)+' auto-riconciliati')},[fattureE,fattureR]);

// Budget
const addBudget=useCallback(async(anno,mese,categoria,previsto)=>{
try{const{data:n,error}=await sb.from('fin_budget').upsert({anno,mese,categoria,budget_previsto:previsto,speso_reale:0,scostamento:-previsto},{onConflict:'azienda_id,anno,mese,categoria'}).select().single();
if(error)throw error;setBudget(p=>{const idx=p.findIndex(b=>b.anno===anno&&b.mese===mese&&b.categoria===categoria);if(idx>=0){const np=[...p];np[idx]=n;return np}return[...p,n]});
show('Budget '+categoria+' impostato')}catch(e){show(e.message,'error')}},[]);

// Costo al minuto
const addCostoMinuto=useCallback(async(tipo,riferimento,costoOra,componenti)=>{
try{const{data:n,error}=await sb.from('fin_costo_minuto').insert({tipo,riferimento,costo_ora:costoOra,componenti:componenti||{},calcolato_il:new Date().toISOString()}).select().single();
if(error)throw error;setCostoMin(p=>[...p,n]);show('Costo/minuto calcolato: '+riferimento)}catch(e){show(e.message,'error')}},[]);

// Margini
const addMargine=useCallback(async(data)=>{
try{const ct=((data.costo_materiali||0)+(data.costo_manodopera||0)+(data.costo_trasporto||0)+(data.costo_indiretti||0)+(data.costo_imprevisti||0));
const mr=(data.ricavo_fatturato||0)-ct;const mp=data.ricavo_fatturato?Math.round(mr/data.ricavo_fatturato*100):0;
const{data:n,error}=await sb.from('fin_margini').insert({...data,costo_totale:ct,margine_reale:mr,margine_percent:mp,stato:mr<0?'in_perdita':'in_corso'}).select().single();
if(error)throw error;setMargini(p=>[n,...p]);show('Margine calcolato');return n}catch(e){show(e.message,'error');return null}},[]);

const addCostoFisso=useCallback(async(data)=>{
try{const{data:n,error}=await sb.from('fin_costi_fissi').insert({...data,attivo:true}).select().single();
if(error)throw error;setCostiFissi(p=>[...p,n]);show('Costo fisso aggiunto')}catch(e){show(e.message,'error')}},[]);

const addContratto=useCallback(async(data)=>{
try{const{data:n,error}=await sb.from('fin_contratti').insert({...data,stato:'attivo'}).select().single();
if(error)throw error;setContratti(p=>[...p,n]);show('Contratto aggiunto')}catch(e){show(e.message,'error')}},[]);

// Note di credito
const addNotaCredito=useCallback(async(data)=>{
try{const{data:n,error}=await sb.from('fin_note_credito').insert({...data,stato:'emessa'}).select().single();
if(error)throw error;setNoteCredito(p=>[n,...p]);
// Registro IVA rettifica
const periodo=new Date(data.data_emissione||new Date()).toISOString().slice(0,7);
const tipoIva=data.tipo==='emessa'?'vendite':'acquisti';
await sb.from('fin_registro_iva').insert({tipo:tipoIva,periodo,numero_fattura:'NC-'+data.numero,controparte:data.controparte,imponibile:-(data.imponibile||0),iva:-(data.iva||0),totale:-(data.totale||0)});
show('Nota di credito emessa')}catch(e){show(e.message,'error')}},[]);

// Analisi per categoria
const analisiCategorie=useMemo(()=>{
const now=new Date();const mese=now.getMonth();const anno=now.getFullYear();
const movMese=movimenti.filter(m=>{const d=new Date(m.data);return d.getMonth()===mese&&d.getFullYear()===anno&&m.importo<0});
const cat={};movMese.forEach(m=>{const c=m.categoria||'altro';if(!cat[c])cat[c]={cat:c,totale:0,count:0};cat[c].totale+=Math.abs(m.importo);cat[c].count++});
return Object.values(cat).sort((a,b)=>b.totale-a.totale)},[movimenti]);

// Bilancio di verifica semplificato
const bilancioVerifica=useMemo(()=>{
const contiMap={};primaNota.forEach(pn=>{
if(pn.conto_dare_nome){if(!contiMap[pn.conto_dare_nome])contiMap[pn.conto_dare_nome]={nome:pn.conto_dare_nome,dare:0,avere:0};contiMap[pn.conto_dare_nome].dare+=(pn.importo||0)}
if(pn.conto_avere_nome){if(!contiMap[pn.conto_avere_nome])contiMap[pn.conto_avere_nome]={nome:pn.conto_avere_nome,dare:0,avere:0};contiMap[pn.conto_avere_nome].avere+=(pn.importo||0)}});
return Object.values(contiMap).map(c=>({...c,saldo:c.dare-c.avere}))},[primaNota]);

return{loading,conti,movimenti,fattureE,fattureR,scadenze,costiFissi,margini,contratti,costoMin,cashflow,
pianoConti,primaNota,registroIva,liquidazioniIva,ritenute,budget,solleciti,riconciliazione,noteCredito,
kpi,alerts,cashflow30,analisiCategorie,bilancioVerifica,toast,setToast,show,
addConto,addMovimento,addFatturaE,addFatturaR,registraPagamento,addCostoFisso,addContratto,addMargine,
calcolaLiquidazioneIVA,generaSolleciti,inviaSollecito,importaEstrattoConto,addBudget,addCostoMinuto,addNotaCredito,
setConti,setMovimenti,setFattureE,setFattureR,setScadenze,setCostiFissi,setMargini,setContratti,setBudget,setSolleciti}
}
