export const VERSION=2;
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const INITIAL_ORDER=[4,2,5,1,3,0];
export function fresh(){return {version:VERSION,started:false,openingSeen:false,badge:false,archive:false,placed:[],open:0,inspected:false,photo:false,back:false,destination:false};}
export function complete(s){return s.placed.length===6;}
export function restore(raw){
 const s=fresh();if(!raw||![1,VERSION].includes(raw.version))return s;
 s.openingSeen=raw.openingSeen===true;
 s.started=raw.started===true;s.badge=s.started&&raw.badge===true;s.archive=s.badge&&raw.archive===true;
 s.placed=s.archive&&Array.isArray(raw.placed)?[...new Set(raw.placed.filter(n=>Number.isInteger(n)&&n>=0&&n<6))]:[];
 s.open=complete(s)&&Number.isFinite(raw.open)?clamp(raw.open):0;
 s.inspected=complete(s)&&(raw.inspected===true||raw.photo===true);s.photo=s.inspected&&raw.photo===true;s.back=s.photo&&raw.back===true;s.destination=s.back&&raw.destination===true;return s;
}
export function chooseArchive(s,id){if(!s.badge)return {ok:false,reason:'先看看工牌背面的档案编号。'};if(id!=='A-07')return {ok:false,reason:id==='A-03'?'这是设备保养卷。和工牌上的编号对不上。':'这是材料清单。再对照一下工牌背面。'};s.archive=true;return {ok:true};}
export function place(s,piece,slot){if(!s.archive)return {ok:false,reason:'先找到对应的档案卷。'};if(!Number.isInteger(piece)||piece<0||piece>5||!Number.isInteger(slot)||slot<0||slot>5)return {ok:false,reason:'把图纸放进留白处。'};if(s.placed.includes(piece))return {ok:false,reason:'这张图纸已经接好了。'};if(piece!==slot)return {ok:false,reason:'窗带或楼梯间没有接上，换个位置试试。'};s.placed.push(piece);return {ok:true,complete:complete(s)};}
export function turn(s,value){if(!complete(s))return false;if(!Number.isFinite(value))return false;s.open=clamp(value);return true;}
export function inspectEntry(s){if(!complete(s)||s.open<.94)return false;s.inspected=true;return true;}
export function takePhoto(s){if(!complete(s)||s.open<.94||!s.inspected)return false;s.photo=true;return true;}
export function destination(s,id){if(!s.photo||!s.back)return {ok:false,reason:'翻到合影背面找找地点线索。'};if(id!=='neighbour')return {ok:false,reason:'再看背面的桥廊、圆形雨棚，以及“下班以后”这句话。'};s.destination=true;return {ok:true};}
export function goal(s){if(s.destination)return'去新城邻里中心问问，那里也许有人记得他。';if(s.photo)return'翻到合影背面，看看有没有留下去处。';if(complete(s))return s.open>.93?(s.inspected?'门廊这页夹着张合影，把它拿出来。':'换个角度，看看门廊后面露出的纸角。'):'转动纸轮，先把厂房展开。';if(s.archive)return'把图纸接好，找找夹在里面的合影。';if(s.badge)return'桌上的档案按编号放着，找 A-07 那卷。';return'先问问林姨，再翻翻旧工牌。';}
