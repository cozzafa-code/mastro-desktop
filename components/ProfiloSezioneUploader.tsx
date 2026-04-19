'use client';
// @ts-nocheck
// MASTRO — ProfiloSezioneUploader (GPT Verdel)
import React, { useState, useCallback } from 'react';
import CadImport from './CadImport';

const T = {
  bg:'#F2F1EC',card:'#FFFFFF',bdr:'#E0DED8',bdrFocus:'#3B7FE0',
  text:'#1A1A1C',sub:'#6B6B70',acc:'#D08008',grn:'#1A9E73',red:'#DC4444',blu:'#3B7FE0',
  ff:"'Inter', system-ui, sans-serif",fm:"'JetBrains Mono', 'Fira Mono', monospace",
};
const TIPI = [{value:'telaio',label:'Telaio'},{value:'anta',label:'Anta'},{value:'traverso',label:'Traverso'},{value:'montante',label:'Montante'},{value:'zoccolo',label:'Zoccolo'}];
const inp = {width:'100%',boxSizing:'border-box',padding:'8px 11px',borderRadius:7,border:`1.5px solid ${T.bdr}`,fontSize:13,fontFamily:T.ff,color:T.text,background:T.card,outline:'none'};

function FInput({value,onChange,placeholder,type='text'}) {
  const [f,setF]=useState(false);
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{...inp,borderColor:f?T.bdrFocus:T.bdr}}/>;
}

export default function ProfiloSezioneUploader({onSaved,style}) {
  const [dxfFile,setDxfFile]=useState(null);
  const [cadResult,setCadResult]=useState(null);
  const [saveStatus,setSaveStatus]=useState('idle');
  const [saveError,setSaveError]=useState('');
  const [savedId,setSavedId]=useState('');
  const [meta,setMeta]=useState({nome:'',codice:'',sistema:'',tipo:'telaio',larghezza_mm:'',altezza_mm:'',note:''});
  const sf=(k,v)=>setMeta(p=>({...p,[k]:v}));

  const onImport=useCallback((result,file)=>{
    setCadResult(result);setDxfFile(file);setSaveStatus('idle');setSaveError('');
    const w=result.model.bounds.width.toFixed(2),h=result.model.bounds.height.toFixed(2);
    setMeta(p=>({...p,larghezza_mm:p.larghezza_mm||w,altezza_mm:p.altezza_mm||h,nome:p.nome||file.name.replace(/\.(dxf|dwg)$/i,'').replace(/[-_]/g,' ')}));
  },[]);

  const isValid=()=>!!dxfFile&&!!meta.nome.trim();

  const handleSave=async(e)=>{
    e.preventDefault();if(!isValid()||!dxfFile)return;
    setSaveStatus('saving');setSaveError('');
    try {
      const fd=new FormData();fd.append('dxf',dxfFile);
      fd.append('meta',JSON.stringify({...meta,larghezza_mm:meta.larghezza_mm?parseFloat(meta.larghezza_mm):null,altezza_mm:meta.altezza_mm?parseFloat(meta.altezza_mm):null}));
      const res=await fetch('/api/profili-sezioni',{method:'POST',body:fd});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error??`HTTP ${res.status}`);
      setSaveStatus('success');setSavedId(data.id??'');onSaved?.(data.id??'');
    } catch(err){setSaveError(err instanceof Error?err.message:String(err));setSaveStatus('error');}
  };

  const reset=()=>{setDxfFile(null);setCadResult(null);setSaveStatus('idle');setSaveError('');setSavedId('');setMeta({nome:'',codice:'',sistema:'',tipo:'telaio',larghezza_mm:'',altezza_mm:'',note:''});};

  return (
    <div style={{fontFamily:T.ff,color:T.text,...style}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:22}}>
        <div style={{width:36,height:36,borderRadius:9,background:`${T.acc}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>📐</div>
        <div>
          <div style={{fontSize:17,fontWeight:800,color:T.text}}>Importa Sezione Profilo</div>
          <div style={{fontSize:11,color:T.sub}}>Carica un DXF e compila i metadati</div>
        </div>
      </div>
      <form onSubmit={handleSave}>
        <div style={{display:'flex',gap:20,flexWrap:'wrap',alignItems:'flex-start'}}>
          <div style={{flex:'1 1 280px',minWidth:260,background:T.card,borderRadius:12,border:`1px solid ${T.bdr}`,padding:18,display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:11,fontWeight:700,color:T.sub,textTransform:'uppercase',letterSpacing:'0.06em'}}>Metadati profilo</div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:T.sub,marginBottom:6}}>Tipo <span style={{color:T.red}}>*</span></div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {TIPI.map(o=><button key={o.value} type="button" onClick={()=>sf('tipo',o.value)} style={{padding:'5px 12px',borderRadius:20,fontSize:11,cursor:'pointer',fontWeight:meta.tipo===o.value?700:400,border:`1.5px solid ${meta.tipo===o.value?T.acc:T.bdr}`,background:meta.tipo===o.value?`${T.acc}15`:T.bg,color:meta.tipo===o.value?T.acc:T.sub}}>{o.label}</button>)}
              </div>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:T.sub,marginBottom:5}}>Nome <span style={{color:T.red}}>*</span></div>
              <FInput value={meta.nome} onChange={v=>sf('nome',v)} placeholder="es. Telaio base 70mm"/>
            </div>
            <div style={{display:'flex',gap:12}}>
              <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:T.sub,marginBottom:5}}>Codice</div><FInput value={meta.codice} onChange={v=>sf('codice',v)} placeholder="14XX07+R"/></div>
              <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:T.sub,marginBottom:5}}>Sistema</div><FInput value={meta.sistema} onChange={v=>sf('sistema',v)} placeholder="IDEAL 5000"/></div>
            </div>
            <div style={{display:'flex',gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:600,color:T.sub,marginBottom:5}}>Larghezza mm</div>
                <div style={{position:'relative'}}><FInput type="number" value={meta.larghezza_mm} onChange={v=>sf('larghezza_mm',v)} placeholder="70"/>
                {cadResult&&<div style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:9,color:T.grn}}>✓{cadResult.model.bounds.width.toFixed(1)}</div>}</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:600,color:T.sub,marginBottom:5}}>Altezza mm</div>
                <div style={{position:'relative'}}><FInput type="number" value={meta.altezza_mm} onChange={v=>sf('altezza_mm',v)} placeholder="70"/>
                {cadResult&&<div style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:9,color:T.grn}}>✓{cadResult.model.bounds.height.toFixed(1)}</div>}</div>
              </div>
            </div>
            <div><div style={{fontSize:11,fontWeight:600,color:T.sub,marginBottom:5}}>Note</div><textarea value={meta.note} onChange={e=>sf('note',e.target.value)} placeholder="Annotazioni..." rows={2} style={{...inp,resize:'vertical',lineHeight:1.5}}/></div>
            {cadResult&&<div style={{padding:'10px 12px',borderRadius:8,background:`${T.grn}10`,border:`1px solid ${T.grn}30`,fontSize:11}}><div style={{fontWeight:700,color:T.grn,marginBottom:4}}>DXF caricato</div><div style={{color:T.sub}}>{cadResult.model.entityCount} entità · {cadResult.model.layers.length} layer{cadResult.profile&&<> · {cadResult.profile.holes.length} camera/e</>}</div></div>}
          </div>
          <div style={{flex:'2 1 380px',minWidth:320}}>
            <div style={{background:T.card,borderRadius:12,border:`1px solid ${T.bdr}`,padding:18}}>
              <div style={{fontSize:11,fontWeight:700,color:T.sub,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:14}}>File DXF</div>
              <CadImport onImport={onImport}/>
            </div>
          </div>
        </div>
        <div style={{marginTop:20,padding:'14px 18px',background:T.card,borderRadius:12,border:`1px solid ${T.bdr}`,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          {saveStatus==='error'&&<div style={{flex:1,padding:'8px 12px',borderRadius:7,background:`${T.red}10`,border:`1px solid ${T.red}40`,fontSize:12,color:T.red}}><strong>Errore: </strong>{saveError}</div>}
          {saveStatus==='success'&&<div style={{flex:1,padding:'8px 12px',borderRadius:7,background:`${T.grn}10`,border:`1px solid ${T.grn}30`,fontSize:12,color:T.grn}}>✓ Profilo salvato{savedId?` · ${savedId}`:''}</div>}
          {(saveStatus==='idle'||saveStatus==='saving')&&<div style={{flex:1,fontSize:11,color:T.sub}}>{!dxfFile?'Carica un file DXF per continuare':!meta.nome?'Inserisci il nome del profilo':'Pronto per il salvataggio'}</div>}
          <div style={{display:'flex',gap:10,marginLeft:'auto'}}>
            {saveStatus==='success'
              ?<button type="button" onClick={reset} style={{padding:'9px 20px',borderRadius:8,border:`1.5px solid ${T.bdr}`,background:T.bg,color:T.sub,fontSize:13,cursor:'pointer'}}>Nuovo profilo</button>
              :<><button type="button" onClick={reset} style={{padding:'9px 20px',borderRadius:8,border:`1.5px solid ${T.bdr}`,background:T.bg,color:T.sub,fontSize:13,cursor:'pointer'}}>Reset</button>
                <button type="submit" disabled={!isValid()||saveStatus==='saving'} style={{padding:'9px 24px',borderRadius:8,border:'none',background:isValid()&&saveStatus!=='saving'?T.acc:T.bdr,color:'#FFF',fontSize:13,fontWeight:700,cursor:isValid()&&saveStatus!=='saving'?'pointer':'not-allowed'}}>
                  {saveStatus==='saving'?'Salvataggio...':'↑ Salva profilo'}
                </button></>}
          </div>
        </div>
      </form>
    </div>
  );
}
