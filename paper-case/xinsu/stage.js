import * as T from '../../heritage/vendor/three.module.js';
import {FactoryScene,FACTORY_STOREY} from '../../assembly/factory.js';
import {NeighbourScene} from '../../assembly/neighbour.js';
import {clamp} from './model.js';
class Builder{
 constructor(){this.d=[];}
 tri(a,b,c,n){if(!n){const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...n)||1;n=n.map(v=>v/l);}for(const p of[a,b,c])this.d.push(...p,...n);}
 quad(a,b,c,d,n){this.tri(a,b,c,n);this.tri(a,c,d,n);}
}
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
export function createStage(canvas,{onError,onInspect,onPhotoAnchor,reduced=false,plan=null}={}){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch(e){onError?.(e);return null;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.35:1.75));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=false;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-3.7,3.7,2.8,-2.8,.1,60);scene.add(new T.HemisphereLight(0xfff6df,0x657d7b,2));const sun=new T.DirectionalLight(0xffe0a0,2.4);sun.position.set(-4,7,5);scene.add(sun);
 const root=new T.Group();root.position.set(0,0,.6);scene.add(root);let progress=0,active=false,az=.3,targetAz=.3,frame=0,last=0,dead=false,drag=null,dirty=true,close=0,targetClose=0,inspectionNotified=false;
 const ramp=new T.DataTexture(new Uint8Array([95,95,95,255,160,160,160,255,240,240,240,255]),3,1,T.RGBAFormat);ramp.minFilter=T.NearestFilter;ramp.magFilter=T.NearestFilter;ramp.needsUpdate=true;
 const materials=new Map();function material(color){if(!materials.has(color))materials.set(color,new T.MeshToonMaterial({color,gradientMap:ramp,side:T.DoubleSide}));return materials.get(color);}
 const edgeMat=new T.LineBasicMaterial({color:0x213e4a,transparent:true,opacity:.52});const edgeCache=new Map();
 function add(parent,g,color,edges=true){const m=new T.Mesh(g,material(color));parent.add(m);if(edges){if(!edgeCache.has(g))edgeCache.set(g,new T.EdgesGeometry(g,38));m.add(new T.LineSegments(edgeCache.get(g),edgeMat));}return m;}
 const r={mesh(data){const g=new T.BufferGeometry(),pos=[],normal=[];for(let i=0;i<data.length;i+=6){pos.push(...data.slice(i,i+3));normal.push(...data.slice(i+3,i+6));}g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));return g;}};
 const craft={addBox:NeighbourScene.prototype.addBox,addChamfer:NeighbourScene.prototype.addChamfer};const factory=new FactoryScene(r,{Builder,C:{},craft});
 const paper=add(root,new T.BoxGeometry(5.65,.075,3.7),0xf3e8cc);paper.position.set(0,-.065,-1);
 let planTexture=null,planFace=null;if(plan){planTexture=new T.TextureLoader().load(plan,()=>{dirty=true;});planTexture.colorSpace=T.SRGBColorSpace;const mat=new T.MeshBasicMaterial({map:planTexture,transparent:true,opacity:1,depthWrite:false,side:T.DoubleSide});planFace=new T.Mesh(new T.PlaneGeometry(5.45,3.5),mat);planFace.rotation.x=-Math.PI/2;planFace.position.set(0,-.018,-1);root.add(planFace);}
 const under=add(root,new T.BoxGeometry(5.72,.035,3.76),0x397b78);under.position.copy(paper.position);under.position.y=-.12;
 const grid=new T.GridHelper(5.6,18,0xc3b68c,0xd7cba8);grid.material.transparent=true;grid.material.opacity=.32;grid.position.set(0,-.019,-1);grid.scale.z=.65;root.add(grid);
 const site=new T.Group();root.add(site);const siteColors={paving:0xd8c8a5,road:0x397b78,curb:0xe9ddbd,paint:0xf9eccb,garden:0x759278,metal:0x213e4a,entry:0x376768};for(const[k,g]of Object.entries(factory.site))add(site,g,siteColors[k],!['paint','metal'].includes(k));
 const letter=add(root,new T.BoxGeometry(.25,.15,.012),0xf9edcc);letter.position.set(.75,.18,-1.22);letter.rotation.z=-.12;const stamp=add(letter,new T.BoxGeometry(.045,.045,.005),0xcb5b47,false);stamp.position.set(.07,.035,.009);const letterPoint=new T.Vector3();
 const floors=[],roofs=[];for(const [index,b]of factory.blocks.entries()){
  for(let level=0;level<b.levels;level++){
   const hinge=new T.Group();root.add(hinge);const part=new T.Group();part.position.z=b.d/2;hinge.add(part);
   for(const[k,g]of Object.entries(b.full)){const color=k==='wall'?(level===2||level===3?0xd49c42:0xf3e8cc):k==='glass'?0x4a8385:k==='room'?0x234957:k==='detail'?0xd9c7a0:0x213e4a;add(part,g,color,k!=='room');}
   floors.push({hinge,index,level,spec:b});
  }
  const roof=new T.Group();root.add(roof);for(const[k,g]of Object.entries(b.roof))add(roof,g,k==='metal'?0x397b78:0xe9d9b6);roofs.push({roof,index,spec:b});
 }
 // Illustration-specific paper supports; all building meshes above reuse the existing factory module.
 const braceMat=material(0xd4b777);for(const x of[-1.7,.9]){const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(.55,0);shape.lineTo(0,.65);shape.closePath();const brace=new T.Mesh(new T.ShapeGeometry(shape),braceMat);brace.rotation.y=Math.PI/2;brace.position.set(x,.04,-1.2);root.add(brace);brace.userData.brace=true;}
 function resize(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height,false);const aspect=rect.width/rect.height,halfW=3.65,halfH=halfW/aspect;camera.left=-halfW;camera.right=halfW;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();dirty=true;}
 const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,az:targetAz};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(drag)targetAz=clamp(drag.az+(e.clientX-drag.x)*.004,-.5,.75);});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 function render(now){if(dead)return;frame=requestAnimationFrame(render);if(!active||document.hidden||(!dirty&&Math.abs(targetAz-az)<.0004&&Math.abs(targetClose-close)<.0004)||now-last<1000/(innerWidth<700?30:45))return;last=now;dirty=false;az+=(targetAz-az)*(reduced?1:.16);close+=(targetClose-close)*(reduced?1:.12);const totals=[0,0];
  for(const f of floors){const t=ease(progress*6.4-f.level-f.index*.28),base=totals[f.index];f.hinge.position.set(f.spec.x,base+.057+.003*f.level,f.spec.z-f.spec.d/2);f.hinge.rotation.x=(1-t)*Math.PI/2;totals[f.index]+=FACTORY_STOREY*t;f.hinge.visible=progress>.004;}
  for(const {roof,index,spec}of roofs){const t=ease((progress-.81-index*.03)/.16);roof.position.set(spec.x,totals[index]+.057+(1-t)*.24,spec.z);roof.scale.set(1,Math.max(.001,t),1);roof.visible=t>.003;}
  if(planFace)planFace.material.opacity=1-ease(progress/.35);site.scale.setScalar(Math.max(.001,ease(progress/.2)));root.children.forEach(o=>{if(o.userData.brace){o.scale.y=Math.max(.001,ease(progress));o.visible=progress>.04;}});
  letter.visible=progress>=.94;camera.zoom=1+close*.20;camera.updateProjectionMatrix();camera.position.set(Math.sin(az)*6.7,4.7-close*.7,Math.cos(az)*6.7);camera.lookAt(close*.22,.62-close*.22,-.7-close*.12);renderer.render(scene,camera);
  root.updateMatrixWorld();letter.getWorldPosition(letterPoint);letterPoint.project(camera);const rect=canvas.getBoundingClientRect();onPhotoAnchor?.({x:(letterPoint.x+1)*rect.width/2,y:(1-letterPoint.y)*rect.height/2});
  if(progress>=.94&&az<-.28&&Math.abs(az-targetAz)<.006&&!inspectionNotified){inspectionNotified=true;onInspect?.();}
 }
 frame=requestAnimationFrame(render);
 return{setProgress(v){v=clamp(v);if(v!==progress)dirty=true;progress=v;},setActive(v){active=v;if(v)resize();},inspectEntry(){targetAz=-.44;targetClose=1;inspectionNotified=false;dirty=true;},resetView(){targetAz=.3;targetClose=0;dirty=true;},resetInspection(){inspectionNotified=false;targetClose=0;targetAz=.3;dirty=true;},stats(){return{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,progress};},dispose(){dead=true;cancelAnimationFrame(frame);ro.disconnect();const gs=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);});Object.values(factory.site).forEach(g=>gs.add(g));Object.values(factory.simpleSite).forEach(g=>gs.add(g));for(const b of factory.blocks)for(const set of[b.full,b.low,b.roof,b.simpleRoof])Object.values(set).forEach(g=>gs.add(g));gs.forEach(g=>g.dispose());planTexture?.dispose();planFace?.material.dispose();materials.forEach(m=>m.dispose());edgeMat.dispose();ramp.dispose();renderer.dispose();}};
}
