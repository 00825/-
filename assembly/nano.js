import {smooth} from './model.js';

// Original courtyard study inspired by HENN's scale hierarchy, not a surveyed block plan.
export const NANO_PAVILIONS=[
 {x:-.85,z:-2.02,w:1.42,d:.73,levels:5}, {x:.85,z:-2.02,w:1.42,d:.73,levels:5},
 {x:-1.69,z:-1.04,w:.68,d:1.06,levels:4}, {x:1.69,z:-1.04,w:.68,d:1.06,levels:4},
 {x:-1.43,z:-.10,w:1.06,d:.62,levels:2}, {x:1.43,z:-.10,w:1.06,d:.62,levels:2}
];
export const NANO_STOREY=.235;
export function nanoGrowth(p){return{site:smooth(p/.20),floors:smooth((p-.08)/.69),bridges:smooth((p-.63)/.23),garden:smooth((p-.74)/.22),life:smooth((p-.92)/.08)};}
export function nanoFloorProgress(p,building,level){const start=.07+level*.106+building*.022;return smooth((p-start)/.23);}

export function nanoStack(p,index){let base=0;return Array.from({length:NANO_PAVILIONS[index].levels},(_,level)=>{const progress=nanoFloorProgress(p,index,level),height=progress*NANO_STOREY,storey={base,height,progress};base+=height;return storey;});}

export class NanoScene{
 constructor(r,{Builder,C,craft}){this.r=r;this.Builder=Builder;this.C=C;this.craft=craft;this.pavilions=NANO_PAVILIONS.map(spec=>({...spec,full:this.makeStorey(spec,false),low:this.makeStorey(spec,true),roof:this.makeRoof(spec,false),simpleRoof:this.makeRoof(spec,true)}));this.bridge=this.makeBridge(false);this.simpleBridge=this.makeBridge(true);}
 box(b,p,s,low=true){if(low)this.craft.addBox(b,p,s);else this.craft.addChamfer(b,p,s,.0015);}
 meshes(groups){return Object.fromEntries(Object.entries(groups).map(([key,b])=>[key,this.r.mesh(b.d)]));}
 makeStorey(spec,low){const {w,d}=spec,g=Object.fromEntries(['wall','frame','room','glass','detail'].map(k=>[k,new this.Builder()])),add=(key,p,s)=>this.box(g[key],p,s,low||key==='room');
  add('wall',[0,.022,0],[w,.044,d]);
  // Window openings have wall thickness, a recessed pane and a room backing.
  for(const side of[-1,1])for(const axis of[0,2]){const length=axis===0?w:d,depth=axis===0?d:w,bays=Math.max(2,Math.round(length/.31)),pitch=(length-.09)/bays,pane=pitch-.035;
   const at=(u,y,z)=>axis===0?[u,y,z]:[z,y,u],size=(a,b,c)=>axis===0?[a,b,c]:[c,b,a];
   add('wall',at(0,.223,side*(depth/2-.019)),size(length,.025,.055));
   for(let bay=0;bay<bays;bay++){const u=-length/2+.045+pitch*(bay+.5),y=.133,face=side*(depth/2-.025),normal=axis===0?[0,0,side]:[side,0,0];
    const a=at(u-pane/2,.059,face),b=at(u+pane/2,.059,face),c=at(u+pane/2,.207,face),e=at(u-pane/2,.207,face);g.glass.quad(a,b,c,e,normal);
    add('room',at(u,y,side*(depth/2-.14)),size(pane,.162,.016));
    for(const dx of[-pitch/2,pitch/2])add('wall',at(u+dx,y,side*(depth/2-.018)),size(.031,.183,.075));
    for(const dx of[-pane/2,pane/2])add('frame',at(u+dx,y,side*(depth/2-.009)),size(.009,.158,.025));
    for(const dy of[-.077,.077])add('frame',at(u,y+dy,side*(depth/2-.009)),size(pane,.009,.025));
    if(!low){add('frame',at(u+pane*.19,y,side*(depth/2-.007)),size(.006,.149,.027));add('frame',at(u,y+.032,side*(depth/2-.007)),size(pane,.006,.027));add('detail',at(u,.049,side*(depth/2+.012)),size(pitch+.012,.012,.10));}
   }
  }
  for(const x of[-w/2+.025,w/2-.025])for(const z of[-d/2+.025,d/2-.025])add('wall',[x,.136,z],[.063,.194,.063]);
  return this.meshes(g);
 }
 makeRoof({w,d,levels},low){const g=Object.fromEntries(['wall','metal','vents'].map(k=>[k,new this.Builder()])),add=(key,p,s)=>this.box(g[key],p,s,low);
  add('metal',[0,.004,0],[w-.05,.022,d-.05]);
  for(const z of[-d/2+.012,d/2-.012])add('wall',[0,.049,z],[w+.025,.08,.037]);
  for(const x of[-w/2+.012,w/2-.012])add('wall',[x,.049,0],[.037,.08,d]);
  if(levels<=2){add('metal',[w*.2,.026,-d*.16],[w*.24,.021,d*.24]);return this.meshes(g);}
  add('wall',[-w*.18,.085,-d*.1],[w*.28,.14,d*.36]);add('metal',[-w*.18,.159,-d*.1],[w*.30,.014,d*.38]);
  if(!low){for(let j=0;j<7;j++)add('vents',[-w*.18,.065+j*.014,d*.08],[w*.245,.005,.013]);
   for(let j=0;j<5;j++)add('metal',[w*.23,.055,-d*.22+j*d*.10],[w*.18,.04,.018]);}
  return this.meshes(g);
 }
 makeBridge(low){const g=Object.fromEntries(['wall','metal','glass','room'].map(k=>[k,new this.Builder()])),add=(key,p,s)=>this.box(g[key],p,s,low);
  add('wall',[0,0,0],[2.77,.045,.28]);add('wall',[0,.264,0],[2.79,.032,.29]);
  add('room',[0,.13,-.11],[2.7,.23,.013]);
  for(const side of[-1,1]){const z=side*.145;g.glass.quad([-1.36,.026,z],[1.36,.026,z],[1.36,.245,z],[-1.36,.245,z],[0,0,side]);
   for(let k=0;k<=18;k++)add('metal',[-1.36+k*2.72/18,.135,z],[low?.010:.007,.233,.018]);
   if(!low)for(let k=0;k<55;k++)add('metal',[-1.35+k*.05,.13,z+.013*side],[.006,.19,.006]);
  }
  return this.meshes(g);
 }
 draw(y,p){const r=this.r,g=nanoGrowth(p),glass=[];r.receiveShadow=true;
  r.bevelAt([0,y-.012,-1.02],[4.84*g.site,.075*g.site,3.08*g.site],[.65,.67,.62]);
  r.boxAt([0,y+.031,-1.02],[4.77*g.site,.014,3.01*g.site],[.64,.65,.61],0,0,12);
  for(let k=0;k<this.pavilions.length;k++){const b=this.pavilions[k],mesh=r.low?b.low:b.full,stack=nanoStack(p,k);
   for(let level=0;level<b.levels;level++){const t=stack[level].progress;if(t<=0)continue;const spread=.90+.10*t,base=y+.042+stack[level].base,at=[b.x,base,b.z],scale=[spread,t,spread];
    r.draw(mesh.wall,at,scale,[.81,.81,.76],0,0,11);r.draw(mesh.frame,at,scale,[.19,.24,.25],0,0,13);r.draw(mesh.room,at,scale,[.40,.44,.42],0,0,24);if(!r.low)r.draw(mesh.detail,at,scale,[.62,.64,.61],0,0,18);glass.push([mesh.glass,at,scale]);
   }
   const t=nanoFloorProgress(p,k,b.levels-1),roof=r.low?b.simpleRoof:b.roof,at=[b.x,y+.042+stack.reduce((sum,f)=>sum+f.height,0),b.z],size=[t,t,t];
   for(const key of['wall','metal','vents'])r.draw(roof[key],at,size,key==='wall'?[.82,.82,.77]:[.29,.34,.34],0,0,key==='wall'?11:13);
   const entry=smooth((p-.56-k*.025)/.20),front=b.z+b.d/2+.008;
   if(k>=4){r.boxAt([b.x,y+.14*entry,front],[.26*entry,.22*entry,.021],[.19,.26,.27],0,0,18);r.boxAt([b.x,y+.274*entry,front+.07],[.43*entry,.023,.22*entry],[.69,.71,.67],0,0,18);}
  }
  // One glazed research link crosses the garden; its narrow slats cast real shadows.
  const bridge=r.low?this.simpleBridge:this.bridge,bt=g.bridges,at=[0,y+.53,-.91],size=[bt,bt,bt];
  r.draw(bridge.wall,at,size,[.78,.79,.75],0,0,11);r.draw(bridge.metal,at,size,[.22,.28,.29],0,0,13);r.draw(bridge.room,at,size,[.40,.44,.42],0,0,24);glass.push([bridge.glass,at,size]);
  const garden=g.garden;
  for(const side of[-1,1]){r.bevelAt([side*.58,y+.066,-.84],[.86*garden,.055,.95*garden],[.68,.70,.64]);r.boxAt([side*.58,y+.099,-.84],[.80*garden,.016,.89*garden],[.23,.34,.20],0,0,19);
   r.boxAt([side*.58,y+.123,-.33],[.61*garden,.046,.12],[.39,.29,.18],0,0,14);
   const x=side*.66,z=-.51;r.draw(this.craft.column,[x,y+.27*garden,z],[.025,.39*garden,.025],[.28,.23,.16],0,0,14);r.draw(r.low?this.craft.leaf:this.craft.foliage,[x,y+.51*garden,z],[.21*garden,.25*garden,.21*garden],[.25,.36,.21],0,side*.2,15);
  }
  r.boxAt([0,y+.052,-.78],[.15*garden,.012,1.16*garden],[.12,.29,.32],0,0,2);
  r.boxAt([0,y+.067,-.20],[.44*garden,.025,.25*garden],[.73,.73,.68],0,0,12);
  if(g.life>0){const count=r.low?1:3;for(let i=0;i<count;i++){const t=r.time*.15+i*2.1,x=1.14*Math.sin(t);this.craft.person(x,y+.043,.31,r.time*3.5+i,[.24+i*.06,.30,.31],g.life,Math.cos(t)>0?Math.PI/2:-Math.PI/2);}}
  if(!r.shadowPass)for(const [mesh,pos,scale]of glass)r.glass(mesh,pos,scale);
  r.receiveShadow=false;
 }
}
