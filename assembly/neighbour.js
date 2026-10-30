import {TAU,smooth,clamp} from './model.js';
import {citizenPose,entranceOpening,residentBird} from './neighbour-life.js';

// Geometry and motion are original. Site planting and people are illustrative,
// not a reconstruction of the site's 1998 landscaping.
export function neighbourGrowth(p){return{body:smooth(p/.22),hinge:smooth(p/.65),bridges:smooth((p-.25)/.50),canopy:smooth((p-.48)/.48),life:smooth((p-.84)/.16)};}
export function walkLoop(time,offset=0){const t=((time*.045+offset)%1+1)%1;return{x:1.7*Math.sin(t*TAU),z:.40+Math.cos(t*TAU)*.055,phase:time*4+offset*TAU};}
export function pigeonPose(age,index){const t=clamp((age-index*.045)/5.5),flight=Math.sin(t*Math.PI),a=index*2.399;return{x:Math.cos(a)*.42+Math.sin(t*TAU)*(.45+index*.04),z:.12+Math.sin(a)*.13-flight*.54,y:.10+flight*(.50+index*.045),wing:Math.sin(age*19+index)*.60*flight,flight};}

export class NeighbourScene{
 constructor(r,{Builder,C}){this.r=r;this.C=C;this.Builder=Builder;this.wings=this.makeWings(false);this.simpleWings=this.makeWings(true);this.canopy=this.makeCanopy();this.flatGlass=this.makePanel();this.siteDetails=this.makeSiteDetails();this.leaf=this.makeLeaf();this.moonSphere=this.makeLeaf(64,32);this.birdWing=this.makeBirdWing();this.column=this.makeColumn();this.torso=this.makeTorso();this.foliage=this.makeFoliage();this.refinement=this.makeRefinement();}
 addBox(b,p,s){const v=(x,y,z)=>[p[0]+x*s[0],p[1]+y*s[1],p[2]+z*s[2]];for(const[z,n]of[[.5,[0,0,1]],[-.5,[0,0,-1]]])b.quad(v(-.5,-.5,z),v(.5,-.5,z),v(.5,.5,z),v(-.5,.5,z),n);for(const[x,n]of[[.5,[1,0,0]],[-.5,[-1,0,0]]])b.quad(v(x,-.5,-.5),v(x,-.5,.5),v(x,.5,.5),v(x,.5,-.5),n);for(const[y,n]of[[.5,[0,1,0]],[-.5,[0,-1,0]]])b.quad(v(-.5,y,-.5),v(.5,y,-.5),v(.5,y,.5),v(-.5,y,.5),n);}
 // Closed chamfered boxes keep the highlight on the actual geometry edge.
 addChamfer(b,p,s,radius=.004){const h=s.map(v=>v*.5),r=Math.min(radius,...h.map(v=>v*.35)),point=q=>q.map((v,k)=>v+p[k]);
 for(let axis=0;axis<3;axis++){const u=(axis+1)%3,v=(axis+2)%3;for(const sign of[-1,1]){const n=[0,0,0];n[axis]=sign;const at=(a,c)=>{const q=[0,0,0];q[axis]=sign*h[axis];q[u]=a*(h[u]-r);q[v]=c*(h[v]-r);return point(q);};b.quad(at(-1,-1),at(1,-1),at(1,1),at(-1,1),n);}}
 for(let axis=0;axis<3;axis++){const u=(axis+1)%3,v=(axis+2)%3;for(const su of[-1,1])for(const sv of[-1,1]){const at=(end,edge)=>{const q=[0,0,0];q[axis]=end*(h[axis]-r);q[u]=su*(h[u]-(edge?r:0));q[v]=sv*(h[v]-(edge?0:r));return point(q);};const n=[0,0,0];n[u]=su/Math.sqrt(2);n[v]=sv/Math.sqrt(2);b.quad(at(-1,0),at(1,0),at(1,1),at(-1,1),n);}}
 for(const x of[-1,1])for(const y of[-1,1])for(const z of[-1,1]){const signs=[x,y,z],at=axis=>point(h.map((v,k)=>signs[k]*(v-(k===axis?0:r))));b.tri(at(0),at(1),at(2),signs.map(v=>v/Math.sqrt(3)));}
 }
 makePanel(){const b=new this.Builder();b.quad([-.5,-.5,0],[.5,-.5,0],[.5,.5,0],[-.5,.5,0],[0,0,1]);return this.r.mesh(b.d);}
 makeWings(low){const keys=['wall','glassFront','glassBack','glassSide','frame','roof','trim','room','floor','wood','curtain','lamp'],groups=Object.fromEntries(keys.map(k=>[k,new this.Builder()]));
 const add=(key,p,s)=>{if(!low&&['wall','frame','trim'].includes(key))this.addChamfer(groups[key],p,s,key==='frame'?.0015:.004);else this.addBox(groups[key],p,s);};
 const pane=(key,x,y,z,w,h,n)=>groups[key].quad([x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],n);
 for(const y of[.045,.405,.775,1.145]){add('wall',[0,y,0],[1.77,.070,1.36]);add('trim',[0,y-.025,.694],[1.78,.014,.055]);}
 for(const x of[-.82,.82])for(const z of[-.49,.49])add('wall',[x,.59,z],[.09,1.16,.39]);
 for(const z of[-.662,.662])for(const x of[-.40,0,.40])add('wall',[x,.59,z],[.042,1.10,.075]);
 add('roof',[0,1.205,0],[1.79,.045,1.41]);
 for(const z of[-.68,.68]){add('wall',[0,1.26,z],[1.80,.12,.045]);add('trim',[0,1.325,z],[1.82,.018,.065]);}
 for(const x of[-.88,.88]){add('wall',[x,1.26,0],[.045,.12,1.39]);add('trim',[x,1.325,0],[.065,.018,1.42]);}
 // Recessed windows, real room shells and restrained, unbranded interior details.
 for(let level=0;level<3;level++)for(let bay=0;bay<4;bay++)for(const side of[-1,1]){
  const x=-.60+bay*.40,y=.225+level*.37,front=side*.629,seed=bay+level*5+(side>0?0:2);
  pane(side>0?'glassFront':'glassBack',x,y,front,.346,.269,[0,0,side]);
  for(const dx of[-.177,.177])add('frame',[x+dx,y,side*.645],[.012,.278,.032]);
  for(const dy of[-.139,.139])add('frame',[x,y+dy,side*.645],[.365,.013,.032]);
  if(!low){add('frame',[x,y+.027,side*.648],[.348,.009,.033]);add('frame',[x,y,side*.648],[.008,.268,.032]);}
  add('trim',[x,y-.150,side*.666],[.395,.022,.115]);
  add('room',[x,y,side*.17],[.39,.30,.022]);
  for(const dx of[-.193,.193])add('room',[x+dx,y,side*.399],[.014,.30,.44]);
  add('floor',[x,y-.147,side*.398],[.38,.018,.445]);add('room',[x,y+.145,side*.398],[.38,.012,.445]);
  if(!low){
   if(seed%3===0){add('wood',[x-.04,y-.035,side*.47],[.23,.014,.10]);for(const dx of[-.13,.05])add('frame',[x+dx,y-.095,side*.47],[.009,.11,.009]);}
   else {for(let j=0;j<2;j++)add('wood',[x+.06,y-.075+j*.065,side*.21],[.15,.012,.06]);}
   if(level>0&&seed%3!==1){for(let j=0;j<8;j++){const xx=x+(seed%2?-.155:.068)+j*.012,z=side*(.565+.007*Math.cos(j*Math.PI*.8));add('curtain',[xx,y+.014,z],[.012,.24,.009]);}}
   if(seed%3!==0)add('lamp',[x,y+.127,side*.34],[.11,.007,.032]);
  }
 }
 // Side windows have their own reveals and an internal back wall.
 for(const side of[-1,1])for(const y of[.225,.595,.965]){
  const face=side*.827;groups.glassSide.quad([face,y-.135,-.29],[face,y-.135,.29],[face,y+.135,.29],[face,y+.135,-.29],[side,0,0]);
  for(const z of[-.30,0,.30])add('frame',[side*.844,y,z],[.027,.282,.012]);for(const dy of[-.14,.14])add('frame',[side*.844,y+dy,0],[.027,.014,.61]);add('room',[side*.73,y,0],[.018,.28,.60]);
 }
 if(!low)for(const x of[-.6,-.2,.2,.6])add('trim',[x,1.233,0],[.006,.004,1.26]);
 return Object.fromEntries(Object.entries(groups).map(([k,b])=>[k,this.r.mesh(b.d)]));}
 makeCanopy(){const d=[],profile=[];for(let j=0;j<=16;j++){const t=j/16*.97;profile.push([t,.13*(1-t*t)]);}profile.push([.985,.002],[.996,-.004],[1.,-.013],[1.,-.034],[.992,-.047],[.978,-.052]);for(let j=15;j>=0;j--){const t=j/16*.97;profile.push([t,.078-.13*t*t]);}
 const vertex=(i,a)=>{const [r,y]=profile[i],prev=profile[Math.max(0,i-1)],next=profile[Math.min(profile.length-1,i+1)],dr=next[0]-prev[0],dy=next[1]-prev[1];let nr=-dy,ny=dr;if(r===0){nr=0;ny=i===0?1:-1;}const len=Math.hypot(nr,ny);return[Math.cos(a)*r*.99,y,Math.sin(a)*r*.99,Math.cos(a)*nr/len,ny/len,Math.sin(a)*nr/len];},tri=(...v)=>v.forEach(p=>d.push(...p));
 for(let j=0;j<profile.length-1;j++)for(let i=0;i<96;i++){const a=i/96*TAU,c=(i+1)/96*TAU;if(profile[j][0]>0)tri(vertex(j,a),vertex(j,c),vertex(j+1,c));if(profile[j+1][0]>0)tri(vertex(j,a),vertex(j+1,c),vertex(j+1,a));}
 return this.r.mesh(d);}
 makeSiteDetails(){const channel=new this.Builder(),grate=new this.Builder();this.addBox(channel,[0,.055,-.53],[4.34,.007,.030]);for(let i=0;i<62;i++)this.addBox(grate,[-2.13+i*.07,.059,-.53],[.011,.004,.028]);return{channel:this.r.mesh(channel.d),grate:this.r.mesh(grate.d)};}

 makeRefinement(){const rim=new this.Builder(),paving=new this.Builder();
  for(let i=0;i<64;i++){const a=i/64*TAU,b=(i+1)/64*TAU,p=(t,r,y)=>[Math.cos(t)*r,y,Math.sin(t)*r];
   rim.quad(p(a,.982,-.029),p(b,.982,-.029),p(b,1.003,-.029),p(a,1.003,-.029),[0,1,0]);
   rim.quad(p(a,1.003,-.046),p(b,1.003,-.046),p(b,1.003,-.029),p(a,1.003,-.029),[Math.cos((a+b)/2),0,Math.sin((a+b)/2)]);
  }
  for(let i=0;i<24;i++)this.addBox(paving,[-2.18+i*.19,.050,.44],[.16,.005,.075]);
  for(const side of[-1,1])for(let i=0;i<8;i++)this.addBox(paving,[side*.77,.050,.30-i*.108],[.22,.005,.075]);
  return{rim:this.r.mesh(rim.d),paving:this.r.mesh(paving.d)};
 }
 makeLeaf(segments=12,rings=8){const d=[],p=(a,t)=>[Math.cos(a)*Math.sin(t),Math.cos(t),Math.sin(a)*Math.sin(t)],put=(a,b,c)=>{for(const v of[a,b,c])d.push(...v,...v);};for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=i/segments*TAU,c=(i+1)/segments*TAU,t=j/rings*Math.PI,u=(j+1)/rings*Math.PI;if(j>0)put(p(a,t),p(c,t),p(c,u));if(j<rings-1)put(p(a,t),p(c,u),p(a,u));}return this.r.mesh(d);}
 makeBirdWing(){const b=new this.Builder();b.quad([0,0,0],[.07,0,.03],[.10,0,-.03],[.035,0,-.05],[0,1,0]);return this.r.mesh(b.d);}
 makeColumn(){const b=new this.Builder();for(let i=0;i<32;i++){const a=i/32*TAU,c=(i+1)/32*TAU;for(const v of [[a,-.5],[c,-.5],[c,.5],[a,-.5],[c,.5],[a,.5]])b.d.push(Math.cos(v[0])*.5,v[1],Math.sin(v[0])*.5,Math.cos(v[0]),0,Math.sin(v[0]));b.tri([0,.5,0],[Math.cos(c)*.5,.5,Math.sin(c)*.5],[Math.cos(a)*.5,.5,Math.sin(a)*.5],[0,1,0]);b.tri([0,-.5,0],[Math.cos(a)*.5,-.5,Math.sin(a)*.5],[Math.cos(c)*.5,-.5,Math.sin(c)*.5],[0,-1,0]);}return this.r.mesh(b.d);}
 makeFoliage(){const b=new this.Builder();let seed=731;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<850;i++){const az=rnd()*TAU,z=rnd()*2-1,rr=Math.pow(rnd(),.32),r=Math.sqrt(1-z*z),center=[Math.cos(az)*r*rr,z*rr,Math.sin(az)*r*rr],a=rnd()*TAU,tilt=rnd()*.9-.45,u=[Math.cos(a)*.10,tilt*.10,Math.sin(a)*.10],v=[-Math.sin(a)*.045,.03,Math.cos(a)*.045],at=(x,y,fold=0)=>center.map((n,k)=>n+u[k]*x+v[k]*y+(k===1?fold:0));b.tri(at(-1,0),at(0,-1),at(0,0,.025));b.tri(at(0,-1),at(1,0),at(0,0,.025));b.tri(at(1,0),at(0,1),at(0,0,.025));b.tri(at(0,1),at(-1,0),at(0,0,.025));}return this.r.mesh(b.d);}
 makeTorso(){const b=new this.Builder(),rings=[[-.5,.68],[-.25,.76],[.27,1.],[.43,.93],[.5,.48]];for(let j=0;j<rings.length-1;j++)for(let i=0;i<16;i++){const a=i/16*TAU,c=(i+1)/16*TAU,point=(angle,row)=>[Math.cos(angle)*rings[row][1]*.5,rings[row][0],Math.sin(angle)*rings[row][1]*.32];b.quad(point(a,j),point(c,j),point(c,j+1),point(a,j+1));}return this.r.mesh(b.d);}
 segment(a,b,width,c,mode=17){const d=b.map((v,i)=>v-a[i]),length=Math.hypot(...d);if(length<.00001)return;const center=a.map((v,i)=>(v+b[i])/2);this.r.draw(this.leaf,center,[width,length*.57,width],c,Math.acos(clamp(d[1]/length,-1,1)),Math.atan2(d[2],-d[0]),mode);}
 person(x,y,z,phase,coat,scale=1,heading=0,action=null){const r=this.r,skin=[.64,.43,.30],pants=[.12,.15,.18],hair=[.075,.055,.04],stride=action?.stride??1,walk=Math.sin(phase)*.028*stride,gesture=action?.gesture??0;
 const at=(a,b,c)=>[x+(a*Math.cos(heading)+c*Math.sin(heading))*scale,y+b*scale,z+(-a*Math.sin(heading)+c*Math.cos(heading))*scale];
 r.draw(this.torso,at(0,.145,0),[.072*scale,.102*scale,.072*scale],coat,0,heading,17);
 r.draw(this.leaf,at(0,.224,0),[.025*scale,.033*scale,.025*scale],skin,0,heading,16);
 r.draw(this.leaf,at(0,.242,-.004),[.026*scale,.017*scale,.025*scale],hair,0,heading,17);
 for(const side of[-1,1]){const leg=side*walk,lift=action?Math.max(0,Math.cos(phase+(side>0?Math.PI:0)))*.018*stride:0,hip=at(side*.019,.102,0),knee=at(side*.020,.057+lift*.4,leg),foot=at(side*.021,.014+lift,-leg);this.segment(hip,knee,.013*scale,pants);this.segment(knee,foot,.011*scale,pants);r.draw(this.leaf,at(side*.021,.010+lift,.009-leg),[.014*scale,.011*scale,.025*scale],pants,0,heading,13);
 const talk=side===1?gesture:0,shoulder=at(side*.038,.181,0),elbow=at(side*.045,.137+talk*.018,side*-walk*.6+talk*.026),hand=at(side*.043,.100+talk*.065,side*-walk+talk*.050);this.segment(shoulder,elbow,.013*scale,coat);this.segment(elbow,hand,.009*scale,skin,16);r.draw(this.leaf,hand,[.010*scale,.012*scale,.009*scale],skin,0,heading,16);
 if(action?.bag&&side===-1){const handle=at(-.046,.085,-side*walk),bag=at(-.047,.054,-side*walk);this.segment(hand,handle,.0035*scale,[.38,.24,.12],14);r.draw(this.torso,bag,[.043*scale,.051*scale,.028*scale],[.62,.37,.16],0,heading,17);}}
 }
 box(p,s,c,mode=0){this.r.boxAt(p,s,c,0,0,mode);}
 draw(y,p){const r=this.r,C=this.C,g=neighbourGrowth(p),polish=!!r.neighbourPolish,colors=polish?{wall:[.87,.84,.74],frame:[.31,.43,.45],roof:[.31,.42,.43],trim:[.90,.85,.71],room:[.63,.62,.53],floor:[.49,.46,.37],wood:[.50,.32,.16],curtain:[.77,.72,.60],lamp:[.95,.77,.44]}:{wall:[.81,.795,.745],frame:[.36,.39,.40],roof:[.29,.32,.31],trim:[.74,.74,.69],room:[.64,.635,.59],floor:[.47,.46,.42],wood:[.39,.29,.18],curtain:[.69,.66,.59],lamp:[.91,.79,.58]},meshes=r.low?this.simpleWings:this.wings;
 const shading=polish&&!r.shadowPass&&r.gl&&r.u;
 if(shading)r.gl.uniform2f(r.u.Life,1,r.energy||0);
 try{
 r.receiveShadow=true;const site=smooth(p/.3),ground=y+.025;
 r.bevelAt([0,y-.025,-1.02],[4.92*site,.13*site,3.12*site],polish?[.83,.79,.66]:[.69,.73,.64]);
 r.boxAt([0,ground,-.135],[4.75*site,.045,1.18],polish?[.74,.70,.59]:[.64,.63,.59],0,0,12);
 r.boxAt([0,ground+.028,.105],[1.40*site,.026,.48*site],[.24,.34,.19],0,0,19);
 for(const side of[-1,1])r.bevelAt([side*.72,ground+.040,.105],[.035*site,.035,.51*site],C.ivory);
 r.bevelAt([0,ground-.015,.49],[1.2*site,.045,.14],[.73,.73,.64]);
 if(!r.low)for(let i=0;i<13;i++)this.box([-2.16+i*.36,ground+.025,-.02],[.008*site,.006,.86*site],C.ivory);
 // Soft local contact patches, drawn on the site before the buildings.
 for(const side of[-1,1])r.contact([side*1.28,ground+.027,-1.40],[1.15*site,1,.87*site],.26);
 for(const side of[-1,1]){const angle=side*(1-g.hinge)*.88,cx=side*(.50+.79*Math.cos(angle)),cz=-1.38-.79*Math.sin(Math.abs(angle));
 for(const key of['room','floor','wood','curtain','lamp','wall','frame','roof','trim'])r.draw(meshes[key],[cx,y+.075,cz],[g.body,g.body,g.body],colors[key],0,angle,['room','floor','wood'].includes(key)?22:key==='curtain'?17:key==='lamp'?9:key==='frame'?13:key==='roof'?12:11);
 }
 for(let k=0;k<3;k++){const t=smooth((g.bridges-k*.15)/.70),h=y+.25+k*.36;this.box([0,h,-.89],[1.04*t,.075,.27],C.ivory);this.box([0,h+.075,-.735],[1.01*t,.12,.012],[.26,.37,.39],20);if(!r.low){this.box([0,h+.145,-.735],[1.06*t,.013,.024],[.60,.62,.61],13);for(let m=-2;m<=2;m++)this.box([m*.21*t,h+.085,-.724],[.009*t,.115,.014],[.52,.55,.55],13);}}
 const cap=g.canopy,capY=y+1.44+(1-cap)*.32;
 for(const side of[-1,1]){r.draw(this.column,[side*.48,y+.725*cap,-.48],[.065,1.45*cap,.065],[.60,.085,.045],0,0,11);r.bevelAt([side*.48,y+.05,-.48],[.12*cap,.06*cap,.12*cap],C.navy);}
 r.draw(this.canopy,[0,capY,-.91],[cap,cap,.86*cap],[.80,.80,.76],0,0,18);
 if(polish){r.draw(this.refinement.rim,[0,capY,-.91],[cap,cap,.86*cap],[.54,.40,.21],0,0,13);r.draw(this.refinement.paving,[0,y,0],[site,site,site],[.45,.55,.52],0,0,12);}
 if(!r.low&&cap>.01){for(let i=0;i<12;i++){const a=i/12*TAU;this.segment([Math.cos(a)*.15*cap,capY-.043*cap,-.91+Math.sin(a)*.13*cap],[Math.cos(a)*.91*cap,capY-.043*cap,-.91+Math.sin(a)*.78*cap],.008*cap,[.44,.46,.45],13);}}
 // Static recessed entrances, with physical metal surrounds and slim handles.
 const entry=g.body*smooth((g.hinge-.90)/.10),door=polish?entranceOpening(r.time,p):0;
 for(const side of[-1,1]){const x=side*.77,h=y+.20*entry,slide=side===-1?door*.09:0;for(const dx of[-.123,.123])this.box([x+dx,h,-.704],[.016*entry,.27*entry,.028],[.40,.43,.43],13);this.box([x,h+.139*entry,-.704],[.26*entry,.015,.028],[.40,.43,.43],13);this.box([x,y+.060,-.70],[.30*entry,.025,.10],[.55,.55,.50],12);for(const d of[-1,1]){this.box([x+d*slide,h,-.696],[.0045,.265*entry,.02],[.40,.43,.43],13);r.draw(this.column,[x+d*(.023+slide),h,-.675],[.006,.055*entry,.006],[.55,.57,.56],0,0,13);}}
 if(!r.low){r.draw(this.siteDetails.channel,[0,y,0],[site,1,site],[.11,.13,.13],0,0,11);r.draw(this.siteDetails.grate,[0,y,0],[site,1,site],[.48,.51,.50],0,0,13);}

 const landscape=smooth((p-.54)/.36);
 for(const side of[-1,1]){for(const z of[-.10,-2.12]){const x=side*2.07;r.bevelAt([x,y+.09,z],[.47*landscape,.14*landscape,.38*landscape],C.ivory);r.draw(this.column,[x,y+.22*landscape,z],[.033,.36*landscape,.033],[.29,.23,.16],0,0,14);
 const wind=Math.sin(r.time*.8+x+z)*(polish?.014+(r.energy||0)*.018:.010);
 if(r.low)r.draw(this.leaf,[x+wind,y+.49*landscape,z],[.23*landscape,.29*landscape,.23*landscape],[.24,.34,.20],0,0,15);
 else {for(let j=0;j<3;j++){const a=j/3*TAU;this.segment([x,y+.24*landscape,z],[x+Math.cos(a)*.12*landscape,y+.44*landscape,z+Math.sin(a)*.12*landscape],.012*landscape,[.27,.21,.14],14);}r.draw(this.foliage,[x+wind,y+.51*landscape,z],[.27*landscape,.31*landscape,.25*landscape],[.27,.36,.20],0,side*.4,15);}

 }
 r.bevelAt([side*1.1,y+.13,-.10],[.50*landscape,.065,.15],[.47,.36,.24]);for(const dx of[-.17,.17])this.box([side*1.1+dx,y+.07,-.10],[.025,.12*landscape,.10],C.navy);
 // Slatted seats and a backrest with its own thickness.
 if(!r.low){for(let j=0;j<4;j++)this.box([side*1.1,y+.17,-.16+j*.035],[.50*landscape,.016,.020],[.44,.30,.18],14);this.box([side*1.1,y+.22,-.19],[.50*landscape,.11,.028],[.42,.29,.17],14);}
 for(let j=0;j<3;j++)r.draw(this.leaf,[side*(1.82+j*.12),y+.15*landscape,.27],[.09*landscape,.11*landscape,.085*landscape],[.36,.45,.25],0,0,15);
 r.bevelAt([side*1.72,y+.09,.02],[.05,.10*landscape,.05],C.navy);r.boxAt([side*1.72,y+.145*landscape,.02],[.055,.035*landscape,.055],[.94,.70,.35],0,0,9);
 }
 if(g.life>0){const count=polish?(r.low?1:3):(r.low?2:4),t=r.time;for(let i=0;i<count;i++){if(polish){const citizen=citizenPose(t,i,p),coats=[[.64,.35,.16],[.20,.40,.43],[.70,.58,.38]];this.person(citizen.x,y+.054,citizen.z,citizen.phase,coats[i],citizen.weight*1.08,citizen.heading,citizen);}else{const path=walkLoop(t,i*.24);this.person(path.x,y+.045,path.z-.03,path.phase,i%2?[.29,.34,.32]:[.48,.23,.13],g.life,Math.cos(((t*.045+i*.24)%1)*TAU)>=0?Math.PI/2:-Math.PI/2);}}
 }
 if(g.life>0){const count=polish?(r.low?2:5):(r.low?4:8);for(let i=0;i<count;i++){const bird=polish?residentBird(r.time,i,r.energy||0):pigeonPose(100,i),size=g.life,yy=y+bird.y;const feather=i%3===0?[.52,.58,.61]:[.78,.80,.74];r.draw(this.leaf,[bird.x,yy,bird.z],[.023*size,.026*size,.043*size],feather);r.draw(this.leaf,[bird.x,yy+.027*size-(bird.peck||0)*.03,bird.z+.030*size],[.013*size,.016*size,.013*size],[.28,.32,.35]);for(const side of[-1,1])r.draw(this.birdWing,[bird.x,yy,bird.z],[(.35+.65*bird.flight)*size,size,size],feather,side*bird.wing,side===1?0:Math.PI);}}
 // Glass comes after opaque architecture and residents, with depth writes disabled.
 if(!r.shadowPass){for(const side of[-1,1]){const angle=side*(1-g.hinge)*.88,cx=side*(.50+.79*Math.cos(angle)),cz=-1.38-.79*Math.sin(Math.abs(angle)),pos=[cx,y+.075,cz],scale=[g.body,g.body,g.body];const viewZ=r.eye?(r.eye[0]-cx)*Math.sin(angle)+(r.eye[2]-cz)*Math.cos(angle):1;for(const key of(viewZ>=0?['glassBack','glassSide','glassFront']:['glassFront','glassSide','glassBack'])){if(r.glass)r.glass(meshes[key],pos,scale,angle);else r.draw(meshes[key],pos,scale,[.25,.34,.37],0,angle,21);}}
 for(const side of[-1,1])for(const leaf of[-1,1]){const pos=[side*.77+leaf*(.0575*entry+(side===-1?door*.09:0)),y+.20*entry,-.693],scale=[.115*entry,.258*entry,1];if(r.glass)r.glass(this.flatGlass,pos,scale);else r.draw(this.flatGlass,pos,scale,[.25,.34,.37],0,0,21);}}
 if(!r.shadowPass&&r.lightPatch&&g.life>0&&r.mood>.01)for(const side of[-1,1])r.lightPatch([side*.77,ground+.051,-.36],[.40,.001,.45],[.95,.61,.20],r.mood*.12);
 r.receiveShadow=false;
 }finally{if(shading)r.gl.uniform2f(r.u.Life,0,r.energy||0);}
 }
}
