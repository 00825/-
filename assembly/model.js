export const TAU=Math.PI*2;
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export const GEARS=[{x:-1.65,y:-.85,z:1.5,n:24,r:.9},{x:-.15,y:-.85,z:1.5,n:16,r:.6},{x:1.05,y:.05,z:1.5,n:24,r:.9}];
export const TRAVEL=2.25,MAX_TURN=TRAVEL/.9,SCREW_TURN=Math.PI*1.35;
export const CHAPTERS=[
 {year:'1995',event:'投资开发',name:'腾飞新苏坊',short:'新苏坊',theme:'产业空间',growth:'模块落位',line:'预建标准厂房，让企业更快开始。',role:'建设与制造'},
 {year:'1998',event:'开业',name:'新城邻里中心',short:'邻里中心',theme:'日常生活',growth:'围合展开',line:'邻里中心，把日常服务带到居民身边。',role:'服务与生活'},
 {year:'2007',event:'开业',name:'苏州文化艺术中心',short:'苏艺',theme:'公共文化',growth:'曲面卷展',line:'演出、展览与公共文化，为城市增添新的空间。',role:'文化与创作'},
 {year:'2013',event:'首期投用',name:'苏州纳米城',short:'纳米城',theme:'研发创新',growth:'递归细分',line:'从研究单元出发，连接研发、中试与生产。',role:'研究与协作'},
 {year:'2016',event:'竣工',name:'东方之门',short:'东方之门',theme:'城市地标',growth:'双塔合拢',line:'从两座塔楼，到连接天际的城市之门。',role:'连接与共享'}
];
export const TOTAL_TURN=MAX_TURN*CHAPTERS.length,LAYER_STEP=TRAVEL;
export function layerGrowth(journey,index){const raw=clamp(journey-index);return{raw,deck:smooth(raw/.18),build:smooth((raw-.12)/.82),y:-.35+index*LAYER_STEP};}
export function pieceGrowth(p,index,count,overlap=.48){const start=(index/Math.max(1,count-1))*(1-overlap);return smooth((p-start)/overlap);}
export function nanoCells(){const cells=[];for(let x=0;x<4;x++)for(let z=0;z<4;z++){if(x>0&&x<3&&z>0&&z<3)continue;cells.push({x:(x-1.5)*.9,z:(z-1.5)*.57,w:.76,d:.46,h:.66+((x+z)%3)*.16});}return cells;}
export function drivenAngle(parent,child,theta){const a=Math.atan2(child.y-parent.y,child.x-parent.x);return a+Math.PI-Math.PI/child.n-parent.n/child.n*(theta-a);}
export function transmission(theta){const b=drivenAngle(GEARS[0],GEARS[1],theta),c=drivenAngle(GEARS[1],GEARS[2],b),b0=drivenAngle(GEARS[0],GEARS[1],0),c0=drivenAngle(GEARS[1],GEARS[2],b0);return{angles:[theta,b,c],lift:(c-c0)*GEARS[2].r};}
export class AssemblyState{
 constructor(){this.reset();}
 reset(){this.screw=0;this.connected=false;this.turn=0;this.connections=0;this.distance=0;this.moved=false;this.peak=0;}
 get progress(){return this.turn/TOTAL_TURN;}
 get journey(){return this.turn/MAX_TURN;}
 get chapter(){return Math.min(CHAPTERS.length-1,Math.floor(this.journey));}
 get chapterProgress(){return this.journey>=CHAPTERS.length?1:this.journey-this.chapter;}
 get completed(){return Math.min(CHAPTERS.length,Math.floor(this.journey+1e-9));}
 get stage(){return !this.connected?0:this.journey>=CHAPTERS.length?CHAPTERS.length+1:this.chapter+1;}
 rotate(delta){if(!Number.isFinite(delta))return;if(!this.connected){this.screw=clamp(this.screw+delta,0,SCREW_TURN);if(this.screw>=SCREW_TURN-1e-6){this.screw=SCREW_TURN;this.connected=true;this.connections++;}}else{const previous=this.turn;this.turn=clamp(this.turn+delta,0,TOTAL_TURN);this.distance+=Math.abs(this.turn-previous);this.moved||=this.distance>.04;this.peak=Math.max(this.peak,this.progress);}}
}

// Common module .075; an involute-inspired profile with root relief, not a CAD-rated gear.
export function gearProfile(teeth,module=.075){
 const r=teeth*module/2,rb=r*Math.cos(Math.PI/9),root=r-1.25*module,tip=r+module;
 const inv=radius=>{const t=Math.sqrt(Math.max(0,(radius/rb)**2-1));return t-Math.atan(t);};
 const invP=inv(r),width=radius=>Math.PI/(2*teeth)+invP-inv(Math.max(radius,rb)),points=[];
 for(let k=0;k<teeth;k++){
  const center=k*TAU/teeth,add=(radius,a)=>points.push([radius*Math.cos(a),radius*Math.sin(a)]);
  add(root,center-Math.PI/teeth);add(root,center-width(rb)-.018);
  for(let j=0;j<=4;j++){const radius=rb+(tip-rb)*j/4;add(radius,center-width(radius));}
  add(tip,center);for(let j=4;j>=0;j--){const radius=rb+(tip-rb)*j/4;add(radius,center+width(radius));}
  add(root,center+width(rb)+.018);
 }
 return points;
}
