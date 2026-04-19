// @ts-nocheck
'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO PRODUZIONE v2 — Production Operating System (S27)
// hooks/useProduzione.ts for data+CRUD
// 11 Tabs: Tower, WO, Macchine, Operatori, Risorse, Routing,
//          Quality, Blocchi, Manutenzioni, Eventi, Config
// ═══════════════════════════════════════════════════════════
import React,{useState,useEffect} from 'react';
import useProduzione,{MACHINE_STATI,WO_STATI,BLOCCO_CAUSE,PRIORITA,FASI_PRODUZIONE,stOf} from '../hooks/useProduzione';
const C={tl:'#28A0A0',dk:'#156060',ink:'#0D1F1F',bg:'#EEF8F8',bdr:'#C8E4E4',wh:'#FFFFFF',red:'#DC4444',grn:'#1A9E73',amb:'#D08008',blu:'#3B7FE0',vio:'#7C3AED',pin:'#EC4899'};
const FF="'Inter',system-ui,sans-serif",FM="'JetBrains Mono',monospace";
const ico=(d,s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const IC={back:ico(<path d="M19 12H5M12 19l-7-7 7-7"/>),plus:ico(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),check:ico(<polyline points="20 6 9 17 4 12"/>),x:ico(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),play:ico(<polygon points="5 3 19 12 5 21 5 3"/>),pause:ico(<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>),alert:ico(<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>),clock:ico(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),user:ico(<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>),tool:ico(<><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>),truck:ico(<><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>),zap:ico(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>),search:ico(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>),list:ico(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>),box:ico(<><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>),shield:ico(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>),grid:ico(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>),activity:ico(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>),settings:ico(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>),wrench:ico(<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>),bar:ico(<><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></>),users:ico(<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>),route:ico(<><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3"/></>)};
function fD(d){if(!d)return'-';try{return new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'short'})}catch{return d}}
function fH(d){if(!d)return'';try{return new Date(d).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}catch{return''}}
function fAgo(d){if(!d)return'';const m=Math.floor((Date.now()-new Date(d).getTime())/60000);if(m<1)return'ora';if(m<60)return m+'min';const h=Math.floor(m/60);if(h<24)return h+'h';return Math.floor(h/24)+'gg'}
function fMin(m){if(!m)return'-';if(m<60)return m+'min';return Math.floor(m/60)+'h'+String(m%60).padStart(2,'0')}
function Btn({children,onClick,bg,disabled,style:s}){return<button onClick={onClick} disabled={disabled} style={{padding:'14px 28px',borderRadius:14,border:'2px solid '+(bg||C.tl),background:bg||C.tl,color:C.wh,fontSize:15,fontWeight:900,cursor:disabled?'default':'pointer',fontFamily:FF,display:'inline-flex',alignItems:'center',gap:10,boxShadow:'0 4px 0 0 '+C.dk,opacity:disabled?.4:1,...(s||{})}}>{children}</button>}
function Sm({children,onClick,color,bg}){return<button onClick={onClick} style={{padding:'8px 16px',borderRadius:10,border:'2px solid '+(color||C.bdr),background:bg||C.wh,color:color||C.ink,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FF,display:'inline-flex',alignItems:'center',gap:6,boxShadow:'0 3px 0 '+(color?color+'40':C.bdr)}}>{children}</button>}
function Bg({text,color,big}){return<span style={{padding:big?'5px 14px':'3px 10px',borderRadius:big?8:5,fontSize:big?12:10,fontWeight:800,background:color+'18',color}}>{text}</span>}
function Kpi({label,value,color,icon,onClick}){return<div onClick={onClick} style={{flex:1,padding:18,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,textAlign:'center',boxShadow:'0 4px 0 #A8CCCC',minWidth:110,cursor:onClick?'pointer':'default'}}>{icon&&<div style={{marginBottom:6,opacity:.5}}>{icon}</div>}<div style={{fontSize:28,fontWeight:900,fontFamily:FM,color}}>{value}</div><div style={{fontSize:9,fontWeight:800,color:C.dk,textTransform:'uppercase',letterSpacing:1,marginTop:4}}>{label}</div></div>}
function SH({icon,title,count,right}){return<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}><div style={{color:C.tl}}>{icon}</div><div style={{fontSize:18,fontWeight:900}}>{title}</div>{count!=null&&<Bg text={String(count)} color={C.tl} big/>}<div style={{flex:1}}/>{right}</div>}
function Tst({msg,type,onDone}){useEffect(()=>{const t=setTimeout(onDone,3500);return()=>clearTimeout(t)},[]);return<div style={{position:'fixed',top:20,right:20,zIndex:99999,padding:'14px 24px',borderRadius:14,background:type==='ok'?C.grn:type==='warn'?C.amb:C.red,color:C.wh,fontSize:14,fontWeight:800,fontFamily:FF,boxShadow:'0 8px 30px rgba(0,0,0,.25)',display:'flex',alignItems:'center',gap:10}}>{type==='ok'?IC.check:IC.alert} {msg}</div>}

export default function DesktopProduzione({commessaId,onNavigate,onBack}){
const P=useProduzione();
const[tab,setTab]=useState('tower');
const[selWO,setSelWO]=useState(null);
const[fS,setFS]=useState('');// filtro stato
const[fR,setFR]=useState('');// filtro reparto
const[sq,setSQ]=useState('');// search
const[showNW,setShowNW]=useState(false);
const[nw,setNw]=useState({articolo:'',commessa_code:'',cliente:'',priorita:'normale',tempo_stimato_min:60,reparto_id:'',macchina_id:'',operatore_nome:'',routing_id:'',data_inizio_prevista:'',data_fine_prevista:'',note:''});
const[showQC,setShowQC]=useState(null);// quality check modal: woId
const[qcData,setQcData]=useState({fase:'finale',esito:'ok',items:[{item:'Dimensioni corrette',ok:true},{item:'Superficie pulita',ok:true},{item:'Ferramenta montata',ok:true},{item:'Guarnizioni inserite',ok:true},{item:'Vetro integro',ok:true}],note:''});
const INP={width:'100%',padding:'12px 14px',border:'2px solid '+C.bdr,borderRadius:12,fontSize:14,fontFamily:FF,outline:'none',background:C.wh};
const LB={fontSize:10,fontWeight:800,color:C.dk,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:4,display:'block'};
const wf=P.wo.filter(w=>{if(fS&&w.stato!==fS)return false;if(fR&&w.reparto_id!==fR)return false;if(sq){const q=sq.toLowerCase();return[w.codice,w.articolo,w.cliente,w.commessa_code].some(x=>(x||'').toLowerCase().includes(q))}return true});
if(P.loading)return<div style={{padding:60,textAlign:'center',color:C.dk,fontFamily:FF}}>Caricamento Produzione...</div>;
const TABS=[{id:'tower',l:'Control Tower',i:IC.zap},{id:'wo',l:'Work Orders',i:IC.list,n:P.kpi.woTotali},{id:'macchine',l:'Macchine',i:IC.settings,n:P.kpi.macchineLavoro},{id:'operatori',l:'Operatori',i:IC.users},{id:'risorse',l:'Risorse',i:IC.tool},{id:'routing',l:'Routing',i:IC.route,n:P.kpi.routingTotal},{id:'quality',l:'Qualita',i:IC.shield,n:P.kpi.qualityFail},{id:'blocchi',l:'Blocchi',i:IC.alert,n:P.kpi.blocchiAperti},{id:'man',l:'Manutenzioni',i:IC.wrench,n:P.kpi.manScadute},{id:'log',l:'Eventi',i:IC.activity},{id:'cfg',l:'Config',i:IC.grid}];
const hdr=<div style={{flexShrink:0}}>
<div style={{padding:'14px 24px',background:C.ink,color:C.wh,display:'flex',alignItems:'center',gap:14}}>
{onBack&&<button onClick={onBack} style={{background:'none',border:'none',color:C.tl,cursor:'pointer'}}>{IC.back}</button>}
{IC.box}<div style={{flex:1}}><div style={{fontSize:22,fontWeight:900,letterSpacing:'-.5px'}}>MASTRO PRODUZIONE</div>
<div style={{fontSize:10,color:'rgba(255,255,255,.35)'}}>PRODUCTION OPERATING SYSTEM</div></div>
{P.kpi.bloccati>0&&<div style={{padding:'8px 16px',borderRadius:12,background:C.red+'25',color:C.red,fontSize:14,fontWeight:900}}>{P.kpi.bloccati} bloccati</div>}
{P.kpi.ritardo>0&&<div style={{padding:'8px 16px',borderRadius:12,background:C.amb+'25',color:C.amb,fontSize:14,fontWeight:900}}>{P.kpi.ritardo} in ritardo</div>}
<Btn onClick={()=>setShowNW(true)}>{IC.plus} Nuovo WO</Btn></div>
<div style={{display:'flex',gap:0,background:C.bg,borderBottom:'2px solid '+C.bdr,padding:'0 16px',overflowX:'auto'}}>
{TABS.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setSelWO(null)}} style={{padding:'14px 18px',border:'none',borderBottom:tab===t.id?'4px solid '+C.tl:'4px solid transparent',background:tab===t.id?C.tl+'10':'transparent',color:tab===t.id?C.tl:C.dk,fontSize:13,fontWeight:tab===t.id?900:600,cursor:'pointer',fontFamily:FF,display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap',borderRadius:'10px 10px 0 0'}}>
{t.i}{t.l}{t.n>0&&<span style={{width:20,height:20,borderRadius:'50%',background:['blocchi','man','quality'].includes(t.id)?C.red:C.tl,color:C.wh,fontSize:10,fontWeight:900,display:'inline-flex',alignItems:'center',justifyContent:'center',marginLeft:3}}>{t.n}</span>}</button>)}</div></div>;
const Pg=({children})=><div style={{fontFamily:FF,height:'100%',display:'flex',flexDirection:'column',background:'#F8FAFA'}}>{hdr}{children}{P.toast&&<Tst msg={P.toast.msg} type={P.toast.type} onDone={()=>P.setToast(null)}/>}
{showQC&&<QualityModal woId={showQC} qc={qcData} setQc={setQcData} onClose={()=>setShowQC(null)} onSave={async()=>{await P.addQualityCheck(showQC,qcData.fase,qcData.esito,qcData.items.map(i=>({item:i.item,esito:i.ok?'ok':'non_conforme'})),qcData.note);setShowQC(null)}}/>}</div>;

// ═══ QUALITY CHECK MODAL ═══
function QualityModal({woId,qc,setQc,onClose,onSave}){
const w=P.wo.find(x=>x.id===woId);
return<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
<div style={{background:C.wh,borderRadius:20,width:560,maxHeight:'85vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
<div style={{padding:'20px 24px',borderBottom:'2px solid '+C.bdr,display:'flex',alignItems:'center',gap:12}}>
<div style={{width:44,height:44,borderRadius:12,background:C.grn+'15',display:'flex',alignItems:'center',justifyContent:'center',color:C.grn}}>{IC.shield}</div>
<div style={{flex:1}}><div style={{fontSize:18,fontWeight:900,color:C.grn}}>Controllo Qualita</div>
{w&&<div style={{fontSize:11,color:C.dk}}>{w.codice} — {w.articolo?.slice(0,40)}</div>}</div>
<button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.dk}}>{IC.x}</button></div>
<div style={{padding:24}}>
{/* Fase + Esito */}
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
<div><label style={LB}>Fase</label><select value={qc.fase} onChange={e=>setQc({...qc,fase:e.target.value})} style={INP}>
{FASI_PRODUZIONE.map(f=><option key={f} value={f}>{f}</option>)}<option value="finale">finale</option></select></div>
<div><label style={LB}>Esito</label><div style={{display:'flex',gap:6}}>
{['ok','non_conforme','rework'].map(e=><button key={e} onClick={()=>setQc({...qc,esito:e})} style={{flex:1,padding:'12px',borderRadius:10,border:'2px solid '+(qc.esito===e?(e==='ok'?C.grn:e==='non_conforme'?C.red:C.amb):C.bdr),background:qc.esito===e?(e==='ok'?C.grn:e==='non_conforme'?C.red:C.amb)+'15':C.wh,color:qc.esito===e?(e==='ok'?C.grn:e==='non_conforme'?C.red:C.amb):C.dk,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:FF,textTransform:'uppercase'}}>{e.replace(/_/g,' ')}</button>)}</div></div>
</div>
{/* Checklist */}
<div style={{marginBottom:16}}>
<label style={LB}>Checklist</label>
{qc.items.map((item,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',marginBottom:4,borderRadius:10,border:'2px solid '+(item.ok?C.grn+'30':C.red+'30'),background:item.ok?C.grn+'05':C.red+'05',cursor:'pointer'}} onClick={()=>{const nItems=[...qc.items];nItems[i]={...item,ok:!item.ok};setQc({...qc,items:nItems})}}>
<div style={{width:24,height:24,borderRadius:6,border:'2px solid '+(item.ok?C.grn:C.red),background:item.ok?C.grn:C.red+'20',display:'flex',alignItems:'center',justifyContent:'center',color:C.wh,flexShrink:0}}>{item.ok&&IC.check}</div>
<span style={{fontSize:13,fontWeight:700,flex:1}}>{item.item}</span>
<Bg text={item.ok?'OK':'NON CONF.'} color={item.ok?C.grn:C.red}/></div>)}
<button onClick={()=>{const n=prompt('Nuovo punto checklist:');if(n)setQc({...qc,items:[...qc.items,{item:n,ok:true}]})}} style={{padding:'8px 14px',marginTop:6,borderRadius:8,border:'2px dashed '+C.bdr,background:'transparent',color:C.tl,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FF,width:'100%'}}>{IC.plus} Aggiungi punto</button>
</div>
{/* Note */}
<div><label style={LB}>Note</label><textarea value={qc.note} onChange={e=>setQc({...qc,note:e.target.value})} rows={2} placeholder="Osservazioni..." style={{...INP,resize:'vertical'}}/></div>
{/* Non conformita count */}
{qc.items.filter(i=>!i.ok).length>0&&<div style={{marginTop:12,padding:12,borderRadius:10,background:C.red+'08',border:'1.5px solid '+C.red+'30',fontSize:12,fontWeight:700,color:C.red}}>{IC.alert} {qc.items.filter(i=>!i.ok).length} non conformita rilevate: {qc.items.filter(i=>!i.ok).map(i=>i.item).join(', ')}</div>}
</div>
<div style={{padding:'16px 24px',borderTop:'2px solid '+C.bdr,display:'flex',gap:10,justifyContent:'flex-end'}}>
<Sm onClick={onClose} color={C.dk}>Annulla</Sm>
<Btn onClick={onSave} bg={qc.esito==='ok'?C.grn:qc.esito==='non_conforme'?C.red:C.amb} style={{padding:'12px 24px'}}>{IC.shield} Salva controllo</Btn></div></div></div>}

// ═══ NEW WO ═══
if(showNW)return<Pg><div style={{flex:1,overflow:'auto',padding:24,maxWidth:700}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}><Sm onClick={()=>setShowNW(false)}>{IC.back} Annulla</Sm><span style={{fontSize:18,fontWeight:900}}>Nuovo Work Order</span></div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
<div style={{gridColumn:'1/3'}}><label style={LB}>Articolo *</label><input value={nw.articolo} onChange={e=>setNw({...nw,articolo:e.target.value})} placeholder="Finestra 2A PVC bianco 1200x1400" style={INP}/></div>
<div><label style={LB}>Commessa</label><input value={nw.commessa_code} onChange={e=>setNw({...nw,commessa_code:e.target.value})} placeholder="S-0001" style={INP}/></div>
<div><label style={LB}>Cliente</label><input value={nw.cliente} onChange={e=>setNw({...nw,cliente:e.target.value})} style={INP}/></div>
<div><label style={LB}>Priorita</label><select value={nw.priorita} onChange={e=>setNw({...nw,priorita:e.target.value})} style={INP}>{PRIORITA.map(p=><option key={p.id} value={p.id}>{p.id}</option>)}</select></div>
<div><label style={LB}>Tempo (min)</label><input type="number" value={nw.tempo_stimato_min} onChange={e=>setNw({...nw,tempo_stimato_min:+e.target.value})} style={INP}/></div>
<div><label style={LB}>Reparto</label><select value={nw.reparto_id} onChange={e=>setNw({...nw,reparto_id:e.target.value})} style={INP}><option value="">-</option>{P.reparti.map(r=><option key={r.id} value={r.id}>{r.nome}</option>)}</select></div>
<div><label style={LB}>Macchina</label><select value={nw.macchina_id} onChange={e=>setNw({...nw,macchina_id:e.target.value})} style={INP}><option value="">-</option>{P.macchine.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}</select></div>
<div><label style={LB}>Operatore</label><input value={nw.operatore_nome} onChange={e=>setNw({...nw,operatore_nome:e.target.value})} style={INP}/></div>
<div><label style={LB}>Routing</label><select value={nw.routing_id} onChange={e=>{const r=P.routing.find(x=>x.id===e.target.value);if(r){const steps=P.getRoutingSteps(r.id);setNw(p=>({...p,routing_id:r.id,tempo_stimato_min:steps.reduce((s,st)=>s+(st.tempo_stimato_min||0),0)||p.tempo_stimato_min}))}}} style={INP}><option value="">-</option>{P.routing.map(r=><option key={r.id} value={r.id}>{r.nome}</option>)}</select></div>
<div><label style={LB}>Inizio</label><input type="date" value={nw.data_inizio_prevista} onChange={e=>setNw({...nw,data_inizio_prevista:e.target.value})} style={INP}/></div>
<div><label style={LB}>Fine</label><input type="date" value={nw.data_fine_prevista} onChange={e=>setNw({...nw,data_fine_prevista:e.target.value})} style={INP}/></div>
<div style={{gridColumn:'1/3'}}><label style={LB}>Note</label><textarea value={nw.note} onChange={e=>setNw({...nw,note:e.target.value})} rows={2} style={{...INP,resize:'vertical'}}/></div>
</div>
<div style={{marginTop:20}}><Btn onClick={async()=>{const r=await P.createWO(nw);if(r)setShowNW(false)}} disabled={!nw.articolo.trim()} style={{width:'100%',justifyContent:'center',fontSize:16}}>{IC.check} Crea Work Order</Btn></div></div></Pg>;

// ═══ TOWER ═══
if(tab==='tower')return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
<Kpi label="WO attivi" value={P.kpi.attivi} color={C.tl} icon={IC.play} onClick={()=>{setFS('in_lavorazione');setTab('wo')}}/>
<Kpi label="Bloccati" value={P.kpi.bloccati} color={C.red} icon={IC.alert} onClick={()=>setTab('blocchi')}/>
<Kpi label="In ritardo" value={P.kpi.ritardo} color={C.amb} icon={IC.clock}/>
<Kpi label="Oggi" value={P.kpi.completatiOggi} color={C.grn} icon={IC.check}/>
<Kpi label="Macchine" value={P.kpi.macchineLavoro+'/'+P.kpi.macchineTotal} color={C.tl} icon={IC.settings} onClick={()=>setTab('macchine')}/>
<Kpi label="Operatori" value={P.kpi.opAttivi} color={C.blu} icon={IC.users} onClick={()=>setTab('operatori')}/>
</div>
{/* Saturazione */}
{P.saturazioneReparti.length>0&&<><SH icon={IC.bar} title="Saturazione Reparti"/>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:24}}>
{P.saturazioneReparti.map(r=><div key={r.id} style={{padding:16,borderRadius:14,background:C.wh,border:'2px solid '+C.bdr,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><div style={{width:14,height:14,borderRadius:4,background:r.colore||C.tl}}/><span style={{fontSize:14,fontWeight:900}}>{r.nome}</span></div>
<div style={{height:8,borderRadius:4,background:C.bdr,marginBottom:6}}><div style={{height:'100%',borderRadius:4,background:r.saturazione>90?C.red:r.saturazione>70?C.amb:C.grn,width:Math.min(100,r.saturazione)+'%'}}/></div>
<div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.dk}}><span>{r.woAttivi} WO</span><span style={{fontFamily:FM,fontWeight:900,color:r.saturazione>90?C.red:r.saturazione>70?C.amb:C.grn}}>{r.saturazione}%</span></div></div>)}</div></>}
{/* Blocchi */}
{P.kpi.blocchiAperti>0&&<div style={{padding:16,borderRadius:14,background:C.red+'08',border:'2px solid '+C.red+'30',marginBottom:20}}>
<div style={{fontSize:14,fontWeight:900,color:C.red,marginBottom:8}}>{IC.alert} {P.kpi.blocchiAperti} blocchi</div>
{P.blocchi.filter(b=>b.stato==='aperto').slice(0,4).map(b=>{const wr=P.wo.find(w=>w.id===b.work_order_id);return<div key={b.id} style={{padding:'10px 14px',marginBottom:4,borderRadius:10,background:C.wh,border:'1px solid '+C.red+'30',display:'flex',alignItems:'center',gap:8,fontSize:12}}>
<Bg text={b.causa?.replace(/_/g,' ')} color={C.red}/><span style={{flex:1,fontWeight:700}}>{b.descrizione||b.causa}{wr&&<span style={{fontFamily:FM,color:C.tl,marginLeft:6}}>{wr.codice}</span>}</span>
<Sm onClick={()=>{const a=prompt('Azione:');P.risolviBlocco(b.id,a||'')}} color={C.grn}>{IC.check}</Sm></div>})}</div>}
{/* Macchine */}
{P.macchine.length>0&&<><SH icon={IC.settings} title="Macchine Live" count={P.macchine.length}/>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10,marginBottom:24}}>
{P.macchine.map(m=>{const st=stOf(m.stato,MACHINE_STATI);return<div key={m.id} style={{padding:14,borderRadius:12,background:C.wh,border:'2px solid '+st.c+'30',boxShadow:'0 2px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}><div style={{width:10,height:10,borderRadius:'50%',background:st.c,boxShadow:'0 0 6px '+st.c+'60'}}/><span style={{fontSize:13,fontWeight:900,flex:1}}>{m.nome}</span></div>
<Bg text={st.l} color={st.c}/></div>})}</div></>}
{/* In corso */}
{P.wo.filter(w=>['in_lavorazione','in_setup'].includes(w.stato)).length>0&&<><SH icon={IC.play} title="In lavorazione"/>
{P.wo.filter(w=>['in_lavorazione','in_setup'].includes(w.stato)).slice(0,6).map(w=><div key={w.id} onClick={()=>{setSelWO(w);setTab('wo')}} style={{padding:'12px 18px',marginBottom:6,borderRadius:12,border:'2px solid '+C.tl+'25',background:C.wh,cursor:'pointer',display:'flex',alignItems:'center',gap:12,boxShadow:'0 2px 0 '+C.bdr}}>
<span style={{fontFamily:FM,fontWeight:900,color:C.tl}}>{w.codice}</span><Bg text={stOf(w.stato,WO_STATI).l} color={stOf(w.stato,WO_STATI).c}/>
<span style={{flex:1,fontSize:13,fontWeight:700}}>{w.articolo?.slice(0,40)}</span><span style={{fontSize:11,color:C.dk}}>{w.operatore_nome} {fAgo(w.stato_dal)}</span></div>)}</>}
</div></Pg>;

// ═══ WO LIST ═══
if(tab==='wo'&&!selWO)return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<SH icon={IC.list} title="Work Orders" count={wf.length} right={<Btn onClick={()=>setShowNW(true)} style={{padding:'10px 18px',fontSize:13}}>{IC.plus} Nuovo</Btn>}/>
<div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
<div style={{position:'relative',flex:1,maxWidth:300}}><span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:.4}}>{IC.search}</span>
<input placeholder="Cerca..." value={sq} onChange={e=>setSQ(e.target.value)} style={{width:'100%',padding:'12px 14px 12px 40px',...INP}}/></div>
{Object.entries(WO_STATI).map(([k,v])=>{const n=P.wo.filter(w=>w.stato===k).length;if(!n)return null;return<Sm key={k} onClick={()=>setFS(fS===k?'':k)} color={fS===k?v.c:C.dk} bg={fS===k?v.c+'15':C.wh}>{v.l} ({n})</Sm>})}
</div>
{wf.map(w=>{const st=stOf(w.stato,WO_STATI);const pr=PRIORITA.find(p=>p.id===w.priorita)||PRIORITA[1];const rit=w.data_fine_prevista&&new Date(w.data_fine_prevista)<new Date()&&!['completato','annullato'].includes(w.stato);
return<div key={w.id} onClick={()=>setSelWO(w)} style={{padding:'14px 18px',marginBottom:6,borderRadius:14,border:'2px solid '+(rit?C.amb+'50':w.stato==='bloccato'?C.red+'50':C.bdr),background:C.wh,cursor:'pointer',display:'flex',alignItems:'center',gap:12,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{width:8,height:36,borderRadius:4,background:st.c}}/>
<div style={{flex:1}}><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}><span style={{fontFamily:FM,fontWeight:900,color:C.tl,fontSize:12}}>{w.codice}</span><Bg text={st.l} color={st.c}/><Bg text={pr.id} color={pr.c}/>{rit&&<Bg text="RITARDO" color={C.amb}/>}{w.commessa_code&&<Bg text={w.commessa_code} color={C.blu}/>}</div>
<div style={{fontSize:13,fontWeight:700}}>{w.articolo||'--'}</div><div style={{fontSize:11,color:C.dk}}>{w.cliente}{w.operatore_nome&&' - '+w.operatore_nome}</div></div>
<div style={{textAlign:'right'}}>{w.data_fine_prevista&&<div style={{fontFamily:FM,fontSize:11,color:rit?C.amb:C.dk}}>{fD(w.data_fine_prevista)}</div>}<div style={{fontFamily:FM,fontSize:11,color:C.dk}}>{fMin(w.tempo_stimato_min)}</div></div></div>})}
</div></Pg>;

// ═══ WO DETAIL ═══
if(tab==='wo'&&selWO){const w=selWO;const st=stOf(w.stato,WO_STATI);const rep=P.reparti.find(r=>r.id===w.reparto_id);const mac=P.macchine.find(m=>m.id===w.macchina_id);
const we=P.events.filter(e=>e.work_order_id===w.id);const wb=P.blocchi.filter(b=>b.work_order_id===w.id&&b.stato==='aperto');const wq=P.quality.filter(q=>q.work_order_id===w.id);
return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<Sm onClick={()=>setSelWO(null)} color={C.tl}>{IC.back} Lista</Sm>
<div style={{marginTop:16,padding:24,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,marginBottom:16,boxShadow:'0 4px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}><div style={{fontFamily:FM,fontSize:24,fontWeight:900,color:C.tl}}>{w.codice}</div><Bg text={st.l} color={st.c} big/></div>
<div style={{fontSize:18,fontWeight:800,marginBottom:12}}>{w.articolo}</div>
<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,fontSize:12}}>
{[['Commessa',w.commessa_code],['Cliente',w.cliente],['Reparto',rep?.nome],['Macchina',mac?.nome],['Operatore',w.operatore_nome],['Tempo stim.',fMin(w.tempo_stimato_min)],['Inizio',fD(w.data_inizio_prevista)],['Fine',fD(w.data_fine_prevista)]].map(([l,v],i)=>
<div key={i}><span style={{fontSize:10,fontWeight:800,color:C.dk,textTransform:'uppercase'}}>{l}</span><div style={{fontWeight:700,marginTop:2}}>{v||'-'}</div></div>)}</div></div>
<div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
{w.stato==='pianificato'&&<Btn onClick={()=>{P.updateWOStato(w.id,'pronto');setSelWO({...w,stato:'pronto'})}} bg={C.blu}>{IC.check} Pronto</Btn>}
{['pronto','pausa'].includes(w.stato)&&<Btn onClick={()=>{P.updateWOStato(w.id,'in_lavorazione');setSelWO({...w,stato:'in_lavorazione'})}}>{IC.play} Avvia</Btn>}
{w.stato==='in_lavorazione'&&<Btn onClick={()=>{P.updateWOStato(w.id,'pausa');setSelWO({...w,stato:'pausa'})}} bg={C.amb}>{IC.pause} Pausa</Btn>}
{!['completato','annullato','bloccato'].includes(w.stato)&&<Btn onClick={()=>{const c=prompt('Causa:\n'+BLOCCO_CAUSE.join(', '),'manca_materiale');if(c){P.createBlocco(w.id,c,prompt('Descrizione:')||'');setSelWO({...w,stato:'bloccato'})}}} bg={C.red}>{IC.alert} Blocca</Btn>}
{['in_lavorazione','pronto'].includes(w.stato)&&<Btn onClick={()=>{P.updateWOStato(w.id,'completato');setSelWO({...w,stato:'completato'})}} bg={C.grn}>{IC.check} Completa</Btn>}
{!w.operatore_nome&&<Sm onClick={()=>{const op=prompt('Operatore:');if(op)P.assignWO(w.id,op,w.macchina_id)}} color={C.vio}>{IC.user} Assegna</Sm>}
<Sm onClick={()=>{setQcData({fase:w.fase_corrente||'finale',esito:'ok',items:[{item:'Dimensioni corrette',ok:true},{item:'Superficie pulita',ok:true},{item:'Ferramenta montata',ok:true},{item:'Guarnizioni inserite',ok:true},{item:'Vetro integro',ok:true}],note:''});setShowQC(w.id)}} color={C.grn}>{IC.shield} Quality Check</Sm>
</div>
{wb.length>0&&<div style={{padding:14,borderRadius:14,background:C.red+'08',border:'2px solid '+C.red+'30',marginBottom:16}}>
<div style={{fontSize:12,fontWeight:900,color:C.red,marginBottom:6}}>Blocchi</div>
{wb.map(b=><div key={b.id} style={{padding:'8px 12px',marginBottom:4,borderRadius:8,background:C.wh,display:'flex',alignItems:'center',gap:8,fontSize:11}}>
<Bg text={b.causa?.replace(/_/g,' ')} color={C.red}/><span style={{flex:1}}>{b.descrizione}</span><Sm onClick={()=>{const a=prompt('Azione:');P.risolviBlocco(b.id,a||'')}} color={C.grn}>{IC.check}</Sm></div>)}</div>}
{wq.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:900,marginBottom:8}}>{IC.shield} Controlli qualita ({wq.length})</div>
{wq.map(q=><div key={q.id} style={{padding:'10px 14px',marginBottom:4,borderRadius:10,background:C.wh,border:'2px solid '+(q.esito==='ok'?C.grn:q.esito==='non_conforme'?C.red:C.amb)+'25',display:'flex',alignItems:'center',gap:10,fontSize:12}}>
<Bg text={q.esito?.replace(/_/g,' ')} color={q.esito==='ok'?C.grn:q.esito==='non_conforme'?C.red:C.amb} big/>
<span style={{fontWeight:700}}>{q.fase} — {q.tipo}</span><span style={{flex:1}}/><span style={{color:C.dk}}>{fD(q.created_at)}</span>
{q.checklist&&<span style={{fontSize:10,color:C.dk}}>({(q.checklist||[]).filter(c=>c.esito==='ok').length}/{(q.checklist||[]).length} OK)</span>}</div>)}</div>}
<div style={{fontSize:13,fontWeight:900,marginBottom:8}}>Timeline</div>
{we.map(e=><div key={e.id} style={{padding:'6px 12px',borderLeft:'3px solid '+(e.tipo?.includes('block')?C.red:e.tipo?.includes('complete')?C.grn:C.tl),marginBottom:3,marginLeft:12,background:C.wh,borderRadius:'0 6px 6px 0',fontSize:11}}>
<span style={{fontFamily:FM,fontSize:10,color:C.dk}}>{fH(e.created_at)} {fD(e.created_at)}</span> <Bg text={e.tipo} color={e.tipo?.includes('block')?C.red:e.tipo?.includes('complete')?C.grn:C.tl}/></div>)}
</div></Pg>}

// ═══ MACCHINE ═══
if(tab==='macchine')return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<SH icon={IC.settings} title="Parco Macchine" count={P.macchine.length} right={<Sm onClick={()=>{const n=prompt('Nome:');if(n){const t=prompt('Tipo:');const r=P.reparti.length?prompt('Reparto ('+P.reparti.map(r=>r.nome).join('/')+'):'):'';P.createMachine(n,t||'',P.reparti.find(x=>x.nome===r)?.id)}}} color={C.tl}>{IC.plus}</Sm>}/>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
{P.macchine.map(m=>{const st=stOf(m.stato,MACHINE_STATI);const wr=P.wo.find(w=>w.id===m.job_corrente_id);return<div key={m.id} style={{padding:18,borderRadius:16,background:C.wh,border:'2px solid '+st.c+'30',boxShadow:'0 4px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}><div style={{width:44,height:44,borderRadius:12,background:st.c+'15',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:14,height:14,borderRadius:'50%',background:st.c,boxShadow:'0 0 10px '+st.c+'60'}}/></div>
<div style={{flex:1}}><div style={{fontSize:15,fontWeight:900}}>{m.nome}</div><div style={{fontSize:11,color:C.dk}}>{m.tipo}</div></div></div>
<Bg text={st.l} color={st.c} big/>
{wr&&<div style={{marginTop:10,padding:8,borderRadius:8,background:C.tl+'08',border:'1px solid '+C.tl+'25',fontSize:11}}><span style={{fontFamily:FM,fontWeight:700,color:C.tl}}>{wr.codice}</span> {wr.articolo?.slice(0,30)}</div>}
<div style={{marginTop:10,display:'flex',gap:4,flexWrap:'wrap'}}>{Object.entries(MACHINE_STATI).filter(([k])=>k!==m.stato).slice(0,4).map(([k,v])=>
<button key={k} onClick={()=>P.updateMachineStato(m.id,k)} style={{padding:'3px 8px',borderRadius:5,border:'1.5px solid '+v.c+'40',background:v.c+'08',color:v.c,fontSize:9,fontWeight:800,cursor:'pointer',fontFamily:FF}}>{v.l}</button>)}</div></div>})}</div></div></Pg>;

// ═══ OPERATORI ═══
if(tab==='operatori')return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<SH icon={IC.users} title="Operatori" count={P.operatori.length} right={<Sm onClick={()=>{const n=prompt('Nome operatore:');if(n){const s=prompt('Prima skill ('+FASI_PRODUZIONE.slice(0,6).join('/')+'):');if(s)P.addSkill(n,s,2)}}} color={C.tl}>{IC.plus} Aggiungi</Sm>}/>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
{P.operatori.map(op=>{const ass=op.assegnazione;const wr=ass?P.wo.find(w=>w.id===ass.work_order_id):null;
return<div key={op.nome} style={{padding:18,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,boxShadow:'0 4px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
<div style={{width:44,height:44,borderRadius:14,background:ass?C.tl+'15':C.bg,display:'flex',alignItems:'center',justifyContent:'center',color:ass?C.tl:C.dk,fontSize:18,fontWeight:900,border:'2px solid '+(ass?C.tl:C.bdr)+'30'}}>{op.nome.charAt(0)}</div>
<div style={{flex:1}}><div style={{fontSize:15,fontWeight:900}}>{op.nome}</div>
{op.turnoOggi?<div style={{fontSize:10,color:C.grn}}>{op.turnoOggi.ora_inizio}-{op.turnoOggi.ora_fine}</div>:<div style={{fontSize:10,color:C.dk}}>Nessun turno</div>}</div>
{ass?<Bg text={ass.stato?.replace(/_/g,' ')} color={ass.stato==='in_lavorazione'?C.tl:C.amb} big/>:<Bg text="Libero" color={C.grn} big/>}</div>
{op.skills.length>0&&<div style={{marginBottom:8,display:'flex',gap:4,flexWrap:'wrap'}}>
{op.skills.map((s,i)=><span key={i} style={{padding:'3px 10px',borderRadius:5,fontSize:10,fontWeight:700,background:C.vio+'12',color:C.vio}}>{s.skill} L{s.livello}</span>)}</div>}
{wr&&<div style={{padding:10,borderRadius:10,background:C.tl+'08',border:'1px solid '+C.tl+'25',fontSize:12}}>
<span style={{fontFamily:FM,fontWeight:700,color:C.tl}}>{wr.codice}</span> {wr.articolo?.slice(0,35)}<div style={{fontSize:10,color:C.dk,marginTop:2}}>Da: {fAgo(ass.inizio)}</div></div>}
<div style={{marginTop:8,display:'flex',gap:4}}>
<Sm onClick={()=>{const s=prompt('Skill da aggiungere:');if(s){const l=+(prompt('Livello (1-4):','2')||2);P.addSkill(op.nome,s,l)}}} color={C.vio}>{IC.plus} Skill</Sm>
</div></div>})}</div></div></Pg>;

// ═══ RISORSE ═══
if(tab==='risorse')return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<SH icon={IC.tool} title="Attrezzi" count={P.attrezzi.length} right={<Sm onClick={()=>{const n=prompt('Nome:');if(n)P.createAttrezzo(n,prompt('Categoria:')||'')}} color={C.tl}>{IC.plus}</Sm>}/>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10,marginBottom:30}}>
{P.attrezzi.map(a=>{const col=a.stato==='disponibile'?C.grn:a.stato==='in_uso'?C.tl:C.red;return<div key={a.id} style={{padding:14,borderRadius:12,background:C.wh,border:'2px solid '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span style={{fontSize:13,fontWeight:900}}>{a.nome}</span><Bg text={a.stato?.replace(/_/g,' ')} color={col}/></div>
{a.assegnato_a&&<div style={{fontSize:11,color:C.vio}}>In uso: {a.assegnato_a}</div>}
<div style={{marginTop:6,display:'flex',gap:4}}>
{a.stato==='disponibile'&&<button onClick={()=>{const op=prompt('Operatore:');if(op)P.checkoutTool(a.id,op)}} style={{padding:'3px 8px',borderRadius:4,border:'1px solid '+C.tl+'40',background:C.tl+'08',color:C.tl,fontSize:9,fontWeight:700,cursor:'pointer'}}>Check-out</button>}
{a.stato==='in_uso'&&<button onClick={()=>P.checkinTool(a.id)} style={{padding:'3px 8px',borderRadius:4,border:'1px solid '+C.grn+'40',background:C.grn+'08',color:C.grn,fontSize:9,fontWeight:700,cursor:'pointer'}}>Check-in</button>}</div></div>})}</div>
<SH icon={IC.truck} title="Mezzi" count={P.mezzi.length} right={<Sm onClick={()=>{const n=prompt('Nome:');if(n)P.createMezzo(n,prompt('Tipo:','furgone')||'',prompt('Targa:')||'')}} color={C.tl}>{IC.plus}</Sm>}/>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:10}}>
{P.mezzi.map(v=>{const col=v.stato==='in_sede'?C.grn:v.stato==='in_viaggio'?C.blu:v.stato==='fermo'?C.red:'#999';return<div key={v.id} style={{padding:14,borderRadius:12,background:C.wh,border:'2px solid '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><span style={{fontSize:13,fontWeight:900}}>{v.nome}</span><Bg text={v.stato?.replace(/_/g,' ')} color={col}/></div>
{v.targa&&<div style={{fontSize:10,fontFamily:FM,color:C.dk}}>{v.targa}</div>}{v.autista&&<div style={{fontSize:10,color:C.vio}}>Autista: {v.autista}</div>}</div>})}</div></div></Pg>;

// ═══ ROUTING ═══
if(tab==='routing')return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<SH icon={IC.route} title="Routing Templates" count={P.routing.length} right={<Sm onClick={()=>{const n=prompt('Nome (es. Finestra PVC standard):');if(!n)return;const fam=prompt('Famiglia (pvc/alluminio/legno):','pvc');const s=prompt('Fasi (virgola):','taglio,saldatura,pulizia,vetro,ferramenta,collaudo');if(s)P.createRouting(n,fam||'',s.split(',').map(x=>({fase:x.trim(),tempo_stimato_min:+(prompt('Minuti per '+x.trim()+':','30')||30)})))}} color={C.tl}>{IC.plus} Nuovo</Sm>}/>
{P.routing.map(r=>{const steps=P.getRoutingSteps(r.id);return<div key={r.id} style={{padding:20,marginBottom:12,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,boxShadow:'0 4px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}><div style={{fontSize:16,fontWeight:900}}>{r.nome}</div><Bg text={r.famiglia||'generico'} color={C.tl} big/></div>
{steps.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{steps.map((s,i)=><div key={s.id||i} style={{display:'flex',alignItems:'center',gap:4}}>
<div style={{padding:'8px 14px',borderRadius:10,background:C.tl+'10',border:'1.5px solid '+C.tl+'30',fontSize:12,fontWeight:700}}><span style={{color:C.tl}}>{s.ordine}.</span> {s.fase} <span style={{fontFamily:FM,fontSize:10,color:C.dk}}>{fMin(s.tempo_stimato_min)}</span></div>
{i<steps.length-1&&<span style={{color:C.bdr,fontSize:16}}>→</span>}</div>)}</div>}
<div style={{fontSize:11,color:C.dk,marginTop:8}}>Tempo totale: <span style={{fontFamily:FM,fontWeight:900}}>{fMin(steps.reduce((s,st)=>s+(st.tempo_stimato_min||0),0))}</span></div></div>})}
{!P.routing.length&&<div style={{padding:40,textAlign:'center',color:C.dk}}>Crea il primo routing per definire le fasi produttive</div>}</div></Pg>;

// ═══ QUALITY ═══
if(tab==='quality')return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<SH icon={IC.shield} title="Controlli Qualita" count={P.quality.length}/>
{/* Stats */}
<div style={{display:'flex',gap:14,marginBottom:24}}>
<Kpi label="Totali" value={P.quality.length} color={C.tl}/>
<Kpi label="OK" value={P.quality.filter(q=>q.esito==='ok').length} color={C.grn}/>
<Kpi label="Non conformi" value={P.quality.filter(q=>q.esito==='non_conforme').length} color={C.red}/>
<Kpi label="Rework" value={P.quality.filter(q=>q.esito==='rework').length} color={C.amb}/>
<Kpi label="% OK" value={P.quality.length?Math.round(P.quality.filter(q=>q.esito==='ok').length/P.quality.length*100)+'%':'--'} color={C.grn}/>
</div>
{P.quality.map(q=>{const wr=P.wo.find(w=>w.id===q.work_order_id);const cl=q.checklist||[];const nok=cl.filter(c=>c.esito==='non_conforme'||c.esito===false);
return<div key={q.id} style={{padding:'16px 20px',marginBottom:8,borderRadius:14,border:'2px solid '+(q.esito==='ok'?C.grn:q.esito==='non_conforme'?C.red:C.amb)+'25',background:C.wh,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
<Bg text={q.esito?.replace(/_/g,' ')} color={q.esito==='ok'?C.grn:q.esito==='non_conforme'?C.red:C.amb} big/>
<span style={{fontFamily:FM,fontWeight:700,color:C.tl}}>{wr?.codice||'-'}</span>
<span style={{fontSize:14,fontWeight:700,flex:1}}>{q.fase} — {q.tipo||'standard'}</span>
<span style={{fontSize:11,color:C.dk}}>{fD(q.created_at)} {fH(q.created_at)}</span></div>
{/* Checklist items */}
{cl.length>0&&<div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:4}}>
{cl.map((c,i)=><span key={i} style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:(c.esito==='ok'||c.ok?C.grn:C.red)+'12',color:c.esito==='ok'||c.ok?C.grn:C.red}}>{c.item}</span>)}</div>}
{nok.length>0&&<div style={{fontSize:11,color:C.red,fontWeight:700}}>Non conformi: {nok.map(c=>c.item).join(', ')}</div>}
{q.note&&<div style={{fontSize:11,color:C.dk,marginTop:4}}>{q.note}</div>}
{wr&&<div style={{fontSize:11,color:C.dk,marginTop:2}}>{wr.articolo?.slice(0,50)} — {wr.cliente}</div>}
</div>})}
{!P.quality.length&&<div style={{padding:40,textAlign:'center',color:C.dk}}>I controlli appariranno qui — eseguili dalla scheda dettaglio WO</div>}</div></Pg>;

// ═══ BLOCCHI ═══
if(tab==='blocchi')return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<SH icon={IC.alert} title="Blocchi" count={P.blocchi.filter(b=>b.stato==='aperto').length}/>
{!P.blocchi.filter(b=>b.stato==='aperto').length&&<div style={{padding:40,textAlign:'center',color:C.dk}}>Nessun blocco attivo</div>}
{P.blocchi.map(b=>{const wr=P.wo.find(w=>w.id===b.work_order_id);return<div key={b.id} style={{padding:'18px 22px',marginBottom:8,borderRadius:14,border:'2px solid '+(b.stato==='aperto'?C.red:C.grn)+'30',background:C.wh,boxShadow:'0 3px 0 '+C.bdr,opacity:b.stato==='risolto'?.5:1}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}><Bg text={b.causa?.replace(/_/g,' ')} color={C.red} big/><Bg text={b.impatto||'medio'} color={b.impatto==='critico'?C.red:C.amb} big/><Bg text={b.stato} color={b.stato==='aperto'?C.red:C.grn}/><span style={{flex:1}}/><span style={{fontSize:10,color:C.dk}}>{fAgo(b.aperto_il)}</span></div>
<div style={{fontSize:14,fontWeight:800}}>{b.descrizione||b.causa}</div>
{wr&&<div style={{fontSize:12,color:C.dk,marginTop:4}}>WO: <span style={{fontFamily:FM,color:C.tl}}>{wr.codice}</span> — {wr.articolo?.slice(0,40)}</div>}
{b.stato==='aperto'&&<div style={{marginTop:10}}><Btn onClick={()=>{const a=prompt('Azione:');P.risolviBlocco(b.id,a||'')}} bg={C.grn} style={{padding:'10px 20px',fontSize:13}}>{IC.check} Risolvi</Btn></div>}
{b.stato==='risolto'&&b.azione_risolutiva&&<div style={{marginTop:6,fontSize:11,color:C.grn}}>Risolto: {b.azione_risolutiva}</div>}
</div>})}</div></Pg>;

// ═══ MANUTENZIONI ═══
if(tab==='man')return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<SH icon={IC.wrench} title="Manutenzioni" count={P.manutenzioni.length} right={<Sm onClick={()=>{const t=prompt('Tipo (programmata/correttiva):','programmata');const d=prompt('Descrizione:');if(!d)return;
const rt=prompt('Risorsa (macchina/attrezzo/mezzo):','macchina');const ls=rt==='macchina'?P.macchine:rt==='attrezzo'?P.attrezzi:P.mezzi;
const rn=prompt('Nome ('+ls.map(l=>l.nome).join('/')+'):');const ri=ls.find(l=>l.nome===rn)?.id;if(!ri)return P.showToast('Non trovata','error');
P.createManutenzione(rt,ri,t||'',d,prompt('Data (YYYY-MM-DD):')||'')}} color={C.tl}>{IC.plus} Pianifica</Sm>}/>
{P.manutenzioni.map(m=>{const sc=m.stato==='pianificata'&&m.data_prevista&&new Date(m.data_prevista)<new Date();
return<div key={m.id} style={{padding:'14px 18px',marginBottom:6,borderRadius:14,border:'2px solid '+(sc?C.red:m.stato==='completata'?C.grn+'50':C.bdr),background:C.wh,opacity:m.stato==='completata'?.5:1}}>
<div style={{display:'flex',alignItems:'center',gap:10}}><Bg text={m.tipo} color={m.tipo==='correttiva'?C.red:C.blu} big/><Bg text={m.risorsa_tipo} color={C.vio}/>
<span style={{flex:1,fontSize:14,fontWeight:800}}>{m.descrizione}</span><Bg text={m.stato} color={m.stato==='completata'?C.grn:sc?C.red:C.amb}/>
{m.data_prevista&&<span style={{fontFamily:FM,fontSize:12,color:sc?C.red:C.dk}}>{fD(m.data_prevista)}</span>}
{m.stato==='pianificata'&&<Sm onClick={()=>{const chi=prompt('Eseguita da:');P.completaManutenzione(m.id,chi||'')}} color={C.grn}>{IC.check}</Sm>}</div></div>})}</div></Pg>;

// ═══ EVENTI ═══
if(tab==='log')return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<SH icon={IC.activity} title="Event Log" count={P.events.length}/>
{P.events.map(e=>{const wr=P.wo.find(w=>w.id===e.work_order_id);return<div key={e.id} style={{padding:'8px 14px',borderBottom:'1px solid '+C.bdr,display:'flex',alignItems:'center',gap:8,fontSize:12}}>
<span style={{fontFamily:FM,fontSize:10,color:C.dk,minWidth:100}}>{fH(e.created_at)} {fD(e.created_at)}</span>
<Bg text={e.tipo} color={e.tipo?.includes('block')||e.tipo?.includes('alarm')?C.red:e.tipo?.includes('complete')?C.grn:e.tipo?.includes('pause')?C.amb:C.tl}/>
{wr&&<span style={{fontFamily:FM,fontWeight:700,color:C.tl}}>{wr.codice}</span>}<span style={{flex:1,color:C.ink}}>{e.operatore}</span></div>})}</div></Pg>;

// ═══ CONFIG ═══
if(tab==='cfg')return<Pg><div style={{flex:1,overflow:'auto',padding:24}}>
<SH icon={IC.grid} title="Configurazione"/>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
<div style={{padding:20,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,boxShadow:'0 4px 0 '+C.bdr}}>
<div style={{fontSize:16,fontWeight:900,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>Reparti <Sm onClick={()=>{const n=prompt('Nome:');if(n)P.createReparto(n,prompt('Colore:','#28A0A0')||'')}} color={C.tl}>{IC.plus}</Sm></div>
{P.reparti.map(r=><div key={r.id} style={{padding:'10px 14px',marginBottom:4,borderRadius:10,border:'1px solid '+C.bdr,display:'flex',alignItems:'center',gap:8}}>
<div style={{width:16,height:16,borderRadius:4,background:r.colore||C.tl}}/><span style={{fontSize:14,fontWeight:700,flex:1}}>{r.nome}</span><span style={{fontSize:11,fontFamily:FM,color:C.dk}}>{r.capacita_ore_giorno}h/gg</span></div>)}</div>
<div style={{padding:20,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,boxShadow:'0 4px 0 '+C.bdr}}>
<div style={{fontSize:16,fontWeight:900,marginBottom:12}}>Risorse</div>
{[['Macchine',P.macchine.length],['Attrezzi',P.attrezzi.length],['Mezzi',P.mezzi.length],['Reparti',P.reparti.length],['Operatori',P.operatori.length],['Routing',P.routing.length],['Work Orders',P.wo.length],['Skills',P.skills.length],['Qualita',P.quality.length]].map(([l,v],i)=>
<div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:14,padding:'6px 0',borderBottom:'1px solid '+C.bdr}}><span>{l}</span><span style={{fontFamily:FM,fontWeight:900}}>{v}</span></div>)}</div>
</div></div></Pg>;

return<Pg><div style={{padding:24}}>Sezione: {tab}</div></Pg>;
}
