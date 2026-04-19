// @ts-nocheck
'use client';
// ═══════════════════════════════════════════════════════════════════
// MASTRO — CostruttoreVetri v2 (S21)
// Configuratore vetri professionale con:
// - Calcoli EN 673 (Ug), EN 410 (g, TL), EN 12758 (Rw)
// - Scheda tecnica completa
// - Consigli zona climatica italiana (DM 26/06/2015)
// - Normativa UNI 7697 sicurezza
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const DS={teal:'#28A0A0',dark:'#156060',ink:'#0D1F1F',light:'#EEF8F8',border:'#C8E4E4',white:'#FFFFFF',red:'#DC4444',green:'#1A9E73',amber:'#D08008',blue:'#3B7FE0'};
const M="'JetBrains Mono',monospace";
type LT='vetro'|'pvb'|'canalina';
interface GL{id:string;tipo:LT;spessore:number;vetro_tipo?:string;gas?:string;canalina_tipo?:string}
const EMISSIVITY:Record<string,number>={float:0.837,temperato:0.837,basso_emissivo:0.04,selettivo:0.03};
const SOLAR_FACTOR:Record<string,number>={float:0.87,temperato:0.85,basso_emissivo:0.63,selettivo:0.42};
const LIGHT_TX:Record<string,number>={float:0.90,temperato:0.89,basso_emissivo:0.80,selettivo:0.70};
const GAS_L:Record<string,number>={aria:0.025,argon:0.0162,kripton:0.0093};
const PSI_SP:Record<string,number>={alluminio:0.08,warm_edge:0.04,super_spacer:0.03};
const ZONE=[
  {z:'A',c:'Lampedusa, Pantelleria',uw:4.6,ug:2.5},
  {z:'B',c:'Agrigento, Catania, Messina, Palermo, Reggio C., Siracusa, Trapani',uw:3.0,ug:1.7},
  {z:'C',c:'Bari, Cagliari, Cosenza, Latina, Lecce, Napoli, Taranto',uw:2.0,ug:1.3},
  {z:'D',c:'Firenze, Genova, Pescara, Roma, Sassari',uw:1.8,ug:1.1},
  {z:'E',c:'Bologna, Milano, Torino, Venezia, Verona, Padova, Trieste',uw:1.4,ug:1.0},
  {z:'F',c:"Belluno, Cuneo, Trento, Bolzano, L'Aquila",uw:1.0,ug:0.7},
];
const RWC=[{min:0,max:29,cl:'1',d:'Scarso'},{min:29,max:32,cl:'2',d:'Base'},{min:32,max:35,cl:'3',d:'Medio'},{min:35,max:40,cl:'4',d:'Buono'},{min:40,max:45,cl:'5',d:'Ottimo'},{min:45,max:99,cl:'6',d:'Eccellente'}];
const LC:Record<LT,{f:string;s:string}>={vetro:{f:'#B8E0E0',s:'#0D1F1F'},pvb:{f:'#E8D090',s:'#C0A050'},canalina:{f:'#E8E8E8',s:'#999'}};
const PRESETS=[
  {n:'4/16/4 Base',l:[{tipo:'vetro',spessore:4,vetro_tipo:'float'},{tipo:'canalina',spessore:16,gas:'aria',canalina_tipo:'alluminio'},{tipo:'vetro',spessore:4,vetro_tipo:'float'}]},
  {n:'4BE/16Ar/4 Low-E',l:[{tipo:'vetro',spessore:4,vetro_tipo:'basso_emissivo'},{tipo:'canalina',spessore:16,gas:'argon',canalina_tipo:'warm_edge'},{tipo:'vetro',spessore:4,vetro_tipo:'float'}]},
  {n:'6BE/16Ar/6 Acustico',l:[{tipo:'vetro',spessore:6,vetro_tipo:'basso_emissivo'},{tipo:'canalina',spessore:16,gas:'argon',canalina_tipo:'warm_edge'},{tipo:'vetro',spessore:6,vetro_tipo:'float'}]},
  {n:'44.2/16Ar/4BE Sicurezza',l:[{tipo:'vetro',spessore:4,vetro_tipo:'float'},{tipo:'pvb',spessore:0.76},{tipo:'vetro',spessore:4,vetro_tipo:'float'},{tipo:'canalina',spessore:16,gas:'argon',canalina_tipo:'warm_edge'},{tipo:'vetro',spessore:4,vetro_tipo:'basso_emissivo'}]},
  {n:'4BE/14Ar/4/14Ar/4BE Triplo',l:[{tipo:'vetro',spessore:4,vetro_tipo:'basso_emissivo'},{tipo:'canalina',spessore:14,gas:'argon',canalina_tipo:'warm_edge'},{tipo:'vetro',spessore:4,vetro_tipo:'float'},{tipo:'canalina',spessore:14,gas:'argon',canalina_tipo:'warm_edge'},{tipo:'vetro',spessore:4,vetro_tipo:'basso_emissivo'}]},
  {n:'33.1/16/33.1 Antinfortunio',l:[{tipo:'vetro',spessore:3,vetro_tipo:'float'},{tipo:'pvb',spessore:0.38},{tipo:'vetro',spessore:3,vetro_tipo:'float'},{tipo:'canalina',spessore:16,gas:'aria',canalina_tipo:'alluminio'},{tipo:'vetro',spessore:3,vetro_tipo:'float'},{tipo:'pvb',spessore:0.38},{tipo:'vetro',spessore:3,vetro_tipo:'float'}]},
  {n:'6T/16Ar/6T Temperato',l:[{tipo:'vetro',spessore:6,vetro_tipo:'temperato'},{tipo:'canalina',spessore:16,gas:'argon',canalina_tipo:'warm_edge'},{tipo:'vetro',spessore:6,vetro_tipo:'temperato'}]},
  {n:'4S/16Ar/4 Selettivo solare',l:[{tipo:'vetro',spessore:4,vetro_tipo:'selettivo'},{tipo:'canalina',spessore:16,gas:'argon',canalina_tipo:'warm_edge'},{tipo:'vetro',spessore:4,vetro_tipo:'float'}]},
];
let _id=0;const gid=()=>String(++_id);

export default function CostruttoreVetri({onBack,onSave}:{onBack?:()=>void;onSave?:(v:any)=>void}){
  const[layers,setLayers]=useState<GL[]>([]);
  const[nome,setNome]=useState('');const[codice,setCodice]=useState('');
  const[fornitore,setFornitore]=useState('');const[prezzo,setPrezzo]=useState('');
  const[saving,setSaving]=useState(false);

  const calc=useMemo(()=>{
    if(!layers.length)return null;
    const sp=layers.reduce((s,l)=>s+l.spessore,0);
    const peso=layers.reduce((w,l)=>l.tipo==='vetro'?w+(l.spessore/1000)*2500:l.tipo==='pvb'?w+(l.spessore/1000)*1100:w,0);
    const vetri=layers.filter(l=>l.tipo==='vetro');
    const cam=layers.filter(l=>l.tipo==='canalina');
    const pvbs=layers.filter(l=>l.tipo==='pvb');
    
    // Ug (EN 673 simplified)
    let Ug=5.8;
    if(cam.length>0&&vetri.length>=2){
      let R=0.13+0.04;
      vetri.forEach(v=>{R+=(v.spessore/1000)/1.0});
      cam.forEach(c=>{
        const s=c.spessore/1000;const lam=GAS_L[c.gas||'aria']||0.025;
        const idx=layers.indexOf(c);
        const gL=layers.slice(0,idx).reverse().find(x=>x.tipo==='vetro');
        const gR=layers.slice(idx+1).find(x=>x.tipo==='vetro');
        const e1=EMISSIVITY[gL?.vetro_tipo||'float']||0.837;
        const e2=EMISSIVITY[gR?.vetro_tipo||'float']||0.837;
        const eEff=1/(1/e1+1/e2-1);
        const hr=4*5.67e-8*Math.pow(283,3)*eEff;
        const Nu=Math.max(1,0.035*Math.pow(s*1000,0.38));
        const hg=Nu*lam/s;
        R+=1/(hg+hr);
      });
      Ug=1/R;
    }
    Ug=Math.round(Ug*100)/100;

    // g solare (EN 410)
    let g=vetri.reduce((a,v)=>a*(SOLAR_FACTOR[v.vetro_tipo||'float']||0.87),1);
    g*=Math.pow(0.95,pvbs.length)*Math.pow(0.97,cam.length);
    g=Math.round(g*100)/100;

    // TL (EN 410)
    let TL=vetri.reduce((a,v)=>a*(LIGHT_TX[v.vetro_tipo||'float']||0.90),1);
    TL*=Math.pow(0.98,pvbs.length)*Math.pow(0.99,cam.length);
    TL=Math.round(TL*100)/100;

    // Rw (EN 12758)
    let Rw=20*Math.log10(peso)+12;
    const spV=vetri.map(v=>v.spessore);
    if(spV.length>=2&&new Set(spV).size>1)Rw+=2;
    if(pvbs.length>0)Rw+=3*pvbs.length;
    cam.forEach(c=>{if(c.spessore>=16)Rw+=1});
    Rw=Math.round(Math.min(52,Math.max(25,Rw)));
    const rwC=RWC.find(c=>Rw>=c.min&&Rw<c.max)||RWC[0];

    const psi=cam.length?cam.reduce((s,c)=>s+(PSI_SP[c.canalina_tipo||'alluminio']||0.08),0)/cam.length:0;
    const comp=buildComp(layers);
    const hasSic=pvbs.length>0||vetri.some(v=>v.vetro_tipo==='temperato');
    const detr=Ug<=1.1;

    // Consigli intelligenti
    const tips:string[]=[];
    if(Ug>1.4)tips.push('Per zona E/F (Milano, Torino, Bologna) serve Ug piu basso. Aggiungi vetro basso emissivo + argon.');
    if(Ug>2.0&&cam.length>0)tips.push('Ug troppo alto per detrazioni fiscali. Obiettivo: Ug <= 1.0-1.1 W/m2K.');
    if(cam.some(c=>c.canalina_tipo==='alluminio'))tips.push('Canalina alluminio = ponte termico. Warm Edge riduce condensa sul bordo e migliora Uw di 0.1-0.2 W/m2K. Costa pochi EUR in piu.');
    if(cam.some(c=>c.gas==='aria')&&cam.length>0)tips.push('Sostituire aria con argon migliora Ug di 0.2-0.3 W/m2K. Il costo aggiuntivo si recupera in bolletta in 1-2 anni.');
    if(g>0.5&&!vetri.some(v=>v.vetro_tipo==='selettivo'))tips.push('Fattore solare g='+g+' alto. Per finestre esposte a sud/ovest usa vetro selettivo: riduce surriscaldamento estivo del 30-40%.');
    if(Rw<33)tips.push('Abbattimento acustico Rw='+Rw+'dB insufficiente per zone trafficate. Usa spessori asimmetrici (es. 6/16/4) o aggiungi PVB acustico (+3dB per foglio).');
    if(sp>44)tips.push('Spessore '+sp+'mm elevato. Verificare compatibilita con fermavetro del profilo (tipico max 44-48mm).');
    if(vetri.length===1)tips.push('Vetro singolo non idoneo per serramenti esterni. Obbligatorio minimo doppio vetro camera (DM 26/06/2015).');
    if(!vetri.some(v=>v.vetro_tipo==='basso_emissivo'||v.vetro_tipo==='selettivo')&&cam.length>0)tips.push('Nessun vetro basso emissivo. Una lastra Low-E migliora Ug del 40-50% senza costo significativo. E lo standard minimo oggi.');
    if(!hasSic)tips.push('Nessuna lastra di sicurezza (stratificato/temperato). Per altezza caduta >1m, porte-finestra, e bagni serve vetro di sicurezza (UNI 7697:2014).');
    if(cam.length>=2&&!vetri.some(v=>v.vetro_tipo==='basso_emissivo'))tips.push('Triplo vetro senza Low-E ha senso limitato. Aggiungi almeno una lastra basso emissivo per ottenere Ug < 0.8.');
    if(cam.some(c=>c.gas==='kripton'))tips.push('Kripton ottimo per prestazioni (+15% vs argon) ma costoso. Ideale per tripli vetri con camere strette (10-12mm).');
    if(detr)tips.push('Questo vetro e idoneo per detrazioni fiscali Ecobonus 50%/65% e Superbonus. Ug='+Ug+' <= 1.1 W/m2K.');

    return{sp,peso:Math.round(peso*10)/10,Ug,g,TL,Rw,rwC,psi:Math.round(psi*1000)/1000,comp,hasSic,detr,tips,nV:vetri.length,nC:cam.length,nP:pvbs.length};
  },[layers]);

  function buildComp(ls:GL[]):string{
    const p:string[]=[];let i=0;
    while(i<ls.length){
      if(ls[i].tipo==='vetro'){
        let lb=String(ls[i].spessore);
        if(ls[i].vetro_tipo==='basso_emissivo')lb+='BE';
        if(ls[i].vetro_tipo==='selettivo')lb+='S';
        if(ls[i].vetro_tipo==='temperato')lb+='T';
        if(i+2<ls.length&&ls[i+1].tipo==='pvb'&&ls[i+2].tipo==='vetro'){
          let sl=lb,j=i+1;
          while(j<ls.length-1&&ls[j].tipo==='pvb'&&ls[j+1].tipo==='vetro'){
            let nl=String(ls[j+1].spessore);
            if(ls[j+1].vetro_tipo==='basso_emissivo')nl+='BE';
            if(ls[j+1].vetro_tipo==='selettivo')nl+='S';
            if(ls[j+1].vetro_tipo==='temperato')nl+='T';
            sl+=nl;j+=2;
          }
          p.push(sl+'.'+Math.round(ls[i+1].spessore*10/3.8));i=j;
        }else{p.push(lb);i++;}
      }else if(ls[i].tipo==='canalina'){p.push(String(ls[i].spessore));i++;}else i++;
    }
    return p.join('/');
  }

  const add=(t:LT)=>{const d:Record<LT,Partial<GL>>={vetro:{spessore:4,vetro_tipo:'float'},pvb:{spessore:0.76},canalina:{spessore:16,gas:'argon',canalina_tipo:'warm_edge'}};setLayers(p=>[...p,{id:gid(),tipo:t,...d[t]}as GL])};
  const upd=(id:string,u:Partial<GL>)=>setLayers(p=>p.map(l=>l.id===id?{...l,...u}:l));
  const rm=(id:string)=>setLayers(p=>p.filter(l=>l.id!==id));
  const loadP=(pr:typeof PRESETS[0])=>{setLayers(pr.l.map(l=>({...l,id:gid()}as GL)));setNome(pr.n);setCodice('')};

  const svg=useMemo(()=>{
    if(!layers.length)return'';
    const S=3;
    const totalW = layers.reduce((s,l) => s + Math.max(l.spessore * S, l.tipo === 'pvb' ? 3 : 0), 0);
    const H = 50 * S; // Fixed 150px height - realistic proportion for glass section
    let x=0;const p:string[]=[];
    layers.forEach(l=>{
      const w=Math.max(l.spessore*S,l.tipo==='pvb'?3:0);
      if(l.tipo==='canalina'){
        const bH=4*S;
        p.push(`<rect x="${x}" y="0" width="${w}" height="${H}" fill="${l.gas==='argon'?'#E0E8FF':l.gas==='kripton'?'#E8E0FF':'#F0F0F0'}"/>`);
        p.push(`<rect x="${x}" y="0" width="${w}" height="${bH}" fill="${l.canalina_tipo==='warm_edge'?'#555':'#888'}" rx="1"/>`);
        p.push(`<rect x="${x}" y="${H-bH}" width="${w}" height="${bH}" fill="${l.canalina_tipo==='warm_edge'?'#555':'#888'}" rx="1"/>`);
        p.push(`<text x="${x+w/2}" y="${H/2+3}" text-anchor="middle" font-size="7" fill="#999" font-family="${M}">${(l.gas||'aria')[0].toUpperCase()}</text>`);
        p.push(`<text x="${x+w/2}" y="${H+14}" text-anchor="middle" font-size="9" fill="#666" font-family="${M}" font-weight="700">${l.spessore}</text>`);
      }else if(l.tipo==='pvb'){
        p.push(`<rect x="${x}" y="0" width="${w}" height="${H}" fill="#E8D090" stroke="#C0A050" stroke-width="0.5"/>`);
      }else{
        p.push(`<rect x="${x}" y="0" width="${w}" height="${H}" fill="#B8E0E0" stroke="#0D1F1F" stroke-width="1" rx="0.5"/>`);
        if(l.vetro_tipo==='basso_emissivo'||l.vetro_tipo==='selettivo')p.push(`<line x1="${x+w-1}" y1="3" x2="${x+w-1}" y2="${H-3}" stroke="${l.vetro_tipo==='selettivo'?'#D08008':'#3B7FE0'}" stroke-width="2" stroke-dasharray="4,2"/>`);
        if(l.vetro_tipo==='temperato')p.push(`<text x="${x+w/2}" y="${H/2+3}" text-anchor="middle" font-size="8" fill="#0D1F1F" font-weight="800">T</text>`);
        p.push(`<text x="${x+w/2}" y="${H+14}" text-anchor="middle" font-size="9" fill="#0D1F1F" font-family="${M}" font-weight="700">${l.spessore}${l.vetro_tipo==='basso_emissivo'?'BE':l.vetro_tipo==='selettivo'?'S':l.vetro_tipo==='temperato'?'T':''}</text>`);
      }
      x+=w;
    });
    return`<svg viewBox="-2 -2 ${x+4} ${H+22}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" width="${x+4}" height="${H+22}">${p.join('')}</svg>`;
  },[layers]);

  const save=async()=>{
    if(!codice.trim()||!calc){alert('Inserisci codice');return}
    setSaving(true);
    try{
      const{error}=await supabase.from('catalogo_vetri').upsert({codice:codice.trim(),nome:nome.trim()||calc.comp,composizione:calc.comp,ug:calc.Ug,spessore:calc.sp,peso_mq:calc.peso,fornitore:fornitore.trim()||null,prezzo_mq:parseFloat(prezzo)||null,sezione_svg:svg,strati:layers.map(l=>({tipo:l.tipo,spessore:l.spessore,vetro_tipo:l.vetro_tipo,gas:l.gas,canalina_tipo:l.canalina_tipo}))},{onConflict:'codice'}).select().single();
      if(error)alert('Errore: '+error.message);else{alert('Vetro salvato!');if(onSave)onSave(null)}
    }catch(e:any){alert(e.message)}
    setSaving(false);
  };

  return(
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden',fontFamily:"'Inter',sans-serif"}}>
      <div style={{padding:'12px 20px',flexShrink:0,borderBottom:`1.5px solid ${DS.border}`,display:'flex',alignItems:'center',gap:10}}>
        {onBack&&<button onClick={onBack} style={{background:DS.white,border:`1.5px solid ${DS.border}`,borderRadius:8,cursor:'pointer',color:DS.teal,padding:'6px 12px',fontSize:13,fontWeight:700}}>&#8592;</button>}
        <h2 style={{margin:0,fontSize:20,fontWeight:800,color:DS.ink}}>Costruttore Vetri</h2>
        {calc&&<span style={{fontFamily:M,fontSize:14,fontWeight:700,color:DS.teal}}>{calc.comp}</span>}
      </div>
      <div style={{flex:1,overflow:'auto',padding:'16px 24px'}}>
        {/* Presets */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:'#999',textTransform:'uppercase',marginBottom:6}}>Preset rapidi</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {PRESETS.map((pr,i)=><button key={i} onClick={()=>loadP(pr)} style={{padding:'8px 14px',borderRadius:8,border:`1.5px solid ${DS.border}`,background:DS.white,cursor:'pointer',fontSize:12,fontWeight:600,color:DS.ink}} onMouseOver={e=>(e.currentTarget.style.borderColor=DS.teal)} onMouseOut={e=>(e.currentTarget.style.borderColor=DS.border)}>{pr.n}</button>)}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'400px 1fr',gap:24}}>
          {/* LEFT — Layer builder + buttons */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#999',textTransform:'uppercase',marginBottom:6}}>Strati ({layers.length})</div>
            {layers.length===0?<div style={{padding:40,textAlign:'center',color:'#ccc',border:`2px dashed ${DS.border}`,borderRadius:10,marginBottom:12,fontSize:14}}>Scegli un preset o aggiungi strati</div>
            :layers.map(l=>(
              <div key={l.id} style={{display:'flex',gap:8,alignItems:'center',padding:'10px 14px',borderRadius:8,border:`1.5px solid ${DS.border}`,background:DS.white,marginBottom:4}}>
                <div style={{width:18,height:36,borderRadius:3,background:LC[l.tipo].f,border:`1.5px solid ${LC[l.tipo].s}`,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:DS.ink,marginBottom:4}}>{l.tipo==='vetro'?'Lastra vetro':l.tipo==='pvb'?'PVB interlayer':'Camera + gas'}</div>
                  <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                    <div>
                      <label style={{fontSize:9,color:'#999',fontWeight:600}}>Spessore</label>
                      <input type="number" value={l.spessore} step={l.tipo==='pvb'?0.38:1} min={0.38} onChange={e=>upd(l.id,{spessore:parseFloat(e.target.value)||0})}
                        style={{width:65,padding:'6px 8px',border:`1.5px solid ${DS.border}`,borderRadius:6,fontSize:14,fontFamily:M,fontWeight:700,textAlign:'center',display:'block'}}/>
                    </div>
                  {l.tipo==='vetro'&&<div>
                    <label style={{fontSize:9,color:'#999',fontWeight:600}}>Tipo</label>
                    <select value={l.vetro_tipo||'float'} onChange={e=>upd(l.id,{vetro_tipo:e.target.value})} style={{padding:'6px',border:`1.5px solid ${DS.border}`,borderRadius:6,fontSize:12,display:'block'}}>
                    <option value="float">Float</option><option value="temperato">Temperato</option><option value="basso_emissivo">Basso emissivo</option><option value="selettivo">Selettivo</option>
                  </select></div>}
                  {l.tipo==='canalina'&&<><div>
                    <label style={{fontSize:9,color:'#999',fontWeight:600}}>Gas</label>
                    <select value={l.gas||'aria'} onChange={e=>upd(l.id,{gas:e.target.value})} style={{padding:'6px',border:`1.5px solid ${DS.border}`,borderRadius:6,fontSize:12,display:'block'}}>
                    <option value="aria">Aria</option><option value="argon">Argon</option><option value="kripton">Kripton</option>
                  </select></div>
                  <div>
                    <label style={{fontSize:9,color:'#999',fontWeight:600}}>Canalina</label>
                    <select value={l.canalina_tipo||'alluminio'} onChange={e=>upd(l.id,{canalina_tipo:e.target.value})} style={{padding:'6px',border:`1.5px solid ${DS.border}`,borderRadius:6,fontSize:12,display:'block'}}>
                    <option value="alluminio">Alluminio</option><option value="warm_edge">Warm Edge</option><option value="super_spacer">Super Spacer</option>
                  </select></div></>}
                  </div>
                </div>
                <button onClick={()=>rm(l.id)} style={{background:'none',border:'none',color:'#ccc',cursor:'pointer',fontSize:14}} onMouseOver={e=>(e.currentTarget.style.color=DS.red)} onMouseOut={e=>(e.currentTarget.style.color='#ccc')}>&times;</button>
              </div>
            ))}
            <div style={{display:'flex',gap:8,margin:'12px 0'}}>
              <button onClick={()=>add('vetro')} style={{flex:1,padding:'10px',borderRadius:8,border:`2px solid ${DS.teal}30`,background:DS.teal+'08',color:DS.teal,fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Lastra</button>
              <button onClick={()=>add('pvb')} style={{flex:1,padding:'10px',borderRadius:8,border:`2px solid ${DS.amber}30`,background:DS.amber+'08',color:DS.amber,fontSize:13,fontWeight:700,cursor:'pointer'}}>+ PVB</button>
              <button onClick={()=>add('canalina')} style={{flex:1,padding:'10px',borderRadius:8,border:`2px solid #88888830`,background:'#88888808',color:'#666',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Camera</button>
            </div>

            {/* Save form */}
            {calc&&<div style={{padding:14,borderRadius:10,border:`1.5px solid ${DS.border}`,background:DS.white}}>
              <div style={{fontSize:11,fontWeight:700,color:'#999',textTransform:'uppercase',marginBottom:8}}>Salva in catalogo</div>
              <input placeholder="Codice vetro *" value={codice} onChange={e=>setCodice(e.target.value)} style={{width:'100%',padding:'10px',border:`1.5px solid ${DS.border}`,borderRadius:8,fontSize:14,fontFamily:M,fontWeight:700,marginBottom:6,boxSizing:'border-box'}}/>
              <input placeholder="Nome descrittivo" value={nome} onChange={e=>setNome(e.target.value)} style={{width:'100%',padding:'10px',border:`1.5px solid ${DS.border}`,borderRadius:8,fontSize:13,marginBottom:6,boxSizing:'border-box'}}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:8}}>
                <input placeholder="Fornitore" value={fornitore} onChange={e=>setFornitore(e.target.value)} style={{padding:'10px',border:`1.5px solid ${DS.border}`,borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
                <input placeholder="EUR/m2" type="number" value={prezzo} onChange={e=>setPrezzo(e.target.value)} style={{padding:'10px',border:`1.5px solid ${DS.border}`,borderRadius:8,fontSize:13,fontFamily:M,boxSizing:'border-box'}}/>
              </div>
              <button onClick={save} disabled={saving||!codice.trim()||!layers.length}
                style={{width:'100%',padding:'12px',background:codice.trim()&&layers.length?DS.green:'#ccc',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:codice.trim()?'pointer':'default',boxShadow:codice.trim()?`0 2px 0 #157a5a`:'none'}}>
                {saving?'Salvataggio...':'Salva vetro'}
              </button>
            </div>}
          </div>

          {/* RIGHT — Preview + KPI + Consigli + Zone */}
          <div>
            {calc&&<>
              {/* Composizione banner */}
              <div style={{padding:16,borderRadius:12,background:DS.ink,color:'#fff',marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,opacity:0.5,textTransform:'uppercase'}}>Composizione</div>
                <div style={{fontSize:26,fontFamily:M,fontWeight:800,letterSpacing:2}}>{calc.comp}</div>
                <div style={{fontSize:12,opacity:0.5,marginTop:4}}>{calc.nV} lastre, {calc.nC} camere{calc.nP>0?`, ${calc.nP} PVB`:''}</div>
              </div>

              {/* SVG Preview */}
              {layers.length>0&&<div style={{background:DS.white,borderRadius:12,border:`1.5px solid ${DS.border}`,padding:20,display:'flex',alignItems:'center',justifyContent:'center',height:220,marginBottom:12}}>
                <div dangerouslySetInnerHTML={{__html:svg}} style={{maxWidth:'80%',maxHeight:'90%'}}/>
              </div>}

              {/* KPIs grid */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginBottom:12}}>
                <KPI l="Ug" v={calc.Ug} u="W/m2K" c={calc.Ug<=1.1?DS.green:calc.Ug<=1.4?DS.amber:DS.red}/>
                <KPI l="g solare" v={calc.g} u="" c={calc.g<=0.35?DS.blue:calc.g<=0.5?DS.green:DS.amber}/>
                <KPI l="TL luce" v={Math.round(calc.TL*100)+'%'} u="" c={calc.TL>=0.7?DS.green:DS.amber}/>
                <KPI l={`Rw ${calc.rwC.d}`} v={calc.Rw+'dB'} u="" c={calc.Rw>=35?DS.green:calc.Rw>=32?DS.amber:DS.red}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginBottom:12}}>
                <KPI l="Spessore" v={calc.sp+'mm'} u="" c={DS.ink}/>
                <KPI l="Peso" v={calc.peso} u="kg/m2" c={DS.ink}/>
                <KPI l="Psi bordo" v={calc.psi} u="W/mK" c={calc.psi<=0.04?DS.green:calc.psi<=0.06?DS.amber:DS.red}/>
                <KPI l="Sicurezza" v={calc.hasSic?'SI':'NO'} u="" c={calc.hasSic?DS.green:DS.red}/>
              </div>

              {/* Zone climatiche */}
              <div style={{padding:14,borderRadius:10,background:DS.light,border:`1px solid ${DS.border}`,marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:'#999',textTransform:'uppercase',marginBottom:8}}>Zone climatiche (DM 26/06/2015)</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {ZONE.map(z=>{const ok=calc.Ug<=z.ug+0.3;const ot=calc.Ug<=z.ug;return(
                    <div key={z.z} title={z.c} style={{padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:700,background:ot?DS.green+'15':ok?DS.amber+'15':DS.red+'10',color:ot?DS.green:ok?DS.amber:DS.red,border:`1.5px solid ${ot?DS.green:ok?DS.amber:DS.red}20`,cursor:'help'}}>
                      {z.z} {ot?'OK':ok?'~':'NO'}
                    </div>)})}
                </div>
                {calc.detr&&<div style={{marginTop:10,fontSize:13,color:DS.green,fontWeight:700}}>Idoneo detrazioni fiscali Ecobonus/Superbonus</div>}
              </div>

              {/* Consigli */}
              {calc.tips.length>0&&<div style={{padding:14,borderRadius:10,background:DS.amber+'08',border:`1.5px solid ${DS.amber}20`,marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:DS.amber,textTransform:'uppercase',marginBottom:8}}>Consigli tecnici ({calc.tips.length})</div>
                {calc.tips.map((t,i)=><div key={i} style={{fontSize:12,color:DS.ink,marginBottom:6,paddingLeft:12,borderLeft:`3px solid ${DS.amber}30`,lineHeight:1.4}}>{t}</div>)}
              </div>}

              {/* Normativa */}
              <div style={{padding:10,borderRadius:8,background:DS.light,border:`1px solid ${DS.border}`,fontSize:11,color:'#888'}}>
                <span style={{fontWeight:700}}>NORMATIVA:</span> EN 673 (Ug) · EN 410 (g, TL) · EN 12758 (Rw) · UNI 7697 (sicurezza) · EN 1279 (vetrate isolanti) · DM 26/06/2015
              </div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
function KPI({l,v,u,c}:{l:string;v:any;u:string;c:string}){
  return<div style={{padding:'8px 10px',borderRadius:6,background:DS.light,border:`1px solid ${DS.border}`}}>
    <div style={{fontSize:8,color:'#999',fontWeight:700,textTransform:'uppercase'}}>{l}</div>
    <div style={{fontSize:18,fontFamily:M,fontWeight:800,color:c}}>{v}<span style={{fontSize:9,color:'#999',fontWeight:400}}> {u}</span></div>
  </div>;
}
