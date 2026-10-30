import * as T from '../../heritage/vendor/three.module.js';
import {NeighbourScene} from '../../assembly/neighbour.js';
import {CultureScene} from '../../assembly/culture.js';
import {clamp} from '../../assembly/model.js';

// Adapt the existing crescent wall, pearl and garden geometry to the chapter renderer.
// This adapter changes the renderer/palette, not the building into a new box model.
class Builder{
 constructor(){this.d=[];}
 tri(a,b,c,n){if(!n){const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const len=Math.hypot(...n)||1;n=n.map(v=>v/len);}for(const p of[a,b,c])this.d.push(...p,...n);}
 quad(a,b,c,d,n){this.tri(a,b,c,n);this.tri(a,c,d,n);}
}
export function createCultureStage(canvas,{onError=()=>{},reduced=false}={}){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch(e){onError(e);return null;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.25:1.65));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
 const scene=new T.Scene(),root=new T.Group();scene.add(root);
 scene.add(new T.HemisphereLight(0xfff5de,0x60787a,2.3));const sun=new T.DirectionalLight(0xffe6b3,2.5);sun.position.set(-3,7,5);scene.add(sun);
 const camera=new T.OrthographicCamera(-3.3,3.3,2.5,-2.5,.1,50),materials=new Map(),pools=new Map(),geometries=new Set(),edgeGeometries=new Map();
 const edgeMat=new T.LineBasicMaterial({color:0x1e4149,transparent:true,opacity:.2});
 function mat(rgb,mode=0){const key=rgb.join(',')+':'+mode;if(!materials.has(key)){const col=new T.Color().setRGB(...rgb);materials.set(key,mode===21?new T.MeshPhongMaterial({color:col,transparent:true,opacity:.44,depthWrite:false,shininess:60,side:T.DoubleSide}):mode===99?new T.MeshBasicMaterial({color:0x173d46,transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide}):new T.MeshStandardMaterial({color:col,roughness:mode===13?.48:.9,metalness:mode===13?.25:0,side:T.DoubleSide,emissive:mode===9?col:0,emissiveIntensity:.2}));}return materials.get(key);}
 function mesh(data){const pos=[],normal=[];for(let i=0;i<data.length;i+=6){pos.push(...data.slice(i,i+3));normal.push(...data.slice(i+3,i+6));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));geometries.add(g);return g;}
 const box=new T.BoxGeometry(1,1,1);geometries.add(box);const cb=new Builder();NeighbourScene.prototype.addChamfer.call({},cb,[0,0,0],[1,1,1],.035);const bevel=mesh(cb.d);
 const plate=new T.Mesh(box,mat([.94,.90,.78],12));plate.scale.set(5.3,.07,3.4);plate.position.set(0,-.12,-1.02);root.add(plate);const under=new T.Mesh(box,mat([.24,.46,.45],12));under.scale.set(5.36,.04,3.46);under.position.set(0,-.18,-1.02);root.add(under);
 const patch=new T.CircleGeometry(1,24);patch.rotateX(-Math.PI/2);geometries.add(patch);
 function draw(g,pos,size,rgb,rz=0,ry=0,mode=0){if(size.some(v=>!Number.isFinite(v)||Math.abs(v)<1e-6))return;
  const material=mat(rgb,mode);let byMaterial=pools.get(g);if(!byMaterial){byMaterial=new Map();pools.set(g,byMaterial);}let pool=byMaterial.get(material);if(!pool){pool={items:[],cursor:0};byMaterial.set(material,pool);}let item=pool.items[pool.cursor++];
  if(!item){item=new T.Mesh(g,material);root.add(item);pool.items.push(item);if([11,12,18].includes(mode)&&g!==box&&g!==bevel){if(!edgeGeometries.has(g))edgeGeometries.set(g,new T.EdgesGeometry(g,38));item.add(new T.LineSegments(edgeGeometries.get(g),edgeMat));}}
  item.visible=true;item.position.set(...pos);item.scale.set(...size);item.rotation.set(0,ry,rz,'YZX');
 }
 const r={mesh,draw,low:false,neighbourPolish:true,time:0,energy:0,mood:0,eye:[0,5,7],
  boxAt(p,s,c,rz=0,ry=0,mode=0){draw(box,p,s,c,rz,ry,mode);},
  bevelAt(p,s,c){draw(bevel,p,s,c,0,0,12);},
  contact(p,s){draw(patch,p,[s[0],1,s[2]],[0,0,0],0,0,99);},
  glass(g,p,s,ry=0){draw(g,p,s,[.24,.46,.47],0,ry,21);}
 };
 const craft=Object.create(NeighbourScene.prototype);Object.assign(craft,{r,Builder,C:{}});craft.leaf=craft.makeLeaf(20,12);craft.moonSphere=craft.makeLeaf(48,24);craft.column=craft.makeColumn();craft.torso=craft.makeTorso();craft.foliage=craft.leaf;
 const landmark=new CultureScene(r,{Builder,C:{},craft});r.low=innerWidth<700;
 let progress=0,active=false,dead=false,frame=0,last=0,az=.25,targetAz=.25,elevation=4.5,targetElevation=4.5,zoom=1,targetZoom=1,drag=null;
 function resize(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height,false);const aspect=rect.width/rect.height,halfH=Math.max(1.85,3.15/aspect),halfW=halfH*aspect;camera.left=-halfW;camera.right=halfW;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(canvas);
 function tick(now){if(dead)return;frame=requestAnimationFrame(tick);if(!active||document.hidden||now-last<1000/(innerWidth<700?24:35))return;const dt=Math.min(.05,(now-last)/1000);last=now;if(!reduced)r.time+=dt;
  const ease=reduced?1:.14;az+=(targetAz-az)*ease;elevation+=(targetElevation-elevation)*ease;zoom+=(targetZoom-zoom)*ease;
  for(const by of pools.values())for(const p of by.values())p.cursor=0;
  landmark.draw(0,progress);
  for(const by of pools.values())for(const p of by.values())for(let i=p.cursor;i<p.items.length;i++)p.items[i].visible=false;
  camera.zoom=zoom;camera.updateProjectionMatrix();camera.position.set(Math.sin(az)*7,elevation,Math.cos(az)*7);camera.lookAt(0,.48,-.9);r.eye=camera.position.toArray();renderer.render(scene,camera);
 }
 function down(e){drag={x:e.clientX,y:e.clientY,az:targetAz,el:targetElevation};canvas.setPointerCapture(e.pointerId);}
 function move(e){if(!drag)return;targetAz=clamp(drag.az+(e.clientX-drag.x)*.006,-1.25,1.25);targetElevation=clamp(drag.el+(e.clientY-drag.y)*.015,2.3,7);}
 function up(){drag=null;}
 function lost(e){e.preventDefault();active=false;onError(new Error('WebGL context lost'));}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('webglcontextlost',lost);
 frame=requestAnimationFrame(tick);
 return{setProgress(v){progress=clamp(v);},setActive(v){active=v;last=performance.now();if(v)resize();},inspect(part){targetAz=part==='wall'?.6:part==='garden'?-.5:.05;targetElevation=part==='pearl'?3.1:4.5;targetZoom=part==='pearl'?1.12:1;},rotate(direction){targetAz=clamp(targetAz+direction*.3,-1.25,1.25);},resetView(){targetAz=.25;targetElevation=4.5;targetZoom=1;},dispose(){dead=true;cancelAnimationFrame(frame);observer.disconnect();for(const [type,fn]of[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['webglcontextlost',lost]])canvas.removeEventListener(type,fn);geometries.forEach(g=>g.dispose());edgeGeometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());edgeMat.dispose();renderer.dispose();}};
}
