export const clamp=(v,a,b)=>Math.min(Math.max(v,a),Math.max(a,b));
export function clampPoint(p,b){return {x:clamp(p.x,b.left,b.right),y:clamp(p.y,b.top,b.bottom)};}
export class CompanionDrag{
 constructor(){this.position={x:0,y:0};this.active=null;this.facing=1;}
 place(p,b){this.position=clampPoint(p,b);return this.position;}
 start(id,x,y){if(this.active)return false;this.active={id,x,y,lastX:x,origin:{...this.position},moved:false};return true;}
 move(id,x,y,b){const a=this.active;if(!a||a.id!==id)return null;const dx=x-a.x,dy=y-a.y;a.moved||=Math.hypot(dx,dy)>6;if(Math.abs(x-a.lastX)>1)this.facing=x<a.lastX?-1:1;a.lastX=x;this.position=clampPoint({x:a.origin.x+dx,y:a.origin.y+dy},b);return this.position;}
 end(id,cancel=false){const a=this.active;if(!a||a.id!==id)return null;this.active=null;if(cancel)this.position=a.origin;return {dragged:a.moved,cancelled:cancel,position:{...this.position}};}
 nudge(dx,dy,b){if(dx)this.facing=dx<0?-1:1;this.position=clampPoint({x:this.position.x+dx,y:this.position.y+dy},b);return this.position;}
}
