// @ts-nocheck
'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO — Procurement Ops Engine v5 (S26)
// Estetica fliwoX: bottoni 3D grandi, card con shadow, colori forti
// 8 tab + Supply Item Flow + Risk Score + Stato per riga
// ═══════════════════════════════════════════════════════════
import React,{useState,useEffect,useMemo} from 'react';
import {createClient} from '@supabase/supabase-js';
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C={tl:'#28A0A0',dk:'#156060',ink:'#0D1F1F',bg:'#EEF8F8',bdr:'#C8E4E4',wh:'#FFFFFF',red:'#DC4444',grn:'#1A9E73',amb:'#D08008',blu:'#3B7FE0',vio:'#7C3AED'};
const FF="'Inter',system-ui,sans-serif",FM="'JetBrains Mono',monospace";

// ── SVG Icons ──
const ico=(d,s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const IC={
back:ico(<path d="M19 12H5M12 19l-7-7 7-7"/>),
plus:ico(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
check:ico(<polyline points="20 6 9 17 4 12"/>),
truck:ico(<><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,20),
dl:ico(<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
mail:ico(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></>),
trash:ico(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>),
alert:ico(<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>),
cal:ico(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
star:ico(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>),
chart:ico(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>),
tag:ico(<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>),
search:ico(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>),
file:ico(<><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></>),
clock:ico(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
box:ico(<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>),
gear:ico(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>),
warn:ico(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>),
};

// ── Constants ──
const STATI_ORD=[{id:'bozza',l:'Bozza',c:'#999'},{id:'approvato',l:'Approvato',c:C.blu},{id:'inviato',l:'Inviato',c:C.amb},{id:'confermato_forn',l:'Confermato',c:'#6366F1'},{id:'modificato_forn',l:'Modificato',c:'#F59E0B'},{id:'in_produzione',l:'In produzione',c:C.vio},{id:'spedito',l:'Spedito',c:C.blu},{id:'ricevuto_parziale',l:'Parziale',c:C.amb},{id:'ricevuto',l:'Ricevuto',c:C.grn},{id:'controllato',l:'Controllato',c:'#059669'},{id:'chiuso',l:'Chiuso',c:'#6B7280'},{id:'contestato',l:'Contestato',c:C.red},{id:'annullato',l:'Annullato',c:C.red}];
const STATI_RICH=[{id:'aperta',l:'Aperta',c:C.amb},{id:'approvata',l:'Approvata',c:C.blu},{id:'in_ordine',l:'In ordine',c:C.vio},{id:'completata',l:'Completata',c:C.grn},{id:'annullata',l:'Annullata',c:C.red}];
const PRIOR=[{id:'bassa',l:'Bassa',c:'#6B7280'},{id:'normale',l:'Normale',c:C.tl},{id:'alta',l:'Alta',c:C.amb},{id:'urgente',l:'Urgente',c:'#F59E0B'},{id:'critica',l:'Critica',c:C.red}];
const CAT=['Profili','Vetri','Ferramenta','Guarnizioni','Accessori','Controtelai','Cassonetti','Davanzali','Soglie','Zanzariere','Tapparelle','Viti/Fissaggi','Schiume/Sigillanti','Cantiere','Ufficio','Altro'];
const FONTI=['manuale','commessa','magazzino','scorta_minima','anomalia','produzione'];
const TIPO_CONT=['danno','articolo_errato','colore_errato','qta_errata','ritardo_grave','prezzo_non_concordato','accessorio_mancante'];
const CONF_FORN=[{id:'totale',l:'Conferma totale'},{id:'parziale',l:'Parziale'},{id:'nuova_data',l:'Nuova data'},{id:'indisponibile',l:'Indisponibile'},{id:'sostituzione',l:'Sostituzione'},{id:'variazione_prezzo',l:'Variazione prezzo'}];
const SIF=['Fabbisogno','Sourcing','Ordinato','Confermato','Spedito','Ricevuto','Controllato','Utilizzato'];
function fD(d){if(!d)return'-';try{return new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})}catch{return d}}
function fE(n){return'\u20AC'+(n||0).toFixed(2).replace('.',',')}
function ggR(dc){if(!dc)return 0;return Math.floor((Date.now()-new Date(dc).getTime())/864e5)}
function stC(id,arr){return arr.find(s=>s.id===id)||arr[0]}
function sifIdx(s){return({pending:1,da_confermare:2,confermata:3,modificata:3,in_produzione:3,spedita:4,ricevuta:5,contestata:5,chiusa:7})[s]||2}

// ── UI Components — Big Beautiful Buttons ──
function Badge({text,color,big}){return<span style={{padding:big?'5px 14px':'3px 10px',borderRadius:big?8:5,fontSize:big?12:10,fontWeight:800,background:color+'18',color,whiteSpace:'nowrap',letterSpacing:'.3px'}}>{text}</span>}

function KpiCard({label,value,color,icon}){return<div style={{flex:1,padding:20,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,textAlign:'center',boxShadow:'0 4px 0 0 #A8CCCC',minWidth:120,transition:'transform .1s',cursor:'default'}}>
{icon&&<div style={{marginBottom:6,opacity:.5}}>{icon}</div>}
<div style={{fontSize:32,fontWeight:900,fontFamily:FM,color,lineHeight:1}}>{value}</div>
<div style={{fontSize:10,fontWeight:800,color:C.dk,textTransform:'uppercase',letterSpacing:1,marginTop:6}}>{label}</div></div>}

function BigBtn({children,onClick,color,bg,disabled,outline,...p}){
const bgC=bg||(outline?C.wh:C.tl);const txtC=color||(outline?C.tl:C.wh);const bdrC=outline?C.tl:bgC;const shadow=outline?'0 3px 0 0 '+C.bdr:'0 4px 0 0 '+C.dk;
return<button onClick={onClick} disabled={disabled} style={{padding:'12px 24px',borderRadius:12,border:'2px solid '+bdrC,background:bgC,color:txtC,
fontSize:14,fontWeight:800,cursor:disabled?'default':'pointer',fontFamily:FF,display:'inline-flex',alignItems:'center',gap:8,
boxShadow:shadow,transition:'all .1s',opacity:disabled?.4:1,letterSpacing:'.3px',...(p.style||{})}}
onMouseDown={e=>{if(!disabled)e.currentTarget.style.transform='translateY(2px)';e.currentTarget.style.boxShadow='0 1px 0 0 '+C.dk}}
onMouseUp={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=shadow}}
onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=shadow}}>{children}</button>}

function SmBtn({children,onClick,color,bg,disabled}){
return<button onClick={onClick} disabled={disabled} style={{padding:'8px 16px',borderRadius:10,border:'2px solid '+(color||C.bdr),background:bg||C.wh,color:color||C.ink,
fontSize:12,fontWeight:700,cursor:disabled?'default':'pointer',fontFamily:FF,display:'inline-flex',alignItems:'center',gap:6,
boxShadow:'0 3px 0 0 '+(color?color+'40':C.bdr),transition:'all .1s',opacity:disabled?.4:1}}>{children}</button>}

const LB={fontSize:10,fontWeight:800,color:C.dk,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:4,display:'block'};
const INP={width:'100%',padding:'12px 14px',border:'2px solid '+C.bdr,borderRadius:12,fontSize:14,fontFamily:FF,outline:'none',background:C.wh,color:C.ink};
const SEL={padding:'8px 12px',fontSize:12,borderRadius:10,border:'2px solid '+C.bdr,fontFamily:FF,color:C.ink,background:C.wh};

// ═══ COMPONENT ═══
export default function OrdiniFornitori({onBack}){
const[ordini,setOrdini]=useState([]);const[richieste,setRichieste]=useState([]);const[ricezioni,setRicezioni]=useState([]);const[contestaz,setContestaz]=useState([]);
const[commesse,setCM]=useState([]);const[vani,setVani]=useState([]);const[profili,setProf]=useState([]);const[loading,setLoading]=useState(true);
const[tab,setTab]=useState('dashboard');const[sel,setSel]=useState(null);const[fS,setFS]=useState('');const[fF,setFF]=useState('');const[sq,setSQ]=useState('');
const[showNew,setShowNew]=useState(null);const[nTipo,setNTipo]=useState('commessa');const[selCM,setSelCM]=useState([]);const[righeLib,setRigheLib]=useState([]);
const[oNote,setONote]=useState('');const[oCons,setOCons]=useState('');const[oUrg,setOUrg]=useState(false);
const[showConfForn,setShowConfForn]=useState(false);const[confTipo,setConfTipo]=useState('totale');const[confNote,setConfNote]=useState('');const[confData,setConfData]=useState('');
const[showArrivo,setShowArrivo]=useState(false);const[arrDDT,setArrDDT]=useState('');const[arrDDTData,setArrDDTData]=useState('');const[arrTipo,setArrTipo]=useState('totale');const[arrNote,setArrNote]=useState('');const[arrOrdCod,setArrOrdCod]=useState('');const[arrForn,setArrForn]=useState('');
const[showContestForm,setShowContestForm]=useState(false);const[cTipo,setCTipo]=useState('danno');const[cGrav,setCGrav]=useState('media');const[cDesc,setCDesc]=useState('');const[cForn,setCForn]=useState('');const[cOrdCod,setCOrdCod]=useState('');
const[nlCod,setNlCod]=useState('');const[nlDesc,setNlDesc]=useState('');const[nlForn,setNlForn]=useState('');const[nlQta,setNlQta]=useState('1');const[nlPrezzo,setNlPrezzo]=useState('0');const[nlCat,setNlCat]=useState('Altro');

useEffect(()=>{(async()=>{const[r1,r2,r3,r4,r5,r6,r7]=await Promise.all([
sb.from('ordini_fornitore').select('*').order('created_at',{ascending:false}).limit(200),
sb.from('richieste_acquisto').select('*').order('created_at',{ascending:false}).limit(200),
sb.from('ricezioni_merce').select('*').order('created_at',{ascending:false}).limit(100),
sb.from('contestazioni').select('*').order('created_at',{ascending:false}).limit(100),
sb.from('commesse').select('id,code,cliente,cognome,sistema,stato').not('stato','eq','annullata').order('created_at',{ascending:false}).limit(100),
sb.from('vani').select('id,commessa_id,nome,larghezza,altezza,sistema,misure_json,misure_complete').limit(500),
sb.from('catalogo_profili').select('id,codice,fornitore,serie,tipo,ruolo,profondita,peso_kg_m,prezzo_ml').limit(300)]);
setOrdini(r1.data||[]);setRichieste(r2.data||[]);setRicezioni(r3.data||[]);setContestaz(r4.data||[]);setCM(r5.data||[]);setVani(r6.data||[]);setProf(r7.data||[]);setLoading(false)})()},[]);

// ── Computed ──
const kpi=useMemo(()=>{const n=Date.now();const ic=ordini.filter(o=>!['ricevuto','chiuso','annullato','controllato'].includes(o.stato));
const rit=ic.filter(o=>o.consegna_prevista&&new Date(o.consegna_prevista).getTime()<n);const noConf=ordini.filter(o=>o.stato==='inviato');
return{ic:ic.length,rit:rit.length,noConf:noConf.length,rich:richieste.filter(r=>r.stato==='aperta').length,cont:contestaz.filter(c=>c.stato==='aperta').length,
speso:ordini.filter(o=>['ricevuto','chiuso'].includes(o.stato)).reduce((s,o)=>s+(o.totale_euro||0),0)}},[ordini,richieste,contestaz]);

const alerts=useMemo(()=>{const a=[];ordini.forEach(o=>{if(['annullato','chiuso','ricevuto','controllato'].includes(o.stato))return;
const cmNames=(o.commesse_ids||[]).map(id=>{const cm=commesse.find(c=>c.id===id);return cm?.code}).filter(Boolean);
if(o.consegna_prevista&&ggR(o.consegna_prevista)>0){const g=ggR(o.consegna_prevista);a.push({t:'rit',o,g,m:`${o.codice} ritardo ${g}gg (${o.fornitore})`,cm:cmNames,sug:g>5?'Cerca fornitore alternativo':'Sollecita subito'})}
if(o.stato==='inviato'){const d=Math.floor((Date.now()-new Date(o.data_invio||o.data_ordine||o.created_at).getTime())/864e5);if(d>3)a.push({t:'nc',o,g:d,m:`${o.codice} senza conferma ${d}gg`,cm:cmNames,sug:'Invia sollecito'})}
if(o.stato==='contestato')a.push({t:'cont',o,g:10,m:`${o.codice} CONTESTATO — ${o.fornitore}`,cm:cmNames,sug:'Gestisci contestazione'})});
return a.sort((a,b)=>(b.g||0)-(a.g||0))},[ordini,commesse]);

const distinta=useMemo(()=>{if(nTipo!=='commessa'||!selCM.length)return[];const it=[];
vani.filter(v=>selCM.includes(v.commessa_id)).forEach(v=>{const m=v.misure_complete||v.misure_json||{};const W=m.lCentro||v.larghezza||0;const H=m.hCentro||v.altezza||0;const s=v.sistema||'';const cm=commesse.find(c=>c.id===v.commessa_id);
const tp=profili.filter(p=>p.serie===s&&(p.ruolo==='telaio'||p.tipo==='telaio'));const ap=profili.filter(p=>p.serie===s&&(p.ruolo==='anta'||p.tipo==='anta'));
if(tp.length){const p=tp[0];it.push({codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Telaio orizz.',lunghezza:W,qta:2,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,commessa:cm?.code||'',categoria:'Profili'});
it.push({codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Telaio vert.',lunghezza:H,qta:2,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,commessa:cm?.code||'',categoria:'Profili'})}
if(ap.length){const p=ap[0];const d=(tp[0]?.profondita||70)*2-10;it.push({codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Anta orizz.',lunghezza:Math.round(W-d),qta:2,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,commessa:cm?.code||'',categoria:'Profili'});
it.push({codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Anta vert.',lunghezza:Math.round(H-d),qta:2,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,commessa:cm?.code||'',categoria:'Profili'})}
const vW=W-(tp[0]?.profondita||70)*2-40,vH=H-(tp[0]?.profondita||70)*2-40;
if(vW>0&&vH>0)it.push({codice:'VT-4/16/4',fornitore:'Vetri',ruolo:'Vetrocamera',lunghezza:Math.round(vW),altezza:Math.round(vH),qta:1,mq:Math.round(vW*vH/1e6*100)/100,vano:v.nome,commessa:cm?.code||'',categoria:'Vetri'})});return it},[nTipo,selCM,vani,commesse,profili]);

const perF=useMemo(()=>{const s=nTipo==='commessa'?distinta:righeLib;const m={};(s||[]).forEach(i=>{const f=i.fornitore||'N/D';if(!m[f])m[f]=[];m[f].push(i)});return m},[distinta,righeLib,nTipo]);

// ── CRUD ──
const saveOrd=async(stato='bozza')=>{const righe=nTipo==='commessa'?distinta:righeLib;if(!righe.length)return;
const fl=[...new Set(righe.map(r=>r.fornitore).filter(Boolean))];const cod='ORD-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
const d={codice:cod,tipo_ordine:nTipo,fornitore:fl[0]||'',fornitori:fl,stato,commesse_ids:nTipo==='commessa'?selCM:[],righe,
totale_pezzi:righe.reduce((s,r)=>s+(r.qta||0),0),totale_peso_kg:Math.round(righe.reduce((s,r)=>s+(r.peso_m||0)*(r.lunghezza||0)/1000*(r.qta||0),0)*10)/10,
totale_euro:Math.round(righe.reduce((s,r)=>s+(r.prezzo_ml||0)*(r.lunghezza||0)/1000*(r.qta||0),0)*100)/100,
note:oNote,urgente:oUrg,consegna_prevista:oCons||null,data_ordine:new Date().toISOString(),timeline:[{evento:'Creato',data:new Date().toISOString(),stato}]};
try{const{data:nd,error}=await sb.from('ordini_fornitore').insert(d).select().single();if(error)throw error;
if(nd?.id){const rr=righe.map((r,i)=>({ordine_id:nd.id,riga_numero:i+1,codice_interno:r.codice,descrizione:r.ruolo,categoria:r.categoria,serie:r.serie,ruolo:r.ruolo,
qta_richiesta:r.qta,lunghezza_mm:r.lunghezza,altezza_mm:r.altezza,prezzo_ml:r.prezzo_ml,totale_riga:(r.prezzo_ml||0)*(r.lunghezza||0)/1000*(r.qta||0),commessa_code:r.commessa,vano_nome:r.vano}));
await sb.from('righe_ordine').insert(rr)}
setOrdini(p=>[nd,...p]);setSel(nd);setTab('dettaglio');setShowNew(null);setSelCM([]);setRigheLib([]);setONote('');setOCons('');setOUrg(false)}catch(e){alert('Errore: '+e.message)}};

const upStato=async(id,stato)=>{const upd={stato};if(stato==='ricevuto')upd.data_ricezione=new Date().toISOString();if(stato==='inviato')upd.data_invio=new Date().toISOString();
// Event-driven: calcola risk score
const ord=ordini.find(o=>o.id===id)||sel;
let risk=0;if(ord){
if(ord.consegna_prevista&&ggR(ord.consegna_prevista)>0)risk+=40;
if(stato==='inviato'&&!ord.conferma_fornitore)risk+=25;if(ord.urgente)risk+=15;
if(stato==='contestato')risk+=30;if(!ord.conferma_fornitore&&['inviato','approvato'].includes(stato))risk+=10;
upd.risk_score=Math.min(risk,100);
upd.risk_factors=[
...(ord.consegna_prevista&&ggR(ord.consegna_prevista)>0?[{f:'Ritardo '+ggR(ord.consegna_prevista)+'gg',s:40}]:[]),
...(stato==='contestato'?[{f:'Contestato',s:30}]:[]),
...(ord.urgente?[{f:'Urgente',s:15}]:[]),
...(!ord.conferma_fornitore&&['inviato','approvato'].includes(stato)?[{f:'Non confermato',s:10}]:[])];
}
const tl=[...(ord?.timeline||[]),{evento:stato,data:new Date().toISOString()}];
await sb.from('ordini_fornitore').update({...upd,timeline:tl}).eq('id',id);
setOrdini(p=>p.map(o=>o.id===id?{...o,...upd,timeline:tl}:o));if(sel?.id===id)setSel(p=>({...p,...upd,timeline:tl}));
// Event cascade: if ritardo or contestato, log event for commesse collegate
if((stato==='contestato'||risk>=40)&&ord?.commesse_ids?.length){
const cmCodes=ord.commesse_ids.map(cid=>{const cm=commesse.find(c=>c.id===cid);return cm?.code}).filter(Boolean);
if(cmCodes.length)console.log('[MASTRO EVENT] order.'+stato+' → impatto commesse: '+cmCodes.join(', ')+' risk:'+risk);
}};;
const delOrd=async id=>{if(!confirm('Eliminare?'))return;await sb.from('ordini_fornitore').delete().eq('id',id);setOrdini(p=>p.filter(o=>o.id!==id));if(sel?.id===id){setSel(null);setTab('lista')}};
const csv=righe=>{const h='Codice;Ruolo;L;H;Qta;Prezzo\n';const r=(righe||[]).map(r=>[r.codice||r.codice_interno,r.ruolo||r.descrizione,r.lunghezza||'',r.altezza||'',r.qta||r.qta_richiesta,r.prezzo_ml||''].join(';')).join('\n');
const b=new Blob([h+r],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='ordine.csv';a.click()};
const sollecita=async o=>{await sb.from('ordini_fornitore').update({solleciti:[...(o.solleciti||[]),{data:new Date().toISOString()}]}).eq('id',o.id);
setOrdini(p=>p.map(x=>x.id===o.id?{...x,solleciti:[...(x.solleciti||[]),{data:new Date().toISOString()}]}:x));if(sel?.id===o.id)setSel(p=>({...p,solleciti:[...(p.solleciti||[]),{data:new Date().toISOString()}]}));alert('Sollecito registrato')};

const filt=ordini.filter(o=>{if(fS&&o.stato!==fS)return false;if(fF&&o.fornitore!==fF)return false;if(sq){const q=sq.toLowerCase();return(o.codice||'').toLowerCase().includes(q)||(o.fornitore||'').toLowerCase().includes(q)}return true});
const fornList=[...new Set(ordini.map(o=>o.fornitore).filter(Boolean))];
if(loading)return<div style={{padding:60,textAlign:'center',color:C.dk,fontFamily:FF,fontSize:16}}>Caricamento procurement...</div>;

// ═══ HEADER ═══
const hdr=<div style={{flexShrink:0}}>
<div style={{padding:'14px 24px',background:C.ink,color:C.wh,display:'flex',alignItems:'center',gap:14}}>
{onBack&&<button onClick={onBack} style={{background:'none',border:'none',color:C.tl,cursor:'pointer',padding:4}}>{IC.back}</button>}
{IC.truck}<div style={{flex:1}}><div style={{fontSize:22,fontWeight:900,letterSpacing:'-.5px'}}>Procurement</div><div style={{fontSize:10,color:'rgba(255,255,255,.35)',letterSpacing:'.5px'}}>ORDINI / ARRIVI / FORNITORI / ANALISI</div></div>
{alerts.length>0&&<div onClick={()=>setTab('dashboard')} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:12,background:C.red+'25',color:C.red,fontSize:13,fontWeight:800,cursor:'pointer',boxShadow:'0 0 20px '+C.red+'30'}}>{IC.alert} {alerts.length} alert</div>}
<BigBtn onClick={()=>setShowNew('richiesta')} bg={C.amb} color={C.wh} style={{boxShadow:'0 4px 0 0 #996006'}}>{IC.plus} Richiesta</BigBtn>
<BigBtn onClick={()=>{setShowNew('ordine');setNTipo('commessa');setSelCM([]);setRigheLib([])}}>{IC.plus} Nuovo Ordine</BigBtn>
</div>
<div style={{display:'flex',gap:0,background:C.bg,borderBottom:'2px solid '+C.bdr,padding:'0 20px',overflowX:'auto'}}>
{[{id:'dashboard',l:'Dashboard',i:ico(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,20)},{id:'richieste',l:'Richieste',i:ico(<><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></>,20),n:kpi.rich},{id:'lista',l:'Ordini',i:ico(<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,20),n:kpi.ic},{id:'arrivi',l:'Arrivi',i:ico(<><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,20)},
{id:'contestazioni',l:'Contestazioni',i:ico(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,20),n:kpi.cont},{id:'fornitori',l:'Fornitori',i:ico(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,20)},{id:'analisi',l:'Analisi',i:ico(<><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,20)},{id:'regole',l:'Regole',i:ico(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,20)}].map(t=>
<button key={t.id} onClick={()=>{setTab(t.id);setFS('');setFF('');setSQ('')}} style={{padding:'16px 24px',border:'none',borderBottom:tab===t.id?'5px solid '+C.tl:'5px solid transparent',background:tab===t.id?C.tl+'10':'transparent',color:tab===t.id?C.tl:C.dk,fontSize:15,fontWeight:tab===t.id?900:700,cursor:'pointer',fontFamily:FF,display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap',transition:'all .15s',borderRadius:'12px 12px 0 0',letterSpacing:'.3px'}}>
{t.i} {t.l}{t.n>0&&<span style={{width:24,height:24,borderRadius:'50%',background:C.red,color:C.wh,fontSize:12,fontWeight:900,display:'inline-flex',alignItems:'center',justifyContent:'center',marginLeft:4,boxShadow:'0 2px 6px '+C.red+'50'}}>{t.n}</span>}</button>)}
</div></div>;
const Page=({children})=><div style={{fontFamily:FF,height:'100%',display:'flex',flexDirection:'column',background:'#F8FAFA'}}>{hdr}{children}</div>;

// ═══ DASHBOARD ═══
if(tab==='dashboard')return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{display:'flex',gap:14,marginBottom:24,flexWrap:'wrap'}}>
<KpiCard label="In corso" value={kpi.ic} color={C.blu} icon={IC.box}/>
<KpiCard label="In ritardo" value={kpi.rit} color={C.red} icon={IC.alert}/>
<KpiCard label="Senza conferma" value={kpi.noConf} color={C.amb} icon={IC.clock}/>
<KpiCard label="Richieste aperte" value={kpi.rich} color={C.vio} icon={IC.file}/>
<KpiCard label="Contestazioni" value={kpi.cont} color={C.red} icon={IC.warn}/>
<KpiCard label="Speso" value={fE(kpi.speso)} color={C.grn} icon={IC.tag}/></div>
{alerts.length>0&&<div style={{marginBottom:24}}>
<div style={{fontSize:14,fontWeight:900,color:C.red,marginBottom:10,display:'flex',alignItems:'center',gap:8}}>{IC.alert} {alerts.length} situazioni da gestire</div>
{alerts.slice(0,8).map((a,i)=><div key={i} onClick={()=>{if(a.o){setSel(a.o);setTab('dettaglio')}}} style={{padding:'16px 20px',marginBottom:8,borderRadius:14,background:a.t==='rit'?'#FEE2E2':a.t==='cont'?'#FEE2E2':'#FEF3C7',border:'2px solid '+(a.t==='rit'||a.t==='cont'?C.red:C.amb)+'30',cursor:'pointer',display:'flex',alignItems:'flex-start',gap:12,boxShadow:'0 3px 0 '+(a.t==='rit'?C.red:C.amb)+'15'}}>
<span style={{color:a.t==='rit'||a.t==='cont'?C.red:C.amb,marginTop:2}}>{a.t==='rit'||a.t==='cont'?IC.alert:IC.clock}</span>
<div style={{flex:1}}><div style={{fontSize:14,fontWeight:800}}>{a.m}</div>
{a.cm&&a.cm.length>0&&<div style={{fontSize:12,color:C.red,fontWeight:700,marginTop:4}}>Commesse colpite: {a.cm.join(', ')}</div>}
{a.sug&&<div style={{fontSize:11,color:C.dk,marginTop:3,fontStyle:'italic'}}>Suggerimento: {a.sug}</div>}</div>
{a.o&&<SmBtn onClick={e=>{e.stopPropagation();sollecita(a.o)}} color={C.red}>{IC.mail} Sollecita</SmBtn>}</div>)}</div>}
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
<div><div style={{fontSize:14,fontWeight:900,marginBottom:10}}>Da ordinare</div>
{richieste.filter(r=>r.stato==='approvata').slice(0,5).map(r=><div key={r.id} style={{padding:'12px 14px',marginBottom:6,borderRadius:12,border:'2px solid '+C.bdr,background:C.wh,fontSize:13,display:'flex',alignItems:'center',gap:8,boxShadow:'0 3px 0 '+C.bdr}}>
<Badge text={stC(r.priorita,PRIOR).l} color={stC(r.priorita,PRIOR).c} big/><span style={{flex:1,fontWeight:700}}>{r.articolo_desc||r.articolo_codice}</span><span style={{fontFamily:FM,color:C.amb,fontWeight:800,fontSize:15}}>x{r.qta_richiesta}</span></div>)}
{richieste.filter(r=>r.stato==='approvata').length===0&&<div style={{fontSize:12,color:C.dk,padding:12}}>Nessuna richiesta approvata</div>}
{(()=>{const grp={};richieste.filter(r=>r.stato==='approvata').forEach(r=>{const k=r.articolo_codice||r.articolo_desc;if(k){if(!grp[k])grp[k]={cod:k,desc:r.articolo_desc,tot:0,n:0};grp[k].tot+=(r.qta_richiesta||0);grp[k].n++}});
const cons=Object.values(grp).filter(g=>g.n>1);if(!cons.length)return null;
return<div style={{marginTop:12,padding:16,background:C.tl+'10',borderRadius:14,border:'2px solid '+C.tl+'30',boxShadow:'0 3px 0 '+C.tl+'15'}}>
<div style={{fontSize:12,fontWeight:900,color:C.tl,marginBottom:8}}>CONSOLIDA — {cons.length} articoli da piu commesse</div>
{cons.map((g,i)=><div key={i} style={{fontSize:12,display:'flex',gap:8,padding:'4px 0',fontWeight:600}}>
<span style={{fontFamily:FM,fontWeight:800,color:C.tl}}>{g.cod}</span><span style={{flex:1}}>{g.desc}</span>
<span style={{fontFamily:FM,color:C.amb,fontWeight:800}}>x{g.tot} ({g.n} rich.)</span></div>)}</div>})()}</div>
<div><div style={{fontSize:14,fontWeight:900,marginBottom:10}}>Ultimi ordini</div>
{ordini.slice(0,6).map(o=>{const st=stC(o.stato,STATI_ORD);return<div key={o.id} onClick={()=>{setSel(o);setTab('dettaglio')}} style={{padding:'12px 14px',marginBottom:6,borderRadius:12,border:'2px solid '+C.bdr,background:C.wh,fontSize:13,display:'flex',alignItems:'center',gap:10,cursor:'pointer',boxShadow:'0 3px 0 '+C.bdr,transition:'border-color .1s'}} onMouseOver={e=>e.currentTarget.style.borderColor=C.tl} onMouseOut={e=>e.currentTarget.style.borderColor=C.bdr}>
<div style={{width:6,height:32,borderRadius:4,background:st.c}}/><div style={{flex:1}}><div style={{fontWeight:800}}>{o.codice}</div><div style={{fontSize:11,color:C.dk}}>{o.fornitore}</div></div>
{o.urgente&&<Badge text="URG" color={C.red} big/>}<Badge text={st.l} color={st.c} big/></div>})}</div></div>
</div></Page>;

// ═══ RICHIESTE ═══
if(tab==='richieste')return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>{STATI_RICH.map(s=><SmBtn key={s.id} onClick={()=>setFS(fS===s.id?'':s.id)} color={fS===s.id?s.c:C.dk} bg={fS===s.id?s.c+'15':C.wh}>{s.l} ({richieste.filter(r=>r.stato===s.id).length})</SmBtn>)}</div>
{richieste.filter(r=>!fS||r.stato===fS).map((r,i)=>{const st=stC(r.stato,STATI_RICH);const pr=stC(r.priorita,PRIOR);
return<div key={r.id} style={{padding:'14px 18px',marginBottom:6,borderRadius:14,border:'2px solid '+C.bdr,background:C.wh,display:'flex',alignItems:'center',gap:12,boxShadow:'0 3px 0 '+C.bdr}}>
<Badge text={pr.l} color={pr.c} big/>
<div style={{flex:1}}><div style={{fontSize:14,fontWeight:800}}>{r.articolo_desc||r.articolo_codice||'-'}</div>
<div style={{fontSize:11,color:C.dk}}>{r.categoria} — Qta: <b>{r.qta_richiesta}</b> — {r.fonte} {r.commessa_code&&'— '+r.commessa_code}</div></div>
{r.data_necessita&&<div style={{fontSize:11,color:r.data_necessita&&ggR(r.data_necessita)>0?C.red:C.dk,fontWeight:700}}>{fD(r.data_necessita)}</div>}
<Badge text={st.l} color={st.c} big/>
{r.stato==='aperta'&&<BigBtn onClick={async()=>{await sb.from('richieste_acquisto').update({stato:'approvata',data_approvazione:new Date().toISOString()}).eq('id',r.id);setRichieste(p=>p.map(x=>x.id===r.id?{...x,stato:'approvata'}:x))}} bg={C.grn} color={C.wh} style={{padding:'10px 18px',boxShadow:'0 4px 0 0 #14694E'}}>{IC.check} Approva</BigBtn>}
{r.stato==='approvata'&&<BigBtn onClick={async()=>{setRigheLib([{codice:r.articolo_codice,ruolo:r.articolo_desc,fornitore:r.fornitore_preferito||'',categoria:r.categoria||'Altro',qta:r.qta_richiesta||1,prezzo_ml:0,lunghezza:1000}]);setNTipo('magazzino');setShowNew('ordine');
await sb.from('richieste_acquisto').update({stato:'in_ordine'}).eq('id',r.id);setRichieste(p=>p.map(x=>x.id===r.id?{...x,stato:'in_ordine'}:x))}} bg={C.blu} color={C.wh} style={{padding:'10px 18px',boxShadow:'0 4px 0 0 #2558A0'}}>{IC.box} Ordina</BigBtn>}
</div>})}
{richieste.filter(r=>!fS||r.stato===fS).length===0&&<div style={{textAlign:'center',padding:60,color:C.dk,fontSize:14}}>Nessuna richiesta</div>}
</div></Page>;

// ═══ LISTA ORDINI ═══
if(tab==='lista')return<Page>
<div style={{padding:'12px 24px',display:'flex',gap:10,alignItems:'center',borderBottom:'2px solid '+C.bdr,flexShrink:0}}>
<div style={{position:'relative',flex:1,maxWidth:300}}><span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:.4}}>{IC.search}</span>
<input placeholder="Cerca ordine..." value={sq} onChange={e=>setSQ(e.target.value)} style={{...INP,paddingLeft:36}}/></div>
<select value={fS} onChange={e=>setFS(e.target.value)} style={SEL}><option value="">Tutti stati</option>{STATI_ORD.map(s=><option key={s.id} value={s.id}>{s.l}</option>)}</select>
<select value={fF} onChange={e=>setFF(e.target.value)} style={SEL}><option value="">Tutti fornitori</option>{fornList.map(f=><option key={f} value={f}>{f}</option>)}</select>
<span style={{fontSize:12,color:C.dk,marginLeft:'auto',fontWeight:700}}>{filt.length} ordini</span></div>
<div style={{flex:1,overflow:'auto',padding:'16px 24px'}}>
{filt.map(o=>{const st=stC(o.stato,STATI_ORD);const rit=o.consegna_prevista?ggR(o.consegna_prevista):0;
return<div key={o.id} onClick={()=>{setSel(o);setTab('dettaglio')}} style={{padding:'16px 20px',marginBottom:8,borderRadius:14,border:'2px solid '+(rit>0?C.red+'60':C.bdr),background:C.wh,cursor:'pointer',display:'flex',alignItems:'center',gap:14,boxShadow:'0 3px 0 '+(rit>0?C.red+'20':C.bdr),transition:'all .15s'}} onMouseOver={e=>e.currentTarget.style.borderColor=C.tl} onMouseOut={e=>e.currentTarget.style.borderColor=rit>0?C.red+'60':C.bdr}>
<div style={{width:6,height:44,borderRadius:4,background:st.c,flexShrink:0}}/>
<div style={{flex:1}}><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:15,fontWeight:900}}>{o.codice}</span>{o.urgente&&<Badge text="URGENTE" color={C.red} big/>}</div>
<div style={{fontSize:12,color:C.dk,marginTop:2}}>{o.fornitore} — {o.totale_pezzi||0} pezzi — {fD(o.data_ordine)}{rit>0&&<span style={{color:C.red,fontWeight:800}}> +{rit}gg ritardo</span>}</div></div>
{o.totale_euro>0&&<span style={{fontFamily:FM,fontWeight:800,color:C.grn,fontSize:14}}>{fE(o.totale_euro)}</span>}
<Badge text={st.l} color={st.c} big/></div>})}
{filt.length===0&&<div style={{textAlign:'center',padding:60}}><BigBtn onClick={()=>setShowNew('ordine')}>{IC.plus} Crea primo ordine</BigBtn></div>}
</div></Page>;

// ═══ DETTAGLIO ═══
if(tab==='dettaglio'&&sel){const righe=sel.righe||[];const st=stC(sel.stato,STATI_ORD);
const FLOW=['bozza','approvato','inviato','confermato_forn','in_produzione','spedito','ricevuto','controllato','chiuso'];const ci=FLOW.indexOf(sel.stato);const nx=ci>=0&&ci<FLOW.length-1?FLOW[ci+1]:null;
const calcRisk=()=>{let r=0;const ritGG=sel.consegna_prevista?ggR(sel.consegna_prevista):0;if(ritGG>0)r+=40;if(sel.stato==='inviato'&&!sel.conferma_fornitore)r+=25;if(sel.urgente)r+=15;if(!sel.conferma_fornitore&&['inviato','approvato'].includes(sel.stato))r+=10;return Math.min(r,100)};
const risk=calcRisk();const riskC=risk>=60?C.red:risk>=30?C.amb:C.grn;const ritGG=sel.consegna_prevista?ggR(sel.consegna_prevista):0;
const cmColpite=(sel.commesse_ids||[]).map(id=>commesse.find(c=>c.id===id)).filter(Boolean);
return<Page>
<div style={{padding:'12px 24px',display:'flex',alignItems:'center',gap:10,flexShrink:0,borderBottom:'2px solid '+C.bdr,flexWrap:'wrap'}}>
<SmBtn onClick={()=>{setSel(null);setTab('lista');setShowConfForn(false)}}>{IC.back} Lista</SmBtn>
<span style={{fontSize:18,fontWeight:900}}>{sel.codice}</span><span style={{fontSize:13,color:C.dk}}>— {sel.fornitore}</span>
<span style={{padding:'6px 16px',borderRadius:10,fontSize:12,fontWeight:900,background:riskC+'18',color:riskC,border:'2px solid '+riskC+'30'}}>RISCHIO {risk}/100</span>
<span style={{flex:1}}/><Badge text={st.l} color={st.c} big/>
{nx&&<BigBtn onClick={()=>upStato(sel.id,nx)} style={{padding:'10px 20px'}}>{IC.check} {stC(nx,STATI_ORD).l}</BigBtn>}
{(sel.stato==='inviato'||sel.stato==='confermato_forn')&&<SmBtn onClick={()=>setShowConfForn(!showConfForn)} color={'#6366F1'}>{IC.check} Conf. fornitore</SmBtn>}
<SmBtn onClick={()=>sollecita(sel)} color={C.amb}>{IC.mail}</SmBtn><SmBtn onClick={()=>csv(righe)}>{IC.dl}</SmBtn><SmBtn onClick={()=>delOrd(sel.id)} color={C.red}>{IC.trash}</SmBtn></div>
{/* Progress con label */}
<div style={{padding:'8px 24px',display:'flex',gap:3,flexShrink:0}}>{FLOW.map((f,i)=><div key={f} style={{flex:1}}>
<div style={{height:8,borderRadius:4,background:i<=ci?stC(f,STATI_ORD).c:C.bdr,opacity:f===sel.stato?1:.5,transition:'all .2s'}}/>
<div style={{fontSize:8,textAlign:'center',color:i<=ci?stC(f,STATI_ORD).c:C.dk,marginTop:2,fontWeight:f===sel.stato?900:500}}>{stC(f,STATI_ORD).l.slice(0,8)}</div></div>)}</div>
{/* Impatto commesse */}
{ritGG>0&&cmColpite.length>0&&<div style={{margin:'0 24px 8px',padding:'14px 18px',borderRadius:14,background:'#FEE2E2',border:'2px solid '+C.red+'30',fontSize:13,display:'flex',alignItems:'center',gap:10,boxShadow:'0 3px 0 '+C.red+'15'}}>
{IC.alert}<span style={{color:C.red,fontWeight:900}}>IMPATTO OPERATIVO:</span>
<span style={{flex:1,fontWeight:600}}>Commesse {cmColpite.map(c=>c.code).join(', ')} — ritardo {ritGG}gg blocca produzione/montaggio</span></div>}
{/* Conferma fornitore */}
{showConfForn&&<div style={{padding:'14px 24px',background:'#EDE9FE',borderBottom:'2px solid #6366F130',display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',flexShrink:0}}>
<select value={confTipo} onChange={e=>setConfTipo(e.target.value)} style={SEL}>{CONF_FORN.map(c=><option key={c.id} value={c.id}>{c.l}</option>)}</select>
{confTipo==='nuova_data'&&<input type="date" value={confData} onChange={e=>setConfData(e.target.value)} style={{...SEL,width:150}}/>}
<input placeholder="Note conferma..." value={confNote} onChange={e=>setConfNote(e.target.value)} style={{...INP,flex:1,padding:'10px 14px'}}/>
<BigBtn onClick={async()=>{const ns=confTipo==='totale'?'confermato_forn':'modificato_forn';const conf={tipo:confTipo,data:new Date().toISOString(),note:confNote};
const upd={stato:ns,conferma_fornitore:conf,timeline:[...(sel.timeline||[]),{evento:'Conferma: '+confTipo,data:new Date().toISOString()}]};
if(confTipo==='nuova_data'&&confData)upd.consegna_confermata=confData;
await sb.from('ordini_fornitore').update(upd).eq('id',sel.id);setOrdini(p=>p.map(o=>o.id===sel.id?{...o,...upd}:o));setSel(p=>({...p,...upd}));setShowConfForn(false);setConfNote('')}} bg={'#6366F1'} color={C.wh} style={{boxShadow:'0 4px 0 0 #4338CA'}}>{IC.check} Conferma</BigBtn></div>}
{/* KPI */}
<div style={{display:'flex',gap:10,padding:'8px 24px',flexShrink:0,flexWrap:'wrap'}}>
<KpiCard label="Pezzi" value={sel.totale_pezzi||righe.length} color={C.tl}/><KpiCard label="Importo" value={sel.totale_euro?fE(sel.totale_euro):'-'} color={C.grn}/>
<KpiCard label="Consegna" value={sel.consegna_prevista?fD(sel.consegna_prevista):'-'} color={ritGG>0?C.red:C.dk}/><KpiCard label="Rischio" value={risk} color={riskC}/></div>
{/* Righe con Supply Flow + Stato per riga */}
<div style={{flex:1,overflow:'auto',padding:'8px 24px 24px',display:'flex',gap:16}}>
<div style={{flex:1,minWidth:0}}>
<table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{background:C.ink,color:'rgba(255,255,255,.6)'}}>
{['Codice','Ruolo','L','Qta','Prezzo','Supply Flow','Stato riga','CM'].map(h=><th key={h} style={{padding:'10px 10px',textAlign:'left',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</th>)}</tr></thead>
<tbody>{righe.map((r,i)=>{const rs=r.stato_riga||'ordinato';const si=sifIdx(rs);
return<tr key={i} style={{borderBottom:'2px solid '+C.bdr,background:i%2?C.bg:C.wh}}>
<td style={{padding:'10px',fontFamily:FM,fontWeight:800,color:C.tl}}>{r.codice||r.codice_interno}</td>
<td style={{padding:'10px',fontWeight:700}}>{r.ruolo||r.descrizione}</td>
<td style={{padding:'10px',fontFamily:FM}}>{r.lunghezza||r.lunghezza_mm||'-'}</td>
<td style={{padding:'10px',fontFamily:FM,fontWeight:900,color:C.amb,fontSize:14}}>x{r.qta||r.qta_richiesta}</td>
<td style={{padding:'10px',fontFamily:FM,color:C.grn,fontWeight:700}}>{r.prezzo_ml?fE(r.prezzo_ml):'-'}</td>
{/* Supply Item Flow bar */}
<td style={{padding:'6px 8px'}}><div style={{display:'flex',gap:2}}>{SIF.map((s,j)=><div key={s} title={s} style={{width:16,height:10,borderRadius:3,background:j<si?C.tl:C.bdr,opacity:j<si?1:.25,transition:'all .2s'}}/>)}</div>
<div style={{fontSize:7,color:C.dk,marginTop:2}}>{SIF[Math.min(si,7)-1]||'?'}</div></td>
{/* Stato riga select */}
<td style={{padding:'6px'}}><select value={rs} onChange={async e=>{const nv=e.target.value;const nr=[...righe];nr[i]={...nr[i],stato_riga:nv};
await sb.from('ordini_fornitore').update({righe:nr,timeline:[...(sel.timeline||[]),{evento:`Riga ${i+1}: ${nv}`,data:new Date().toISOString()}]}).eq('id',sel.id);
setSel(p=>({...p,righe:nr}));setOrdini(p=>p.map(o=>o.id===sel.id?{...o,righe:nr}:o))}} style={{padding:'6px 8px',fontSize:10,borderRadius:6,border:'2px solid '+C.bdr,fontWeight:700,fontFamily:FF,cursor:'pointer',background:C.wh}}>
{['pending','da_confermare','confermata','modificata','in_produzione','spedita','ricevuta','contestata','chiusa'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}</select></td>
<td style={{padding:'10px',fontSize:11}}>{r.commessa||r.commessa_code||'-'}</td></tr>})}</tbody></table>
{sel.note&&<div style={{marginTop:12,padding:14,background:'#FEF3C7',borderRadius:12,border:'2px solid '+C.amb+'30',fontSize:12,color:C.amb}}><b>Note:</b> {sel.note}</div>}
{sel.conferma_fornitore&&<div style={{marginTop:8,padding:14,background:'#EDE9FE',borderRadius:12,border:'2px solid #6366F130',fontSize:12,color:'#6366F1'}}><b>Conferma:</b> {sel.conferma_fornitore.tipo} {sel.conferma_fornitore.note&&'— '+sel.conferma_fornitore.note}</div>}
</div>
{/* Sidebar: Risk + Timeline */}
<div style={{width:200,flexShrink:0}}>
<div style={{padding:14,borderRadius:12,background:riskC+'10',border:'2px solid '+riskC+'25',marginBottom:12}}>
<div style={{fontSize:12,fontWeight:900,color:riskC,marginBottom:8}}>RISCHIO {risk}/100</div>
<div style={{fontSize:10,lineHeight:1.6}}>
{ritGG>0&&<div style={{color:C.red,fontWeight:700}}>+40 Ritardo {ritGG}gg</div>}
{sel.stato==='inviato'&&!sel.conferma_fornitore&&<div style={{color:C.amb,fontWeight:700}}>+25 Senza conferma</div>}
{sel.urgente&&<div style={{color:C.red,fontWeight:700}}>+15 Urgente</div>}
{risk===0&&<div style={{color:C.grn,fontWeight:700}}>Nessun rischio</div>}</div></div>
<div style={{fontSize:11,fontWeight:900,color:C.dk,marginBottom:8,textTransform:'uppercase',letterSpacing:'.5px'}}>Timeline</div>
{(sel.timeline||[]).map((ev,i)=><div key={i} style={{display:'flex',gap:8,marginBottom:8}}>
<div style={{width:10,height:10,borderRadius:'50%',background:C.tl,marginTop:3,flexShrink:0,boxShadow:'0 0 6px '+C.tl+'40'}}/>
<div><div style={{fontSize:11,fontWeight:700}}>{typeof ev==='string'?ev:(ev.evento||'?')}</div>
<div style={{fontSize:9,color:C.dk}}>{typeof ev==='object'&&ev.data?fD(ev.data):''}</div></div></div>)}
{(sel.solleciti||[]).length>0&&<><div style={{fontSize:10,fontWeight:800,color:C.amb,marginTop:10}}>Solleciti ({sel.solleciti.length})</div>
{sel.solleciti.map((s,i)=><div key={i} style={{fontSize:9,color:C.amb,marginTop:2}}>{fD(s.data)}</div>)}</>}</div></div></Page>}

// ═══ ARRIVI ═══
if(tab==='arrivi')return<Page>
<div style={{padding:'12px 24px',display:'flex',alignItems:'center',gap:10,flexShrink:0,borderBottom:'2px solid '+C.bdr}}>
<span style={{fontSize:16,fontWeight:900,flex:1}}>Arrivi — {ricezioni.length}</span>
<BigBtn onClick={()=>setShowArrivo(!showArrivo)} bg={C.grn} color={C.wh} style={{boxShadow:'0 4px 0 0 #14694E'}}>{IC.truck} Registra arrivo</BigBtn></div>
{showArrivo&&<div style={{padding:'16px 24px',background:'#D1FAE520',borderBottom:'2px solid '+C.grn+'30',flexShrink:0}}>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
<div><label style={LB}>Ordine collegato</label><input value={arrOrdCod} onChange={e=>setArrOrdCod(e.target.value)} placeholder="ORD-..." style={INP}/></div>
<div><label style={LB}>Fornitore</label><input value={arrForn} onChange={e=>setArrForn(e.target.value)} style={INP}/></div>
<div><label style={LB}>N. DDT</label><input value={arrDDT} onChange={e=>setArrDDT(e.target.value)} style={INP}/></div>
<div><label style={LB}>Data DDT</label><input type="date" value={arrDDTData} onChange={e=>setArrDDTData(e.target.value)} style={INP}/></div>
<div><label style={LB}>Tipo ricezione</label><select value={arrTipo} onChange={e=>setArrTipo(e.target.value)} style={INP}><option value="totale">Totale</option><option value="parziale">Parziale</option></select></div>
<div><label style={LB}>Note magazzino</label><input value={arrNote} onChange={e=>setArrNote(e.target.value)} style={INP}/></div></div>
<BigBtn onClick={async()=>{const cod='RIC-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
const ordMatch=arrOrdCod?ordini.find(o=>o.codice===arrOrdCod):null;
const d={codice_ricezione:cod,fornitore:arrForn||ordMatch?.fornitore||'',ordine_id:ordMatch?.id||null,tipo:arrTipo,stato:'da_controllare',ddt_numero:arrDDT,ddt_data:arrDDTData||null,note_magazzino:arrNote};
try{const{data:nd,error}=await sb.from('ricezioni_merce').insert(d).select().single();if(error)throw error;setRicezioni(p=>[nd,...p]);
if(ordMatch)await upStato(ordMatch.id,arrTipo==='totale'?'ricevuto':'ricevuto_parziale');
setShowArrivo(false);setArrDDT('');setArrDDTData('');setArrNote('');setArrOrdCod('');setArrForn('')}catch(e){alert('Errore: '+e.message)}}} bg={C.grn} color={C.wh} style={{boxShadow:'0 4px 0 0 #14694E'}}>{IC.check} Salva arrivo</BigBtn></div>}
<div style={{flex:1,overflow:'auto',padding:24}}>
{ricezioni.map(r=><div key={r.id} style={{padding:'16px 20px',marginBottom:8,borderRadius:14,border:'2px solid '+C.bdr,background:C.wh,display:'flex',alignItems:'center',gap:12,boxShadow:'0 3px 0 '+C.bdr}}>
<span style={{fontFamily:FM,fontWeight:800,color:C.tl,fontSize:13}}>{r.codice_ricezione}</span><span style={{fontSize:13,color:C.dk}}>{r.fornitore}</span>
{r.ddt_numero&&<span style={{fontSize:11,color:C.dk}}>DDT: {r.ddt_numero}</span>}<span style={{flex:1}}/>
<Badge text={r.tipo} color={r.tipo==='totale'?C.grn:C.amb} big/><Badge text={r.stato?.replace(/_/g,' ')} color={r.stato==='da_controllare'?C.amb:C.grn} big/><span style={{fontSize:12,fontWeight:600}}>{fD(r.data_ricezione)}</span>
{r.stato==='da_controllare'&&<BigBtn onClick={async()=>{await sb.from('ricezioni_merce').update({stato:'controllato',data_controllo:new Date().toISOString()}).eq('id',r.id);setRicezioni(p=>p.map(x=>x.id===r.id?{...x,stato:'controllato'}:x))}} bg={C.grn} color={C.wh} style={{padding:'8px 16px',boxShadow:'0 3px 0 0 #14694E'}}>{IC.check} Controllato</BigBtn>}</div>)}
{ricezioni.length===0&&<div style={{textAlign:'center',padding:60,color:C.dk,fontSize:14}}>Nessun arrivo registrato</div>}</div></Page>;

// ═══ CONTESTAZIONI ═══
if(tab==='contestazioni')return<Page>
<div style={{padding:'12px 24px',display:'flex',alignItems:'center',gap:10,flexShrink:0,borderBottom:'2px solid '+C.bdr}}>
<span style={{fontSize:16,fontWeight:900,flex:1}}>Contestazioni — {contestaz.length}</span>
<BigBtn onClick={()=>setShowContestForm(!showContestForm)} bg={C.red} color={C.wh} style={{boxShadow:'0 4px 0 0 #991B1B'}}>{IC.alert} Apri contestazione</BigBtn></div>
{showContestForm&&<div style={{padding:'16px 24px',background:'#FEE2E220',borderBottom:'2px solid '+C.red+'30',flexShrink:0}}>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
<div><label style={LB}>Ordine</label><input value={cOrdCod} onChange={e=>setCOrdCod(e.target.value)} placeholder="ORD-..." style={INP}/></div>
<div><label style={LB}>Fornitore</label><input value={cForn} onChange={e=>setCForn(e.target.value)} style={INP}/></div>
<div><label style={LB}>Tipo</label><select value={cTipo} onChange={e=>setCTipo(e.target.value)} style={INP}>{TIPO_CONT.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}</select></div>
<div><label style={LB}>Gravita</label><select value={cGrav} onChange={e=>setCGrav(e.target.value)} style={INP}><option value="bassa">Bassa</option><option value="media">Media</option><option value="alta">Alta</option><option value="critica">Critica</option></select></div>
<div style={{gridColumn:'span 2'}}><label style={LB}>Descrizione problema</label><input value={cDesc} onChange={e=>setCDesc(e.target.value)} style={INP}/></div></div>
<BigBtn onClick={async()=>{const cod='CON-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
const ordMatch=cOrdCod?ordini.find(o=>o.codice===cOrdCod):null;
const d={codice:cod,fornitore:cForn||ordMatch?.fornitore||'',ordine_id:ordMatch?.id||null,tipo:cTipo,gravita:cGrav,stato:'aperta',descrizione:cDesc,aperta_da:'Ufficio',timeline:[{evento:'Aperta',data:new Date().toISOString()}]};
try{const{data:nd,error}=await sb.from('contestazioni').insert(d).select().single();if(error)throw error;setContestaz(p=>[nd,...p]);
if(ordMatch)await upStato(ordMatch.id,'contestato');setShowContestForm(false);setCDesc('');setCOrdCod('');setCForn('')}catch(e){alert('Errore: '+e.message)}}} bg={C.red} color={C.wh} style={{boxShadow:'0 4px 0 0 #991B1B'}}>{IC.check} Crea contestazione</BigBtn></div>}
<div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{display:'flex',gap:8,marginBottom:12}}>{['aperta','in_gestione','risolta','chiusa'].map(s=><SmBtn key={s} onClick={()=>setFS(fS===s?'':s)} color={fS===s?C.red:C.dk} bg={fS===s?C.red+'15':C.wh}>{s.replace(/_/g,' ')} ({contestaz.filter(c=>c.stato===s).length})</SmBtn>)}</div>
{contestaz.filter(c=>!fS||c.stato===fS).map(c=><div key={c.id} style={{padding:'16px 20px',marginBottom:8,borderRadius:14,border:'2px solid '+(c.stato==='aperta'?C.red:C.bdr),background:C.wh,boxShadow:'0 3px 0 '+(c.stato==='aperta'?C.red+'15':C.bdr)}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
<span style={{fontFamily:FM,fontWeight:800,color:C.red,fontSize:14}}>{c.codice}</span>
<Badge text={c.tipo?.replace(/_/g,' ')} color={C.red} big/><Badge text={c.gravita} color={c.gravita==='critica'?C.red:c.gravita==='alta'?C.amb:C.dk} big/><span style={{flex:1}}/>
<Badge text={c.stato?.replace(/_/g,' ')} color={c.stato==='aperta'?C.red:c.stato==='risolta'?C.grn:C.amb} big/>
{c.stato==='aperta'&&<BigBtn onClick={async()=>{const risp=prompt('Risposta fornitore:','');const esito=prompt('Esito (nota_credito/reinvio/sostituzione/rimborso):','nota_credito');
await sb.from('contestazioni').update({stato:'risolta',risposta_fornitore:risp,esito,data_risposta:new Date().toISOString()}).eq('id',c.id);setContestaz(p=>p.map(x=>x.id===c.id?{...x,stato:'risolta',esito}:x))}} bg={C.grn} color={C.wh} style={{padding:'8px 16px',boxShadow:'0 3px 0 0 #14694E'}}>{IC.check} Risolvi</BigBtn>}</div>
<div style={{fontSize:13,fontWeight:600}}>{c.descrizione||'-'}</div>
<div style={{fontSize:11,color:C.dk,marginTop:4}}>Forn: {c.fornitore} — {fD(c.data_apertura)}{c.esito&&<span style={{color:C.grn,fontWeight:800}}> — {c.esito}</span>}</div></div>)}
{contestaz.filter(c=>!fS||c.stato===fS).length===0&&<div style={{textAlign:'center',padding:60,color:C.dk}}>Nessuna contestazione</div>}</div></Page>;

// ═══ FORNITORI ═══
if(tab==='fornitori'){const fs=fornList.map(f=>{const o=ordini.filter(x=>x.fornitore===f);const rc=o.filter(x=>['ricevuto','chiuso'].includes(x.stato));
const rt=o.filter(x=>x.consegna_prevista&&x.data_ricezione&&new Date(x.data_ricezione)>new Date(x.consegna_prevista));
const sp=rc.reduce((s,x)=>s+(x.totale_euro||0),0);const pt=rc.length?Math.round((1-rt.length/rc.length)*100):0;const co=contestaz.filter(c=>c.fornitore===f).length;
// Lead time medio (giorni tra ordine e ricezione)
const ltArr=rc.filter(x=>x.data_ordine&&x.data_ricezione).map(x=>Math.floor((new Date(x.data_ricezione).getTime()-new Date(x.data_ordine).getTime())/864e5));
const ltMed=ltArr.length?Math.round(ltArr.reduce((s,v)=>s+v,0)/ltArr.length):0;
// Tasso errori (contestazioni / ordini ricevuti)
const errP=rc.length?Math.round(co/rc.length*100):0;
// Score totale (0-100): puntualità 40% + (100-errori%) 30% + (lead time < 14gg ? 100 : max(0, 100-lt*3)) 30%
const ltScore=ltMed<=14?100:Math.max(0,100-ltMed*3);
const score=Math.round(pt*0.4+(100-errP)*0.3+ltScore*0.3);
return{nome:f,ord:o.length,ric:rc.length,sp,pt,rit:rt.length,co,ltMed,errP,score}}).sort((a,b)=>b.sp-a.sp);
// Auto-save scorecard to Supabase (fire-and-forget)
if(fs.length>0&&!window._scSaved){window._scSaved=true;const periodo=new Date().toISOString().slice(0,7);
fs.forEach(f=>{sb.from('supplier_scorecard').upsert({fornitore_nome:f.nome,periodo,puntualita_perc:f.pt,lead_time_medio_gg:f.ltMed,
tasso_errori_perc:f.errP,tasso_contestazioni_perc:f.errP,volume_acquistato:f.sp,n_ordini:f.ord,n_righe:0,n_ritardi:f.rit,n_contestazioni:f.co,
score_totale:f.score},{onConflict:'fornitore_nome,periodo',ignoreDuplicates:false}).then(()=>{})})}
return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{fontSize:18,fontWeight:900,marginBottom:16}}>Scorecard Fornitori — {fs.length}</div>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14}}>
{fs.map(f=>{const scCol=f.score>=80?C.grn:f.score>=60?C.amb:C.red;
return<div key={f.nome} onClick={()=>{setFF(f.nome);setTab('lista')}} style={{padding:20,borderRadius:16,border:'2px solid '+C.bdr,background:C.wh,cursor:'pointer',boxShadow:'0 4px 0 '+C.bdr,transition:'all .15s'}} onMouseOver={e=>e.currentTarget.style.borderColor=C.tl} onMouseOut={e=>e.currentTarget.style.borderColor=C.bdr}>
<div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
<div style={{width:48,height:48,borderRadius:14,background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',color:C.tl,fontWeight:900,fontSize:20,border:'2px solid '+C.bdr}}>{f.nome.charAt(0)}</div>
<div style={{flex:1}}><div style={{fontSize:16,fontWeight:900}}>{f.nome}</div><div style={{fontSize:11,color:C.dk}}>{f.ord} ordini — {f.ric} ricevuti</div></div>
<div style={{width:48,height:48,borderRadius:14,background:scCol+'15',border:'2px solid '+scCol+'30',display:'flex',alignItems:'center',justifyContent:'center'}}>
<span style={{fontFamily:FM,fontWeight:900,color:scCol,fontSize:18}}>{f.score}</span></div></div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:5}}>
{[{l:'Speso',v:fE(f.sp),c:C.grn},{l:'Punt.',v:f.pt+'%',c:f.pt>=90?C.grn:f.pt>=70?C.amb:C.red},{l:'Lead time',v:f.ltMed+'gg',c:f.ltMed<=14?C.grn:f.ltMed<=21?C.amb:C.red},{l:'Ritardi',v:f.rit,c:f.rit?C.red:C.grn},{l:'Contest.',v:f.co,c:f.co?C.red:C.grn}].map((k,i)=>
<div key={i} style={{textAlign:'center',padding:6,borderRadius:8,background:C.bg,border:'1px solid '+C.bdr}}>
<div style={{fontFamily:FM,fontWeight:900,color:k.c,fontSize:12}}>{k.v}</div><div style={{fontSize:7,color:C.dk,fontWeight:700}}>{k.l}</div></div>)}</div>
{/* Score bar */}
<div style={{marginTop:10}}><div style={{display:'flex',justifyContent:'space-between',fontSize:9,fontWeight:700,marginBottom:2}}>
<span style={{color:C.dk}}>Score affidabilita</span><span style={{color:scCol}}>{f.score}/100</span></div>
<div style={{height:8,borderRadius:4,background:C.bdr}}><div style={{height:8,borderRadius:4,background:scCol,width:f.score+'%',transition:'width .3s'}}/></div></div>
</div>})}
{fs.length===0&&<div style={{textAlign:'center',padding:60,color:C.dk}}>Nessun fornitore negli ordini</div>}</div></div></Page>}

// ═══ ANALISI ═══
if(tab==='analisi'){const art={};ordini.filter(o=>['ricevuto','chiuso'].includes(o.stato)).forEach(o=>{(o.righe||[]).forEach(r=>{if(!r.codice||!r.prezzo_ml)return;if(!art[r.codice])art[r.codice]={cod:r.codice,p:[]};art[r.codice].p.push({d:o.data_ordine,pr:r.prezzo_ml,f:r.fornitore||o.fornitore})})});
const al=Object.values(art).sort((a,b)=>b.p.length-a.p.length);
return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{fontSize:18,fontWeight:900,marginBottom:16}}>Storico Prezzi — {al.length} articoli</div>
{al.length===0?<div style={{textAlign:'center',padding:60,color:C.dk,fontSize:14}}>I dati appariranno dopo i primi ordini ricevuti con prezzi compilati</div>:
<table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr style={{background:C.ink,color:'rgba(255,255,255,.6)'}}>
{['Codice','Acquisti','Ultimo','Min','Max','Variazione','Fornitori'].map(h=><th key={h} style={{padding:'12px 12px',textAlign:'left',fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</th>)}</tr></thead>
<tbody>{al.map((a,i)=>{const pr=a.p.sort((x,y)=>(x.d||'').localeCompare(y.d||''));const u=pr[pr.length-1]?.pr||0;const p0=pr[0]?.pr||0;
const mn=Math.min(...pr.map(x=>x.pr));const mx=Math.max(...pr.map(x=>x.pr));const v=p0>0?Math.round((u-p0)/p0*100):0;
return<tr key={a.cod} style={{borderBottom:'2px solid '+C.bdr,background:i%2?C.bg:C.wh}}>
<td style={{padding:'12px',fontFamily:FM,fontWeight:800,color:C.tl}}>{a.cod}</td><td style={{padding:'12px',fontFamily:FM}}>{pr.length}</td>
<td style={{padding:'12px',fontFamily:FM,fontWeight:800}}>{fE(u)}</td><td style={{padding:'12px',fontFamily:FM,color:C.grn}}>{fE(mn)}</td>
<td style={{padding:'12px',fontFamily:FM,color:C.red}}>{fE(mx)}</td>
<td style={{padding:'12px',fontFamily:FM,fontWeight:800,color:v>0?C.red:v<0?C.grn:C.dk}}>{v>0?'+':''}{v}%</td>
<td style={{padding:'12px'}}>{[...new Set(pr.map(x=>x.f))].join(', ')}</td></tr>})}</tbody></table>}</div></Page>}

// ═══ REGOLE ═══
if(tab==='regole')return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{fontSize:18,fontWeight:900,marginBottom:16}}>Automazioni Procurement</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24}}>
{[{n:'Sollecito auto 3gg',d:'Ordine senza conferma dopo 3 giorni',a:true},{n:'Scorta minima',d:'Stock sotto soglia = richiesta automatica',a:false},
{n:'Ritardo = alert commessa',d:'Consegna in ritardo = alert rosso',a:true},{n:'Arrivo = sblocca fase',d:'Merce completa = avanza fase commessa',a:false},
{n:'Anomalia prezzo +10%',d:'Prezzo sopra media = notifica',a:true},{n:'Consolidamento settimanale',d:'Proposta accorpamento ordini',a:false}].map((r,i)=>
<div key={i} style={{padding:18,borderRadius:14,border:'2px solid '+C.bdr,background:C.wh,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
<div style={{width:14,height:14,borderRadius:'50%',background:r.a?C.grn:C.bdr,border:'2px solid '+(r.a?C.grn:C.bdr)}}/>
<span style={{fontSize:14,fontWeight:900,flex:1}}>{r.n}</span><Badge text={r.a?'Attiva':'Off'} color={r.a?C.grn:'#999'} big/></div>
<div style={{fontSize:12,color:C.dk,lineHeight:1.4}}>{r.d}</div></div>)}</div>
<div style={{fontSize:18,fontWeight:900,marginBottom:16}}>Tolleranze</div>
<div style={{padding:20,borderRadius:14,border:'2px solid '+C.bdr,background:C.wh,boxShadow:'0 3px 0 '+C.bdr}}>
{[{p:'Scostamento prezzo max',v:'10%',d:'Alert se prezzo supera media storica'},{p:'Scostamento data max',v:'3 giorni',d:'Alert se consegna in ritardo'},
{p:'Parzialita ammessa',v:'Si (>70%)',d:'Accetta ricezione parziale'},{p:'Approvazione obbl.',v:'Sopra 1.000€',d:'Ordini grossi = approvazione'},
{p:'Sollecito auto dopo',v:'3 giorni',d:'Invia sollecito se nessuna conferma'},{p:'Lead time max',v:'21 giorni',d:'Alert se fornitore troppo lento'}].map((t,i)=>
<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:i<5?'1px solid '+C.bdr:'none'}}>
<span style={{fontSize:13,fontWeight:800,flex:1}}>{t.p}</span>
<span style={{fontFamily:FM,fontWeight:900,color:C.tl,fontSize:14,width:120,textAlign:'center'}}>{t.v}</span>
<span style={{fontSize:11,color:C.dk,flex:1}}>{t.d}</span></div>)}</div></div></Page>;

// ═══ NUOVA RICHIESTA ═══
if(showNew==='richiesta')return<Page>
<div style={{padding:'14px 24px',display:'flex',alignItems:'center',gap:10,flexShrink:0,borderBottom:'2px solid '+C.bdr}}>
<SmBtn onClick={()=>setShowNew(null)}>{IC.back} Annulla</SmBtn><span style={{fontSize:18,fontWeight:900,flex:1}}>Nuova Richiesta Acquisto</span></div>
<div style={{flex:1,overflow:'auto',padding:24,maxWidth:700}}>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
<div><label style={LB}>Codice articolo *</label><input id="ra_cod" style={INP}/></div>
<div><label style={LB}>Descrizione</label><input id="ra_desc" style={INP}/></div>
<div><label style={LB}>Categoria</label><select id="ra_cat" style={INP}>{CAT.map(c=><option key={c}>{c}</option>)}</select></div>
<div><label style={LB}>Quantita *</label><input id="ra_qta" type="number" defaultValue="1" style={INP}/></div>
<div><label style={LB}>Fornitore preferito</label><input id="ra_forn" style={INP}/></div>
<div><label style={LB}>Priorita</label><select id="ra_prio" style={INP}>{PRIOR.map(p=><option key={p.id} value={p.id}>{p.l}</option>)}</select></div>
<div><label style={LB}>Commessa</label><input id="ra_cm" style={INP}/></div>
<div><label style={LB}>Data necessita</label><input id="ra_data" type="date" style={INP}/></div>
<div style={{gridColumn:'1/3'}}><label style={LB}>Note tecniche</label><input id="ra_note" style={INP}/></div>
<div><label style={LB}>Fonte</label><select id="ra_fonte" style={INP}>{FONTI.map(f=><option key={f}>{f}</option>)}</select></div>
<div><label style={LB}>Variante / colore</label><input id="ra_var" style={INP}/></div></div>
<BigBtn onClick={async()=>{const v=k=>document.getElementById('ra_'+k)?.value||'';if(!v('cod')){alert('Codice obbligatorio');return}
const cod='RDA-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
const d={codice:cod,fonte:v('fonte')||'manuale',stato:'aperta',priorita:v('prio')||'normale',articolo_codice:v('cod'),articolo_desc:v('desc'),
categoria:v('cat')||'Altro',variante:v('var'),qta_richiesta:parseInt(v('qta'))||1,fabbisogno_netto:parseInt(v('qta'))||1,
fornitore_preferito:v('forn'),commessa_code:v('cm'),data_necessita:v('data')||null,note_tecniche:v('note'),richiedente:'Ufficio'};
try{const{data:nd,error}=await sb.from('richieste_acquisto').insert(d).select().single();if(error)throw error;setRichieste(p=>[nd,...p]);setShowNew(null)}catch(e){alert('Errore: '+e.message)}
}} style={{width:'100%',justifyContent:'center',padding:'16px 24px',fontSize:16}}>{IC.check} Crea Richiesta</BigBtn></div></Page>;

// ═══ NUOVO ORDINE ═══
if(showNew==='ordine'){const righe=nTipo==='commessa'?distinta:righeLib;
return<Page>
<div style={{padding:'10px 24px',display:'flex',alignItems:'center',gap:10,flexShrink:0,borderBottom:'2px solid '+C.bdr,flexWrap:'wrap'}}>
<SmBtn onClick={()=>setShowNew(null)}>{IC.back}</SmBtn>
{[{id:'commessa',l:'Da commessa',c:C.tl},{id:'magazzino',l:'Magazzino',c:C.amb},{id:'libero',l:'Libero',c:C.blu}].map(t=>
<SmBtn key={t.id} onClick={()=>setNTipo(t.id)} bg={nTipo===t.id?t.c+'15':C.wh} color={nTipo===t.id?t.c:C.dk}>{t.l}</SmBtn>)}
<span style={{flex:1}}/><label style={{fontSize:12,color:C.red,fontWeight:700,display:'flex',alignItems:'center',gap:4}}><input type="checkbox" checked={oUrg} onChange={e=>setOUrg(e.target.checked)} style={{accentColor:C.red,width:18,height:18}}/>Urgente</label>
<input type="date" value={oCons} onChange={e=>setOCons(e.target.value)} style={{...SEL,width:140}}/>
<SmBtn onClick={()=>saveOrd('bozza')} disabled={!righe.length}>Bozza</SmBtn>
<BigBtn onClick={()=>saveOrd('approvato')} disabled={!righe.length}>{IC.check} Conferma ({righe.length})</BigBtn></div>
<div style={{flex:1,display:'flex',overflow:'hidden'}}>
<div style={{width:320,borderRight:'2px solid '+C.bdr,overflow:'auto',padding:16,flexShrink:0}}>
{nTipo==='commessa'?commesse.map(cm=>{const s=selCM.includes(cm.id);const nv=vani.filter(v=>v.commessa_id===cm.id).length;
return<div key={cm.id} onClick={()=>setSelCM(p=>s?p.filter(x=>x!==cm.id):[...p,cm.id])} style={{padding:'10px 12px',marginBottom:4,borderRadius:10,border:'2px solid '+(s?C.tl:C.bdr),background:s?C.bg:C.wh,cursor:'pointer',display:'flex',alignItems:'center',gap:8,boxShadow:s?'0 3px 0 '+C.tl+'20':'0 2px 0 '+C.bdr}}>
<div style={{width:22,height:22,borderRadius:6,border:'2px solid '+(s?C.tl:C.bdr),background:s?C.tl:'transparent',display:'flex',alignItems:'center',justifyContent:'center',color:C.wh,flexShrink:0}}>{s&&IC.check}</div>
<span style={{fontWeight:800,fontSize:13}}>{cm.code}</span><span style={{flex:1,fontSize:11,color:C.dk}}>{cm.cliente}</span><span style={{fontFamily:FM,fontSize:11,fontWeight:800,color:C.tl}}>{nv}v</span></div>}):
<><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
<div><label style={LB}>Codice</label><input value={nlCod} onChange={e=>setNlCod(e.target.value)} style={INP}/></div>
<div><label style={LB}>Descrizione</label><input value={nlDesc} onChange={e=>setNlDesc(e.target.value)} style={INP}/></div>
<div><label style={LB}>Fornitore</label><input value={nlForn} onChange={e=>setNlForn(e.target.value)} style={INP}/></div>
<div><label style={LB}>Categoria</label><select value={nlCat} onChange={e=>setNlCat(e.target.value)} style={INP}>{CAT.map(c=><option key={c}>{c}</option>)}</select></div>
<div><label style={LB}>Qta</label><input type="number" value={nlQta} onChange={e=>setNlQta(e.target.value)} style={INP}/></div>
<div><label style={LB}>Prezzo</label><input type="number" value={nlPrezzo} onChange={e=>setNlPrezzo(e.target.value)} style={INP}/></div></div>
<BigBtn onClick={()=>{if(!nlCod)return;setRigheLib(p=>[...p,{codice:nlCod,ruolo:nlDesc,fornitore:nlForn,categoria:nlCat,qta:parseInt(nlQta)||1,prezzo_ml:parseFloat(nlPrezzo)||0,lunghezza:1000}]);setNlCod('');setNlDesc('')}} style={{width:'100%',justifyContent:'center',marginBottom:10}}>{IC.plus} Aggiungi</BigBtn>
{righeLib.map((r,i)=><div key={i} style={{padding:10,marginBottom:4,borderRadius:8,border:'2px solid '+C.bdr,fontSize:12,display:'flex',gap:6,alignItems:'center',boxShadow:'0 2px 0 '+C.bdr}}>
<span style={{fontFamily:FM,fontWeight:800,color:C.tl}}>{r.codice}</span><span style={{flex:1,fontWeight:600}}>{r.ruolo}</span><span style={{fontFamily:FM,color:C.amb,fontWeight:800}}>x{r.qta}</span>
<button onClick={()=>setRigheLib(p=>p.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:C.red,cursor:'pointer',padding:4}}>{IC.trash}</button></div>)}</>}
</div>
<div style={{flex:1,overflow:'auto',padding:16}}>
<input placeholder="Note ordine..." value={oNote} onChange={e=>setONote(e.target.value)} style={{...INP,marginBottom:12}}/>
{!righe.length?<div style={{textAlign:'center',padding:40,color:C.dk,fontSize:13}}>Seleziona commesse o aggiungi articoli</div>:
Object.entries(perF).map(([f,items])=><div key={f} style={{marginBottom:12,borderRadius:12,overflow:'hidden',border:'2px solid '+C.bdr,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{background:C.ink,color:C.wh,padding:'10px 14px',fontSize:13,fontWeight:900,display:'flex'}}><span>{f}</span><span style={{marginLeft:'auto',fontFamily:FM,color:C.tl}}>{items.length} righe</span></div>
<table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><tbody>{items.map((r,i)=>
<tr key={i} style={{borderBottom:'1px solid '+C.bdr}}><td style={{padding:'8px 10px',fontFamily:FM,fontWeight:800,color:C.tl}}>{r.codice}</td>
<td style={{padding:'8px 10px',fontWeight:600}}>{r.ruolo}</td><td style={{padding:'8px 10px',fontFamily:FM}}>{r.lunghezza||'-'}</td>
<td style={{padding:'8px 10px',fontFamily:FM,fontWeight:900,color:C.amb}}>x{r.qta}</td></tr>)}</tbody></table></div>)}</div></div></Page>}

return<Page><div style={{padding:24,fontSize:14}}>Sezione: {tab}</div></Page>;
}
