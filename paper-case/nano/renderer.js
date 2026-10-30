import {ROUNDS,trace} from './puzzle.js';
const ink='#183f49',paper='#fff0ce',gold='#e6b460',teal='#347c7c';
export function createPuzzleRenderer(board,lens,{getState,reduced=false}={}){
 const contexts=[board,lens].map(c=>c.getContext('2d'));let active='building',frame=0,dead=false,last=0;
 const ro=new ResizeObserver(resize);ro.observe(board);ro.observe(lens);
 function resize(){for(const c of[board,lens]){const r=c.getBoundingClientRect();if(!r.width||!r.height)continue;const d=Math.min(devicePixelRatio||1,1.5);c.width=Math.round(r.width*d);c.height=Math.round(r.height*d);c.getContext('2d').setTransform(d,0,0,d,0,0);}}
 function drawBoard(s,t){const g=contexts[0],w=board.clientWidth,h=board.clientHeight;if(!w||!h)return;g.clearRect(0,0,w,h);g.fillStyle=paper;g.fillRect(0,0,w,h);const size=w*.76,cell=size/4,left=w*.12,top=h*.12,r=ROUNDS[s.round],beam=trace(r,s.rotations[s.round]),point=p=>[left+(p.x+.5)*cell,top+(p.y+.5)*cell];
  g.strokeStyle='#193f4925';g.lineWidth=1;for(let j=0;j<=4;j++){g.beginPath();g.moveTo(left+j*cell,top);g.lineTo(left+j*cell,top+size);g.moveTo(left,top+j*cell);g.lineTo(left+size,top+j*cell);g.stroke();}
  for(const[i,m]of r.mirrors.entries()){const[x,y]=point(m);g.fillStyle='#d0ddd2';g.fillRect(x-cell*.38,y-cell*.38,cell*.76,cell*.76);g.strokeStyle=ink;g.lineWidth=5;g.lineCap='round';g.beginPath();const flip=s.rotations[s.round][i]===1?1:-1;g.moveTo(x-cell*.28,y-cell*.28*flip);g.lineTo(x+cell*.28,y+cell*.28*flip);g.stroke();g.font='10px sans-serif';g.fillStyle=ink;g.textAlign='left';g.fillText(String(i+1),x-cell*.30,y+cell*.31);}
  g.lineCap='round';g.lineJoin='round';g.beginPath();beam.points.forEach((p,i)=>{const[x,y]=point(p);i?g.lineTo(x,y):g.moveTo(x,y);});g.lineWidth=10;g.strokeStyle='#e6b46030';g.stroke();g.lineWidth=3;g.strokeStyle=beam.complete?'#3a8582':gold;g.stroke();
  const segments=beam.points.slice(1).map((p,i)=>({a:point(beam.points[i]),b:point(p)}));if(!reduced){for(let k=0;k<4;k++){const at=(t*.002+k*segments.length/4)%segments.length,index=Math.floor(at),f=at-index,z=segments[index];if(!z)continue;g.fillStyle=beam.complete?'#9bd8c0':'#fff8e3';g.beginPath();g.arc(z.a[0]+(z.b[0]-z.a[0])*f,z.a[1]+(z.b[1]-z.a[1])*f,3,0,Math.PI*2);g.fill();}}
  r.sensors.forEach((p,i)=>{const[x,y]=point(p),lit=beam.lit.includes(i);g.fillStyle=lit?gold:paper;g.strokeStyle=ink;g.lineWidth=2;g.beginPath();g.arc(x,y,cell*.14,0,Math.PI*2);g.fill();g.stroke();g.fillStyle=ink;g.font='bold 10px sans-serif';g.textAlign='center';g.fillText(String(i+1),x,y+3);});
  for(const[p,word]of[[r.source,'光'],[r.receiver,'收']]){const[x,y]=point(p);g.fillStyle=word==='收'&&beam.complete?teal:ink;g.beginPath();g.arc(x,y,cell*.18,0,Math.PI*2);g.fill();g.fillStyle=paper;g.font='10px sans-serif';g.textAlign='center';g.fillText(word,x,y+3);}
 }
 function drawLens(s){const g=contexts[1],w=lens.clientWidth,h=lens.clientHeight;if(!w||!h)return;g.clearRect(0,0,w,h);g.fillStyle='#e9dfc3';g.fillRect(0,0,w,h);g.strokeStyle='#7a9b8d44';g.lineWidth=1;
  for(let x=0;x<w;x+=14){g.beginPath();g.moveTo(x,0);g.lineTo(x+h*.2,h);g.stroke();}for(let y=10;y<h;y+=18){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
  g.fillStyle='#32646566';g.textAlign='center';g.font='13px serif';for(let j=0;j<5;j++)for(let i=0;i<8;i++)g.fillText(['＋','∴','○','∷'][(i+j)%4],w*(i+.5)/8,h*(j+.6)/5);
  const x=s.lens*w,y=h*.48,r=Math.min(w*.19,h*.42);g.save();g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.clip();g.fillStyle='#fff5db';g.fillRect(0,0,w,h);g.strokeStyle='#e0c68c';g.lineWidth=1;for(let j=0;j<6;j++){g.beginPath();g.moveTo(0,j*h/6);g.lineTo(w,j*h/6);g.stroke();}
  g.textAlign='center';g.fillStyle=ink;g.font=`${Math.min(42,w*.085)}px SimSun,serif`;g.fillText('湖西',w*.25,y+10);g.fillText('门下',w*.75,y+10);g.font='10px sans-serif';g.fillStyle='#8f5b3c';g.fillText('还回去的路',w*.25,y+33);g.fillText('暮时见',w*.75,y+33);g.restore();
  g.lineWidth=8;g.strokeStyle=ink;g.beginPath();g.moveTo(x+r*.68,y+r*.68);g.lineTo(x+r*1.1,y+r*1.1);g.stroke();g.lineWidth=6;g.strokeStyle=gold;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke();g.lineWidth=1;g.strokeStyle=ink;g.stroke();
 }
 function tick(now){if(dead)return;frame=requestAnimationFrame(tick);if(document.hidden||now-last<1000/30)return;last=now;const s=getState();if(active==='board')drawBoard(s,now);if(active==='reveal')drawLens(s);}
 resize();frame=requestAnimationFrame(tick);return{setView(v){active=v;resize();},resize,dispose(){dead=true;cancelAnimationFrame(frame);ro.disconnect();}};
}
