// Original forgiving side-view badminton. Coordinates use a fixed world;
// rendering and DOM controls are separate, so touch and keyboard share rules.
export const W=1000,H=580,FLOOR=480,NET=500,NET_TOP=335;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function flight(x,y,targetX,vy=-455){
 const gravity=780,t=(-vy+Math.sqrt(vy*vy+2*gravity*Math.max(0,FLOOR-y)))/gravity;
 return {x,y,vx:(targetX-x)/t,vy,age:0,last:x<NET?'left':'right',crossed:false};
}
// A downward fast shot must start high enough to clear the net physically.
export function smashFlight(x,y){const vx=930,t=(850-x)/vx,vy=(FLOOR-y-390*t*t)/t;return{x,y,vx,vy,age:0,last:'left',crossed:false,kind:'smash'};}
export function contactWindow(m){const b=m.ball,p=m.player;return !!(m.status==='rally'&&!m.paused&&b?.last==='right'&&m.hitAge>.14&&b.x<NET-7&&Math.abs(b.x-(p.x+37))<108&&b.y>p.y-200&&b.y<p.y-18);}
export function smashWindow(m){if(!contactWindow(m)||m.player.y>=FLOOR-25||m.ball.y>=NET_TOP-42||m.ball.y>=m.player.y-78)return false;const shot=smashFlight(m.ball.x,m.ball.y),t=(NET-shot.x)/shot.vx;return shot.vy>60&&shot.y+shot.vy*t+390*t*t<NET_TOP-8;}
export function prepareSmashWindow(m){const b=m.ball,p=m.player;return !!(!m.paused&&m.status==='rally'&&b?.last==='right'&&b.x>p.x-40&&b.x<p.x+280&&b.y<NET_TOP-55);}
export class Match{
 constructor({onEvent=()=>{},hits=0,assist=true}={}){this.onEvent=onEvent;this.hits=clamp(Number(hits)||0,0,999);this.assist=assist;this.score=[0,0];this.mode='long';this.time=0;this.rally=0;this.best=0;this.status='ready';this.paused=false;this.pointAge=0;this.player=this.actor(260);this.ai=this.actor(750);this.ball=null;this.trail=[];this.keys={};this.queued=0;this.smashQueued=0;this.smashes=0;this.hitAge=2;this.events=[];}
 actor(x){return{x,y:FLOOR,vy:0,vx:0,walk:0,swing:0,swingX:x+65,swingY:FLOOR-110,smash:0};}
 emit(type,detail={}){this.onEvent({type,...detail});}
 setAssist(on){this.assist=!!on;}
 moveTo(x){this.assist=false;this.pointerTarget=clamp(x,85,438);}
 jump(){const p=this.player;if(!this.paused&&this.status==='rally'&&p.y>=FLOOR-.5){p.vy=-450;this.emit('jump');}}
 smash(){if(this.paused||this.status!=='rally'||this.ball?.last!=='right')return false;this.jump();this.smashQueued=.66;this.player.smash=.66;this.emit('smash-prepare');return true;}
 swing(){if(this.paused)return false;if(this.status==='ready'||this.status==='point')return this.serve();if(this.status!=='rally')return false;if(this.player.swing>.1)return false;this.player.swing=.30;this.queued=.30;this.emit('swing');return true;}
 serve(){if(this.paused||this.status==='rally')return false;this.status='rally';this.rally=0;this.trail=[];this.queued=0;this.smashQueued=0;this.player.smash=0;this.pointerTarget=null;this.player.x=260;this.player.y=FLOOR;this.player.vy=0;this.ai.x=750;this.ai.y=FLOOR;this.ball=flight(735,345,260,-390);this.ball.last='right';this.ai.swing=.3;this.ai.swingX=735;this.ai.swingY=345;this.hitAge=0;this.emit('serve');return true;}
 predict(ball){let x=ball.x,y=ball.y,vx=ball.vx,vy=ball.vy;for(let i=0;i<180;i++){vy+=780/120;x+=vx/120;y+=vy/120;if(y>=FLOOR-105&&vy>0)break;}return x;}
 strike(side,kind=this.mode){const b=this.ball;if(!b||this.paused||this.status!=='rally'||b.last===side)return false;if(kind==='smash'&&(side!=='left'||!smashWindow(this)))return false;
  const actor=side==='left'?this.player:this.ai;
  actor.swing=.27;actor.swingX=b.x;actor.swingY=b.y;
  const count=this.hits,target=side==='left'?(this.mode==='short'?645:885):[185,320,405,265][count%4];
  const fresh=kind==='smash'?smashFlight(b.x,b.y):flight(b.x,b.y,target,side==='left'?(this.mode==='short'?-405:-475):-420);
  Object.assign(b,fresh,{last:side,crossed:false,kind});this.trail=[];this.hitAge=0;this.rally++;this.best=Math.max(this.best,this.rally);
  if(side==='left'){this.hits++;this.queued=0;this.smashQueued=0;if(kind==='smash'){this.smashes++;actor.smash=.34;}this.emit('hit',{side,hits:this.hits,rally:this.rally,kind});}
  else this.emit('hit',{side,hits:this.hits,rally:this.rally});return true;
 }
 point(winner,reason){if(this.status!=='rally')return;this.status='point';this.score[winner==='left'?0:1]++;this.pointAge=0;this.queued=0;this.smashQueued=0;this.emit('point',{winner,reason,score:[...this.score]});}
 step(dt){if(this.paused)return;dt=Math.min(.05,Math.max(0,dt));const n=Math.max(1,Math.ceil(dt/(1/120)));for(let i=0;i<n;i++)this.integrate(dt/n);}
 integrate(dt){
  this.time+=dt;this.hitAge+=dt;this.pointAge+=dt;this.queued=Math.max(0,this.queued-dt);this.smashQueued=Math.max(0,this.smashQueued-dt);
  const p=this.player,a=this.ai;
  for(const c of[p,a]){c.swing=Math.max(0,c.swing-dt);c.smash=Math.max(0,c.smash-dt);c.vy+=1050*dt;c.y=Math.min(FLOOR,c.y+c.vy*dt);if(c.y>=FLOOR)c.vy=0;}
  if(this.status!=='rally')return;
  const b=this.ball,dx=(this.keys.right?1:0)-(this.keys.left?1:0),oldP=p.x,oldA=a.x;
  if(dx){this.pointerTarget=null;p.x+=dx*410*dt;}
  else if(this.pointerTarget!=null)p.x+=clamp(this.pointerTarget-p.x,-410*dt,410*dt);
  else if(this.assist&&b.last==='right'){const target=clamp(this.predict(b)-26,100,405);p.x+=clamp(target-p.x,-390*dt,390*dt);}
  p.x=clamp(p.x,65,438);p.vx=(p.x-oldP)/Math.max(dt,.00001);p.walk+=Math.abs(p.x-oldP)*.035;
  if(b.last==='left'){const target=clamp(this.predict(b)+20,570,925);a.x+=clamp(target-a.x,-380*dt,380*dt);}
  a.vx=(a.x-oldA)/Math.max(dt,.00001);a.walk+=Math.abs(a.x-oldA)*.035;
  const oldX=b.x,oldY=b.y;b.vy+=780*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.age+=dt;
  if(this.time-(this.lastTrail??-1)>.023){this.lastTrail=this.time;this.trail.push({x:b.x,y:b.y});if(this.trail.length>16)this.trail.shift();}
  // Wide early input buffer, but a real spatial contact is still required.
  if(this.smashQueued>0&&smashWindow(this))this.strike('left','smash');
  else if(this.queued>0&&contactWindow(this))this.strike('left');
  if(b.last==='left'&&this.hitAge>.2&&b.x>NET+35&&b.vy>0&&Math.abs(b.x-(a.x-35))<95&&b.y>a.y-165&&b.y<a.y-35)this.strike('right');
  if(this.status!=='rally')return;
  if((oldX<NET&&b.x>=NET)||(oldX>NET&&b.x<=NET)){
   const q=(NET-oldX)/(b.x-oldX),atY=oldY+(b.y-oldY)*q;
   if(atY>=NET_TOP-3){b.x=NET+(oldX<NET?-8:8);b.vx*=-.15;b.vy=Math.abs(b.vy)*.15+40;this.point(b.last==='left'?'right':'left','net');return;}
   b.crossed=true;
  }
  if(b.x<30||b.x>970){this.point(b.last==='left'?'right':'left','out');return;}
  if(b.y>=FLOOR){b.y=FLOOR;this.point(b.x<NET?'right':'left','ground');}
 }
 pause(on=true){this.paused=on;this.keys={};this.pointerTarget=null;this.queued=0;this.smashQueued=0;}
}
