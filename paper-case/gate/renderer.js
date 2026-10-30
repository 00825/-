import {STOPS,clamp} from './model.js';
import {visualTime} from './ending.js';
const ease=v=>{v=clamp(v);return v*v*(3-2*v);},lerp=(a,b,t)=>a+(b-a)*t;
export const loadImage=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Image could not load: '+src));i.src=src;});
export async function loadArt(){const [bg,walk,people,bird,...stops]=await Promise.all([loadImage('./assets/lakeside.jpg'),loadImage('./assets/promenade.jpg'),loadImage('./assets/people.webp'),loadImage('../xinsu/assets/aqi-sprites.png'),...STOPS.map(s=>loadImage(s.image))]);return {bg,walk,people,bird,stops};}
function cover(g,img,x,y,w,h){if(!img)return;const scale=Math.max(w/img.width,h/img.height),sw=w/scale,sh=h/scale;g.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h);}
function text(g,str,x,y,size=18,color='#173e49',font='SimSun,serif'){g.fillStyle=color;g.font=`${size}px ${font}`;g.fillText(str,x,y);}
export function bird(g,img,x,y,size,pose=0){if(!img)return;const sw=img.width/3,sh=img.height/2;g.drawImage(img,(pose%3)*sw,Math.floor(pose/3)*sh,sw,sh,x,y,size,size);}
function person(g,img,cell,x,y,h,t=0,moving=false){if(!img)return;const bob=moving?Math.sin(t*7+cell)*2:Math.sin(t*1.8+cell)*.7,w=h/2;g.save();g.translate(x+w/2,y+h);g.rotate(moving?Math.sin(t*3.5+cell)*.015:0);g.drawImage(img,cell*img.width/3,0,img.width/3,img.height,-w/2,-h+bob,w,h);g.restore();}
function lake(g,W,H,t){g.save();g.beginPath();g.rect(0,H*.58,W,H*.14);g.clip();for(let i=0;i<28;i++){const x=((i*73+t*(i%2?5:-4))%(W+90)+W+90)%(W+90)-45,y=H*(.59+(i%9)*.013);g.strokeStyle=i%3?'#fff0b32b':'#d9eff52d';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+16,y+Math.sin(t+i),x+36+i%12,y);g.stroke();}g.restore();}
function paperCard(g,art,i,x,y,w,h,growth=1,angle=0){g.save();g.translate(x+w/2,y+h);g.rotate(angle);const s=Math.max(.015,growth);g.scale(1,s);g.translate(-w/2,-h);g.shadowColor='#12333a55';g.shadowBlur=6;g.shadowOffsetY=5;g.fillStyle='#fff0d1';g.fillRect(0,0,w,h);g.shadowBlur=0;g.shadowOffsetY=0;g.strokeStyle='#244c53';g.lineWidth=1;g.strokeRect(0,0,w,h);cover(g,art.stops[i],7,7,w-14,h*.56);g.fillStyle='#286568';g.fillRect(8,h*.56+11,26,3);text(g,STOPS[i].name,9,h*.56+29,Math.max(9,w*.074));text(g,`0${i+1} / ${STOPS[i].word}`,9,h-10,Math.max(8,w*.055),'#9b613f','sans-serif');g.restore();}
function envelope(g,x,y,w,h,open=0){g.save();g.translate(x,y);g.shadowColor='#173e4944';g.shadowBlur=8;g.shadowOffsetY=7;g.fillStyle='#ead0a0';g.fillRect(0,0,w,h);g.shadowBlur=0;g.shadowOffsetY=0;g.strokeStyle='#9d7950';g.lineWidth=1;g.strokeRect(0,0,w,h);g.beginPath();g.moveTo(0,0);g.lineTo(w/2,lerp(h*.56,-h*.6,ease(open)));g.lineTo(w,0);g.closePath();g.fillStyle='#f3ddba';g.fill();g.stroke();text(g,'致：陈师傅',w*.12,h*.73,w*.085);g.beginPath();g.arc(w*.8,h*.7,w*.08,0,Math.PI*2);g.fillStyle='#ad6545';g.fill();text(g,'邀',w*.756,h*.743,w*.084,'#fff1d2');g.restore();}
export function paintEnding(g,W,H,time,art,{photo=false,reduced=false}={}){
 const t=visualTime(time),portrait=W/H<1.1,sceneT=reduced?0:t;
 g.clearRect(0,0,W,H);cover(g,art.walk||art.bg,0,0,W,H);g.fillStyle='#173e4922';g.fillRect(0,0,W,H);lake(g,W,H,sceneT);
 // The final camera pulls back to reveal that the lakeside gathering lives on an open hand-made book.
 const pull=ease((t-21)/7),zoom=lerp(1.05,.91,pull);g.save();g.translate(W/2,H*.44);g.scale(zoom,zoom);g.translate(-W/2,-H*.44);
 const bookMix=photo?1:ease((t-9.5)/3.5);
 if(t<13&&!photo){g.save();g.globalAlpha=1-bookMix;const phase=ease(t/5.6),w=W*(portrait?.68:.38),h=w*.61,x=W/2-w/2+Math.sin(t*.4)*8,y=lerp(H*.38,H*.25,phase);envelope(g,x,y,w,h,ease((t-1)/3));
  if(t>3){const a=ease((t-3)/3);g.save();g.globalAlpha*=a;g.fillStyle='#fff4d9';g.fillRect(x+w*.08,y-h*.25*a,w*.84,h*.64);text(g,'陈师傅，一起走下一程。',x+w*.13,y+h*.05,w*.05);g.restore();}
  const step=ease((t-5)/5),bh=H*(portrait?.31:.42);person(g,art.people,0,lerp(W*.77,W*.57,step),H*.72-bh,bh,sceneT,true);bird(g,art.bird,lerp(W*.06,W*.27,step),H*.64,H*.17,Math.floor(t*3)%2?3:0);
  g.restore();
 }
 if(t>9.5||photo){g.save();g.globalAlpha=bookMix;
  const margin=W*.055,bookY=H*(portrait?.12:.13),bookH=H*.53;g.fillStyle='#173e4940';g.fillRect(margin+7,bookY+8,W-2*margin,bookH);g.fillStyle='#fbedd0';g.fillRect(margin,bookY,W-2*margin,bookH);g.strokeStyle='#a28c66';g.strokeRect(margin,bookY,W-2*margin,bookH);const spine=g.createLinearGradient(W/2-12,0,W/2+12,0);spine.addColorStop(0,'#e5d5b300');spine.addColorStop(.5,'#92714355');spine.addColorStop(1,'#e5d5b300');g.fillStyle=spine;g.fillRect(W/2-12,bookY,24,bookH);
  text(g,'阿奇的五站手记',margin+18,bookY+27,portrait?W*.035:19,'#173e49');
  const cardW=portrait?(W-2*margin-45)/3:(W-2*margin-68)/5,cardH=portrait?bookH*.36:bookH*.64;
  for(let i=0;i<5;i++){const x=portrait?margin+12+(i%3)*(cardW+10)+(i>=3?cardW*.5:0):margin+12+i*(cardW+11),y=portrait?bookY+43+Math.floor(i/3)*(cardH+17):bookY+45+Math.sin(i*1.6)*9,grow=photo?1:ease((t-12-i*.75)/2);paperCard(g,art,i,x,y,cardW,cardH,grow,(i-2)*.022);}
  const path=ease((t-15)/6);g.setLineDash([5,7]);g.strokeStyle='#b17a47';g.lineWidth=2;g.beginPath();g.moveTo(W*.14,bookY+bookH*.92);g.bezierCurveTo(W*.25,bookY+bookH*.81,W*.6,bookY+bookH*1.02,W*(.14+.72*path),bookY+bookH*.91);g.stroke();g.setLineDash([]);
  const peopleIn=photo?1:ease((t-18)/6),bh=H*(portrait?.22:.28),by=H*.75-bh,offset=H*.34*(1-peopleIn);
  person(g,art.people,1,W*.15-offset,by+bh*.06,bh*.94,sceneT,!photo&&peopleIn<1);person(g,art.people,0,W*.42,by,bh,sceneT,!photo&&peopleIn<1);person(g,art.people,2,W*.64+offset,by+bh*.025,bh*.975,sceneT,!photo&&peopleIn<1);
  const bs=H*.15;bird(g,art.bird,W*.32-bs/2,H*.76-bs+Math.sin(sceneT*3)*3,bs,photo?3:Math.floor(t*2)%3===0?4:3);
  if(photo||t>25){g.globalAlpha=photo?1:ease((t-25)/3);g.fillStyle='#fff0d3ed';g.fillRect(W*.055,H*.81,W*.89,H*.13);text(g,'这封邀请，终于送到了。',W*.09,H*.86,Math.min(W*.04,H*.06,42));text(g,'新苏工业坊 → 邻里中心 → 苏艺 → 纳米城 → 东方之门',W*.09,H*.90,Math.min(W*.018,H*.029,20),'#426c68','sans-serif');g.globalAlpha=1;}
  g.restore();
 }
 g.restore();
 if(photo){g.strokeStyle='#f8e9c6';g.lineWidth=H*.04;g.strokeRect(0,0,W,H);text(g,'阿奇城市寻人手记 / 五站同行 · 虚构故事纪念',W*.065,H*.97,Math.min(W*.015,18),'#fff0d2','sans-serif');}
}
export function paintPostcard(g,W,H,index,note,art){const s=STOPS[index];g.clearRect(0,0,W,H);g.fillStyle='#f9ecd0';g.fillRect(0,0,W,H);cover(g,art.stops[index],W*.035,H*.035,W*.93,H*.55);g.strokeStyle='#173e49';g.lineWidth=2;g.strokeRect(W*.035,H*.035,W*.93,H*.55);bird(g,art.bird,W*.67,H*.42,W*.25,3);text(g,`阿奇城市寻人手记 / 0${index+1} · ${s.word}`,W*.06,H*.64,W*.022,'#426e6b','sans-serif');text(g,s.name,W*.06,H*.71,W*.059);text(g,['从这里，开始找一个人。','下班以后，来一拍。','这一场，也有他的那一份。','借来的，好好还。','这一次，一起走。'][index],W*.06,H*.77,W*.032);text(g,s.line,W*.06,H*.83,W*.021,'#47655f','sans-serif');g.strokeStyle='#173e4944';g.beginPath();g.moveTo(W*.06,H*.87);g.lineTo(W*.94,H*.87);g.stroke();if(note){g.save();g.beginPath();g.rect(W*.06,H*.875,W*.88,H*.07);g.clip();text(g,note,W*.06,H*.92,W*.028);g.restore();}text(g,'真实地标的艺术化插画 · 阿奇为本项目原创IP · 非实景照片',W*.06,H*.97,W*.014,'#68796d','sans-serif');}
export function startAtmosphere(canvas,{reduced=false}={}){const g=canvas.getContext('2d');if(!g)return()=>{};let raf=0,last=0,W=0,H=0;const resize=()=>{W=innerWidth;H=innerHeight;canvas.width=W;canvas.height=H;};resize();const frame=now=>{raf=requestAnimationFrame(frame);if(document.hidden||now-last<50||reduced)return;last=now;g.clearRect(0,0,W,H);lake(g,W,H,now/1000);for(let i=0;i<9;i++){const x=(W*.13+i*W*.12+Math.sin(now*.0002+i)*15)%W,y=(H*.17+i*71+now*.009)%H;g.fillStyle='#ffe8ad44';g.beginPath();g.arc(x,y,1.2,0,Math.PI*2);g.fill();}};window.addEventListener('resize',resize);if(!reduced)raf=requestAnimationFrame(frame);return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};}
