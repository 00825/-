export const ROUNDS=[
 {name:'先让光转个弯',source:{x:-1,y:2,dir:1},receiver:{x:4,y:0},mirrors:[{x:1,y:2},{x:1,y:0}],initial:[1,1],sensors:[{x:1,y:1},{x:2,y:0}]},
 {name:'把两个窗口一起点亮',source:{x:-1,y:3,dir:1},receiver:{x:4,y:3},mirrors:[{x:1,y:3},{x:1,y:1},{x:3,y:1},{x:3,y:3}],initial:[1,0,0,0],sensors:[{x:1,y:2},{x:3,y:2}]}
];
const delta=[[0,-1],[1,0],[0,1],[-1,0]],reflect=[[1,0,3,2],[3,2,1,0]];
export function trace(round,rotations=round.initial){let {x,y,dir}=round.source;const points=[{x,y}],lit=new Set(),visited=new Set();
 for(let k=0;k<80;k++){const key=[x,y,dir].join(',');if(visited.has(key))return {points,lit:[...lit],complete:false,reason:'loop'};visited.add(key);const [dx,dy]=delta[dir];x+=dx;y+=dy;points.push({x,y});
  if(x<0||x>=4||y<0||y>=4){const atGoal=x===round.receiver.x&&y===round.receiver.y;return {points,lit:[...lit],complete:atGoal&&lit.size===round.sensors.length,reason:atGoal?'receiver':'edge'};}
  round.sensors.forEach((s,i)=>{if(s.x===x&&s.y===y)lit.add(i);});const m=round.mirrors.findIndex(m=>m.x===x&&m.y===y);if(m>=0)dir=reflect[rotations[m]===1?1:0][dir];
 }return {points,lit:[...lit],complete:false,reason:'loop'};
}
export const fresh=()=>({version:1,started:false,build:0,seen:[],round:0,rotations:ROUNDS.map(r=>[...r.initial]),solved:[],lens:.15,fragments:[],card:false});
export const ready=s=>s.seen.includes('lab')&&s.seen.includes('link');
export function restore(raw){const s=fresh();if(raw?.version!==1)return s;s.started=!!raw.started;if(!s.started)return s;s.build=Math.max(0,Math.min(1,Number(raw.build)||0));s.seen=[...new Set((Array.isArray(raw.seen)?raw.seen:[]).filter(x=>['lab','link'].includes(x)))];
 s.rotations=ROUNDS.map((r,i)=>r.mirrors.map((m,j)=>[0,1].includes(raw.rotations?.[i]?.[j])?raw.rotations[i][j]:r.initial[j]));
 if(ready(s))for(let i=0;i<2;i++){if(i===1&&!s.solved.includes(0))break;if((Array.isArray(raw.solved)&&raw.solved.includes(i))&&trace(ROUNDS[i],s.rotations[i]).complete)s.solved.push(i);}
 s.round=s.solved.includes(0)?1:0;s.lens=Math.max(.05,Math.min(.95,Number(raw.lens)||.15));if(s.solved.length===2)s.fragments=[...new Set((Array.isArray(raw.fragments)?raw.fragments:[]).filter(x=>x===0||x===1))];s.card=s.fragments.length===2&&!!raw.card;return s;
}
export function inspect(s,part){if(s.build<.94||!['lab','link'].includes(part))return false;if(!s.seen.includes(part))s.seen.push(part);return true;}
export function rotate(s,index){if(!ready(s)||s.solved.includes(s.round)||!Number.isInteger(index)||index<0||index>=ROUNDS[s.round].mirrors.length)return false;s.rotations[s.round][index]^=1;return true;}
export function confirm(s){if(!ready(s)||!trace(ROUNDS[s.round],s.rotations[s.round]).complete)return false;if(!s.solved.includes(s.round))s.solved.push(s.round);if(s.round===0)s.round=1;return true;}
export function observe(s,p){if(s.solved.length!==2||!Number.isFinite(p))return false;s.lens=Math.max(.05,Math.min(.95,p));[.25,.75].forEach((x,i)=>{if(Math.abs(s.lens-x)<.085&&!s.fragments.includes(i))s.fragments.push(i);});return true;}
export function collect(s){if(s.solved.length!==2||s.fragments.length!==2)return false;s.card=true;return true;}
