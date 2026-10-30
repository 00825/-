import {APPROACH,BEAT,WINDOW} from './score.js';
const ink='#173e49',paper='#fff1d1',gold='#eab767',teal='#538b89';
export function createScoreRenderer(canvas,{reduced=false}={}){
 const c=canvas.getContext('2d');let w=440,h=500,flashes=[0,0,0,0],feedback='',feedbackUntil=0;
 function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;if(!w||!h)return;const d=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);c.setTransform(d,0,0,d,0,0);}
 const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
 function rect(x,y,ww,hh,r=8){c.beginPath();c.roundRect(x,y,ww,hh,r);}
 function draw(run,now){if(!w||!h)return;const laneW=w/4,hitY=h-65,approach=run.approach||APPROACH,velocity=(hitY+40)/approach;c.clearRect(0,0,w,h);c.fillStyle=paper;c.fillRect(0,0,w,h);
  for(let lane=0;lane<4;lane++){const x=lane*laneW,held=run.held.has(lane);c.fillStyle=lane%2?'#f2e4c8':'#fff1d6';c.fillRect(x,0,laneW,h);if(held||now<flashes[lane]){c.fillStyle=held?'#dfac5b40':'#efbf7860';c.fillRect(x,0,laneW,h);}c.strokeStyle='#173e491c';c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();c.fillStyle=ink;c.font='13px Georgia';c.textAlign='center';c.fillText(['D','F','J','K'][lane],x+laneW/2,h-22);}
  c.strokeStyle='#d18d42';c.lineWidth=3;c.beginPath();c.moveTo(0,hitY);c.lineTo(w,hitY);c.stroke();
  c.font='10px sans-serif';c.fillStyle='#7d592f';c.textAlign='right';c.fillText('判定线',w-7,hitY-9);c.textAlign='center';
  for(const n of run.notes){if(n.result)continue;const delta=n.time-run.time,automatic=run.listen&&run.time>=n.time,active=n.holding||automatic;
   if(delta>approach||(delta<-WINDOW&&!n.duration)||run.time>n.time+n.duration+WINDOW)continue;
   const head=hitY-delta*velocity,y=(active||n.suspended)?Math.min(hitY,head):head,x=n.lane*laneW+8,keyW=laneW-16;
   if(n.duration){const tail=hitY-(n.time+n.duration-run.time)*velocity,top=Math.max(-15,tail),bottom=Math.min(h+30,y);if(bottom>top){const gradient=c.createLinearGradient(0,top,0,bottom);gradient.addColorStop(0,active?'#f4d398':'#7eaaa1');gradient.addColorStop(1,active?'#c68d42':ink);c.fillStyle=gradient;rect(x,top,keyW,bottom-top,8);c.fill();c.strokeStyle=active?'#f7cc71':'#346866';c.lineWidth=active?3:1;c.stroke();
    c.strokeStyle='#fff1d180';c.lineWidth=2;c.beginPath();c.moveTo(x+keyW/2,top+12);c.lineTo(x+keyW/2,bottom-12);c.stroke();
    if(tail>-8){c.fillStyle=paper;rect(x+8,tail-3,keyW-16,7,3);c.fill();c.font='10px sans-serif';c.fillStyle=paper;c.fillText('松开',x+keyW/2,tail+21);}
   }}
   c.fillStyle=active?gold:ink;rect(x,y-26,keyW,52,7);c.fill();c.strokeStyle=n.duration?'#eab767':'#fff2d488';c.lineWidth=n.duration?2:1;c.stroke();c.fillStyle=active?ink:paper;c.font=n.duration?'bold 13px sans-serif':'22px Georgia';c.fillText(n.duration?(n.suspended?'接着按':active?'按住…':'按住'):'♪',x+keyW/2,y+7);
   if(active&&n.duration){const progress=Math.max(0,Math.min(1,(run.time-n.time)/n.duration));c.strokeStyle=paper;c.lineWidth=3;c.beginPath();c.arc(x+keyW/2,hitY,21,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);c.stroke();}
  }
  if(run.status==='ready'){c.fillStyle=ink;c.font='23px serif';c.fillText('把灯，慢慢接亮。',w/2,h*.24);c.font='12px sans-serif';c.fillText('短键点一下 · 长键按住到尾端',w/2,h*.24+32);c.fillStyle=ink;rect(w*.21,h*.43,w*.21,43,6);c.fill();c.fillStyle=teal;rect(w*.59,h*.39,w*.2,80,7);c.fill();c.fillStyle=paper;c.font='12px sans-serif';c.fillText('轻点',w*.315,h*.43+28);c.fillText('按住',w*.69,h*.39+48);c.fillStyle=ink;c.font='10px sans-serif';c.fillText('轻点即离开',w*.315,h*.74);c.fillText('尾巴过线再松开',w*.69,h*.74);}
  if(run.status==='playing'&&run.time<0){c.fillStyle=ink;c.font='52px Georgia';c.fillText(String(Math.max(1,Math.ceil(-run.time/BEAT))),w/2,h*.42);c.font='12px sans-serif';c.fillText('听四拍，原曲马上开始',w/2,h*.42+30);}
  if(run.status==='playing'&&run.time>=0&&run.time<.95){c.fillStyle=ink;c.font='15px serif';c.fillText('不用抢拍，先听前奏。',w/2,h*.35);}
  if(run.status==='paused'){c.fillStyle='#173e49e6';c.fillRect(0,0,w,h);c.fillStyle=paper;c.font='25px serif';c.fillText('先停在这一拍',w/2,h*.43);c.font='12px sans-serif';c.fillText('音乐与琴键一起暂停',w/2,h*.43+30);if(run.notes.some(n=>n.suspended)){c.fillStyle=gold;c.fillText('继续后，重新按住刚才的长键',w/2,h*.43+60);}}
  if(feedback&&now<feedbackUntil&&run.status==='playing'&&run.time>=0){c.fillStyle='#fff2d4ec';rect(w*.14,15,w*.72,34,6);c.fill();c.fillStyle=ink;c.font='bold 14px sans-serif';c.fillText(feedback,w/2,38);}
 }
 return{resize,draw,react(e,now){if(e.note&&!['miss','hold-start'].includes(e.type)){flashes[e.note.lane]=now+(reduced?.1:.28);feedback=e.type==='listen'?'乐队示范':e.note.duration?'长键接住了':e.type==='perfect'?'正好这一拍':'接住了';}else feedback=e.type==='hold-start'?'按住这一束光，等尾巴过线':e.type==='miss'?(e.note?.duration?(e.reason==='early'?'长键松早了，下一拍再来':'这条长键没接上，下一拍再来'):'这一拍溜走了'):e.type==='stray'?'等琴键落到金线':'';feedbackUntil=now+.9;},dispose(){ro.disconnect();}};
}

