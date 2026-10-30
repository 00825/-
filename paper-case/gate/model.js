export const PEOPLE={runner:{place:'walk',name:'湖边的跑友',cell:1},volunteer:{place:'square',name:'整理签到册的人',cell:2},chen:{place:'bench',name:'背工具包的人',cell:0}};
export const STOPS=[
 {id:'xinsu',name:'新苏工业坊',word:'工作',line:'工牌上的旧地址，是我们出发的地方。',image:'../xinsu/assets/courtyard.jpg'},
 {id:'neighbour',name:'新城邻里中心',word:'运动',line:'球拍上的胶带角，给下次修理留了方便。',image:'../neighbour/assets/courtyard.jpg'},
 {id:'culture',name:'苏州文化艺术中心',word:'文化',line:'开场前，还有人在替台上的人把台子搭稳。',image:'../culture/assets/lakeside.jpg'},
 {id:'nano',name:'苏州纳米城',word:'探索',line:'修好的展灯，让来访的人能亲手试一试。',image:'../nano/assets/workbench.jpg'},
 {id:'gate',name:'东方之门',word:'同行',line:'这一次，大家等他一起出发。',image:'./assets/lakeside.jpg'}
];
export const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
export const fresh=()=>({version:1,started:false,build:0,seen:[],place:'walk',met:[],compared:false,confirmed:false,delivered:false,opened:false,route:0,ended:false,photo:false});
export const ready=s=>s.seen.includes('arch')&&s.seen.includes('lake');
export function inspect(s,id){if(!s.started||s.build<.94||!['arch','lake'].includes(id))return false;if(!s.seen.includes(id))s.seen.push(id);return true;}
export function meet(s,id){if(!ready(s)||!PEOPLE[id]||PEOPLE[id].place!==s.place)return false;if(!s.met.includes(id))s.met.push(id);return true;}
export function compare(s,id){if(!s.met.includes(id))return false;if(id==='chen')s.compared=true;return true;}
export function identify(s,id,question){if(!ready(s)||!s.compared||!s.met.includes('chen')||id!=='chen'||question!=='tape')return false;s.confirmed=true;return true;}
export function deliver(s,p){if(!s.confirmed||!Number.isFinite(p)||p<.94)return false;s.delivered=true;return true;}
export function openLetter(s){if(!s.delivered)return false;s.opened=true;return true;}
export function connect(s,p){if(!s.opened||!Number.isFinite(p))return false;s.route=clamp(p);return true;}
export function finish(s){if(!s.opened||s.route<.99)return false;s.ended=true;return true;}
export function photograph(s){if(!s.ended)return false;s.photo=true;return true;}
export function restore(raw){const s=fresh();if(raw?.version!==1||!raw.started)return s;s.started=true;s.build=clamp(raw.build);if(s.build>=.94)s.seen=[...new Set((Array.isArray(raw.seen)?raw.seen:[]).filter(x=>['arch','lake'].includes(x)))];s.place=['walk','square','bench'].includes(raw.place)?raw.place:'walk';if(ready(s))s.met=[...new Set((Array.isArray(raw.met)?raw.met:[]).filter(x=>PEOPLE[x]))];s.compared=s.met.includes('chen')&&!!raw.compared;s.confirmed=s.compared&&!!raw.confirmed;s.delivered=s.confirmed&&!!raw.delivered;s.opened=s.delivered&&!!raw.opened;s.route=s.opened?clamp(raw.route):0;s.ended=s.route>=.99&&!!raw.ended;s.photo=s.ended&&!!raw.photo;return s;}
// Pointer-owned transfer: moving is only a preview; cancellation cannot deliver a letter.
export class LetterDrag{
 constructor(){this.active=null;this.value=0;}
 start(id,x,width){if(this.active||!Number.isFinite(x)||!Number.isFinite(width)||width<=0)return false;this.active={id,x,width,origin:this.value};return true;}
 move(id,x){if(!this.active||this.active.id!==id||!Number.isFinite(x))return false;this.value=clamp(this.active.origin+(x-this.active.x)/this.active.width);return true;}
 end(id,cancel=false){if(!this.active||this.active.id!==id)return null;const origin=this.active.origin;this.active=null;if(cancel)this.value=origin;return {value:this.value,accepted:!cancel&&this.value>=.94};}
}
