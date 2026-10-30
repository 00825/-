import {clamp,smooth} from './model.js';

// Original, repeatable daily-life vignettes, not records of particular residents.
const PERIOD=40;
const routes=[
 [[0,-1.78,.38],[6,-.77,.25],[11,-.77,-.59],[15,-.77,-.77],[24,-.77,-.77],[28,-.77,-.59],[33,-.77,.25],[40,-1.78,.38]],
 [[0,-1.70,.46],[10,.12,.46],[23,.12,.46],[33,-1.70,.46],[40,-1.70,.46]],
 [[0,1.65,.48],[10,.48,.48],[23,.48,.48],[33,1.65,.48],[40,1.65,.48]]
];
export function citizenPose(time,index,build=1){
 const route=routes[index%3],t=((time+(index===0?3:0))%PERIOD+PERIOD)%PERIOD;
 let distance=0,a=route[0],b=route[1];
 for(let i=0;i<route.length-1;i++){
  a=route[i];b=route[i+1];if(t<=b[0])break;
  distance+=Math.hypot(b[1]-a[1],b[2]-a[2]);
 }
 const u=clamp((t-a[0])/(b[0]-a[0])),e=smooth(u),dx=b[1]-a[1],dz=b[2]-a[2],length=Math.hypot(dx,dz);
 const speed=length*6*u*(1-u)/(b[0]-a[0]),x=a[1]+dx*e,z=a[2]+dz*e;
 const talking=index>0&&t>=10&&t<=23;
 return{x,z,speed,phase:(distance+length*e)*38,heading:talking?(index===1?Math.PI/2:-Math.PI/2):length>.0001?Math.atan2(dx,dz):0,
  stride:clamp(speed/.22),gesture:talking?(.5+.5*Math.sin(time*1.7+index))*smooth((t-10)/2)*smooth((23-t)/2):0,
  weight:smooth((build-.84)/.16)*(1-smooth((-.58-z)/.17)),bag:index===0,role:index};
}
export function entranceOpening(time,build){
 if(build<.88)return 0;const p=citizenPose(time,0,build);
 return smooth((build-.88)/.10)*(1-smooth(Math.hypot(p.x+.77,p.z+.60)/.30))*(1-smooth((-.62-p.z)/.08));
}
export function residentBird(time,index,energy=0){
 const t=((time+index*2.1)%32+32)%32,u=clamp((t-22)/8),f=Math.sin(Math.PI*u),a=index*2.399;
 return{x:Math.cos(a)*.43+Math.sin(u*Math.PI*2)*.7,z:.30+Math.sin(a)*.10-f*.50,
  y:.075+f*(.35+index*.035),flight:f,wing:Math.sin(time*(17+energy*3)+index)*.65*f,
  peck:(1-f)*Math.max(0,Math.sin(time*1.5+index*3))*.22};
}

// Gesture energy changes feedback, never the construction progress.
export class WheelFeedback{
 constructor(){this.angle=null;this.energy=0;this.velocity=0;}
 advance(dt,angle,{reduced=false,paused=false}={}){
  if(!Number.isFinite(angle))return this.energy;
  if(this.angle===null)this.angle=angle;
  const step=angle-this.angle;this.angle=angle;
  if(reduced||paused){this.energy=0;this.velocity=0;return 0;}
  if(!(dt>0))return this.energy;
  const span=Math.min(.05,dt),target=Math.min(1,Math.abs(step)/Math.max(.008,span)/9);
  this.energy+=(target-this.energy)*(1-Math.exp(-span*(target>this.energy?15:3.8)));
  this.velocity+=(Math.max(-10,Math.min(10,step/Math.max(.008,span)))-this.velocity)*(1-Math.exp(-span*9));
  return this.energy;
 }
}
