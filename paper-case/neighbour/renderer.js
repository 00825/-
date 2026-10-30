import {W,H,FLOOR,NET,NET_TOP,contactWindow} from './match.js';

// All moving sports artwork is original Canvas geometry, not a video or sprite replay.
export function createCourt(canvas,match){
 const c=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let width=1000,height=580,scale=1,offsetX=0,offsetY=0,burst=[],last=0;
 const ink='#193c46',paper='#f8efd9',teal='#397b78',gold='#c28b35';
 function resize(){const r=canvas.getBoundingClientRect();width=r.width||1000;height=r.height||580;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);c.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(width/W,height/H);offsetX=(width-W*scale)/2;offsetY=(height-H*scale)/2;}
 const observer=new ResizeObserver(resize);observer.observe(canvas);
 function path(points,color=ink,line=3){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=line;c.lineCap='round';c.lineJoin='round';c.stroke();}
 function ellipse(x,y,rx,ry,fill,stroke=null,line=3){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
 function person(a,side){const dir=side==='left'?1:-1,col=dir===1?teal:gold,t=match.time;
  ellipse(a.x,FLOOR+6,32,6,'#193c4619');
  const run=Math.min(1,Math.abs(a.vx)/200),s=Math.sin(a.walk)*run,lean=a.vx*.018+(a.smash>0?(a.swing>0?15:-10):0),bob=reduced?0:Math.abs(Math.sin(a.walk))*4*run;
  const hip={x:a.x,y:a.y-50-bob},shoulder={x:a.x+lean,y:a.y-106-bob};
  path([[hip.x,hip.y],[a.x-13-s*21,a.y-22],[a.x-17-s*25,a.y]],ink,6);
  path([[hip.x,hip.y],[a.x+13+s*21,a.y-22],[a.x+17+s*25,a.y]],ink,6);
  path([[a.x-19-s*25,a.y],[a.x-7-s*25,a.y]],ink,8);path([[a.x+12+s*25,a.y],[a.x+26+s*25,a.y]],ink,8);
  path([[hip.x,hip.y],[shoulder.x,shoulder.y]],col,17);path([[hip.x-2,hip.y+2],[shoulder.x-2,shoulder.y]],ink,2);
  ellipse(shoulder.x,a.y-132-bob,18,20,paper,ink,4);
  path([[shoulder.x+dir*9,a.y-135-bob],[shoulder.x+dir*11,a.y-135-bob]],ink,3);
  path([[shoulder.x+dir*3,a.y-123-bob],[shoulder.x+dir*10,a.y-125-bob]],ink,1.5);
  let rx=shoulder.x+dir*68,ry=shoulder.y-34;
  if(a.smash>0){rx=shoulder.x-dir*25;ry=shoulder.y-65;}
  if(a.swing>0){const phase=1-a.swing/.30;rx=shoulder.x+dir*(45+42*Math.sin(phase*Math.PI));ry=shoulder.y-70+100*phase;
   if(a.smash>0){rx=shoulder.x+dir*(12+92*phase);ry=shoulder.y-90+155*phase;}
   if(a.swing<=.27&&match.hitAge<.15){rx=a.swingX;ry=a.swingY;}
   if(!reduced){c.globalAlpha=.18;path([[shoulder.x+dir*25,shoulder.y-80],[rx,ry]],col,12);c.globalAlpha=1;}}
  path([[shoulder.x,shoulder.y+4],[shoulder.x-dir*21,shoulder.y+33],[shoulder.x-dir*7,shoulder.y+50]],ink,5);
  const handX=shoulder.x+(rx-shoulder.x)*.55,handY=shoulder.y+(ry-shoulder.y)*.55;
  path([[shoulder.x,shoulder.y],[shoulder.x+dir*27,shoulder.y-3],[handX,handY]],ink,5);
  path([[handX,handY],[rx,ry]],ink,3);
  c.save();c.translate(rx,ry);c.rotate(dir*.38);ellipse(0,0,13,20,paper,ink,3);c.save();c.beginPath();c.ellipse(0,0,11,18,0,0,Math.PI*2);c.clip();for(let k=-16;k<=16;k+=6){path([[-15,k],[15,k]],'#397b7877',1);path([[k,-22],[k,22]],'#397b7877',1);}c.restore();c.restore();
 }
 function shuttle(b){c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));c.fillStyle=paper;c.strokeStyle=ink;c.lineWidth=1.8;c.beginPath();c.moveTo(0,0);c.lineTo(-20,-10);c.lineTo(-24,0);c.lineTo(-20,10);c.closePath();c.fill();c.stroke();path([[-5,0],[-22,-7]],ink,1);path([[-5,0],[-24,0]],ink,1);path([[-5,0],[-22,7]],ink,1);ellipse(0,0,5,5,gold,ink,1.6);c.restore();}
 function react(e){if(e.type==='hit'&&match.ball){const n=e.kind==='smash'?13:7,speed=e.kind==='smash'?230:80;burst=Array.from({length:n},(_,i)=>({x:match.ball.x,y:match.ball.y,vx:Math.cos(i*6.28/n)*speed,vy:Math.sin(i*6.28/n)*speed,life:.32}));}}
 function draw(now=0){const dt=Math.min(.05,(now-last)/1000||0);last=now;c.clearRect(0,0,width,height);c.fillStyle=paper;c.fillRect(0,0,width,height);c.save();c.translate(offsetX,offsetY);c.scale(scale,scale);
  // Printed architecture on the practice card echoes the scene outside it.
  c.globalAlpha=.13;for(let side of[100,650]){c.fillStyle=teal;c.fillRect(side,90,250,125);for(let row=0;row<4;row++)path([[side,110+row*27],[side+250,110+row*27]],paper,9);}ellipse(500,112,168,17,ink);path([[330,181],[670,181]],ink,8);c.globalAlpha=1;
  c.fillStyle='#d9e0c766';c.beginPath();c.moveTo(50,FLOOR+1);c.lineTo(155,258);c.lineTo(845,258);c.lineTo(950,FLOOR+1);c.closePath();c.fill();
  path([[50,FLOOR],[155,258],[845,258],[950,FLOOR],[50,FLOOR]],'#397b7866',2);path([[75,425],[925,425]],'#397b7844',2);path([[180,FLOOR],[248,258]],'#397b7833',2);path([[820,FLOOR],[752,258]],'#397b7833',2);
  // A vertical net in a side-view game, with a low-contrast receding panel.
  c.fillStyle='#193c4609';c.fillRect(NET-4,NET_TOP,76,FLOOR-NET_TOP);for(let y=NET_TOP+8;y<FLOOR;y+=12)path([[NET,y],[NET+74,y]],'#193c462f',1);for(let x=NET+12;x<NET+75;x+=12)path([[x,NET_TOP],[x,FLOOR]],'#193c462f',1);
  path([[NET,FLOOR+4],[NET,NET_TOP],[NET+75,NET_TOP]],ink,4);path([[NET-12,FLOOR+5],[NET+13,FLOOR+5]],ink,4);
  const ready=contactWindow(match);
  if(ready){ellipse(match.player.x,FLOOR+6,42,10,'#d49c4233',gold,2);c.font='18px sans-serif';c.fillStyle=ink;c.textAlign='center';c.fillText('挥拍',match.player.x,match.player.y-183);}
  person(match.player,'left');person(match.ai,'right');
  if(match.ball){if(!reduced){for(let i=1;i<match.trail.length;i++){c.globalAlpha=i/match.trail.length*(match.ball.kind==='smash'?.6:.25);path([[match.trail[i-1].x,match.trail[i-1].y],[match.trail[i].x,match.trail[i].y]],match.ball.kind==='smash'?gold:teal,match.ball.kind==='smash'?6:3);}c.globalAlpha=1;}shuttle(match.ball);}
  if(!reduced)for(const b of burst){b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.life>0){c.globalAlpha=b.life/.32;path([[b.x,b.y],[b.x-b.vx*.03,b.y-b.vy*.03]],gold,3);}}c.globalAlpha=1;
  c.fillStyle='#193c4680';c.font='12px sans-serif';c.textAlign='left';c.fillText('邻里练习卡 / 艺术化活动角',55,540);c.textAlign='right';c.fillText(match.assist?'自动跑位 · 你来掌握挥拍时机':'手动跑位',945,540);
  if(match.paused){c.fillStyle='#f8efd9bb';c.fillRect(0,0,W,H);c.fillStyle=ink;c.font='32px SimSun,serif';c.textAlign='center';c.fillText('歇一拍',500,280);c.font='16px sans-serif';c.fillText('点“继续”回到球场',500,315);}c.restore();return ready;
 }
 return {draw,react,resize,toWorld(clientX){return(clientX-canvas.getBoundingClientRect().left-offsetX)/scale;},dispose(){observer.disconnect();}};
}
