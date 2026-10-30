import {TAU,clamp,smooth} from './model.js';

// Original sectional model calibrated to public reference photographs, not a survey.
export const GATE_HEIGHT=3.55,GATE_JOIN=.855;
// Proportions visually calibrated from reference images, not traced CAD or survey dimensions.
const gateOuterProfile=[[0,.675],[.2,.744],[.4,.832],[.6,.923],[.8,1.005],[1,1.065]];
const gateVoidProfile=[[0,.330],[.18,.345],[.38,.363],[.50,.350],[.62,.292],[.73,.188],[.81,.078],[GATE_JOIN,0]];
const gateVoidSquaredProfile=gateVoidProfile.map(([t,x])=>[t,x*x]);
const gateShoulderProfile=[[0,.452],[.25,.470],[.48,.460],[.66,.372],[.80,.270],[.90,.206],[1,.164]];
function gateProfile(points,t){let i=0;while(i<points.length-2&&t>points[i+1][0])i++;const a=points[i],b=points[i+1],span=b[0]-a[0],u=clamp((t-a[0])/span),secant=k=>(points[k+1][1]-points[k][1])/(points[k+1][0]-points[k][0]);
 const slope=k=>{if(k===0)return secant(0);if(k===points.length-1)return secant(k-1);const left=secant(k-1),right=secant(k);return left*right<=0?0:2*left*right/(left+right);};
 return (2*u*u*u-3*u*u+1)*a[1]+(u*u*u-2*u*u+u)*span*slope(i)+(-2*u*u*u+3*u*u)*b[1]+(u*u*u-u*u)*span*slope(i+1);
}
export function orientSection(t){t=clamp(t);const outer=gateProfile(gateOuterProfile,t),inner=t>=GATE_JOIN?0:Math.sqrt(Math.max(0,gateProfile(gateVoidSquaredProfile,t))),shoulder=gateProfile(gateShoulderProfile,t);return{outer,inner,shoulder,bevel:shoulder-inner,depth:.305+.075*smooth(t),recess:.102+.016*Math.sin(t*Math.PI)};}
export function orientGrowth(p){return{site:smooth(p/.17),tower:smooth((p-.08)/.79),crown:smooth((p-.83)/.13),life:smooth((p-.93)/.07)};}
export function orientStack(p,count=18){const g=orientGrowth(p);let base=0;return Array.from({length:count},(_,i)=>{const progress=smooth(g.tower*count-i),height=GATE_HEIGHT/count*progress,part={base,height,progress};base+=height;return part;});}
const orientSub=(a,b)=>a.map((v,i)=>v-b[i]),orientCross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export class OrientScene{
 constructor(r,{Builder,C,craft}){this.r=r;this.Builder=Builder;this.C=C;this.craft=craft;this.bands=this.makeBands(18,4,false);this.simple=this.makeBands(12,3,true);this.podium=this.makePodium();}
 quad(b,a,c,d,e,n){const tri=(p,q,r)=>{const area=Math.hypot(...orientCross(orientSub(q,p),orientSub(r,p)));if(area>1e-12)b.tri(p,q,r,n);};tri(a,c,d);tri(a,d,e);}
 meshes(groups){return Object.fromEntries(Object.entries(groups).map(([k,b])=>[k,this.r.mesh(b.d)]));}
 makeBands(count,steps,low){const output=[],skinSteps=low?4:10;
  for(let index=0;index<count;index++){const g=Object.fromEntries(['front','side','reveal','trim','roof'].map(k=>[k,new this.Builder()])),bottom=index/count*GATE_HEIGHT;
   const vertex=(x,y,z)=>{const t=y/GATE_HEIGHT,s=orientSection(t),dip=.022*smooth((t-.90)/.10)*(1-Math.pow(x/s.outer,2));return[x,y-bottom-dip,z];};
   const skin=(t,q,sign,front)=>{const s=orientSection(t),x=s.shoulder+(s.outer-.028-s.shoulder)*q,z=front*(s.depth+.046*Math.sin(q*Math.PI));return vertex(sign*x,t*GATE_HEIGHT,z);};
   const skinNormal=(t,q,sign,front)=>{const eps=.0001,dq=orientSub(skin(t,q+eps,sign,front),skin(t,q-eps,sign,front)),dt=orientSub(skin(Math.min(1,t+eps),q,sign,front),skin(Math.max(0,t-eps),q,sign,front)),n=orientCross(dq,dt),length=Math.hypot(...n),factor=n[2]*front<0?-1:1;return n.map(v=>v/length*factor);};
   const curved=(vertices,normals)=>{for(const ids of[[0,1,2],[0,2,3]])for(const k of ids)g.front.d.push(...vertices[k],...normals[k]);};
   const divisions=index/count>.70?steps*2:steps,times=Array.from({length:divisions+1},(_,j)=>(index+j/divisions)/count);
   if(GATE_JOIN>times[0]&&GATE_JOIN<times.at(-1))times.push(GATE_JOIN);times.sort((a,b)=>a-b);
   for(let j=0;j<times.length-1;j++){const t0=times[j],t1=times[j+1],y0=t0*GATE_HEIGHT,y1=t1*GATE_HEIGHT,a=orientSection(t0),b=orientSection(t1);
    for(const sign of[-1,1]){const at=(s,y,x,z)=>vertex(sign*x,y,z),point=(s,y,x,front)=>at(s,y,x,front*s.depth);
     for(const front of[-1,1]){
      for(let q=0;q<skinSteps;q++){const qa=q/skinSteps,qb=(q+1)/skinSteps,parameters=[[t0,qa],[t0,qb],[t1,qb],[t1,qa]];curved(parameters.map(([t,u])=>skin(t,u,sign,front)),parameters.map(([t,u])=>skinNormal(t,u,sign,front)));}
      this.quad(g.side,point(a,y0,a.outer-.028,front),at(a,y0,a.outer,front*(a.depth-.035)),at(b,y1,b.outer,front*(b.depth-.035)),point(b,y1,b.outer-.028,front));
      // The recessed band continues above the arch and between the two glazed wings.
      this.quad(g.reveal,at(a,y0,a.inner,front*a.recess),point(a,y0,a.shoulder,front),point(b,y1,b.shoulder,front),at(b,y1,b.inner,front*b.recess));
      // Deep horizontal plates wrap the inner reveal and cross the connected crown.
      const finIndex=Math.round(t0*count*steps),onFin=Math.abs(t0*count*steps-finIndex)<1e-7;
      if(onFin&&(!low||finIndex%2===0)){const yy=y0+.002,aa=orientSection(yy/GATE_HEIGHT),height=low?.007:.010;
       const inner=(y,zOffset=0)=>at(aa,y,aa.inner,front*(aa.recess+zOffset)),edge=(y,zOffset=0)=>at(aa,y,aa.shoulder,front*(aa.depth+zOffset));
       this.quad(g.trim,inner(yy,.014),edge(yy,.014),edge(yy+height,.014),inner(yy+height,.014));
       this.quad(g.trim,inner(yy+height,.014),edge(yy+height,.014),edge(yy+height,0),inner(yy+height,0),[0,1,0]);
      }
     }
     this.quad(g.side,at(a,y0,a.outer,-a.depth+.035),at(a,y0,a.outer,a.depth-.035),at(b,y1,b.outer,b.depth-.035),at(b,y1,b.outer,-b.depth+.035),[sign,0,0]);
     if(a.inner>0||b.inner>0)this.quad(g.reveal,at(a,y0,a.inner,-a.recess),at(a,y0,a.inner,a.recess),at(b,y1,b.inner,b.recess),at(b,y1,b.inner,-b.recess),[-sign,0,0]);
     if(index===count-1&&j===times.length-2){this.quad(g.roof,point(b,y1,b.shoulder,-1),point(b,y1,b.outer-.028,-1),point(b,y1,b.outer-.028,1),point(b,y1,b.shoulder,1),[0,1,0]);this.quad(g.roof,at(b,y1,0,-b.recess),point(b,y1,b.shoulder,-1),point(b,y1,b.shoulder,1),at(b,y1,0,b.recess),[0,1,0]);}
    }
   }
   output.push(this.meshes(g));
  }
  return output;
 }
 makePodium(){const g=Object.fromEntries(['stone','glass','metal'].map(k=>[k,new this.Builder()])),box=(key,p,s)=>this.craft.addChamfer(g[key],p,s,.003);
  for(const sign of[-1,1]){box('stone',[sign*.505,.072,-1.02],[.45,.14,.77]);box('stone',[sign*.505,.157,-1.02],[.49,.025,.81]);
   for(let i=0;i<5;i++)box('metal',[sign*.505-.19+i*.095,.085,-.641],[.009,.11,.018]);
   g.glass.quad([sign*.505-.21,.027,-.656],[sign*.505+.21,.027,-.656],[sign*.505+.21,.137,-.656],[sign*.505-.21,.137,-.656],[0,0,1]);
  }
  return this.meshes(g);
 }
 draw(y,p){const r=this.r,g=orientGrowth(p),parts=r.low?this.simple:this.bands,stack=orientStack(p,parts.length),base=y+.17;r.receiveShadow=true;
  r.bevelAt([0,y+.008,-1.02],[3.38*g.site,.075*g.site,2.10*g.site],[.66,.68,.64]);r.boxAt([0,y+.052,-1.02],[3.30*g.site,.012,2.02*g.site],[.64,.65,.61],0,0,12);
  for(const key of['stone','metal'])r.draw(this.podium[key],[0,y,0],[g.site,g.site,g.site],key==='stone'?[.64,.66,.63]:[.28,.33,.34],0,0,key==='stone'?12:13);
  for(let i=0;i<parts.length;i++){const t=stack[i].progress;if(t<=0)continue;const at=[0,base+stack[i].base,-1.02],size=[1,t,1],m=parts[i];
   r.draw(m.front,at,size,[.40,.51,.57],0,0,27);r.draw(m.side,at,size,[.32,.42,.48],0,0,27);r.draw(m.reveal,at,size,[.12,.20,.24],0,0,28);r.draw(m.trim,at,size,[.65,.70,.70],0,0,18);if(m.roof.count)r.draw(m.roof,at,size,[.36,.42,.44],0,0,13);
  }
  // Slim rooftop masts; their dimensions are illustrative.
  for(const sign of[-1,1])r.draw(this.craft.column,[sign*.955,base+stack.reduce((sum,f)=>sum+f.height,0)+.085*g.crown,-1.02],[.008,.17*g.crown,.008],[.61,.66,.68],0,0,13);
  const life=g.life;
  for(const side of[-1,1]){r.bevelAt([side*1.35,y+.102,-.54],[.32*life,.07,.42],[.66,.68,.62]);r.boxAt([side*1.35,y+.144,-.54],[.28*life,.012,.37],[.24,.34,.21],0,0,19);}
  r.boxAt([0,y+.066,-.32],[.69*g.site,.022,.37],[.73,.73,.69],0,0,12);
  if(life>0)for(let i=0;i<(r.low?1:2);i++){const t=r.time*.16+i*2.3;this.craft.person(1.14*Math.sin(t),y+.059,-.20,r.time*3.6+i,[.27+i*.08,.30,.31],life*.72,Math.cos(t)>0?Math.PI/2:-Math.PI/2);}
  if(!r.shadowPass)r.glass(this.podium.glass,[0,y,0],[g.site,g.site,g.site]);r.receiveShadow=false;
 }
}
