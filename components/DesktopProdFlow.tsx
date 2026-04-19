// @ts-nocheck
'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO — Flusso Produzione Commessa (S26)
// Distinta materiali → Ottimizza → Crea ordine → Produzione → CNC
// Bottoni grandi, card belle, filtri, flusso completo
// ═══════════════════════════════════════════════════════════
import React,{useState,useEffect,useMemo} from 'react';
import {createClient} from '@supabase/supabase-js';
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const C={tl:'#28A0A0',dk:'#156060',ink:'#0D1F1F',bg:'#EEF8F8',bdr:'#C8E4E4',wh:'#FFFFFF',red:'#DC4444',grn:'#1A9E73',amb:'#D08008',blu:'#3B7FE0',vio:'#7C3AED'};
const FF="'Inter',system-ui,sans-serif",FM="'JetBrains Mono',monospace";
const ico=(d,s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const IC={
back:ico(<path d="M19 12H5M12 19l-7-7 7-7"/>),
plus:ico(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
check:ico(<polyline points="20 6 9 17 4 12"/>),
box:ico(<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>),
truck:ico(<><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>),
cut:ico(<><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></>),
factory:ico(<><path d="M2 20h20"/><path d="M5 20V8l5 4V8l5 4V4l5 2v14"/></>),
send:ico(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>),
dl:ico(<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
filter:ico(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>),
list:ico(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>),
};

function BigBtn({children,onClick,color,bg,disabled,style:s}){
const bgC=bg||C.tl;const shadow='0 4px 0 0 '+C.dk;
return<button onClick={onClick} disabled={disabled} style={{padding:'14px 28px',borderRadius:14,border:'2px solid '+bgC,background:bgC,color:color||C.wh,
fontSize:15,fontWeight:900,cursor:disabled?'default':'pointer',fontFamily:FF,display:'inline-flex',alignItems:'center',gap:10,
boxShadow:shadow,transition:'all .1s',opacity:disabled?.4:1,letterSpacing:'.3px',...(s||{})}}
onMouseDown={e=>{if(!disabled){e.currentTarget.style.transform='translateY(3px)';e.currentTarget.style.boxShadow='0 1px 0 0 '+C.dk}}}
onMouseUp={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=shadow}}
onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=shadow}}>{children}</button>}

function SmBtn({children,onClick,color,bg}){
return<button onClick={onClick} style={{padding:'10px 18px',borderRadius:10,border:'2px solid '+(color||C.bdr),background:bg||C.wh,color:color||C.ink,
fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:FF,display:'inline-flex',alignItems:'center',gap:6,boxShadow:'0 3px 0 '+(color?color+'40':C.bdr)}}>{children}</button>}

function Badge({text,color}){return<span style={{padding:'4px 12px',borderRadius:6,fontSize:11,fontWeight:800,background:color+'18',color}}>{text}</span>}

function fD(d){if(!d)return'-';try{return new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})}catch{return d}}
function fE(n){return'\u20AC'+(n||0).toFixed(2).replace('.',',')}

export default function DesktopProdFlow({commessaId,onNavigate,onBack}){
const[commessa,setCommessa]=useState(null);const[vani,setVani]=useState([]);const[profili,setProfili]=useState([]);const[ordini,setOrdini]=useState([]);
const[loading,setLoading]=useState(true);const[step,setStep]=useState('overview');// overview, distinta, ottimizza, ordine_creato, produzione, cnc
const[filtroCat,setFiltroCat]=useState('');const[filtroForn,setFiltroForn]=useState('');const[selRighe,setSelRighe]=useState([]);

useEffect(()=>{(async()=>{
const[r1,r2,r3,r4]=await Promise.all([
commessaId?sb.from('commesse').select('*').eq('id',commessaId).single():{data:null},
commessaId?sb.from('vani').select('*').eq('commessa_id',commessaId):{data:[]},
sb.from('catalogo_profili').select('*').limit(300),
commessaId?sb.from('ordini_fornitore').select('*').contains('commesse_ids',[commessaId]):{data:[]}]);
setCommessa(r1.data);setVani(r2.data||[]);setProfili(r3.data||[]);setOrdini(r4.data||[]);setLoading(false)})()},[commessaId]);

// Calcola distinta materiali completa
const distinta=useMemo(()=>{if(!vani.length)return[];const it=[];
vani.forEach(v=>{const m=v.misure_complete||v.misure_json||{};const W=m.lCentro||v.larghezza||0;const H=m.hCentro||v.altezza||0;const s=v.sistema||'';
const tp=profili.filter(p=>p.serie===s&&(p.ruolo==='telaio'||p.tipo==='telaio'));
const ap=profili.filter(p=>p.serie===s&&(p.ruolo==='anta'||p.tipo==='anta'));
const mp=profili.filter(p=>p.serie===s&&(p.ruolo==='montante'||p.tipo==='montante'));
const trp=profili.filter(p=>p.serie===s&&(p.ruolo==='traverso'||p.tipo==='traverso'));
// Telaio
if(tp.length){const p=tp[0];
it.push({id:'t_h_'+v.id,codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Telaio superiore',lunghezza:W,qta:1,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,categoria:'Profili',tipo:'profilo'});
it.push({id:'t_b_'+v.id,codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Telaio inferiore',lunghezza:W,qta:1,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,categoria:'Profili',tipo:'profilo'});
it.push({id:'t_l_'+v.id,codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Telaio sinistro',lunghezza:H,qta:1,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,categoria:'Profili',tipo:'profilo'});
it.push({id:'t_r_'+v.id,codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Telaio destro',lunghezza:H,qta:1,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,categoria:'Profili',tipo:'profilo'})}
// Anta
if(ap.length){const p=ap[0];const ded=(tp[0]?.profondita||70)*2-10;
it.push({id:'a_h_'+v.id,codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Anta superiore',lunghezza:Math.round(W-ded),qta:1,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,categoria:'Profili',tipo:'profilo'});
it.push({id:'a_b_'+v.id,codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Anta inferiore',lunghezza:Math.round(W-ded),qta:1,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,categoria:'Profili',tipo:'profilo'});
it.push({id:'a_l_'+v.id,codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Anta sinistra',lunghezza:Math.round(H-ded),qta:1,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,categoria:'Profili',tipo:'profilo'});
it.push({id:'a_r_'+v.id,codice:p.codice,fornitore:p.fornitore,serie:p.serie,ruolo:'Anta destra',lunghezza:Math.round(H-ded),qta:1,peso_m:p.peso_kg_m||0,prezzo_ml:p.prezzo_ml||0,vano:v.nome,categoria:'Profili',tipo:'profilo'})}
// Vetro
const vW=W-(tp[0]?.profondita||70)*2-40,vH=H-(tp[0]?.profondita||70)*2-40;
if(vW>0&&vH>0)it.push({id:'v_'+v.id,codice:'VT-4/16/4',fornitore:'Vetreria',serie:'',ruolo:'Vetrocamera 4/16/4',lunghezza:Math.round(vW),altezza:Math.round(vH),qta:1,mq:Math.round(vW*vH/1e6*100)/100,vano:v.nome,categoria:'Vetri',tipo:'vetro'});
// Guarnizioni (stima 2x perimetro)
const perim=2*(W+H);
it.push({id:'g_'+v.id,codice:'GUA-TPE',fornitore:'Guarnizioni',serie:s,ruolo:'Guarnizione TPE',lunghezza:Math.round(perim),qta:1,peso_m:0.02,prezzo_ml:0.15,vano:v.nome,categoria:'Guarnizioni',tipo:'guarnizione'});
// Ferramenta (1 set per vano)
it.push({id:'f_'+v.id,codice:'FER-SET',fornitore:'Ferramenta',serie:s,ruolo:'Kit ferramenta completo',lunghezza:0,qta:1,peso_m:0,prezzo_ml:0,vano:v.nome,categoria:'Ferramenta',tipo:'ferramenta'});
});return it},[vani,profili]);

// Raggruppa per fornitore
const perForn=useMemo(()=>{const m={};distinta.forEach(i=>{const f=i.fornitore||'N/D';if(!m[f])m[f]=[];m[f].push(i)});return m},[distinta]);
// Raggruppa per categoria
const perCat=useMemo(()=>{const m={};distinta.forEach(i=>{const c=i.categoria||'Altro';if(!m[c])m[c]=[];m[c].push(i)});return m},[distinta]);
// Fornitori e categorie uniche
const fornitori=[...new Set(distinta.map(d=>d.fornitore).filter(Boolean))];
const categorie=[...new Set(distinta.map(d=>d.categoria).filter(Boolean))];
// Righe filtrate
const righeVis=distinta.filter(r=>{if(filtroCat&&r.categoria!==filtroCat)return false;if(filtroForn&&r.fornitore!==filtroForn)return false;return true});
// Totali
const totPezzi=distinta.reduce((s,r)=>s+(r.qta||0),0);
const totPeso=distinta.reduce((s,r)=>s+(r.peso_m||0)*(r.lunghezza||0)/1000*(r.qta||0),0);
const totEuro=distinta.reduce((s,r)=>s+(r.prezzo_ml||0)*(r.lunghezza||0)/1000*(r.qta||0),0);

// Crea ordine procurement
const creaOrdine=async()=>{const righe=selRighe.length?distinta.filter(d=>selRighe.includes(d.id)):distinta;
const fl=[...new Set(righe.map(r=>r.fornitore).filter(Boolean))];const cod='ORD-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
const d={codice:cod,tipo_ordine:'commessa',fornitore:fl[0]||'',fornitori:fl,stato:'approvato',commesse_ids:[commessaId],righe,
totale_pezzi:righe.reduce((s,r)=>s+(r.qta||0),0),totale_euro:Math.round(righe.reduce((s,r)=>s+(r.prezzo_ml||0)*(r.lunghezza||0)/1000*(r.qta||0),0)*100)/100,
note:'Auto-generato da distinta commessa '+(commessa?.code||''),data_ordine:new Date().toISOString(),timeline:[{evento:'Creato da distinta',data:new Date().toISOString()}]};
try{const{data:nd,error}=await sb.from('ordini_fornitore').insert(d).select().single();if(error)throw error;
setOrdini(p=>[nd,...p]);setStep('ordine_creato')}catch(e){alert('Errore: '+e.message)}};

// Export CSV distinta
const exportCSV=()=>{const h='Codice;Fornitore;Serie;Ruolo;L mm;H mm;Qta;€/ml;Peso kg/m;Vano;Categoria\n';
const r=distinta.map(d=>[d.codice,d.fornitore,d.serie,d.ruolo,d.lunghezza||'',d.altezza||'',d.qta,d.prezzo_ml||'',d.peso_m||'',d.vano,d.categoria].join(';')).join('\n');
const b=new Blob([h+r],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='distinta_'+(commessa?.code||'commessa')+'.csv';a.click()};

if(loading)return<div style={{padding:60,textAlign:'center',color:C.dk,fontFamily:FF,fontSize:16}}>Caricamento commessa...</div>;
if(!commessa)return<div style={{padding:60,textAlign:'center',fontFamily:FF}}>
<div style={{fontSize:18,fontWeight:800,color:C.ink,marginBottom:16}}>Seleziona una commessa</div>
<div style={{fontSize:13,color:C.dk}}>Apri una commessa dalla lista per vedere la distinta materiali e il flusso produzione</div></div>;

// ═══ HEADER ═══
const hdr=<div style={{padding:'16px 24px',background:C.ink,color:C.wh,display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
{onBack&&<button onClick={onBack} style={{background:'none',border:'none',color:C.tl,cursor:'pointer'}}>{IC.back}</button>}
{IC.factory}
<div style={{flex:1}}><div style={{fontSize:20,fontWeight:900}}>{commessa.code} — Produzione</div>
<div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>{commessa.cliente} {commessa.cognome||''} — {commessa.sistema||'Sistema N/D'} — {vani.length} vani</div></div>
<Badge text={vani.length+' vani'} color={C.tl}/><Badge text={totPezzi+' pezzi'} color={C.amb}/><Badge text={fE(totEuro)} color={C.grn}/>
</div>;

// ═══ STEP BUTTONS ═══
const steps=[
{id:'overview',l:'Overview',i:IC.list,c:C.tl},
{id:'distinta',l:'Distinta Materiali',i:IC.box,c:C.blu},
{id:'ottimizza',l:'Ottimizza & Raggruppa',i:IC.filter,c:C.amb},
{id:'ordine_creato',l:'Ordine Fornitore',i:IC.send,c:C.vio},
{id:'produzione',l:'Produzione',i:IC.factory,c:C.grn},
{id:'cnc',l:'CNC / Macchine',i:IC.cut,c:C.red},
];
const stepBar=<div style={{display:'flex',gap:0,background:C.bg,borderBottom:'2px solid '+C.bdr,padding:'0 20px',overflowX:'auto',flexShrink:0}}>
{steps.map(s=><button key={s.id} onClick={()=>setStep(s.id)} style={{padding:'14px 22px',border:'none',borderBottom:step===s.id?'5px solid '+s.c:'5px solid transparent',
background:step===s.id?s.c+'10':'transparent',color:step===s.id?s.c:C.dk,fontSize:14,fontWeight:step===s.id?900:700,cursor:'pointer',fontFamily:FF,
display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap',borderRadius:'12px 12px 0 0',letterSpacing:'.3px'}}>{s.i} {s.l}</button>)}</div>;

// ═══ OVERVIEW ═══
if(step==='overview')return<div style={{fontFamily:FF,height:'100%',display:'flex',flexDirection:'column',background:'#F8FAFA'}}>{hdr}{stepBar}
<div style={{flex:1,overflow:'auto',padding:24}}>
{/* Action cards grandi */}
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:24}}>
<div onClick={()=>setStep('distinta')} style={{padding:24,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,boxShadow:'0 4px 0 '+C.bdr,cursor:'pointer',textAlign:'center',transition:'all .15s'}} onMouseOver={e=>e.currentTarget.style.borderColor=C.blu} onMouseOut={e=>e.currentTarget.style.borderColor=C.bdr}>
<div style={{color:C.blu,marginBottom:12}}>{ico(<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,40)}</div>
<div style={{fontSize:18,fontWeight:900,color:C.ink}}>Distinta Materiali</div>
<div style={{fontSize:12,color:C.dk,marginTop:6}}>Tutti i profili, vetri, guarnizioni e ferramenta necessari per {vani.length} vani</div>
<div style={{fontFamily:FM,fontSize:28,fontWeight:900,color:C.blu,marginTop:12}}>{totPezzi} pezzi</div></div>

<div onClick={()=>setStep('ottimizza')} style={{padding:24,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,boxShadow:'0 4px 0 '+C.bdr,cursor:'pointer',textAlign:'center',transition:'all .15s'}} onMouseOver={e=>e.currentTarget.style.borderColor=C.amb} onMouseOut={e=>e.currentTarget.style.borderColor=C.bdr}>
<div style={{color:C.amb,marginBottom:12}}>{ico(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,40)}</div>
<div style={{fontSize:18,fontWeight:900,color:C.ink}}>Ottimizza & Ordina</div>
<div style={{fontSize:12,color:C.dk,marginTop:6}}>Raggruppa per fornitore, seleziona materiali, crea ordine procurement</div>
<div style={{fontFamily:FM,fontSize:28,fontWeight:900,color:C.amb,marginTop:12}}>{fornitori.length} fornitori</div></div>

<div onClick={()=>setStep('cnc')} style={{padding:24,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,boxShadow:'0 4px 0 '+C.bdr,cursor:'pointer',textAlign:'center',transition:'all .15s'}} onMouseOver={e=>e.currentTarget.style.borderColor=C.red} onMouseOut={e=>e.currentTarget.style.borderColor=C.bdr}>
<div style={{color:C.red,marginBottom:12}}>{ico(<><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></>,40)}</div>
<div style={{fontSize:18,fontWeight:900,color:C.ink}}>CNC / Macchine</div>
<div style={{fontSize:12,color:C.dk,marginTop:6}}>Genera distinta taglio per centro di lavoro Emmegi</div>
<div style={{fontFamily:FM,fontSize:28,fontWeight:900,color:C.red,marginTop:12}}>{distinta.filter(d=>d.tipo==='profilo').length} profili</div></div>
</div>
{/* Ordini esistenti */}
{ordini.length>0&&<div>
<div style={{fontSize:16,fontWeight:900,marginBottom:10}}>Ordini collegati ({ordini.length})</div>
{ordini.map(o=><div key={o.id} style={{padding:'14px 18px',marginBottom:6,borderRadius:12,border:'2px solid '+C.bdr,background:C.wh,display:'flex',alignItems:'center',gap:10,boxShadow:'0 3px 0 '+C.bdr}}>
<span style={{fontFamily:FM,fontWeight:800,color:C.tl,fontSize:14}}>{o.codice}</span>
<span style={{fontSize:13,color:C.dk}}>{o.fornitore}</span><span style={{flex:1}}/>
<Badge text={o.stato} color={o.stato==='ricevuto'?C.grn:o.stato==='inviato'?C.amb:C.blu}/><span style={{fontFamily:FM,fontWeight:700,color:C.grn}}>{o.totale_euro?fE(o.totale_euro):''}</span>
<span style={{fontSize:11,color:C.dk}}>{fD(o.data_ordine)}</span></div>)}</div>}
</div></div>;

// ═══ DISTINTA MATERIALI ═══
if(step==='distinta')return<div style={{fontFamily:FF,height:'100%',display:'flex',flexDirection:'column',background:'#F8FAFA'}}>{hdr}{stepBar}
<div style={{padding:'12px 24px',display:'flex',gap:10,alignItems:'center',flexShrink:0,borderBottom:'2px solid '+C.bdr}}>
<select value={filtroCat} onChange={e=>setFiltroCat(e.target.value)} style={{padding:'10px 14px',fontSize:13,borderRadius:10,border:'2px solid '+C.bdr,fontFamily:FF}}>
<option value="">Tutte le categorie</option>{categorie.map(c=><option key={c} value={c}>{c}</option>)}</select>
<select value={filtroForn} onChange={e=>setFiltroForn(e.target.value)} style={{padding:'10px 14px',fontSize:13,borderRadius:10,border:'2px solid '+C.bdr,fontFamily:FF}}>
<option value="">Tutti i fornitori</option>{fornitori.map(f=><option key={f} value={f}>{f}</option>)}</select>
<span style={{flex:1}}/><span style={{fontSize:13,fontWeight:700,color:C.dk}}>{righeVis.length}/{distinta.length} righe</span>
<SmBtn onClick={exportCSV} color={C.tl}>{IC.dl} CSV</SmBtn></div>
<div style={{flex:1,overflow:'auto',padding:'12px 24px'}}>
<table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr style={{background:C.ink,color:'rgba(255,255,255,.6)'}}>
{['Codice','Fornitore','Ruolo','Cat.','L mm','H mm','Qta','€/ml','Peso','Vano'].map(h=><th key={h} style={{padding:'12px 10px',textAlign:'left',fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px'}}>{h}</th>)}</tr></thead>
<tbody>{righeVis.map((r,i)=><tr key={r.id||i} style={{borderBottom:'2px solid '+C.bdr,background:i%2?C.bg:C.wh}}>
<td style={{padding:'10px',fontFamily:FM,fontWeight:800,color:C.tl}}>{r.codice}</td>
<td style={{padding:'10px',fontWeight:600}}>{r.fornitore}</td>
<td style={{padding:'10px',fontWeight:700}}>{r.ruolo}</td>
<td style={{padding:'10px'}}><Badge text={r.categoria} color={r.categoria==='Profili'?C.blu:r.categoria==='Vetri'?C.tl:r.categoria==='Ferramenta'?C.amb:C.dk}/></td>
<td style={{padding:'10px',fontFamily:FM,fontWeight:700}}>{r.lunghezza||'-'}</td>
<td style={{padding:'10px',fontFamily:FM}}>{r.altezza||'-'}</td>
<td style={{padding:'10px',fontFamily:FM,fontWeight:900,color:C.amb,fontSize:15}}>x{r.qta}</td>
<td style={{padding:'10px',fontFamily:FM,color:C.grn}}>{r.prezzo_ml?fE(r.prezzo_ml):'-'}</td>
<td style={{padding:'10px',fontFamily:FM,fontSize:11}}>{r.peso_m?(r.peso_m*(r.lunghezza||0)/1000).toFixed(1)+'kg':'-'}</td>
<td style={{padding:'10px',fontSize:12}}>{r.vano}</td></tr>)}</tbody></table>
{/* Totali */}
<div style={{display:'flex',gap:14,marginTop:16,padding:16,borderRadius:14,background:C.ink,color:C.wh}}>
<div style={{flex:1,textAlign:'center'}}><div style={{fontSize:24,fontWeight:900,fontFamily:FM}}>{totPezzi}</div><div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:C.tl}}>Pezzi totali</div></div>
<div style={{flex:1,textAlign:'center'}}><div style={{fontSize:24,fontWeight:900,fontFamily:FM}}>{Math.round(totPeso*10)/10}kg</div><div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:C.amb}}>Peso totale</div></div>
<div style={{flex:1,textAlign:'center'}}><div style={{fontSize:24,fontWeight:900,fontFamily:FM}}>{fE(totEuro)}</div><div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:C.grn}}>Valore totale</div></div>
<div style={{flex:1,textAlign:'center'}}><div style={{fontSize:24,fontWeight:900,fontFamily:FM}}>{fornitori.length}</div><div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:C.vio}}>Fornitori</div></div></div>
</div></div>;

// ═══ OTTIMIZZA & ORDINA ═══
if(step==='ottimizza')return<div style={{fontFamily:FF,height:'100%',display:'flex',flexDirection:'column',background:'#F8FAFA'}}>{hdr}{stepBar}
<div style={{padding:'12px 24px',display:'flex',gap:10,alignItems:'center',flexShrink:0,borderBottom:'2px solid '+C.bdr}}>
<span style={{fontSize:14,fontWeight:900,flex:1}}>Raggruppa per fornitore — {fornitori.length} fornitori</span>
<BigBtn onClick={creaOrdine} bg={C.tl}>{IC.send} Crea Ordine Procurement ({distinta.length} righe)</BigBtn></div>
<div style={{flex:1,overflow:'auto',padding:24}}>
{Object.entries(perForn).map(([forn,items])=><div key={forn} style={{marginBottom:16,borderRadius:14,overflow:'hidden',border:'2px solid '+C.bdr,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{background:C.ink,color:C.wh,padding:'14px 18px',display:'flex',alignItems:'center',gap:10}}>
<div style={{width:36,height:36,borderRadius:10,background:'rgba(255,255,255,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:16}}>{forn.charAt(0)}</div>
<span style={{fontSize:16,fontWeight:900,flex:1}}>{forn}</span>
<span style={{fontFamily:FM,color:C.tl,fontSize:13}}>{items.length} righe — {items.reduce((s,i)=>s+(i.qta||0),0)} pezzi</span></div>
<table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr style={{background:C.bg}}>
{['Codice','Ruolo','L mm','Qta','€/ml','Vano'].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:9,fontWeight:800,color:C.dk,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
<tbody>{items.map((r,i)=><tr key={i} style={{borderBottom:'1px solid '+C.bdr}}>
<td style={{padding:'8px 12px',fontFamily:FM,fontWeight:800,color:C.tl}}>{r.codice}</td>
<td style={{padding:'8px 12px',fontWeight:700}}>{r.ruolo}</td>
<td style={{padding:'8px 12px',fontFamily:FM}}>{r.lunghezza||'-'}</td>
<td style={{padding:'8px 12px',fontFamily:FM,fontWeight:900,color:C.amb}}>x{r.qta}</td>
<td style={{padding:'8px 12px',fontFamily:FM,color:C.grn}}>{r.prezzo_ml?fE(r.prezzo_ml):'-'}</td>
<td style={{padding:'8px 12px',fontSize:11}}>{r.vano}</td></tr>)}</tbody></table></div>)}</div></div>;

// ═══ ORDINE CREATO ═══
if(step==='ordine_creato')return<div style={{fontFamily:FF,height:'100%',display:'flex',flexDirection:'column',background:'#F8FAFA'}}>{hdr}{stepBar}
<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:40}}>
<div style={{textAlign:'center',maxWidth:500}}>
<div style={{color:C.grn,marginBottom:16}}>{ico(<polyline points="20 6 9 17 4 12"/>,64)}</div>
<div style={{fontSize:24,fontWeight:900,color:C.ink,marginBottom:8}}>Ordine creato con successo</div>
<div style={{fontSize:14,color:C.dk,marginBottom:24}}>L'ordine e stato salvato nel modulo Procurement. Puoi gestirlo da li — inviare al fornitore, tracciare conferme, registrare arrivi.</div>
<div style={{display:'flex',gap:12,justifyContent:'center'}}>
<BigBtn onClick={()=>{if(onNavigate)onNavigate('ordini')}} bg={C.blu} style={{boxShadow:'0 4px 0 0 #2558A0'}}>{IC.box} Vai agli Ordini</BigBtn>
<BigBtn onClick={()=>setStep('produzione')} bg={C.grn} style={{boxShadow:'0 4px 0 0 #14694E'}}>{IC.factory} Vai a Produzione</BigBtn>
<BigBtn onClick={()=>setStep('cnc')} bg={C.red} style={{boxShadow:'0 4px 0 0 #991B1B'}}>{IC.cut} Genera CNC</BigBtn></div></div></div></div>;

// ═══ PRODUZIONE ═══
if(step==='produzione')return<div style={{fontFamily:FF,height:'100%',display:'flex',flexDirection:'column',background:'#F8FAFA'}}>{hdr}{stepBar}
<div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{fontSize:18,fontWeight:900,marginBottom:16}}>Stato Produzione — {commessa.code}</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:14,marginBottom:24}}>
{[{l:'Materiale ordinato',v:ordini.length>0?'Si':'No',c:ordini.length>0?C.grn:C.red},
{l:'Materiale arrivato',v:ordini.some(o=>o.stato==='ricevuto')?'Si':'In attesa',c:ordini.some(o=>o.stato==='ricevuto')?C.grn:C.amb},
{l:'Profili da tagliare',v:distinta.filter(d=>d.tipo==='profilo').length,c:C.blu},
{l:'Vetri da ordinare',v:distinta.filter(d=>d.tipo==='vetro').length,c:C.tl}].map((k,i)=>
<div key={i} style={{padding:20,borderRadius:14,background:C.wh,border:'2px solid '+C.bdr,textAlign:'center',boxShadow:'0 4px 0 '+C.bdr}}>
<div style={{fontSize:28,fontWeight:900,fontFamily:FM,color:k.c}}>{k.v}</div>
<div style={{fontSize:10,fontWeight:800,color:C.dk,textTransform:'uppercase',marginTop:4}}>{k.l}</div></div>)}</div>
<div style={{fontSize:16,fontWeight:900,marginBottom:12}}>Vani da produrre</div>
{vani.map(v=><div key={v.id} style={{padding:'16px 20px',marginBottom:8,borderRadius:14,border:'2px solid '+C.bdr,background:C.wh,display:'flex',alignItems:'center',gap:12,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{width:48,height:48,borderRadius:12,background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',color:C.tl,fontWeight:900,fontSize:14,border:'2px solid '+C.bdr}}>{(v.nome||'V').charAt(0)}</div>
<div style={{flex:1}}><div style={{fontSize:15,fontWeight:800}}>{v.nome||'Vano'}</div>
<div style={{fontSize:12,color:C.dk}}>{v.larghezza||0}x{v.altezza||0}mm — {v.sistema||'N/D'} — {v.tipologia||''}</div></div>
<Badge text={distinta.filter(d=>d.vano===v.nome).length+' pezzi'} color={C.blu}/></div>)}
</div></div>;

// ═══ CNC ═══
if(step==='cnc'){const profiliTaglio=distinta.filter(d=>d.tipo==='profilo');
return<div style={{fontFamily:FF,height:'100%',display:'flex',flexDirection:'column',background:'#F8FAFA'}}>{hdr}{stepBar}
<div style={{padding:'12px 24px',display:'flex',gap:10,alignItems:'center',flexShrink:0,borderBottom:'2px solid '+C.bdr}}>
<span style={{fontSize:14,fontWeight:900,flex:1}}>Distinta Taglio CNC — {profiliTaglio.length} profili</span>
<BigBtn onClick={()=>{
const csv='N;Codice;Descrizione;Lunghezza;Qta;Angolo_SX;Angolo_DX;Vano\n'+profiliTaglio.map((p,i)=>[i+1,p.codice,p.ruolo,p.lunghezza,p.qta,'45','45',p.vano].join(';')).join('\n');
const b=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='cnc_taglio_'+(commessa?.code||'')+'.csv';a.click()}} bg={C.red} style={{boxShadow:'0 4px 0 0 #991B1B'}}>{IC.dl} Esporta CNC (.csv)</BigBtn>
<BigBtn onClick={()=>{
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<CuttingList machine="EMMEGI_CENTRO2" project="'+(commessa?.code||'')+'">\n'+profiliTaglio.map((p,i)=>'  <Bar n="'+(i+1)+'" code="'+p.codice+'" desc="'+p.ruolo+'" length="'+p.lunghezza+'" qty="'+p.qta+'" angle_left="45" angle_right="45"/>').join('\n')+'\n</CuttingList>';
const b=new Blob([xml],{type:'text/xml'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='cnc_'+(commessa?.code||'')+'.xml';a.click()}} bg={C.ink} style={{boxShadow:'0 4px 0 0 #000'}}>{IC.dl} Esporta XML Emmegi</BigBtn></div>
<div style={{flex:1,overflow:'auto',padding:'12px 24px'}}>
<table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr style={{background:C.red+'15',color:C.red}}>
{['N','Codice profilo','Descrizione taglio','Lunghezza mm','Qta','Angolo SX','Angolo DX','Vano'].map(h=><th key={h} style={{padding:'12px 10px',textAlign:'left',fontSize:10,fontWeight:800,textTransform:'uppercase'}}>{h}</th>)}</tr></thead>
<tbody>{profiliTaglio.map((p,i)=><tr key={i} style={{borderBottom:'2px solid '+C.bdr,background:i%2?C.bg:C.wh}}>
<td style={{padding:'10px',fontFamily:FM,fontWeight:800,color:C.red}}>{i+1}</td>
<td style={{padding:'10px',fontFamily:FM,fontWeight:800,color:C.tl}}>{p.codice}</td>
<td style={{padding:'10px',fontWeight:700}}>{p.ruolo}</td>
<td style={{padding:'10px',fontFamily:FM,fontWeight:900,fontSize:15,color:C.ink}}>{p.lunghezza}</td>
<td style={{padding:'10px',fontFamily:FM,fontWeight:900,color:C.amb,fontSize:15}}>x{p.qta}</td>
<td style={{padding:'10px',fontFamily:FM}}>45</td>
<td style={{padding:'10px',fontFamily:FM}}>45</td>
<td style={{padding:'10px',fontSize:12}}>{p.vano}</td></tr>)}</tbody></table>
<div style={{display:'flex',gap:14,marginTop:16,padding:16,borderRadius:14,background:C.ink,color:C.wh}}>
<div style={{flex:1,textAlign:'center'}}><div style={{fontSize:24,fontWeight:900,fontFamily:FM}}>{profiliTaglio.length}</div><div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:C.tl}}>Profili</div></div>
<div style={{flex:1,textAlign:'center'}}><div style={{fontSize:24,fontWeight:900,fontFamily:FM}}>{profiliTaglio.reduce((s,p)=>s+(p.qta||0),0)}</div><div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:C.amb}}>Tagli totali</div></div>
<div style={{flex:1,textAlign:'center'}}><div style={{fontSize:24,fontWeight:900,fontFamily:FM}}>{Math.round(profiliTaglio.reduce((s,p)=>s+(p.lunghezza||0)*(p.qta||0),0)/1000*10)/10}m</div><div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:C.grn}}>Metri lineari</div></div></div>
</div></div>}

return<div style={{fontFamily:FF,height:'100%',display:'flex',flexDirection:'column',background:'#F8FAFA'}}>{hdr}{stepBar}<div style={{padding:24}}>Sezione: {step}</div></div>;
}
