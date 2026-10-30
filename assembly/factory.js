import {smooth} from './model.js';

// Original interpretation of the factory photograph in the architect's retrospective.
// The five levels, L arrangement and details are illustrative, not a surveyed 1995 site.
export const FACTORY_BLOCKS=[
 {x:.05,z:-1.91,w:4.12,d:.88,levels:5,bays:12,stairs:[2,8]},
 {x:-1.49,z:-.76,w:1.04,d:1.42,levels:5,bays:3,stairs:[]}
];
export const FACTORY_STOREY=.305;
export function factoryGrowth(p){return{site:smooth(p/.17),roof:smooth((p-.72)/.16),garden:smooth((p-.76)/.19),life:smooth((p-.91)/.09)};}
export function factoryFloorProgress(p,block,level){return smooth((p-.055-block*.055)*7-level);}
export function factoryStack(p,block){let base=0;return Array.from({length:FACTORY_BLOCKS[block].levels},(_,level)=>{const progress=factoryFloorProgress(p,block,level),height=FACTORY_STOREY*progress,part={base,height,progress};base+=height;return part;});}

export class FactoryScene{
 constructor(r,{Builder,C,craft}){this.r=r;this.Builder=Builder;this.C=C;this.craft=craft;this.blocks=FACTORY_BLOCKS.map(s=>({...s,full:this.makeStorey(s,false),low:this.makeStorey(s,true),roof:this.makeRoof(s,false),simpleRoof:this.makeRoof(s,true)}));this.site=this.makeSite(false);this.simpleSite=this.makeSite(true);}
 groups(keys){return Object.fromEntries(keys.map(k=>[k,new this.Builder()]));}
 meshes(groups){return Object.fromEntries(Object.entries(groups).map(([key,b])=>[key,this.r.mesh(b.d)]));}
 box(g,key,p,s,low=false){if(low||key==='room')this.craft.addBox(g[key],p,s);else this.craft.addChamfer(g[key],p,s,.0015);}
 makeStorey(spec,low){const {w,d,bays,stairs}=spec,g=this.groups(['wall','frame','room','glass','detail']),add=(key,p,s)=>this.box(g,key,p,s,low);
  add('wall',[0,.017,0],[w,.034,d]);
  for(const axis of[0,2])for(const side of[-1,1]){const length=axis===0?w:d,depth=axis===0?d:w,count=axis===0?bays:Math.max(2,Math.round(d/.32)),pitch=(length-.07)/count;
   const at=(u,y,z)=>axis===0?[u,y,z]:[z,y,u],size=(a,b,c)=>axis===0?[a,b,c]:[c,b,a],normal=axis===0?[0,0,side]:[side,0,0];
   for(let bay=0;bay<count;bay++){const u=-length/2+.035+(bay+.5)*pitch,stair=axis===0&&stairs.includes(bay),pane=stair?pitch-.045:Math.min(.187,pitch-.085),bottom=stair?.035:.088,top=stair?.291:.245,cy=(bottom+top)/2,face=side*(depth/2-.027),front=side*(depth/2+.005);
    // Wall pieces surround genuine openings; the blue pane is recessed into them.
    add('wall',at(u,bottom/2,side*(depth/2-.026)),size(pitch,bottom,.055));
    add('wall',at(u,(top+FACTORY_STOREY)/2,side*(depth/2-.026)),size(pitch,FACTORY_STOREY-top,.055));
    for(const dx of[-1,1]){const strip=(pitch-pane)/2;add('wall',at(u+dx*(pane/2+strip/2),cy,side*(depth/2-.026)),size(strip,top-bottom,.055));}
    g.glass.quad(at(u-pane/2,bottom,face),at(u+pane/2,bottom,face),at(u+pane/2,top,face),at(u-pane/2,top,face),normal);
    add('room',at(u,cy,side*(depth/2-.145)),size(pane,top-bottom,.013));
    for(const dx of[-1,1])add('frame',at(u+dx*pane/2,cy,front),size(.008,top-bottom+.012,.019));
    for(const yy of[bottom,top])add('frame',at(u,yy,front),size(pane+.008,.008,.019));
    if(!low){add('frame',at(u,cy,front),size(.005,top-bottom,.021));add('frame',at(u,cy+.021,front),size(pane,.005,.021));add('detail',at(u,bottom-.008,side*(depth/2+.017)),size(pane+.026,.012,.075));}
    if(stair){
     // A simplified stair flight sits behind each glazed vertical bay.
     const steps=low?3:7;for(let j=0;j<steps;j++)add('room',at(u-pane*.40+pane*.8*(j+.5)/steps,.055+j*.031,side*(depth/2-.076)),size(pane*.9/steps,.014,.094));
     for(const yy of[.034,.286])add('detail',at(u,yy,side*(depth/2+.021)),size(pitch,.012,.064));
    }
   }
   // Quiet concrete edge below each window band, with a physical drip ledge.
   add('detail',at(0,.025,side*(depth/2+.005)),size(length,.012,.035));
  }
  for(const x of[-w/2+.022,w/2-.022])for(const z of[-d/2+.022,d/2-.022])add('wall',[x,.158,z],[.045,.294,.045]);
  return this.meshes(g);
 }
 makeRoof(spec,low){const {w,d}=spec,g=this.groups(['wall','metal','detail']),add=(key,p,s)=>this.box(g,key,p,s,low);
  add('metal',[0,.008,0],[w-.035,.022,d-.035]);
  for(const side of[-1,1]){add('wall',[0,.043,side*(d/2-.015)],[w+.014,.073,.035]);add('wall',[side*(w/2-.015),.043,0],[.035,.073,d]);
   add('detail',[0,.082,side*(d/2-.01)],[w+.026,.012,.045]);}
  const cores=spec.stairs.length?spec.stairs.map(i=>-w/2+.035+(i+.5)*(w-.07)/spec.bays):[-w*.28];
  for(const x of cores){add('wall',[x,.098,-d*.14],[spec.stairs.length?.34:.28,.18,d*.57]);add('detail',[x,.195,-d*.14],[spec.stairs.length?.37:.31,.018,d*.59]);
   if(!low)for(let j=0;j<5;j++)add('metal',[x-.105+j*.052,.118,d*.15],[.012,.105,.018]);}
  if(!low){const n=Math.max(2,Math.round(w/.35));for(let i=1;i<n;i++)add('detail',[-w/2+i*w/n,.023,0],[.005,.004,d-.08]);
   for(const side of[-1,1]){add('metal',[side*(w/2-.04),-.24,d/2+.018],[.009,.48,.012]);add('metal',[side*(w/2-.04),.105,-d/2+.08],[.005,.15,.005]);}}
  return this.meshes(g);
 }
 makeSite(low){const g=this.groups(['paving','road','curb','paint','garden','metal','entry']),add=(key,p,s)=>this.box(g,key,p,s,low);
  add('paving',[0,.025,-1.02],[4.98,.05,3.10]);
  add('road',[0,.054,.235],[4.86,.014,.42]);add('road',[.15,.054,-.78],[2.90,.012,.68]);
  for(const z of[.015,.46])add('curb',[0,.068,z],[4.88,.028,.035]);
  for(let i=0;i<11;i++)add('paint',[-2.30+i*.45,.064,.22],[.18,.003,.014]);
  for(let i=0;i<6;i++)add('paint',[.12+i*.06,.065,.22],[.028,.003,.28]);
  for(const x of[-2.18,1.99]){add('curb',[x,.082,-.73],[.34,.08,.88]);add('garden',[x,.125,-.73],[.29,.018,.82]);}
  for(let i=0;i<5;i++)add('paint',[-.55+i*.40,.064,-.76],[.010,.003,.46]);
  add('curb',[.15,.061,-.27],[2.86,.016,.32]);
  // A restrained recessed doorway, projecting canopy and a stone threshold.
  const x=.75,z=-1.447;add('entry',[x,.176,z],[.30,.24,.018]);add('metal',[x,.174,z+.014],[.010,.23,.016]);
  add('metal',[x,.327,z+.12],[.52,.023,.28]);for(const dx of[-.22,.22])add('metal',[x+dx,.195,z+.20],[.012,.25,.012]);add('curb',[x,.075,z+.15],[.46,.028,.34]);
  if(!low){for(let i=0;i<48;i++)add('metal',[-2.25+i*.094,.069,-.025],[.009,.006,.028]);
   for(const x of[-1.80,1.73]){add('curb',[x,.08,-.15],[.30,.05,.20]);add('entry',[x,.116,-.15],[.26,.025,.16]);}}
  return this.meshes(g);
 }
 draw(y,p){const r=this.r,g=factoryGrowth(p),glass=[],site=r.low?this.simpleSite:this.site;r.receiveShadow=true;
  const siteColors={paving:[.63,.64,.59],road:[.19,.22,.23],curb:[.73,.73,.66],paint:[.88,.85,.70],garden:[.25,.34,.20],metal:[.28,.33,.33],entry:[.16,.23,.25]},modes={paving:12,road:17,curb:12,paint:18,garden:19,metal:13,entry:18};
  for(const key of Object.keys(site))r.draw(site[key],[0,y,0],[g.site,g.site,g.site],siteColors[key],0,0,modes[key]);
  for(let k=0;k<this.blocks.length;k++){const b=this.blocks[k],mesh=r.low?b.low:b.full,stack=factoryStack(p,k);
   for(let level=0;level<b.levels;level++){const t=stack[level].progress;if(t<=0)continue;const at=[b.x,y+.057+stack[level].base,b.z],scale=[1,t,1],ochre=level===2||level===3;
    // At sub-pixel heights draw only the floor plate, avoiding coincident window surfaces.
    if(t<.025){r.boxAt([b.x,at[1]+.017*t,b.z],[b.w,.034*t,b.d],[.67,.67,.61],0,0,11);continue;}
    r.draw(mesh.wall,at,scale,ochre?[.72,.48,.24]:[.80,.79,.70],0,0,11);r.draw(mesh.frame,at,scale,[.56,.59,.55],0,0,13);r.draw(mesh.room,at,scale,[.21,.26,.26],0,0,22);if(!r.low)r.draw(mesh.detail,at,scale,[.72,.72,.65],0,0,18);glass.push([mesh.glass,at,scale]);
   }
   const roof=r.low?b.simpleRoof:b.roof,progress=smooth((p-.72-k*.055)/.16),at=[b.x,y+.057+stack.reduce((sum,f)=>sum+f.height,0),b.z];
   for(const key of Object.keys(roof))r.draw(roof[key],at,[1,progress,1],key==='metal'?[.40,.44,.43]:[.78,.77,.68],0,0,key==='metal'?13:11);
  }
  const garden=g.garden;for(const [x,z]of[[-2.18,-.90],[-2.18,-.38],[1.99,-.90],[1.99,-.38]]){r.draw(this.craft.column,[x,y+.29*garden,z],[.023,.34*garden,.023],[.31,.25,.18],0,0,14);r.draw(r.low?this.craft.leaf:this.craft.foliage,[x,y+.52*garden,z],[.17*garden,.25*garden,.17*garden],[.28,.37,.23],0,0,15);}
  if(g.life>0)for(let i=0;i<(r.low?1:3);i++){const t=r.time*.17+i*2.1;this.craft.person(.42+1.22*Math.sin(t),y+.07,-.25,r.time*3.5+i,[.29+i*.035,.31,.29],g.life*.80,Math.cos(t)>0?Math.PI/2:-Math.PI/2);}
  if(!r.shadowPass)for(const [mesh,at,size]of glass)r.glass(mesh,at,size);r.receiveShadow=false;
 }
}
