// MASTRO — CAD Import Types
export type Point = { x: number; y: number };

export type CadLine = { type:'LINE'; x1:number; y1:number; x2:number; y2:number; layer:string };
export type CadPolyline = { type:'POLYLINE'; points:Point[]; closed:boolean; layer:string };
export type CadArc = { type:'ARC'; cx:number; cy:number; r:number; startAngle:number; endAngle:number; layer:string };
export type CadCircle = { type:'CIRCLE'; cx:number; cy:number; r:number; layer:string };
export type CadText = { type:'TEXT'; text:string; x:number; y:number; height:number; layer:string };
export type CadEntity = CadLine | CadPolyline | CadArc | CadCircle | CadText;

export type BoundingBox = { minX:number; minY:number; maxX:number; maxY:number; width:number; height:number };
export type DxfModel = { entities:CadEntity[]; bounds:BoundingBox; layers:string[]; units:'mm'; sourceFile:string; entityCount:number };
export type DxfProfile = { outer:Point[]; holes:Point[][]; thickness?:number; bounds:BoundingBox };
export type SnapKind = 'corner'|'mid'|'intersection';
export type SnapPoint = { x:number; y:number; kind:SnapKind; entityIndex?:number };
export type CadImportResult = { model:DxfModel; profile:DxfProfile|null; snapPoints:SnapPoint[]; warnings:string[] };
export type CadImportError = { error:string; details?:string };
export type DxfRawEntity = { type:string; codes:Map<number,string[]> };
export type DxfBlockDef = { name:string; baseX:number; baseY:number; entities:DxfRawEntity[] };

export const CAD_UNITS_TO_MM: Record<number,number> = {
  0:1, 1:25.4, 2:304.8, 3:1609344, 4:1, 5:10, 6:1000,
  7:0.0000254, 8:0.0254, 9:914.4, 10:1e-7, 11:1e-6, 12:0.001,
  13:100, 14:10000, 15:1000000,
};
export const IGNORED_LAYERS = new Set(['defpoints','DEFPOINTS','dimensions','DIMENSIONS','dim','DIM','hatch','HATCH','hatching','HATCHING','annotation','ANNOTATION','notes','NOTES','text','TEXT_LAYER']);
export const IGNORED_ENTITY_TYPES = new Set(['DIMENSION','HATCH','LEADER','MLEADER','MTEXT','ATTDEF','ATTRIB','VIEWPORT','IMAGE','WIPEOUT','SOLID','3DFACE','SPLINE','ELLIPSE','RAY','XLINE','TOLERANCE','ACAD_PROXY_ENTITY']);
