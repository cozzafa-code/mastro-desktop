// MASTRO — DXF Parser (GPT o1)
import { CadEntity, CadLine, CadPolyline, CadArc, CadCircle, CadText, DxfRawEntity, DxfBlockDef, CAD_UNITS_TO_MM, IGNORED_LAYERS, IGNORED_ENTITY_TYPES, Point } from './types';

function tokenize(c:string){const t:Array<{code:number;value:string}>=[];const l=c.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');let i=0;while(i<l.length-1){const code=parseInt(l[i].trim(),10);if(!isNaN(code))t.push({code,value:l[i+1].trim()});i+=2;}return t;}
function gc(m:Map<number,string[]>,c:number,d=''):string{return m.get(c)?.[0]??d;}
function gcf(m:Map<number,string[]>,c:number,d=0):number{const v=m.get(c)?.[0];return v!==undefined?parseFloat(v)||d:d;}
function gcAll(m:Map<number,string[]>,c:number):string[]{return m.get(c)??[];}

function extractRaw(tokens:Array<{code:number;value:string}>,idx:number):{entity:DxfRawEntity;nextIdx:number}|null{
  const type=tokens[idx].value;const codes=new Map<number,string[]>();let i=idx+1;
  while(i<tokens.length){const t=tokens[i];if(t.code===0)break;const ex=codes.get(t.code);if(ex)ex.push(t.value);else codes.set(t.code,[t.value]);i++;}
  return{entity:{type,codes},nextIdx:i};
}

function collectPolyVerts(tokens:Array<{code:number;value:string}>,idx:number):{codes:Map<number,string[]>;nextIdx:number}{
  const aX:string[]=[],aY:string[]=[],base=new Map<number,string[]>();let i=idx;
  while(i<tokens.length&&tokens[i].code!==0){const{code,value}=tokens[i];const ex=base.get(code);if(ex)ex.push(value);else base.set(code,[value]);i++;}
  while(i<tokens.length){if(tokens[i].code===0){if(tokens[i].value==='SEQEND'){i++;break;}if(tokens[i].value==='VERTEX'){i++;let vx='0',vy='0';while(i<tokens.length&&tokens[i].code!==0){if(tokens[i].code===10)vx=tokens[i].value;if(tokens[i].code===20)vy=tokens[i].value;i++;}aX.push(vx);aY.push(vy);continue;}break;}i++;}
  base.set(10,aX);base.set(20,aY);return{codes:base,nextIdx:i};
}

function cvt(raw:DxfRawEntity,mm:number,iX=0,iY=0,sX=1,sY=1,rot=0):CadEntity|null{
  const{type,codes}=raw;const layer=gc(codes,8,'0');if(IGNORED_LAYERS.has(layer))return null;
  const tp=(x:number,y:number):Point=>{let rx=x*sX,ry=y*sY;if(rot!==0){const r=rot*Math.PI/180,c=Math.cos(r),s=Math.sin(r);const nx=rx*c-ry*s,ny=rx*s+ry*c;rx=nx;ry=ny;}return{x:(rx+iX)*mm,y:(ry+iY)*mm};};
  switch(type){
    case'LINE':{const p1=tp(gcf(codes,10),gcf(codes,20)),p2=tp(gcf(codes,11),gcf(codes,21));return{type:'LINE',x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,layer} as CadLine;}
    case'LWPOLYLINE':{const xs=gcAll(codes,10).map(Number),ys=gcAll(codes,20).map(Number),f=parseInt(gc(codes,70,'0'),10),pts=xs.map((x,i)=>tp(x,ys[i]??0));if(pts.length<2)return null;return{type:'POLYLINE',points:pts,closed:(f&1)===1,layer} as CadPolyline;}
    case'POLYLINE':{const xs=gcAll(codes,10).map(Number),ys=gcAll(codes,20).map(Number),f=parseInt(gc(codes,70,'0'),10),pts=xs.map((x,i)=>tp(x,ys[i]??0));if(pts.length<2)return null;return{type:'POLYLINE',points:pts,closed:(f&1)===1,layer} as CadPolyline;}
    case'ARC':{const c=tp(gcf(codes,10),gcf(codes,20)),r=gcf(codes,40)*mm*sX;if(r<=0)return null;return{type:'ARC',cx:c.x,cy:c.y,r,startAngle:(gcf(codes,50)+rot)%360,endAngle:(gcf(codes,51)+rot)%360,layer} as CadArc;}
    case'CIRCLE':{const c=tp(gcf(codes,10),gcf(codes,20)),r=gcf(codes,40)*mm*sX;if(r<=0)return null;return{type:'CIRCLE',cx:c.x,cy:c.y,r,layer} as CadCircle;}
    case'TEXT':case'MTEXT':{const p=tp(gcf(codes,10),gcf(codes,20)),t=gc(codes,1,'').replace(/\\P/g,'\n').replace(/\{[^}]*\}/g,'');if(!t)return null;return{type:'TEXT',text:t,x:p.x,y:p.y,height:gcf(codes,40,2.5)*mm,layer} as CadText;}
    default:return null;
  }
}

function explodeInsert(raw:DxfRawEntity,blocks:Map<string,DxfBlockDef>,mm:number,d=0):CadEntity[]{
  if(d>8)return[];const{codes}=raw;const block=blocks.get(gc(codes,2));if(!block)return[];
  const iX=gcf(codes,10)-block.baseX,iY=gcf(codes,20)-block.baseY,sX=gcf(codes,41,1),sY=gcf(codes,42,1),rot=gcf(codes,50,0);
  const r:CadEntity[]=[];
  for(const e of block.entities){if(e.type==='INSERT')r.push(...explodeInsert(e,blocks,mm,d+1));else{const c=cvt(e,mm,iX,iY,sX,sY,rot);if(c)r.push(c);}}
  return r;
}

export interface ParseResult{entities:CadEntity[];insunits:number;layers:string[];warnings:string[];}

export function parseDxf(content:string):ParseResult{
  const warnings:string[]=[];
  if(!content?.trim())throw new Error('File DXF vuoto');
  const tokens=tokenize(content);
  if(tokens.length<4)throw new Error('File DXF non valido');
  const blocks=new Map<string,DxfBlockDef>();
  const rawEntities:DxfRawEntity[]=[];
  let insunits=4;
  let i=0;const len=tokens.length;
  while(i<len){
    if(tokens[i].code===0&&tokens[i].value==='SECTION'&&tokens[i+1]?.code===2){
      const sname=tokens[i+1].value;i+=2;
      if(sname==='HEADER'){while(i<len){if(tokens[i].code===0&&tokens[i].value==='ENDSEC')break;if(tokens[i].code===9&&tokens[i].value==='$INSUNITS'&&tokens[i+1])insunits=parseInt(tokens[i+1].value,10)||4;i++;}}
      else if(sname==='BLOCKS'){
        while(i<len){if(tokens[i].code===0&&tokens[i].value==='ENDSEC')break;if(tokens[i].code===0&&tokens[i].value==='BLOCK'){i++;let bn='',bx=0,by=0;const bes:DxfRawEntity[]=[];while(i<len&&tokens[i].code!==0){if(tokens[i].code===2)bn=tokens[i].value;if(tokens[i].code===10)bx=parseFloat(tokens[i].value)||0;if(tokens[i].code===20)by=parseFloat(tokens[i].value)||0;i++;}while(i<len){if(tokens[i].code===0&&tokens[i].value==='ENDBLK'){i++;break;}if(tokens[i].code===0&&tokens[i].value==='ENDSEC')break;if(tokens[i].code===0&&!IGNORED_ENTITY_TYPES.has(tokens[i].value)){const r=extractRaw(tokens,i);if(r){bes.push(r.entity);i=r.nextIdx;continue;}}i++;}if(bn)blocks.set(bn,{name:bn,baseX:bx,baseY:by,entities:bes});continue;}i++;}
      }
      else if(sname==='ENTITIES'){while(i<len){if(tokens[i].code===0&&tokens[i].value==='ENDSEC')break;if(tokens[i].code===0&&!IGNORED_ENTITY_TYPES.has(tokens[i].value)&&tokens[i].value!=='ENDSEC'){const r=extractRaw(tokens,i);if(r){rawEntities.push(r.entity);i=r.nextIdx;continue;}}i++;}}
      continue;
    }
    i++;
  }
  // Legacy POLYLINE vertices
  const legMap=new Map<number,Map<number,string[]>>();
  {let j=0,ri=0;while(j<tokens.length){if(tokens[j].code===0&&tokens[j].value==='POLYLINE'){j++;const{codes,nextIdx}=collectPolyVerts(tokens,j);legMap.set(ri,codes);j=nextIdx;ri++;continue;}if(tokens[j].code===0&&!IGNORED_ENTITY_TYPES.has(tokens[j].value)&&tokens[j].value!=='ENDSEC'&&tokens[j].value!=='EOF')ri++;j++;}}
  const mm=CAD_UNITS_TO_MM[insunits]??1;
  if(insunits===0)warnings.push('Unità non specificate: assunto mm');
  const entities:CadEntity[]=[];const layerSet=new Set<string>();let pCnt=0;
  for(const raw of rawEntities){
    const layer=raw.codes.get(8)?.[0]??'0';layerSet.add(layer);
    if(IGNORED_LAYERS.has(layer))continue;
    if(raw.type==='INSERT'){entities.push(...explodeInsert(raw,blocks,mm));continue;}
    if(raw.type==='POLYLINE'){const en=legMap.get(pCnt++);if(en){const e=cvt({type:'POLYLINE',codes:en},mm);if(e)entities.push(e);}continue;}
    const e=cvt(raw,mm);if(e)entities.push(e);
  }
  if(!entities.length)warnings.push('Nessuna entità trovata');
  return{entities,insunits,layers:Array.from(layerSet).filter(l=>!IGNORED_LAYERS.has(l)),warnings};
}
