// @ts-nocheck
'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO SIGNAL v3 — Conversational Ops Engine (S27)
// DB: signal_conversations, signal_messages, signal_promises,
//     signal_knowledge, signal_entity_links, signal_rules
// REAL: Message→Workflow (crea commesse/task/eventi/problemi),
//       Promise Tracker, Knowledge Memory, Entity auto-link,
//       Cartella cliente, Unified Inbox
// ═══════════════════════════════════════════════════════════
import React,{useState,useEffect,useMemo,useCallback,useRef} from 'react';
import {createClient} from '@supabase/supabase-js';
const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const C={tl:'#28A0A0',dk:'#156060',ink:'#0D1F1F',bg:'#EEF8F8',bdr:'#C8E4E4',wh:'#FFFFFF',red:'#DC4444',grn:'#1A9E73',amb:'#D08008',blu:'#3B7FE0',vio:'#7C3AED',pin:'#EC4899'};
const FF="'Inter',system-ui,sans-serif",FM="'JetBrains Mono',monospace";
const ico=(d:any,s=18)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const IC={back:ico(<path d="M19 12H5M12 19l-7-7 7-7"/>),plus:ico(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
check:ico(<polyline points="20 6 9 17 4 12"/>),send:ico(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>),
search:ico(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>),
mail:ico(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></>),
wa:ico(<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>),
tg:ico(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>),
chat:ico(<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>),
alert:ico(<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>),
clock:ico(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
user:ico(<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
file:ico(<><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></>),
bell:ico(<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>),
link:ico(<><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>),
zap:ico(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>),
flag:ico(<><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>),
star:ico(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>),
phone:ico(<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>),
mic:ico(<><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></>),
task:ico(<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>),
brain:ico(<><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="22" x2="15" y2="22"/></>),
folder:ico(<><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></>),
cal:ico(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
tool:ico(<><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>),
x:ico(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
};

const CANALI=[{id:'email',l:'Email',c:C.blu,i:IC.mail},{id:'whatsapp',l:'WhatsApp',c:'#25D366',i:IC.wa},{id:'telegram',l:'Telegram',c:'#0088CC',i:IC.tg},
{id:'interno',l:'Interno',c:C.tl,i:IC.chat},{id:'sistema',l:'Sistema',c:C.amb,i:IC.bell},{id:'telefono',l:'Telefono',c:C.vio,i:IC.phone},{id:'vocale',l:'Vocale',c:C.pin,i:IC.mic}];
const PRIORITA=[{id:'bassa',l:'Bassa',c:'#6B7280'},{id:'normale',l:'Normale',c:C.tl},{id:'alta',l:'Alta',c:C.amb},{id:'urgente',l:'Urgente',c:C.red},{id:'critica',l:'Critica',c:C.red}];
const STATI=[{id:'nuovo',l:'Nuovo',c:C.blu},{id:'aperto',l:'Aperto',c:C.tl},{id:'in_attesa_cliente',l:'Attesa cliente',c:C.amb},{id:'in_attesa_fornitore',l:'Attesa forn.',c:C.vio},{id:'risolto',l:'Risolto',c:C.grn},{id:'chiuso',l:'Chiuso',c:'#999'}];
function fD(d:any){if(!d)return'-';try{return new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'short'})}catch{return d}}
function fH(d:any){if(!d)return'';try{return new Date(d).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}catch{return''}}
function fAgo(d:any){if(!d)return'';const m=Math.floor((Date.now()-new Date(d).getTime())/60000);if(m<1)return'ora';if(m<60)return m+'min';const h=Math.floor(m/60);if(h<24)return h+'h';return Math.floor(h/24)+'gg'}
function stC(id:string,arr:any[]){return arr.find(s=>s.id===id)||arr[0]}
function cnI(id:string){return CANALI.find(c=>c.id===id)||CANALI[3]}

// ── Entity auto-detect from text ──
const ENTITY_PATTERNS=[
{re:/\b(S-\d{4})\b/g,tipo:'commessa'},
{re:/\b(CM-\d{4,}(?:-\d+)?)\b/gi,tipo:'commessa'},
{re:/\b(ORD-\d{4,})\b/gi,tipo:'ordine'},
{re:/\b(PREV-\d{4,})\b/gi,tipo:'preventivo'},
{re:/\b(MONT-\d{4,})\b/gi,tipo:'montaggio'},
{re:/\b(FT-\d{4,})\b/gi,tipo:'fattura'},
];
function detectEntities(text:string):{code:string,tipo:string}[]{
if(!text)return[];
const found:any[]=[];
for(const p of ENTITY_PATTERNS){p.re.lastIndex=0;let m;while((m=p.re.exec(text))!==null){found.push({code:m[1].toUpperCase(),tipo:p.tipo})}}
return found;
}

// ── Promise auto-detect from text ──
const PROMISE_PATTERNS=[
/ti richiamo/i,/ti mando/i,/te lo invio/i,/montiamo\s+\w+/i,/consegniamo\s+\w+/i,
/entro\s+(luned|marted|mercoled|gioved|venerd|sabato|domenica)/i,
/la settimana prossima/i,/domani\s+(ti|vi|le)/i,/entro\s+\d+\s+giorni/i,
/vi confermo/i,/vi faccio sapere/i,/passo\s+(luned|marted|mercoled|gioved|venerd)/i,
];
function detectPromises(text:string):boolean{return PROMISE_PATTERNS.some(p=>p.test(text))}

function BigBtn({children,onClick,bg,color,disabled,style:s}:{children:any,onClick?:any,bg?:string,color?:string,disabled?:boolean,style?:any}){return<button onClick={onClick} disabled={disabled} style={{padding:'14px 28px',borderRadius:14,border:'2px solid '+(bg||C.tl),background:bg||C.tl,color:color||C.wh,fontSize:15,fontWeight:900,cursor:disabled?'default':'pointer',fontFamily:FF,display:'inline-flex',alignItems:'center',gap:10,boxShadow:'0 4px 0 0 '+C.dk,opacity:disabled?.4:1,...(s||{})}}>{children}</button>}
function SmBtn({children,onClick,color,bg}:{children:any,onClick?:any,color?:string,bg?:string}){return<button onClick={onClick} style={{padding:'8px 16px',borderRadius:10,border:'2px solid '+(color||C.bdr),background:bg||C.wh,color:color||C.ink,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FF,display:'inline-flex',alignItems:'center',gap:6,boxShadow:'0 3px 0 '+(color?color+'40':C.bdr)}}>{children}</button>}
function Badge({text,color,big}:{text:string,color:string,big?:boolean}){return<span style={{padding:big?'5px 14px':'3px 10px',borderRadius:big?8:5,fontSize:big?12:10,fontWeight:800,background:color+'18',color}}>{text}</span>}
function KpiCard({label,value,color,icon}:{label:string,value:number|string,color:string,icon?:any}){return<div style={{flex:1,padding:18,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,textAlign:'center',boxShadow:'0 4px 0 #A8CCCC',minWidth:110}}>
{icon&&<div style={{marginBottom:6,opacity:.5}}>{icon}</div>}<div style={{fontSize:28,fontWeight:900,fontFamily:FM,color}}>{value}</div>
<div style={{fontSize:9,fontWeight:800,color:C.dk,textTransform:'uppercase',letterSpacing:1,marginTop:4}}>{label}</div></div>}

// ── Toast notification ──
function Toast({msg,type,onDone}:{msg:string,type:string,onDone:()=>void}){
useEffect(()=>{const t=setTimeout(onDone,3500);return()=>clearTimeout(t)},[]);
return<div style={{position:'fixed',top:20,right:20,zIndex:99999,padding:'14px 24px',borderRadius:14,
background:type==='ok'?C.grn:type==='warn'?C.amb:C.red,color:C.wh,fontSize:14,fontWeight:800,fontFamily:FF,
boxShadow:'0 8px 30px rgba(0,0,0,.25)',display:'flex',alignItems:'center',gap:10,animation:'slideIn .3s ease'}}>
{type==='ok'?IC.check:type==='warn'?IC.alert:IC.x} {msg}</div>}

// ── Action Modal ──
function ActionModal({tipo,msg,conv,onClose,onConfirm}:{tipo:string,msg:any,conv:any,onClose:()=>void,onConfirm:(data:any)=>void}){
const[title,setTitle]=useState(msg?.testo?.slice(0,80)||'');
const[note,setNote]=useState('');
const[date,setDate]=useState(new Date().toISOString().split('T')[0]);
const[time,setTime]=useState('09:00');
const[priority,setPriority]=useState('media');
const[persona,setPersona]=useState('');
const labels:any={task:'Nuovo Task',appuntamento:'Nuovo Appuntamento',misure:'Sopralluogo Misure',commessa:'Nuova Commessa',
problema:'Segnala Problema',ordine:'Richiesta Ordine',preventivo:'Richiesta Preventivo'};
const colors:any={task:C.tl,appuntamento:C.blu,misure:C.vio,commessa:C.amb,problema:C.red,ordine:C.grn,preventivo:'#6366F1'};
const INP:any={width:'100%',padding:'12px 14px',border:'2px solid '+C.bdr,borderRadius:12,fontSize:14,fontFamily:FF,outline:'none',background:C.wh};
const LB:any={fontSize:10,fontWeight:800,color:C.dk,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:4,display:'block'};
return<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
<div style={{background:C.wh,borderRadius:20,width:520,maxHeight:'80vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
<div style={{padding:'20px 24px',borderBottom:'2px solid '+C.bdr,display:'flex',alignItems:'center',gap:12}}>
<div style={{width:44,height:44,borderRadius:12,background:colors[tipo]+'15',display:'flex',alignItems:'center',justifyContent:'center',color:colors[tipo]}}>{IC.task}</div>
<div style={{flex:1}}><div style={{fontSize:18,fontWeight:900,color:colors[tipo]}}>{labels[tipo]}</div>
<div style={{fontSize:11,color:C.dk}}>Da messaggio di {msg?.da_nome} {conv?.entity_code?'- '+conv.entity_code:''}</div></div>
<button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.dk}}>{IC.x}</button></div>
<div style={{padding:24,display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
<div style={{gridColumn:'1/3'}}><label style={LB}>{tipo==='commessa'?'Cliente':tipo==='problema'?'Problema':'Titolo'} *</label><input value={title} onChange={e=>setTitle(e.target.value)} style={INP}/></div>
{(tipo==='appuntamento'||tipo==='misure')&&<><div><label style={LB}>Data</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={INP}/></div>
<div><label style={LB}>Ora</label><input type="time" value={time} onChange={e=>setTime(e.target.value)} style={INP}/></div></>}
{(tipo==='task')&&<><div><label style={LB}>Scadenza</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={INP}/></div>
<div><label style={LB}>Priorita</label><select value={priority} onChange={e=>setPriority(e.target.value)} style={INP}><option value="bassa">Bassa</option><option value="media">Media</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div></>}
{(tipo==='commessa')&&<div><label style={LB}>Indirizzo</label><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Via..." style={INP}/></div>}
{(tipo==='problema')&&<div><label style={LB}>Gravita</label><select value={priority} onChange={e=>setPriority(e.target.value)} style={INP}><option value="bassa">Bassa</option><option value="media">Media</option><option value="alta">Alta</option><option value="critica">Critica</option></select></div>}
<div style={{gridColumn:'1/3'}}><label style={LB}>Assegna a</label><input value={persona} onChange={e=>setPersona(e.target.value)} placeholder="Nome operatore..." style={INP}/></div>
<div style={{gridColumn:'1/3'}}><label style={LB}>Note aggiuntive</label><textarea value={tipo==='commessa'?'':note} onChange={e=>setNote(e.target.value)} rows={2} style={{...INP,resize:'vertical'}}/></div>
</div>
<div style={{padding:'16px 24px',borderTop:'2px solid '+C.bdr,display:'flex',gap:10,justifyContent:'flex-end'}}>
<SmBtn onClick={onClose} color={C.dk}>Annulla</SmBtn>
<BigBtn onClick={()=>onConfirm({title,note,date,time,priority,persona})} bg={colors[tipo]} disabled={!title.trim()} style={{padding:'12px 24px'}}>{IC.check} Crea {tipo}</BigBtn>
</div></div></div>}

// ── Promise Modal ──
function PromiseModal({conv,onClose,onConfirm}:{conv:any,onClose:()=>void,onConfirm:(data:any)=>void}){
const[testo,setTesto]=useState('');const[chi,setChi]=useState(conv?.contatto_nome||'');
const[scadenza,setScadenza]=useState('');const[tipo,setTipo]=useState<'fatta'|'ricevuta'>('ricevuta');
const INP:any={width:'100%',padding:'12px 14px',border:'2px solid '+C.bdr,borderRadius:12,fontSize:14,fontFamily:FF,outline:'none',background:C.wh};
const LB:any={fontSize:10,fontWeight:800,color:C.dk,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:4,display:'block'};
return<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
<div style={{background:C.wh,borderRadius:20,width:480,boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
<div style={{padding:'20px 24px',borderBottom:'2px solid '+C.bdr,display:'flex',alignItems:'center',gap:12}}>
<div style={{width:44,height:44,borderRadius:12,background:C.amb+'15',display:'flex',alignItems:'center',justifyContent:'center',color:C.amb}}>{IC.flag}</div>
<div style={{flex:1}}><div style={{fontSize:18,fontWeight:900,color:C.amb}}>Nuova Promessa</div></div>
<button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.dk}}>{IC.x}</button></div>
<div style={{padding:24,display:'grid',gap:14}}>
<div style={{display:'flex',gap:8}}>{(['ricevuta','fatta'] as const).map(t=><button key={t} onClick={()=>setTipo(t)} style={{flex:1,padding:'12px',borderRadius:10,border:'2px solid '+(tipo===t?C.amb:C.bdr),background:tipo===t?C.amb+'15':C.wh,color:tipo===t?C.amb:C.dk,fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:FF}}>Promessa {t}</button>)}</div>
<div><label style={LB}>Cosa e stato promesso *</label><input value={testo} onChange={e=>setTesto(e.target.value)} placeholder="es. Montiamo venerdi..." style={INP}/></div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
<div><label style={LB}>Chi promette</label><input value={chi} onChange={e=>setChi(e.target.value)} style={INP}/></div>
<div><label style={LB}>Scadenza</label><input type="date" value={scadenza} onChange={e=>setScadenza(e.target.value)} style={INP}/></div></div></div>
<div style={{padding:'16px 24px',borderTop:'2px solid '+C.bdr,display:'flex',gap:10,justifyContent:'flex-end'}}>
<SmBtn onClick={onClose} color={C.dk}>Annulla</SmBtn>
<BigBtn onClick={()=>onConfirm({testo,chi,scadenza:scadenza||null,tipo})} bg={C.amb} disabled={!testo.trim()} style={{padding:'12px 24px'}}>{IC.flag} Salva promessa</BigBtn>
</div></div></div>}

// ── Knowledge Modal ──
function KnowledgeModal({conv,onClose,onConfirm}:{conv:any,onClose:()=>void,onConfirm:(data:any)=>void}){
const[testo,setTesto]=useState('');const[tipo,setTipo]=useState('decisione');
const tipi=['decisione','eccezione','preferenza','accordo','prezzo','tecnico','contatto'];
const INP:any={width:'100%',padding:'12px 14px',border:'2px solid '+C.bdr,borderRadius:12,fontSize:14,fontFamily:FF,outline:'none',background:C.wh};
const LB:any={fontSize:10,fontWeight:800,color:C.dk,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:4,display:'block'};
return<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
<div style={{background:C.wh,borderRadius:20,width:480,boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
<div style={{padding:'20px 24px',borderBottom:'2px solid '+C.bdr,display:'flex',alignItems:'center',gap:12}}>
<div style={{width:44,height:44,borderRadius:12,background:C.vio+'15',display:'flex',alignItems:'center',justifyContent:'center',color:C.vio}}>{IC.brain}</div>
<div style={{flex:1}}><div style={{fontSize:18,fontWeight:900,color:C.vio}}>Salva nella Memoria</div></div>
<button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.dk}}>{IC.x}</button></div>
<div style={{padding:24,display:'grid',gap:14}}>
<div><label style={LB}>Tipo</label><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{tipi.map(t=><button key={t} onClick={()=>setTipo(t)} style={{padding:'8px 14px',borderRadius:8,border:'2px solid '+(tipo===t?C.vio:C.bdr),background:tipo===t?C.vio+'15':C.wh,color:tipo===t?C.vio:C.dk,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FF,textTransform:'capitalize'}}>{t}</button>)}</div></div>
<div><label style={LB}>Informazione da ricordare *</label><textarea value={testo} onChange={e=>setTesto(e.target.value)} rows={3} placeholder="es. Cliente vuole colore RAL 7016 su tutti i telai..." style={{...INP,resize:'vertical'}}/></div>
</div>
<div style={{padding:'16px 24px',borderTop:'2px solid '+C.bdr,display:'flex',gap:10,justifyContent:'flex-end'}}>
<SmBtn onClick={onClose} color={C.dk}>Annulla</SmBtn>
<BigBtn onClick={()=>onConfirm({testo,tipo})} bg={C.vio} disabled={!testo.trim()} style={{padding:'12px 24px'}}>{IC.brain} Salva</BigBtn>
</div></div></div>}


// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function MastroSignal({onBack,initialEntity,initialContatto}:{onBack?:()=>void,initialEntity?:string|null,initialContatto?:string|null}){
const[convs,setConvs]=useState<any[]>([]);const[msgs,setMsgs]=useState<any[]>([]);const[promises,setPromises]=useState<any[]>([]);const[knowledge,setKnowledge]=useState<any[]>([]);
const[loading,setLoading]=useState(true);const[tab,setTab]=useState('control');const[sel,setSel]=useState<any>(null);const[selMsgs,setSelMsgs]=useState<any[]>([]);
const[filtro,setFiltro]=useState('');const[filtroCanale,setFiltroCanale]=useState('');const[searchQ,setSearchQ]=useState('');
const[replyText,setReplyText]=useState('');const[replyCanale,setReplyCanale]=useState('');
const[showNewConv,setShowNewConv]=useState(false);
const[toast,setToast]=useState<{msg:string,type:string}|null>(null);
const[actionModal,setActionModal]=useState<{tipo:string,msg:any}|null>(null);
const[promiseModal,setPromiseModal]=useState(false);
const[knowledgeModal,setKnowledgeModal]=useState(false);
const[entityView,setEntityView]=useState<string|null>(null);// for cartella cliente deep view
const msgEndRef=useRef<HTMLDivElement>(null);

const showToast=useCallback((msg:string,type='ok')=>{setToast({msg,type});setTimeout(()=>setToast(null),3500)},[]);

// Se aperto con initialEntity, filtra o apri nuova conversazione per quella entity
useEffect(()=>{if(!initialEntity||loading)return;
const existing=convs.find(c=>c.entity_code===initialEntity);
if(existing){setSel(existing);setTab('inbox');setReplyCanale(existing.canale_principale)}
else{setShowNewConv(true);setTab('inbox');
setTimeout(()=>{const el=document.getElementById('nc_entity') as HTMLInputElement;if(el)el.value=initialEntity;
const el2=document.getElementById('nc_nome') as HTMLInputElement;if(el2&&initialContatto)el2.value=initialContatto},100)}
},[initialEntity,loading]);

useEffect(()=>{(async()=>{const[r1,r2,r3,r4]=await Promise.all([
sb.from('signal_conversations').select('*').order('ultimo_msg_time',{ascending:false}).limit(200),
sb.from('signal_promises').select('*').order('created_at',{ascending:false}).limit(100),
sb.from('signal_knowledge').select('*').order('created_at',{ascending:false}).limit(100),
sb.from('signal_messages').select('*').order('created_at',{ascending:false}).limit(1000)]);
setConvs(r1.data||[]);setPromises(r2.data||[]);setKnowledge(r3.data||[]);setMsgs(r4.data||[]);setLoading(false)})()},[]);

// Load msgs for selected conversation + auto-scroll
useEffect(()=>{if(!sel)return;const cm=msgs.filter(m=>m.conversation_id===sel.id).sort((a:any,b:any)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime());
if(cm.length){setSelMsgs(cm)}else{(async()=>{const{data}=await sb.from('signal_messages').select('*').eq('conversation_id',sel.id).order('created_at');setSelMsgs(data||[])})()}
},[sel,msgs]);
useEffect(()=>{msgEndRef.current?.scrollIntoView({behavior:'smooth'})},[selMsgs]);

const kpi=useMemo(()=>({nl:convs.filter(t=>t.non_letto).length,dr:convs.filter(t=>['aperto','nuovo'].includes(t.stato)&&t.non_letto).length,
urg:convs.filter(t=>t.priorita==='urgente'||t.priorita==='critica').length,att:convs.filter(t=>(t.stato||'').startsWith('in_attesa')).length,
sys:convs.filter(t=>t.canale_principale==='sistema').length,promScad:promises.filter(p=>p.stato==='attiva'&&p.scadenza&&new Date(p.scadenza)<new Date()).length,
promAtt:promises.filter(p=>p.stato==='attiva').length,kbTot:knowledge.length}),[convs,promises,knowledge]);

const filtrati=convs.filter(t=>{if(filtro==='non_letti'&&!t.non_letto)return false;if(filtro==='urgenti'&&t.priorita!=='urgente'&&t.priorita!=='critica')return false;
if(filtroCanale&&t.canale_principale!==filtroCanale)return false;
if(searchQ){const q=searchQ.toLowerCase();return(t.contatto_nome||'').toLowerCase().includes(q)||(t.ultimo_msg||'').toLowerCase().includes(q)||(t.entity_code||'').toLowerCase().includes(q)}
return true}).sort((a:any,b:any)=>new Date(b.ultimo_msg_time||b.created_at).getTime()-new Date(a.ultimo_msg_time||a.created_at).getTime());

// ══════════════════════════════════════════════════════════════
// CRUD — ALL REAL ON SUPABASE
// ══════════════════════════════════════════════════════════════
const sendReply=async()=>{if(!replyText.trim()||!sel)return;
// Auto-detect entities in outgoing message
const detected=detectEntities(replyText);
const m={conversation_id:sel.id,da_nome:'Tu',da_ruolo:'operatore',da_canale:replyCanale||sel.canale_principale,testo:replyText,direction:'outbound',letto:true};
try{const{data:nm,error}=await sb.from('signal_messages').insert(m).select().single();if(error)throw error;
setSelMsgs(p=>[...p,nm]);setMsgs(p=>[nm,...p]);
// Auto-link detected entities to conversation
if(detected.length>0&&!sel.entity_code){
const ent=detected[0];
await sb.from('signal_conversations').update({entity_code:ent.code,entity_tipo:ent.tipo}).eq('id',sel.id);
setSel((p:any)=>({...p,entity_code:ent.code,entity_tipo:ent.tipo}));
setConvs(p=>p.map(c=>c.id===sel.id?{...c,entity_code:ent.code,entity_tipo:ent.tipo}:c));
// Save entity link
await sb.from('signal_entity_links').insert({conversation_id:sel.id,entity_code:ent.code,entity_tipo:ent.tipo,linked_by:'auto',link_source:'messaggio'}).catch(()=>{});
showToast('Entity '+ent.code+' collegata automaticamente');
}
await sb.from('signal_conversations').update({ultimo_msg:replyText,ultimo_msg_time:new Date().toISOString(),non_letto:false,stato:'aperto',n_messaggi:(sel.n_messaggi||0)+1}).eq('id',sel.id);
setConvs(p=>p.map(c=>c.id===sel.id?{...c,ultimo_msg:replyText,ultimo_msg_time:new Date().toISOString(),non_letto:false}:c));
setSel((p:any)=>({...p,ultimo_msg:replyText,non_letto:false}));setReplyText('')}catch(e:any){showToast('Errore: '+e.message,'error')}};

const createConv=async()=>{const nome=(document.getElementById('nc_nome') as HTMLInputElement)?.value;if(!nome)return showToast('Nome obbligatorio','error');
const canale=(document.getElementById('nc_canale') as HTMLSelectElement)?.value||'interno';
const entity=(document.getElementById('nc_entity') as HTMLInputElement)?.value||'';
const msg=(document.getElementById('nc_msg') as HTMLInputElement)?.value||'';
const email=(document.getElementById('nc_email') as HTMLInputElement)?.value||'';
const tel=(document.getElementById('nc_tel') as HTMLInputElement)?.value||'';
const d={contatto_nome:nome,contatto_azienda:(document.getElementById('nc_azienda') as HTMLInputElement)?.value||'',
contatto_email:email,contatto_telefono:tel,
canale_principale:canale,priorita:'normale',stato:'aperto',
entity_code:entity,entity_tipo:entity?detectEntities(entity)[0]?.tipo||'altro':'',
ultimo_msg:msg,ultimo_msg_time:new Date().toISOString(),non_letto:false,n_messaggi:msg?1:0};
try{const{data:nc,error}=await sb.from('signal_conversations').insert(d).select().single();if(error)throw error;
if(msg&&nc?.id){await sb.from('signal_messages').insert({conversation_id:nc.id,da_nome:'Tu',da_ruolo:'operatore',da_canale:canale,testo:msg,direction:'outbound'}).select()}
// Auto entity link
if(entity){await sb.from('signal_entity_links').insert({conversation_id:nc.id,entity_code:entity.toUpperCase(),entity_tipo:d.entity_tipo,linked_by:'manuale',link_source:'creazione'}).catch(()=>{})}
setConvs(p=>[nc,...p]);setShowNewConv(false);setSel(nc);setTab('inbox');showToast('Conversazione creata')}catch(e:any){showToast('Errore: '+e.message,'error')}};

// ══════════════════════════════════════════════════════════════
// MESSAGE → WORKFLOW — REAL SUPABASE WRITES
// ══════════════════════════════════════════════════════════════
const msgToAction=async(data:any,tipo:string)=>{
const txt=data.title||'';const entity=sel?.entity_code||'';const contatto=sel?.contatto_nome||'';
const now=new Date().toISOString();
try{
if(tipo==='task'){
// Write to signal_knowledge as action log + create ERP-compatible task via localStorage sync
const taskObj={id:Date.now(),text:txt,meta:data.note||'',time:data.time||'',priority:data.priority||'media',
cm:entity,date:data.date||new Date().toISOString().split('T')[0],persona:data.persona||'',done:false,allegati:[],
fonte:'signal',fonte_conv_id:sel?.id};
// Persist to localStorage for ERP sync
const existing=JSON.parse(localStorage.getItem('mastro:tasks')||'[]');
existing.unshift(taskObj);
localStorage.setItem('mastro:tasks',JSON.stringify(existing));
// Also log in signal
await sb.from('signal_knowledge').insert({conversation_id:sel?.id,tipo:'azione_task',testo:'Task creato: '+txt+(data.persona?' - Assegnato a '+data.persona:''),entity_code:entity,attore:'Sistema',data_evento:now});
showToast('Task "'+txt.slice(0,40)+'" creato');
}
else if(tipo==='appuntamento'){
const evObj={id:Date.now(),text:txt,time:data.time||'09:00',tipo:'sopralluogo',cm:entity,persona:data.persona||contatto,
date:data.date||new Date().toISOString().split('T')[0],addr:'',color:'#3B82F6',fonte:'signal',fonte_conv_id:sel?.id};
const existing=JSON.parse(localStorage.getItem('mastro:events')||'[]');
existing.unshift(evObj);
localStorage.setItem('mastro:events',JSON.stringify(existing));
await sb.from('signal_knowledge').insert({conversation_id:sel?.id,tipo:'azione_appuntamento',testo:'Appuntamento: '+txt+' il '+data.date,entity_code:entity,attore:'Sistema',data_evento:now});
showToast('Appuntamento creato per il '+data.date);
}
else if(tipo==='misure'){
const evObj={id:Date.now(),text:'Sopralluogo misure - '+txt,time:data.time||'09:00',tipo:'sopralluogo',cm:entity,
persona:data.persona||contatto,date:data.date||new Date().toISOString().split('T')[0],addr:'',color:'#7C3AED',fonte:'signal'};
const existing=JSON.parse(localStorage.getItem('mastro:events')||'[]');
existing.unshift(evObj);
localStorage.setItem('mastro:events',JSON.stringify(existing));
await sb.from('signal_knowledge').insert({conversation_id:sel?.id,tipo:'azione_misure',testo:'Sopralluogo misure: '+txt,entity_code:entity,attore:'Sistema',data_evento:now});
showToast('Sopralluogo misure programmato');
}
else if(tipo==='commessa'){
const code='S-'+String(Math.floor(Math.random()*9000+1000));
const cmObj={id:Date.now(),code,cliente:contatto||txt,cognome:'',indirizzo:data.note||'',telefono:sel?.contatto_telefono||'',
email:sel?.contatto_email||'',fase:'sopralluogo',rilievi:[],sistema:'',tipo:'nuova',note:'Creata da SIGNAL - '+txt,allegati:[],
creato:new Date().toLocaleDateString('it-IT',{day:'numeric',month:'short'}),aggiornato:new Date().toLocaleDateString('it-IT',{day:'numeric',month:'short'}),
log:[{chi:'SIGNAL',cosa:'commessa creata da conversazione',quando:'Adesso',color:C.tl}],fonte:'signal',fonte_conv_id:sel?.id};
const existing=JSON.parse(localStorage.getItem('mastro:cantieri')||'[]');
existing.unshift(cmObj);
localStorage.setItem('mastro:cantieri',JSON.stringify(existing));
// Auto-link conversation to new commessa
if(sel?.id){
await sb.from('signal_conversations').update({entity_code:code,entity_tipo:'commessa'}).eq('id',sel.id);
setSel((p:any)=>({...p,entity_code:code,entity_tipo:'commessa'}));
setConvs(p=>p.map(c=>c.id===sel.id?{...c,entity_code:code}:c));
await sb.from('signal_entity_links').insert({conversation_id:sel.id,entity_code:code,entity_tipo:'commessa',linked_by:'auto',link_source:'azione_commessa'}).catch(()=>{});
}
await sb.from('signal_knowledge').insert({conversation_id:sel?.id,tipo:'azione_commessa',testo:'Commessa '+code+' creata per '+contatto,entity_code:code,attore:'Sistema',data_evento:now});
showToast('Commessa '+code+' creata');
}
else if(tipo==='problema'){
const probObj={id:Date.now(),text:txt,cm:entity,priority:data.priority||'media',persona:data.persona||'',
creato:new Date().toLocaleDateString('it-IT',{day:'numeric',month:'short'}),stato:'aperto',fonte:'signal',fonte_conv_id:sel?.id};
const existing=JSON.parse(localStorage.getItem('mastro:problemi')||'[]');
existing.unshift(probObj);
localStorage.setItem('mastro:problemi',JSON.stringify(existing));
// Also flag conversation as high priority if critical
if(data.priority==='critica'||data.priority==='alta'){
await sb.from('signal_conversations').update({priorita:data.priority==='critica'?'critica':'alta'}).eq('id',sel?.id);
setConvs(p=>p.map(c=>c.id===sel?.id?{...c,priorita:data.priority==='critica'?'critica':'alta'}:c));
}
await sb.from('signal_knowledge').insert({conversation_id:sel?.id,tipo:'azione_problema',testo:'Problema: '+txt+(entity?' su '+entity:''),entity_code:entity,attore:'Sistema',data_evento:now});
showToast('Problema segnalato','warn');
}
else if(tipo==='ordine'){
await sb.from('signal_knowledge').insert({conversation_id:sel?.id,tipo:'azione_ordine',testo:'Richiesta ordine: '+txt+(entity?' per '+entity:''),entity_code:entity,attore:'Sistema',data_evento:now});
showToast('Richiesta ordine registrata');
}
else if(tipo==='preventivo'){
await sb.from('signal_knowledge').insert({conversation_id:sel?.id,tipo:'azione_preventivo',testo:'Preventivo richiesto: '+txt+' per '+contatto,entity_code:entity,attore:'Sistema',data_evento:now});
showToast('Richiesta preventivo registrata');
}
setActionModal(null);
// Refresh knowledge
const{data:newK}=await sb.from('signal_knowledge').select('*').order('created_at',{ascending:false}).limit(100);
if(newK)setKnowledge(newK);
}catch(e:any){showToast('Errore: '+e.message,'error')}};

// ── Promises CRUD ──
const addPromise=async(data:any)=>{if(!sel||!data.testo)return;
try{const{data:np,error}=await sb.from('signal_promises').insert({conversation_id:sel.id,testo:data.testo,chi_promette:data.chi,
scadenza:data.scadenza||null,stato:'attiva',entity_code:sel.entity_code,tipo_promessa:data.tipo||'ricevuta'}).select().single();
if(error)throw error;setPromises(p=>[np,...p]);setPromiseModal(false);showToast('Promessa salvata')}catch(e:any){showToast('Errore: '+e.message,'error')}};

const completePromise=async(pId:string)=>{
try{await sb.from('signal_promises').update({stato:'completata',completata_il:new Date().toISOString()}).eq('id',pId);
setPromises(p=>p.map(x=>x.id===pId?{...x,stato:'completata'}:x));showToast('Promessa completata')}catch(e:any){showToast('Errore','error')}};

// ── Knowledge CRUD ──
const addKnowledge=async(data:any)=>{if(!sel||!data.testo)return;
try{const{data:nk,error}=await sb.from('signal_knowledge').insert({conversation_id:sel.id,tipo:data.tipo,testo:data.testo,
entity_code:sel.entity_code,attore:sel.contatto_nome,data_evento:new Date().toISOString()}).select().single();
if(error)throw error;setKnowledge(p=>[nk,...p]);setKnowledgeModal(false);showToast('Salvato nella memoria')}catch(e:any){showToast('Errore: '+e.message,'error')}};

const markRead=async(conv:any)=>{if(!conv.non_letto)return;await sb.from('signal_conversations').update({non_letto:false}).eq('id',conv.id);
setConvs(p=>p.map(c=>c.id===conv.id?{...c,non_letto:false}:c))};

// ── Auto-link entity on incoming messages with codes ──
const autoLinkEntity=useCallback(async(conv:any,text:string)=>{
if(conv.entity_code)return;// already linked
const detected=detectEntities(text);
if(detected.length===0)return;
const ent=detected[0];
await sb.from('signal_conversations').update({entity_code:ent.code,entity_tipo:ent.tipo}).eq('id',conv.id);
setConvs(p=>p.map(c=>c.id===conv.id?{...c,entity_code:ent.code,entity_tipo:ent.tipo}:c));
if(sel?.id===conv.id)setSel((p:any)=>({...p,entity_code:ent.code,entity_tipo:ent.tipo}));
await sb.from('signal_entity_links').insert({conversation_id:conv.id,entity_code:ent.code,entity_tipo:ent.tipo,linked_by:'auto',link_source:'messaggio_inbound'}).catch(()=>{});
},[sel]);

if(loading)return<div style={{padding:60,textAlign:'center',color:C.dk,fontFamily:FF,fontSize:16}}>Caricamento SIGNAL...</div>;

// ═══ LAYOUT ═══
const LB:any={fontSize:10,fontWeight:800,color:C.dk,textTransform:'uppercase',letterSpacing:'.8px',marginBottom:4,display:'block'};
const INP:any={width:'100%',padding:'12px 14px',border:'2px solid '+C.bdr,borderRadius:12,fontSize:14,fontFamily:FF,outline:'none',background:C.wh};
const hdr=<div style={{flexShrink:0}}>
<div style={{padding:'14px 24px',background:C.ink,color:C.wh,display:'flex',alignItems:'center',gap:14}}>
{onBack&&<button onClick={onBack} style={{background:'none',border:'none',color:C.tl,cursor:'pointer'}}>{IC.back}</button>}
{IC.zap}<div style={{flex:1}}><div style={{fontSize:22,fontWeight:900,letterSpacing:'-.5px'}}>MASTRO SIGNAL</div>
<div style={{fontSize:10,color:'rgba(255,255,255,.35)',letterSpacing:'.5px'}}>CONVERSATIONAL OPS ENGINE</div></div>
{kpi.nl>0&&<div style={{padding:'8px 16px',borderRadius:12,background:C.red+'25',color:C.red,fontSize:14,fontWeight:900}}>{kpi.nl} non letti</div>}
{kpi.promScad>0&&<div style={{padding:'8px 16px',borderRadius:12,background:C.amb+'25',color:C.amb,fontSize:14,fontWeight:900}}>{kpi.promScad} promesse scadute</div>}
<BigBtn onClick={()=>setShowNewConv(true)}>{IC.plus} Nuova</BigBtn>
</div>
<div style={{display:'flex',gap:0,background:C.bg,borderBottom:'2px solid '+C.bdr,padding:'0 20px',overflowX:'auto'}}>
{[{id:'control',l:'Control Center',i:IC.zap},{id:'inbox',l:'Inbox',i:IC.mail,n:kpi.nl},{id:'promises',l:'Promesse',i:IC.flag,n:kpi.promScad},
{id:'knowledge',l:'Memoria',i:IC.brain,n:kpi.kbTot},{id:'entity',l:'Per Entity',i:IC.link},{id:'cartella',l:'Cartella Cliente',i:IC.folder},{id:'regole',l:'Regole',i:IC.star}].map(t=>
<button key={t.id} onClick={()=>{setTab(t.id);if(t.id!=='inbox')setSel(null);setEntityView(null)}} style={{padding:'16px 24px',border:'none',borderBottom:tab===t.id?'5px solid '+C.tl:'5px solid transparent',
background:tab===t.id?C.tl+'10':'transparent',color:tab===t.id?C.tl:C.dk,fontSize:15,fontWeight:tab===t.id?900:700,cursor:'pointer',fontFamily:FF,
display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap',borderRadius:'12px 12px 0 0'}}>
{t.i} {t.l}{t.n!=null&&t.n>0&&<span style={{width:24,height:24,borderRadius:'50%',background:t.id==='knowledge'?C.vio:C.red,color:C.wh,fontSize:12,fontWeight:900,display:'inline-flex',alignItems:'center',justifyContent:'center',marginLeft:4}}>{t.n}</span>}</button>)}
</div></div>;
const Page=({children}:{children:any})=><div style={{fontFamily:FF,height:'100%',display:'flex',flexDirection:'column',background:'#F8FAFA'}}>{hdr}{children}
{toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
{actionModal&&<ActionModal tipo={actionModal.tipo} msg={actionModal.msg} conv={sel} onClose={()=>setActionModal(null)} onConfirm={d=>msgToAction(d,actionModal.tipo)}/>}
{promiseModal&&sel&&<PromiseModal conv={sel} onClose={()=>setPromiseModal(false)} onConfirm={addPromise}/>}
{knowledgeModal&&sel&&<KnowledgeModal conv={sel} onClose={()=>setKnowledgeModal(false)} onConfirm={addKnowledge}/>}
</div>;

// ═══ NUOVA CONVERSAZIONE ═══
if(showNewConv)return<Page>
<div style={{padding:'14px 24px',display:'flex',alignItems:'center',gap:10,borderBottom:'2px solid '+C.bdr,flexShrink:0}}>
<SmBtn onClick={()=>setShowNewConv(false)}>{IC.back} Annulla</SmBtn><span style={{fontSize:18,fontWeight:900,flex:1}}>Nuova Conversazione</span></div>
<div style={{flex:1,overflow:'auto',padding:24,maxWidth:600}}>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:16}}>
<div><label style={LB}>Nome contatto *</label><input id="nc_nome" style={INP}/></div>
<div><label style={LB}>Azienda</label><input id="nc_azienda" style={INP}/></div>
<div><label style={LB}>Email</label><input id="nc_email" type="email" style={INP}/></div>
<div><label style={LB}>Telefono</label><input id="nc_tel" style={INP}/></div>
<div><label style={LB}>Canale</label><select id="nc_canale" style={INP}>{CANALI.map(c=><option key={c.id} value={c.id}>{c.l}</option>)}</select></div>
<div><label style={LB}>Entity collegata</label><input id="nc_entity" placeholder="CM-2026-XXX / S-0001" style={INP}/></div>
<div style={{gridColumn:'1/3'}}><label style={LB}>Primo messaggio</label><input id="nc_msg" placeholder="Scrivi..." style={INP}/></div></div>
<BigBtn onClick={createConv} style={{width:'100%',justifyContent:'center',padding:'16px 24px',fontSize:16}}>{IC.check} Crea conversazione</BigBtn></div></Page>;

// ═══ CONTROL CENTER ═══
if(tab==='control')return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{display:'flex',gap:14,marginBottom:24,flexWrap:'wrap'}}>
<KpiCard label="Non letti" value={kpi.nl} color={C.red} icon={IC.mail}/><KpiCard label="Da rispondere" value={kpi.dr} color={C.amb} icon={IC.chat}/>
<KpiCard label="Urgenti" value={kpi.urg} color={C.red} icon={IC.alert}/><KpiCard label="In attesa" value={kpi.att} color={C.vio} icon={IC.clock}/>
<KpiCard label="Promesse scadute" value={kpi.promScad} color={C.amb} icon={IC.flag}/><KpiCard label="Promesse attive" value={kpi.promAtt} color={C.tl} icon={IC.flag}/>
</div>
{/* Promesse scadute alert */}
{kpi.promScad>0&&<div style={{padding:18,borderRadius:14,background:C.red+'10',border:'2px solid '+C.red+'30',marginBottom:20}}>
<div style={{fontSize:14,fontWeight:900,color:C.red,marginBottom:10}}>{IC.alert} {kpi.promScad} promesse scadute</div>
{promises.filter(p=>p.stato==='attiva'&&p.scadenza&&new Date(p.scadenza)<new Date()).map(p=>
<div key={p.id} style={{padding:'10px 14px',marginBottom:4,borderRadius:10,background:C.wh,border:'1.5px solid '+C.red+'40',display:'flex',alignItems:'center',gap:10,fontSize:13}}>
<span style={{flex:1,fontWeight:700}}>{p.testo}</span><span style={{fontFamily:FM,fontSize:11,color:C.red}}>{fD(p.scadenza)}</span>
<SmBtn onClick={()=>completePromise(p.id)} color={C.grn}>{IC.check}</SmBtn></div>)}</div>}
<div style={{fontSize:16,fontWeight:900,marginBottom:12}}>{IC.alert} Thread da gestire</div>
{convs.filter(t=>t.non_letto||t.priorita==='urgente'||t.priorita==='critica').slice(0,8).map(t=>{const cn=cnI(t.canale_principale);const pr=stC(t.priorita,PRIORITA);
return<div key={t.id} onClick={()=>{setSel(t);markRead(t);setTab('inbox');setReplyCanale(t.canale_principale)}} style={{padding:'16px 20px',marginBottom:8,borderRadius:14,
border:'2px solid '+(t.priorita==='urgente'||t.priorita==='critica'?C.red+'50':C.bdr),background:C.wh,cursor:'pointer',display:'flex',alignItems:'center',gap:14,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{width:48,height:48,borderRadius:14,background:cn.c+'15',display:'flex',alignItems:'center',justifyContent:'center',color:cn.c,flexShrink:0,border:'2px solid '+cn.c+'30'}}>{cn.i}</div>
<div style={{flex:1,minWidth:0}}>
<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{fontSize:15,fontWeight:900}}>{t.contatto_nome}</span>
<Badge text={pr.l} color={pr.c} big/>{t.non_letto&&<div style={{width:10,height:10,borderRadius:'50%',background:C.red}}/>}</div>
<div style={{fontSize:13,color:C.ink,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.ultimo_msg||'Nessun messaggio'}</div>
<div style={{fontSize:10,color:C.dk,marginTop:2}}>{t.entity_code&&<span style={{fontFamily:FM,color:C.tl,fontWeight:700}}>{t.entity_code} </span>}{fAgo(t.ultimo_msg_time)} fa</div></div>
<Badge text={stC(t.stato,STATI).l} color={stC(t.stato,STATI).c} big/></div>})}
{convs.filter(t=>t.non_letto||t.priorita==='urgente').length===0&&<div style={{padding:20,textAlign:'center',color:C.dk}}>Nessun thread urgente</div>}
<div style={{fontSize:16,fontWeight:900,marginTop:24,marginBottom:12}}>Canali attivi</div>
<div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{CANALI.map(cn=>{const n=convs.filter(t=>t.canale_principale===cn.id).length;
return<div key={cn.id} onClick={()=>{setFiltroCanale(cn.id);setTab('inbox')}} style={{padding:'16px 20px',borderRadius:14,background:C.wh,border:'2px solid '+C.bdr,cursor:'pointer',display:'flex',alignItems:'center',gap:10,boxShadow:'0 3px 0 '+C.bdr,minWidth:140}}>
<div style={{color:cn.c}}>{cn.i}</div><span style={{fontWeight:800,fontSize:14}}>{cn.l}</span><span style={{marginLeft:'auto',fontFamily:FM,fontWeight:900,color:cn.c,fontSize:16}}>{n}</span></div>})}</div>
</div></Page>;

// ═══ INBOX ═══
if(tab==='inbox')return<Page>
<div style={{padding:'10px 24px',display:'flex',gap:8,alignItems:'center',borderBottom:'2px solid '+C.bdr,flexShrink:0,flexWrap:'wrap'}}>
<div style={{position:'relative',flex:1,maxWidth:300}}><span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:.4}}>{IC.search}</span>
<input placeholder="Cerca..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{width:'100%',padding:'12px 14px 12px 40px',border:'2px solid '+C.bdr,borderRadius:12,fontSize:14,fontFamily:FF,outline:'none'}}/></div>
{[{id:'',l:'Tutte'},{id:'non_letti',l:'Non letti'},{id:'urgenti',l:'Urgenti'}].map(f=><SmBtn key={f.id} onClick={()=>setFiltro(filtro===f.id?'':f.id)} color={filtro===f.id?C.tl:C.dk} bg={filtro===f.id?C.tl+'15':C.wh}>{f.l}</SmBtn>)}
<select value={filtroCanale} onChange={e=>setFiltroCanale(e.target.value)} style={{padding:'10px 14px',fontSize:13,borderRadius:10,border:'2px solid '+C.bdr,fontFamily:FF}}>
<option value="">Tutti canali</option>{CANALI.map(c=><option key={c.id} value={c.id}>{c.l}</option>)}</select>
<span style={{marginLeft:'auto',fontSize:12,fontWeight:700,color:C.dk}}>{filtrati.length} conv.</span></div>
<div style={{flex:1,display:'flex',overflow:'hidden'}}>
{/* Lista */}
<div style={{width:400,borderRight:'2px solid '+C.bdr,overflow:'auto',flexShrink:0}}>
{filtrati.map(t=>{const cn=cnI(t.canale_principale);const isSel=sel?.id===t.id;
return<div key={t.id} onClick={()=>{setSel(t);markRead(t);setReplyCanale(t.canale_principale)}}
style={{padding:'14px 18px',borderBottom:'1px solid '+C.bdr,background:isSel?C.tl+'10':t.non_letto?C.amb+'08':C.wh,cursor:'pointer'}}>
<div style={{display:'flex',alignItems:'center',gap:10}}>
<div style={{width:36,height:36,borderRadius:10,background:cn.c+'15',display:'flex',alignItems:'center',justifyContent:'center',color:cn.c,flexShrink:0}}>{cn.i}</div>
<div style={{flex:1,minWidth:0}}>
<div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:14,fontWeight:t.non_letto?900:700}}>{t.contatto_nome}</span>
{t.non_letto&&<div style={{width:8,height:8,borderRadius:'50%',background:C.red}}/>}
<span style={{marginLeft:'auto',fontSize:10,color:C.dk}}>{fAgo(t.ultimo_msg_time)}</span></div>
<div style={{fontSize:12,color:C.dk,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2}}>{t.ultimo_msg||'-'}</div>
{t.entity_code&&<span style={{fontSize:9,fontFamily:FM,fontWeight:700,color:C.tl,background:C.tl+'10',padding:'1px 6px',borderRadius:4,marginTop:4,display:'inline-block'}}>{t.entity_code}</span>}
</div></div></div>})}
{filtrati.length===0&&<div style={{padding:40,textAlign:'center',color:C.dk}}>Nessuna conversazione</div>}</div>
{/* Thread + context */}
{sel?<div style={{flex:1,display:'flex',overflow:'hidden'}}>
<div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
{/* Header */}
<div style={{padding:'14px 20px',borderBottom:'2px solid '+C.bdr,display:'flex',alignItems:'center',gap:12,flexShrink:0,background:C.wh}}>
<div style={{width:40,height:40,borderRadius:12,background:cnI(sel.canale_principale).c+'15',display:'flex',alignItems:'center',justifyContent:'center',color:cnI(sel.canale_principale).c}}>{cnI(sel.canale_principale).i}</div>
<div style={{flex:1}}><div style={{fontSize:16,fontWeight:900}}>{sel.contatto_nome}</div>
<div style={{fontSize:11,color:C.dk,display:'flex',gap:6}}>{sel.entity_code&&<span style={{fontFamily:FM,fontWeight:700,color:C.tl}}>{sel.entity_code}</span>}
<Badge text={cnI(sel.canale_principale).l} color={cnI(sel.canale_principale).c}/><Badge text={stC(sel.stato,STATI).l} color={stC(sel.stato,STATI).c}/></div></div>
<SmBtn onClick={async()=>{const ns=sel.stato==='risolto'?'aperto':'risolto';await sb.from('signal_conversations').update({stato:ns}).eq('id',sel.id);
setConvs(p=>p.map(c=>c.id===sel.id?{...c,stato:ns}:c));setSel((p:any)=>({...p,stato:ns}));showToast(ns==='risolto'?'Thread risolto':'Thread riaperto')}} color={sel.stato==='risolto'?C.amb:C.grn}>{sel.stato==='risolto'?IC.chat:IC.check} {sel.stato==='risolto'?'Riapri':'Risolvi'}</SmBtn></div>
{/* Messaggi */}
<div style={{flex:1,overflow:'auto',padding:20}}>
{selMsgs.map((m:any,i:number)=>{const isMio=m.direction==='outbound'||m.da_nome==='Tu';const cn=cnI(m.da_canale);
// Auto-detect entities and promises in inbound messages
const detectedEnt=!isMio?detectEntities(m.testo||''):[];
const hasPromise=!isMio&&detectPromises(m.testo||'');
return<div key={m.id||i} style={{display:'flex',justifyContent:isMio?'flex-end':'flex-start',marginBottom:12}}>
<div style={{maxWidth:'70%',padding:'14px 18px',borderRadius:isMio?'16px 16px 4px 16px':'16px 16px 16px 4px',
background:isMio?C.tl:C.wh,color:isMio?C.wh:C.ink,border:isMio?'none':'2px solid '+C.bdr,boxShadow:isMio?'0 3px 0 '+C.dk+'30':'0 2px 0 '+C.bdr}}>
<div style={{fontSize:10,fontWeight:700,marginBottom:4,display:'flex',gap:6,alignItems:'center',opacity:.7}}>
<span style={{color:isMio?'rgba(255,255,255,.7)':cn.c}}>{cn.i}</span>{m.da_nome} — {fH(m.created_at)}</div>
<div style={{fontSize:14,lineHeight:1.5,fontWeight:500}}>{m.testo}</div>
{/* Detected entities in message */}
{detectedEnt.length>0&&<div style={{marginTop:6,display:'flex',gap:4,flexWrap:'wrap'}}>
{detectedEnt.map((e,j)=><span key={j} style={{padding:'2px 8px',borderRadius:4,background:C.tl+'20',color:C.tl,fontSize:9,fontWeight:800,fontFamily:FM,cursor:'pointer'}}
onClick={async()=>{if(!sel.entity_code){await autoLinkEntity(sel,m.testo);showToast('Entity '+e.code+' collegata')}}}>{IC.link} {e.code}</span>)}</div>}
{/* Promise detection badge */}
{hasPromise&&<div style={{marginTop:6}}><span style={{padding:'3px 10px',borderRadius:5,background:C.amb+'15',color:C.amb,fontSize:9,fontWeight:800,cursor:'pointer'}}
onClick={()=>{setPromiseModal(true)}}>{IC.flag} Possibile promessa rilevata — clicca per tracciare</span></div>}
{/* Message to Workflow — REAL actions */}
{!isMio&&<div style={{marginTop:8,display:'flex',gap:3,flexWrap:'wrap'}}>
{[{t:'task',l:'Task',c:C.tl},{t:'appuntamento',l:'Appuntamento',c:C.blu},{t:'misure',l:'Misure',c:C.vio},{t:'commessa',l:'Commessa',c:C.amb},{t:'problema',l:'Problema',c:C.red},{t:'ordine',l:'Ordine',c:C.grn},{t:'preventivo',l:'Preventivo',c:'#6366F1'}].map(a=>
<button key={a.t} onClick={()=>setActionModal({tipo:a.t,msg:m})} style={{padding:'4px 10px',borderRadius:6,border:'1.5px solid '+a.c+'40',background:a.c+'08',color:a.c,fontSize:9,cursor:'pointer',fontFamily:FF,fontWeight:800,transition:'all .1s'}}
onMouseOver={(e:any)=>{e.currentTarget.style.background=a.c+'20'}} onMouseOut={(e:any)=>{e.currentTarget.style.background=a.c+'08'}}>{a.l}</button>)}</div>}
</div></div>})}
<div ref={msgEndRef}/>
{selMsgs.length===0&&<div style={{textAlign:'center',padding:40,color:C.dk}}>Nessun messaggio</div>}
</div>
{/* Composer */}
<div style={{borderTop:'2px solid '+C.bdr,flexShrink:0,background:C.wh}}>
<div style={{padding:'8px 20px',display:'flex',gap:6,alignItems:'center',borderBottom:'1px solid '+C.bdr,fontSize:11}}>
<span style={{fontWeight:700,color:C.dk}}>Collega a:</span>
{sel.entity_code?<Badge text={sel.entity_code} color={C.tl} big/>:<span style={{color:C.dk,fontSize:10}}>nessuna entity</span>}
<button onClick={async()=>{const code=prompt('Collega a commessa/ordine (es. CM-2026-041, S-0001):','');if(!code)return;
const tipo=code.startsWith('S-')?'commessa':code.startsWith('CM')?'commessa':code.startsWith('ORD')?'ordine':code.startsWith('PREV')?'preventivo':code.startsWith('MONT')?'montaggio':'altro';
await sb.from('signal_conversations').update({entity_code:code.toUpperCase(),entity_tipo:tipo}).eq('id',sel.id);
setSel((p:any)=>({...p,entity_code:code.toUpperCase(),entity_tipo:tipo}));setConvs(p=>p.map(c=>c.id===sel.id?{...c,entity_code:code.toUpperCase()}:c));
await sb.from('signal_entity_links').insert({conversation_id:sel.id,entity_code:code.toUpperCase(),entity_tipo:tipo,linked_by:'manuale',link_source:'bottone_collega'}).catch(()=>{});
showToast('Collegato a '+code.toUpperCase())}} style={{padding:'4px 10px',borderRadius:6,border:'1.5px solid '+C.tl+'40',background:C.tl+'08',color:C.tl,fontSize:10,cursor:'pointer',fontFamily:FF,fontWeight:700}}>{IC.link} Collega</button>
<span style={{flex:1}}/>
<span style={{fontWeight:700,color:C.dk}}>Invia come:</span>
<select value={replyCanale} onChange={e=>setReplyCanale(e.target.value)} style={{padding:'4px 8px',borderRadius:6,border:'1.5px solid '+C.bdr,fontFamily:FF,fontSize:11,fontWeight:700}}>
{CANALI.filter(c=>c.id!=='sistema').map(c=><option key={c.id} value={c.id}>{c.l}</option>)}</select>
</div>
<div style={{padding:'12px 20px',display:'flex',gap:10,alignItems:'center'}}>
<label style={{padding:'10px 14px',borderRadius:10,border:'2px solid '+C.bdr,background:C.wh,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4,fontSize:12,fontWeight:700,color:C.dk,boxShadow:'0 3px 0 '+C.bdr}}>
{IC.file} File
<input type="file" multiple style={{display:'none'}} onChange={e=>{const files=e.target.files;if(files?.length)showToast(files.length+' file selezionati — upload via Supabase Storage','warn')}}/></label>
<input value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Scrivi messaggio..." onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey)sendReply()}}
style={{flex:1,padding:'12px 16px',border:'2px solid '+C.bdr,borderRadius:12,fontSize:14,fontFamily:FF,outline:'none'}}/>
<BigBtn onClick={sendReply} disabled={!replyText.trim()} style={{padding:'12px 20px'}}>{IC.send} Invia</BigBtn></div>
</div>
</div>
{/* Context panel */}
<div style={{width:260,borderLeft:'2px solid '+C.bdr,overflow:'auto',padding:16,flexShrink:0,background:C.bg}}>
<div style={{fontSize:12,fontWeight:900,color:C.ink,marginBottom:10,textTransform:'uppercase',letterSpacing:'.5px'}}>Contesto</div>
<div style={{padding:12,borderRadius:12,background:C.wh,border:'2px solid '+C.bdr,marginBottom:10}}>
<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>{IC.user}<span style={{fontWeight:900,fontSize:14}}>{sel.contatto_nome}</span></div>
{sel.contatto_azienda&&<div style={{fontSize:11,color:C.dk}}>{sel.contatto_azienda}</div>}
{sel.contatto_email&&<div style={{fontSize:10,color:C.blu,marginTop:2}}>{sel.contatto_email}</div>}
{sel.contatto_telefono&&<div style={{fontSize:10,color:C.vio,marginTop:2}}>{sel.contatto_telefono}</div>}
</div>
{sel.entity_code&&<div style={{padding:12,borderRadius:12,background:C.tl+'10',border:'2px solid '+C.tl+'30',marginBottom:10}}>
<div style={{fontSize:10,fontWeight:800,color:C.tl}}>ENTITY COLLEGATA</div>
<div style={{fontFamily:FM,fontSize:16,fontWeight:900,color:C.tl}}>{sel.entity_code}</div>
<div style={{fontSize:10,color:C.dk,textTransform:'capitalize'}}>{sel.entity_tipo}</div></div>}
{/* Cartella cliente */}
{(()=>{const altreConv=convs.filter(c=>c.contatto_nome===sel.contatto_nome&&c.id!==sel.id);
if(!altreConv.length)return null;
return<div style={{marginBottom:10}}>
<div style={{fontSize:10,fontWeight:900,color:C.dk,marginBottom:6,textTransform:'uppercase'}}>Cartella {sel.contatto_nome} ({altreConv.length+1} conv.)</div>
{altreConv.map(c=>{const cn=cnI(c.canale_principale);return<div key={c.id} onClick={()=>{setSel(c);markRead(c);setReplyCanale(c.canale_principale)}}
style={{padding:'8px 10px',marginBottom:3,borderRadius:8,background:C.wh,border:'1px solid '+C.bdr,cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:6}}>
<span style={{color:cn.c}}>{cn.i}</span><span style={{flex:1,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.ultimo_msg||'-'}</span>
<span style={{fontSize:8,color:C.dk}}>{fAgo(c.ultimo_msg_time)}</span></div>})}</div>})()}
{/* Promesse */}
<div style={{fontSize:10,fontWeight:900,color:C.dk,marginBottom:6,textTransform:'uppercase'}}>Promesse</div>
{promises.filter(p=>p.conversation_id===sel.id).map(p=>{const scad=p.stato==='attiva'&&p.scadenza&&new Date(p.scadenza)<new Date();
return<div key={p.id} style={{padding:8,borderRadius:8,background:C.wh,border:'1.5px solid '+(scad?C.red:C.bdr),marginBottom:4,fontSize:10}}>
<div style={{fontWeight:700}}>{p.testo}</div>
{p.scadenza&&<div style={{color:scad?C.red:C.dk,fontWeight:700,marginTop:2}}>{fD(p.scadenza)}{scad&&' SCADUTA'}</div>}
{p.stato==='attiva'&&<button onClick={()=>completePromise(p.id)} style={{marginTop:4,padding:'3px 8px',borderRadius:4,border:'1px solid '+C.grn,background:C.grn+'10',color:C.grn,fontSize:9,cursor:'pointer',fontWeight:700}}>{IC.check} Fatto</button>}</div>})}
{promises.filter(p=>p.conversation_id===sel.id).length===0&&<div style={{fontSize:9,color:C.dk,marginBottom:10}}>Nessuna promessa</div>}
{/* Memoria */}
<div style={{fontSize:10,fontWeight:900,color:C.dk,marginTop:10,marginBottom:6,textTransform:'uppercase'}}>Memoria</div>
{knowledge.filter(k=>k.conversation_id===sel.id||k.entity_code===sel.entity_code).slice(0,5).map(k=><div key={k.id} style={{padding:8,borderRadius:8,background:C.wh,border:'1px solid '+C.bdr,marginBottom:4,fontSize:10}}>
<Badge text={k.tipo} color={C.vio}/><div style={{fontWeight:600,marginTop:4}}>{k.testo}</div></div>)}
{knowledge.filter(k=>k.conversation_id===sel.id||k.entity_code===sel.entity_code).length===0&&<div style={{fontSize:9,color:C.dk}}>Nessuna nota</div>}
{/* Quick actions */}
<div style={{marginTop:12,display:'flex',flexDirection:'column',gap:4}}>
<SmBtn onClick={()=>setPromiseModal(true)} color={C.amb}>{IC.flag} Aggiungi promessa</SmBtn>
<SmBtn onClick={()=>setKnowledgeModal(true)} color={C.vio}>{IC.brain} Salva decisione</SmBtn>
</div></div></div>:<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:C.dk}}>
<div style={{textAlign:'center'}}><div style={{opacity:.2,marginBottom:12}}>{ico(<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,64)}</div>
<div style={{fontSize:16,fontWeight:700}}>Seleziona una conversazione</div></div></div>}
</div></Page>;

// ═══ PROMESSE ═══
if(tab==='promises')return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{fontSize:18,fontWeight:900,marginBottom:16,display:'flex',alignItems:'center',gap:10}}>{IC.flag} Promise Tracker — {promises.length}
<span style={{flex:1}}/><BigBtn onClick={()=>{if(!sel){showToast('Seleziona prima una conversazione dalla Inbox','warn');return}setPromiseModal(true)}} style={{padding:'10px 18px',fontSize:13}}>{IC.plus} Nuova</BigBtn></div>
<div style={{display:'flex',gap:8,marginBottom:16}}>
{['tutte','attiva','completata','scaduta'].map(s=>{const n=s==='tutte'?promises.length:s==='scaduta'?promises.filter(p=>p.stato==='attiva'&&p.scadenza&&new Date(p.scadenza)<new Date()).length:promises.filter(p=>p.stato===s).length;
return<SmBtn key={s} onClick={()=>setFiltro(filtro===s?'':s)} color={filtro===s?(s==='scaduta'?C.red:s==='completata'?C.grn:s==='attiva'?C.amb:C.tl):C.dk} bg={filtro===s?C.tl+'15':C.wh}>{s} ({n})</SmBtn>})}</div>
{promises.filter(p=>{if(!filtro||filtro==='tutte')return true;if(filtro==='scaduta')return p.stato==='attiva'&&p.scadenza&&new Date(p.scadenza)<new Date();return p.stato===filtro}).map(p=>{
const scaduta=p.stato==='attiva'&&p.scadenza&&new Date(p.scadenza)<new Date();
return<div key={p.id} style={{padding:'16px 20px',marginBottom:8,borderRadius:14,border:'2px solid '+(scaduta?C.red:p.stato==='completata'?C.grn+'50':C.bdr),background:C.wh,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:10}}>
<span style={{fontSize:14,fontWeight:800,flex:1}}>{p.testo}</span>
<Badge text={scaduta?'SCADUTA':p.stato} color={scaduta?C.red:p.stato==='completata'?C.grn:C.amb} big/>
{p.scadenza&&<span style={{fontFamily:FM,fontSize:12,fontWeight:700,color:scaduta?C.red:C.dk}}>{fD(p.scadenza)}</span>}
{p.stato==='attiva'&&<SmBtn onClick={()=>completePromise(p.id)} color={C.grn}>{IC.check}</SmBtn>}
</div>
<div style={{fontSize:11,color:C.dk,marginTop:4}}>{p.chi_promette&&'Da: '+p.chi_promette+' — '}{p.entity_code&&<span style={{fontFamily:FM,color:C.tl}}>{p.entity_code}</span>}
{p.tipo_promessa&&<span style={{marginLeft:8}}><Badge text={p.tipo_promessa} color={p.tipo_promessa==='fatta'?C.tl:C.vio}/></span>}</div>
</div>})}</div></Page>;

// ═══ KNOWLEDGE MEMORY ═══
if(tab==='knowledge'){
const tipi=[...new Set(knowledge.map(k=>k.tipo))].filter(Boolean);
return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{fontSize:18,fontWeight:900,marginBottom:16,display:'flex',alignItems:'center',gap:10}}>{IC.brain} Knowledge Memory — {knowledge.length}
<span style={{flex:1}}/><BigBtn onClick={()=>{if(!sel){showToast('Seleziona prima una conversazione dalla Inbox','warn');return}setKnowledgeModal(true)}} style={{padding:'10px 18px',fontSize:13}}>{IC.plus} Nuova</BigBtn></div>
{tipi.length>0&&<div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
{tipi.map(t=><SmBtn key={t} onClick={()=>setFiltro(filtro===t?'':t)} color={filtro===t?C.vio:C.dk} bg={filtro===t?C.vio+'15':C.wh}>{t} ({knowledge.filter(k=>k.tipo===t).length})</SmBtn>)}</div>}
{knowledge.filter(k=>!filtro||k.tipo===filtro).map(k=><div key={k.id} style={{padding:'16px 20px',marginBottom:8,borderRadius:14,border:'2px solid '+C.bdr,background:C.wh,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
<Badge text={k.tipo} color={k.tipo?.startsWith('azione_')?C.tl:C.vio} big/><span style={{flex:1,fontSize:14,fontWeight:800}}>{k.testo}</span>
<span style={{fontSize:10,color:C.dk}}>{fD(k.data_evento||k.created_at)}</span></div>
<div style={{fontSize:11,color:C.dk}}>{k.attore&&'Da: '+k.attore+' — '}{k.entity_code&&<span style={{fontFamily:FM,color:C.tl}}>{k.entity_code}</span>}</div></div>)}
{knowledge.length===0&&<div style={{textAlign:'center',padding:60,color:C.dk}}>La memoria si riempie salvando decisioni, eccezioni e accordi dalle conversazioni</div>}
</div></Page>}

// ═══ PER ENTITY ═══
if(tab==='entity'){const ent:any={};convs.forEach(t=>{if(t.entity_code){if(!ent[t.entity_code])ent[t.entity_code]={code:t.entity_code,tipo:t.entity_tipo,threads:[],promises:[],kb:[]};ent[t.entity_code].threads.push(t)}});
promises.forEach(p=>{if(p.entity_code&&ent[p.entity_code])ent[p.entity_code].promises.push(p)});
knowledge.forEach(k=>{if(k.entity_code&&ent[k.entity_code])ent[k.entity_code].kb.push(k)});
const el=Object.values(ent).sort((a:any,b:any)=>b.threads.length-a.threads.length);
return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{fontSize:18,fontWeight:900,marginBottom:16}}>{IC.link} Per Entity — {el.length}</div>
{(el as any[]).map((e:any)=><div key={e.code} style={{padding:20,marginBottom:10,borderRadius:14,border:'2px solid '+C.bdr,background:C.wh,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
<div style={{width:44,height:44,borderRadius:12,background:C.tl+'15',display:'flex',alignItems:'center',justifyContent:'center',color:C.tl,border:'2px solid '+C.tl+'30'}}>{IC.link}</div>
<div style={{flex:1}}><div style={{fontFamily:FM,fontSize:16,fontWeight:900,color:C.tl}}>{e.code}</div>
<div style={{fontSize:12,color:C.dk}}>{e.tipo} — {e.threads.length} conv. — {e.promises.length} promesse — {e.kb.length} note</div></div></div>
{e.threads.map((t:any)=>{const cn=cnI(t.canale_principale);return<div key={t.id} onClick={()=>{setSel(t);setTab('inbox');setReplyCanale(t.canale_principale)}}
style={{padding:'10px 14px',marginBottom:4,borderRadius:10,border:'1px solid '+C.bdr,display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12}}>
<span style={{color:cn.c}}>{cn.i}</span><span style={{fontWeight:700}}>{t.contatto_nome}</span><span style={{flex:1,color:C.dk,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.ultimo_msg}</span>
<span style={{fontSize:10,color:C.dk}}>{fAgo(t.ultimo_msg_time)}</span></div>})}
{e.promises.filter((p:any)=>p.stato==='attiva').length>0&&<div style={{marginTop:8,padding:10,borderRadius:8,background:C.amb+'08',border:'1px solid '+C.amb+'30'}}>
<div style={{fontSize:10,fontWeight:800,color:C.amb,marginBottom:4}}>PROMESSE ATTIVE</div>
{e.promises.filter((p:any)=>p.stato==='attiva').map((p:any)=><div key={p.id} style={{fontSize:11,marginBottom:2}}>{p.testo} {p.scadenza&&<span style={{fontFamily:FM,color:C.dk}}>({fD(p.scadenza)})</span>}</div>)}</div>}
</div>)}</div></Page>}

// ═══ CARTELLA CLIENTE ═══
if(tab==='cartella'){
const clienti:any={};
convs.forEach(t=>{const nome=t.contatto_nome||'Sconosciuto';if(!clienti[nome])clienti[nome]={nome,azienda:t.contatto_azienda||'',email:t.contatto_email||'',tel:t.contatto_telefono||'',convs:[],entities:new Set(),promises:[],kb:[]};
clienti[nome].convs.push(t);if(t.entity_code)clienti[nome].entities.add(t.entity_code);if(!clienti[nome].email&&t.contatto_email)clienti[nome].email=t.contatto_email;if(!clienti[nome].tel&&t.contatto_telefono)clienti[nome].tel=t.contatto_telefono});
promises.forEach(p=>{const conv=convs.find(c=>c.id===p.conversation_id);if(conv&&clienti[conv.contatto_nome])clienti[conv.contatto_nome].promises.push(p)});
knowledge.forEach(k=>{const conv=convs.find(c=>c.id===k.conversation_id);if(conv&&clienti[conv.contatto_nome])clienti[conv.contatto_nome].kb.push(k)});
const cl=Object.values(clienti).sort((a:any,b:any)=>b.convs.length-a.convs.length);
const selected=entityView?clienti[entityView]:null;

if(selected)return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<SmBtn onClick={()=>setEntityView(null)} color={C.tl}>{IC.back} Tutti i clienti</SmBtn>
<div style={{marginTop:16,display:'flex',gap:20}}>
{/* Left — info */}
<div style={{width:300,flexShrink:0}}>
<div style={{padding:20,borderRadius:16,background:C.wh,border:'2px solid '+C.bdr,marginBottom:14,boxShadow:'0 4px 0 '+C.bdr}}>
<div style={{fontSize:20,fontWeight:900,marginBottom:8}}>{selected.nome}</div>
{selected.azienda&&<div style={{fontSize:13,color:C.dk,marginBottom:4}}>{selected.azienda}</div>}
{selected.email&&<div style={{fontSize:12,color:C.blu}}>{selected.email}</div>}
{selected.tel&&<div style={{fontSize:12,color:C.vio}}>{selected.tel}</div>}
<div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
{[...selected.entities].map((e:string)=><Badge key={e} text={e} color={C.tl} big/>)}
</div>
<div style={{marginTop:12,fontSize:12,color:C.dk}}>{selected.convs.length} conversazioni — {selected.promises.length} promesse — {selected.kb.length} note</div>
</div>
{/* Promesse attive */}
{selected.promises.filter((p:any)=>p.stato==='attiva').length>0&&<div style={{padding:16,borderRadius:14,background:C.amb+'08',border:'2px solid '+C.amb+'30',marginBottom:14}}>
<div style={{fontSize:11,fontWeight:900,color:C.amb,marginBottom:8}}>PROMESSE ATTIVE</div>
{selected.promises.filter((p:any)=>p.stato==='attiva').map((p:any)=>{const scad=p.scadenza&&new Date(p.scadenza)<new Date();
return<div key={p.id} style={{padding:8,marginBottom:4,borderRadius:8,background:C.wh,border:'1px solid '+(scad?C.red:C.bdr),fontSize:11}}>
<div style={{fontWeight:700}}>{p.testo}</div>{p.scadenza&&<div style={{color:scad?C.red:C.dk,fontSize:10}}>{fD(p.scadenza)}{scad&&' SCADUTA'}</div>}
<button onClick={()=>completePromise(p.id)} style={{marginTop:4,padding:'3px 8px',borderRadius:4,border:'1px solid '+C.grn,background:C.grn+'10',color:C.grn,fontSize:9,cursor:'pointer',fontWeight:700}}>{IC.check} Fatto</button></div>})}</div>}
{/* Knowledge */}
{selected.kb.length>0&&<div style={{padding:16,borderRadius:14,background:C.vio+'08',border:'2px solid '+C.vio+'30'}}>
<div style={{fontSize:11,fontWeight:900,color:C.vio,marginBottom:8}}>MEMORIA</div>
{selected.kb.map((k:any)=><div key={k.id} style={{padding:8,marginBottom:4,borderRadius:8,background:C.wh,border:'1px solid '+C.bdr,fontSize:11}}>
<Badge text={k.tipo} color={C.vio}/><div style={{marginTop:4,fontWeight:600}}>{k.testo}</div></div>)}</div>}
</div>
{/* Right — conversazioni */}
<div style={{flex:1}}>
<div style={{fontSize:14,fontWeight:900,marginBottom:12}}>Tutte le conversazioni</div>
{selected.convs.sort((a:any,b:any)=>new Date(b.ultimo_msg_time).getTime()-new Date(a.ultimo_msg_time).getTime()).map((c:any)=>{const cn=cnI(c.canale_principale);
return<div key={c.id} onClick={()=>{setSel(c);setTab('inbox');setReplyCanale(c.canale_principale)}}
style={{padding:'14px 18px',marginBottom:6,borderRadius:14,border:'2px solid '+C.bdr,background:C.wh,cursor:'pointer',display:'flex',alignItems:'center',gap:12,boxShadow:'0 2px 0 '+C.bdr}}>
<div style={{width:40,height:40,borderRadius:10,background:cn.c+'15',display:'flex',alignItems:'center',justifyContent:'center',color:cn.c}}>{cn.i}</div>
<div style={{flex:1}}>
<div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontWeight:800,fontSize:14}}>{cn.l}</span>
{c.entity_code&&<Badge text={c.entity_code} color={C.tl}/>}<Badge text={stC(c.stato,STATI).l} color={stC(c.stato,STATI).c}/>
<span style={{marginLeft:'auto',fontSize:10,color:C.dk}}>{fD(c.ultimo_msg_time)}</span></div>
<div style={{fontSize:12,color:C.dk,marginTop:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.ultimo_msg||'-'}</div>
</div></div>})}</div></div></div></Page>;

return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{fontSize:18,fontWeight:900,marginBottom:16}}>{IC.folder} Cartella Cliente — {cl.length}</div>
<div style={{position:'relative',marginBottom:16}}><span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:.4}}>{IC.search}</span>
<input placeholder="Cerca cliente..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{width:'100%',maxWidth:400,padding:'12px 14px 12px 40px',border:'2px solid '+C.bdr,borderRadius:12,fontSize:14,fontFamily:FF,outline:'none'}}/></div>
{(cl as any[]).filter((c:any)=>!searchQ||c.nome.toLowerCase().includes(searchQ.toLowerCase())).map((c:any)=>
<div key={c.nome} onClick={()=>setEntityView(c.nome)} style={{padding:'18px 22px',marginBottom:8,borderRadius:14,border:'2px solid '+C.bdr,background:C.wh,cursor:'pointer',display:'flex',alignItems:'center',gap:14,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{width:52,height:52,borderRadius:14,background:C.tl+'12',display:'flex',alignItems:'center',justifyContent:'center',color:C.tl,fontSize:20,fontWeight:900,border:'2px solid '+C.tl+'25'}}>{c.nome.charAt(0).toUpperCase()}</div>
<div style={{flex:1}}>
<div style={{fontSize:16,fontWeight:900}}>{c.nome}{c.azienda&&<span style={{fontSize:12,color:C.dk,fontWeight:600,marginLeft:8}}>{c.azienda}</span>}</div>
<div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
{[...c.entities].map((e:string)=><Badge key={e} text={e} color={C.tl}/>)}
<Badge text={c.convs.length+' conv.'} color={C.dk}/>
{c.promises.filter((p:any)=>p.stato==='attiva').length>0&&<Badge text={c.promises.filter((p:any)=>p.stato==='attiva').length+' promesse'} color={C.amb}/>}
{c.kb.length>0&&<Badge text={c.kb.length+' note'} color={C.vio}/>}
</div></div>
<div style={{textAlign:'right'}}>{c.email&&<div style={{fontSize:10,color:C.blu}}>{c.email}</div>}{c.tel&&<div style={{fontSize:10,color:C.vio}}>{c.tel}</div>}</div>
</div>)}</div></Page>}

// ═══ REGOLE ═══
if(tab==='regole')return<Page><div style={{flex:1,overflow:'auto',padding:24}}>
<div style={{fontSize:18,fontWeight:900,marginBottom:16}}>Message Rules Engine</div>
<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
{[{n:'Ritardo fornitore',d:'Email con "ritardo"/"slittamento" — tag + alert produzione',a:true,c:C.red},
{n:'Urgenza cantiere',d:'WhatsApp/Telegram + "urgente" + foto — priorita alta',a:true,c:C.amb},
{n:'Thread senza risposta 24h',d:'Thread aperto 24h senza risposta — alert owner',a:true,c:C.amb},
{n:'Post-vendita',d:'Messaggio entro 7gg dal montaggio — tag assistenza',a:false,c:C.blu},
{n:'Fattura/bonifico',d:'Email PDF + "fattura"/"bonifico" — admin',a:true,c:C.grn},
{n:'Auto-link commessa',d:'Codice S-XXXX / CM-XXXX nel testo — collega a commessa automaticamente',a:true,c:C.tl},
{n:'Promise tracker AI',d:'Rileva "ti richiamo", "montiamo venerdi", "consegniamo lunedi" — suggerisce promessa',a:true,c:C.vio},
{n:'Classificazione AI',d:'Classifica per entity, urgenza, sentimento',a:false,c:C.pin}].map((r,i)=>
<div key={i} style={{padding:18,borderRadius:14,border:'2px solid '+C.bdr,background:C.wh,boxShadow:'0 3px 0 '+C.bdr}}>
<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
<div style={{width:14,height:14,borderRadius:'50%',background:r.a?C.grn:C.bdr,border:'2px solid '+(r.a?C.grn:C.bdr)}}/>
<span style={{fontSize:14,fontWeight:900,flex:1,color:r.c}}>{r.n}</span><Badge text={r.a?'Attiva':'Off'} color={r.a?C.grn:'#999'} big/></div>
<div style={{fontSize:12,color:C.dk,lineHeight:1.4}}>{r.d}</div></div>)}</div></div></Page>;

return<Page><div style={{padding:24}}>Sezione: {tab}</div></Page>;
}
