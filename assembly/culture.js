import {TAU,clamp,smooth,pieceGrowth} from './model.js';

// An original geometric study of the crescent, pearl and double facade.
// Dimensions and panel patterns are interpretive, not measured construction data.
export function cultureSection(u){
 const q=1-u*u;
 return {x:u*2.20,outer:-.40-1.85*q,inner:-.40-.72*q,height:.72+.45*q+.07*Math.sin((u+.6)*2.2)};
}
export function cultureGrowth(p){return {site:smooth(p/.23),pearl:smooth((p-.18)/.58),garden:smooth((p-.63)/.30),life:smooth((p-.87)/.13)};}

export class CultureScene{
 constructor(r,{Builder,C,craft}){this.r=r;this.Builder=Builder;this.C=C;this.craft=craft;this.screenLines=this.makePattern();this.sections=this.makeSections(28,false);this.simple=this.makeSections(16,true);}
 box(b,p,s){this.craft.addBox(b,p,s);}
 makePattern(){const lines=[],edges=new Set(),ru=.047,rv=.082;
  for(let col=-16;col<=16;col++)for(let row=-1;row<9;row++){
   const cx=col*1.5*ru,cy=Math.sqrt(3)*rv*(row+.5*(Math.abs(col)%2));
   const points=Array.from({length:6},(_,i)=>[cx+Math.cos(i/6*TAU)*ru,cy+Math.sin(i/6*TAU)*rv]);
   for(let i=0;i<6;i++){const a=points[i],b=points[(i+1)%6],key=[a,b].map(p=>p.map(v=>v.toFixed(5)).join(',')).sort().join('/');if(!edges.has(key)){edges.add(key);lines.push([a,b,.0052]);}}
  }
  // The brush-like secondary lines are newly generated; no original panel tile is copied.
  for(let row=0;row<6;row++)for(let i=0;i<80;i++){
   const point=u=>[u,.12+row*.145+.031*Math.sin(u*8+row*1.9)+.014*Math.sin(u*19-row)];
   lines.push([point(-1+i/40),point(-1+(i+1)/40),.0065]);
  }
  return lines;
 }
 facadePoint(u,v,side,offset=0){const s=cultureSection(u),z=side===1?s.inner:s.outer,dz=(side===1?.72:1.85)*2*u/2.2,n=[side===1?-dz:dz,0,side],len=Math.hypot(...n);return {p:[s.x,.06+v*(s.height-.10),z+side*offset],n:n.map(v=>v/len)};}
 ribbon(builder,a,b,width,side,lo,hi){
  const dx=b[0]-a[0],dy=b[1]-a[1];let t0=0,t1=1;
  for(const [start,delta,min,max] of [[a[0],dx,lo,hi],[a[1],dy,.035,.97]]){
   if(Math.abs(delta)<1e-9){if(start<min||start>max)return;}
   else {const tA=(min-start)/delta,tB=(max-start)/delta;t0=Math.max(t0,Math.min(tA,tB));t1=Math.min(t1,Math.max(tA,tB));}
  }
  if(t1-t0<1e-7)return;
  const length=Math.hypot(dx*2.2,dy),du=-dy/length*width/2.2,dv=dx*2.2/length*width;
  const point=(t,sign)=>this.facadePoint(clamp(a[0]+dx*t+du*sign,-.99,.99),clamp(a[1]+dy*t+dv*sign,.02,.99),side,.034);
  const p=point(t0,-1),q=point(t1,-1),v=point(t1,1),w=point(t0,1);
  builder.quad(p.p,q.p,v.p,w.p,p.n);
 }
 makeSections(count,low){const output=[];
  for(let i=0;i<count;i++){
   const lo=-.985+i/count*1.97,hi=-.985+(i+1)/count*1.97,a=cultureSection(lo),b=cultureSection(hi),opaque=new this.Builder(),roof=new this.Builder(),glass=new this.Builder(),screen=new this.Builder(),frame=new this.Builder(),joints=new this.Builder();
   const outer=(s,y)=>[s.x,y,s.outer+.045],inner=(s,y)=>[s.x,y,s.inner-.025];
   opaque.quad(outer(a,.025),outer(b,.025),outer(b,b.height-.05),outer(a,a.height-.05),[0,0,1]);
   for(const h of[.07,.34,.62])opaque.quad(outer(a,h),inner(a,h),inner(b,h),outer(b,h),[0,1,0]);
   roof.quad([a.x,a.height,a.outer],[b.x,b.height,b.outer],[b.x,b.height,b.inner],[a.x,a.height,a.inner]);
   roof.quad([a.x,a.height-.035,a.inner],[b.x,b.height-.035,b.inner],[b.x,b.height,b.inner],[a.x,a.height,a.inner]);
   roof.quad([a.x,a.height,a.outer],[b.x,b.height,b.outer],[b.x,b.height-.035,b.outer],[a.x,a.height-.035,a.outer]);
   const roofPoint=(u,v)=>{const s=cultureSection(u);return[s.x,s.height+.002,s.outer+(s.inner-s.outer)*v];};
   const seam=.0015;
   joints.quad(roofPoint(lo,.0),roofPoint(lo+seam,.0),roofPoint(lo+seam,1),roofPoint(lo,1));
   if(!low)for(const v of[.25,.5,.75])joints.quad(roofPoint(lo,v-seam),roofPoint(hi,v-seam),roofPoint(hi,v+seam),roofPoint(lo,v+seam));
   const af=this.facadePoint(lo,.035,1,-.025),bf=this.facadePoint(hi,.035,1,-.025),at=this.facadePoint(lo,.965,1,-.025),bt=this.facadePoint(hi,.965,1,-.025);
   glass.quad(af.p,bf.p,bt.p,at.p,af.n);
   if(i===0||i===count-1){const s=i===0?a:b;opaque.quad(outer(s,.025),inner(s,.025),inner(s,s.height-.04),outer(s,s.height-.04),[i===0?-1:1,0,0]);}
   for(const line of this.screenLines){if(low&&line[2]>.006)continue;for(const side of[-1,1])this.ribbon(screen,line[0],line[1],line[2]*(low?1.25:1),side,lo,hi);}
   if(i%2===0){const c=cultureSection((lo+hi)/2);this.box(frame,[c.x,c.height*.48,c.inner-.042],[.014,c.height*.85,.023]);}
   output.push(Object.fromEntries(Object.entries({opaque,roof,glass,screen,frame,joints}).map(([k,b])=>[k,this.r.mesh(b.d)])));
  }
  return output;
 }

 draw(y,p){const r=this.r,g=cultureGrowth(p),parts=r.low?this.simple:this.sections; r.receiveShadow=true;
  r.bevelAt([0,y+.007,-1.02],[4.88*g.site,.065,3.08*g.site],[.63,.64,.60]);
  r.boxAt([0,y+.041,-1.02],[4.82*g.site,.008,3.02*g.site],[.65,.66,.62],0,0,12);
  r.boxAt([0,y+.045,.40],[4.76*g.site,.024,.32*g.site],[.10,.30,.38],0,0,2);
  r.boxAt([0,y+.062,.205],[4.78*g.site,.025,.065],[.77,.77,.71],0,0,12);
  for(let i=0;i<parts.length;i++){const t=pieceGrowth(p,i,parts.length,.62);if(t<=0)continue;const mesh=parts[i],spread=.72+.28*t,pos=[0,y-.12*(1-t),-1.02*(1-spread)],scale=[spread,t,spread];
   r.draw(mesh.opaque,pos,scale,[.45,.47,.45],0,0,24);r.draw(mesh.roof,pos,scale,[.83,.85,.83],0,0,18);r.draw(mesh.frame,pos,scale,[.24,.30,.32],0,0,13);r.draw(mesh.screen,pos,scale,[.79,.81,.78],0,0,18);r.draw(mesh.joints,pos,scale,[.40,.46,.47],0,0,18);
  }
  // The principal pearl volume, partly seated in a glazed plinth.
  const pearl=g.pearl,center=[.08,y+.46*pearl,-.27],size=[.60*pearl,.53*pearl,.48*pearl];
  r.receiveShadow=false;
  r.draw(this.craft.moonSphere,center,size,[.80,.81,.78],-.09,0,23);
  r.receiveShadow=true;
  r.bevelAt([.08,y+.07*pearl,-.27],[1.22*pearl,.12*pearl,.90*pearl],[.23,.31,.32]);
  for(let step=0;step<3;step++)r.boxAt([.08,y+(.018+step*.018)*pearl,.26-step*.055],[1.30*pearl,.022*pearl,.09*pearl],[.67,.69,.65],0,0,12);
  // Recessed doors and freestanding posts make the screen a skin in front of inhabited space.
  for(const side of[-1,1]){const entry=smooth((p-.55)/.30),u=side*.57,a=cultureSection(u),x=a.x,z=a.inner-.04;
   r.boxAt([x,y+.25*entry,z],[.31*entry,.48*entry,.035],[.19,.26,.27],0,0,18);
   for(const dx of[-.16,0,.16])r.draw(this.craft.column,[x+dx,y+.26*entry,z+.008],[.014,.51*entry,.014],[.72,.74,.70],0,0,18);
   r.boxAt([x,y+.52*entry,z+.09],[.48*entry,.026,.22*entry],[.73,.75,.71],0,0,18);
  }
  const life=g.life,land=g.garden;
  for(const side of[-1,1]){r.bevelAt([side*1.42,y+.055,-.45],[.62*land,.06,.46*land],[.26,.37,.22]);r.bevelAt([side*1.14,y+.10,-.02],[.36*land,.055,.13],[.44,.31,.19]);
   r.draw(this.craft.column,[side*1.97,y+.20*land,-.17],[.028,.32*land,.028],[.29,.24,.17],0,0,14);
   r.draw(r.low?this.craft.leaf:this.craft.foliage,[side*1.97,y+.43*land,-.17],[.21*land,.25*land,.21*land],[.27,.37,.22],0,side*.3,15);
   if(life>0){const t=r.time*.07+side;const x=side*(1.25+.37*Math.sin(t)),z=.10;this.craft.person(x,y+.052,z,r.time*3.1+side,[.32,.35,.36],life,Math.cos(t)*side>0?Math.PI/2:-Math.PI/2);}
  }
  if(!r.shadowPass){for(let i=0;i<parts.length;i++){const t=pieceGrowth(p,i,parts.length,.62);if(t<=0)continue;const spread=.72+.28*t,pos=[0,y-.12*(1-t),-1.02*(1-spread)],size=[spread,t,spread];if(r.glass)r.glass(parts[i].glass,pos,size);else r.draw(parts[i].glass,pos,size,[.2,.3,.34],0,0,21);}}
  r.receiveShadow=false;
 }
}
