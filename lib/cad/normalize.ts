// MASTRO — CAD Normalizer (GPT o1)
import { CadEntity, CadArc, CadPolyline, BoundingBox, DxfModel, DxfProfile, SnapPoint, Point } from './types';

export function computeBounds(entities:CadEntity[]):BoundingBox{
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  const exp=(x:number,y:number)=>{if(x<minX)minX=x;if(y<minY)minY=y;if(x>maxX)maxX=x;if(y>maxY)maxY=y;};
  for(const e of entities){
    switch(e.type){
      case'LINE':exp(e.x1,e.y1);exp(e.x2,e.y2);break;
      case'POLYLINE':e.points.forEach(p=>exp(p.x,p.y));break;
      case'ARC':{const sa=e.startAngle*Math.PI/180,ea=e.endAngle*Math.PI/180;exp(e.cx-e.r,e.cy-e.r);exp(e.cx+e.r,e.cy+e.r);exp(e.cx+e.r*Math.cos(sa),e.cy+e.r*Math.sin(sa));exp(e.cx+e.r*Math.cos(ea),e.cy+e.r*Math.sin(ea));break;}
      case'CIRCLE':exp(e.cx-e.r,e.cy-e.r);exp(e.cx+e.r,e.cy+e.r);break;
      case'TEXT':exp(e.x,e.y);break;
    }
  }
  if(!isFinite(minX)){minX=0;minY=0;maxX=0;maxY=0;}
  return{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};
}

export function normalizeEntities(entities:CadEntity[],sourceFile:string,layers:string[]):DxfModel{
  const raw=computeBounds(entities);
  const trans=entities.map(e=>{
    switch(e.type){
      case'LINE':return{...e,x1:e.x1-raw.minX,y1:e.y1-raw.minY,x2:e.x2-raw.minX,y2:e.y2-raw.minY};
      case'POLYLINE':return{...e,points:e.points.map(p=>({x:p.x-raw.minX,y:p.y-raw.minY}))};
      case'ARC':return{...e,cx:e.cx-raw.minX,cy:e.cy-raw.minY};
      case'CIRCLE':return{...e,cx:e.cx-raw.minX,cy:e.cy-raw.minY};
      case'TEXT':return{...e,x:e.x-raw.minX,y:e.y-raw.minY};
    }
  });
  // dedup
  const seen=new Set<string>();
  const deduped=trans.filter(e=>{
    let k='';const T=0.001;const pk=(x:number,y:number)=>`${Math.round(x/T)},${Math.round(y/T)}`;
    switch(e.type){case'LINE':k=`L:${pk(e.x1,e.y1)}-${pk(e.x2,e.y2)}`;break;case'POLYLINE':k=`P:${e.points.map(p=>pk(p.x,p.y)).join('|')}:${e.closed}`;break;case'ARC':k=`A:${pk(e.cx,e.cy)},${Math.round(e.r/T)}`;break;case'CIRCLE':k=`C:${pk(e.cx,e.cy)},${Math.round(e.r/T)}`;break;case'TEXT':k=`T:${pk(e.x,e.y)}:${e.text}`;break;}
    if(seen.has(k))return false;seen.add(k);return true;
  });
  const bounds=computeBounds(deduped);
  return{entities:deduped,bounds,layers,units:'mm',sourceFile,entityCount:deduped.length};
}

export function generateSnapPoints(entities:CadEntity[]):SnapPoint[]{
  const snaps:SnapPoint[]=[];const seen=new Set<string>();
  const add=(x:number,y:number,kind:SnapPoint['kind'],idx?:number)=>{
    const k=`${Math.round(x/0.01)},${Math.round(y/0.01)},${kind}`;
    if(seen.has(k))return;seen.add(k);
    snaps.push({x:Math.round(x*1e6)/1e6,y:Math.round(y*1e6)/1e6,kind,entityIndex:idx});
  };
  entities.forEach((e,idx)=>{
    switch(e.type){
      case'LINE':add(e.x1,e.y1,'corner',idx);add(e.x2,e.y2,'corner',idx);add((e.x1+e.x2)/2,(e.y1+e.y2)/2,'mid',idx);break;
      case'POLYLINE':e.points.forEach((p,pi)=>{add(p.x,p.y,'corner',idx);if(pi<e.points.length-1)add((p.x+e.points[pi+1].x)/2,(p.y+e.points[pi+1].y)/2,'mid',idx);});break;
      case'ARC':{const sa=e.startAngle*Math.PI/180,ea=e.endAngle*Math.PI/180;add(e.cx+e.r*Math.cos(sa),e.cy+e.r*Math.sin(sa),'corner',idx);add(e.cx+e.r*Math.cos(ea),e.cy+e.r*Math.sin(ea),'corner',idx);add(e.cx,e.cy,'corner',idx);break;}
      case'CIRCLE':add(e.cx,e.cy,'corner',idx);add(e.cx+e.r,e.cy,'mid',idx);add(e.cx-e.r,e.cy,'mid',idx);break;
    }
  });
  return snaps;
}

function polyArea(pts:Point[]):number{let a=0;const n=pts.length;for(let i=0;i<n;i++){const j=(i+1)%n;a+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;}return Math.abs(a)/2;}
function ptInPoly(pt:Point,poly:Point[]):boolean{let inside=false;const n=poly.length;for(let i=0,j=n-1;i<n;j=i++){const xi=poly[i].x,yi=poly[i].y,xj=poly[j].x,yj=poly[j].y;if((yi>pt.y)!==(yj>pt.y)&&pt.x<(xj-xi)*(pt.y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}

export function extractProfile(model:DxfModel):DxfProfile|null{
  const closed=model.entities.filter((e):e is CadPolyline=>e.type==='POLYLINE'&&e.closed&&e.points.length>=3);
  if(!closed.length)return null;
  const wa=closed.map(p=>({poly:p,area:polyArea(p.points)}));wa.sort((a,b)=>b.area-a.area);
  const outer=wa[0].poly;
  const holes:Point[][]=[];
  for(let i=1;i<wa.length;i++){if(ptInPoly(wa[i].poly.points[0],outer.points))holes.push(wa[i].poly.points);}
  const bounds=computeBounds([outer]);
  return{outer:outer.points,holes,thickness:bounds.width,bounds};
}
