// Sparse, authored chart from the supplied recording's onsets; never time-stretch the song.
export const BPM=200/3,BEAT=.9,DURATION=45.7386875,APPROACH=4.2,WINDOW=.32;
export const SPEEDS=Object.freeze({slow:{label:'慢速',approach:5.6},medium:{label:'中速',approach:4.2},fast:{label:'快速',approach:2.6}});
export const speedFor=value=>SPEEDS[value]||SPEEDS.medium;
export const SONG={src:'./assets/audio/lakeside-user-song.mp3',label:'湖畔试音',version:2};
// [onset, lane, hold duration]. Intro teaches taps before the first long key.
const layout=[
 [5.182,0],[6.092,1],[7.212,2],[8.592,3],[9.492,1,1.79],
 [12.182,2],[13.532,0],[14.442,3,1.80],[17.142,2],[18.042,1],[19.392,0],
 [20.522,2,2.48],[23.902,1],[24.802,3,1.79],[27.502,0],[28.402,1],[29.182,3],
 [30.202,2,1.80],[32.902,3],[34.702,1],[36.052,0,1.80],
 [39.192,2],[40.312,3],[40.992,1,1.80]
];
export const CHART=layout.map(([time,lane,duration=0],id)=>({id,time,lane,duration,kind:duration?'hold':'tap'}));
export const LYRICS=[
 {time:0,text:'先听一会儿，短键轻轻点一下。'},
 {time:8.2,text:'长键来了：按住，到尾巴经过金线再松开。'},
 {time:17,text:'不用抢拍，让手跟着音乐走。'},
 {time:24,text:'把这一束光，慢慢留在舞台上。'},
 {time:33,text:'听见句子的停顿，给下一拍一点空间。'},
 {time:39,text:'最后几拍了，陪这场演出亮起来。'}
];
export class RhythmRun{
 constructor({chart=CHART,duration=DURATION,onEvent=()=>{}}={}){this.chart=chart;this.duration=duration;this.onEvent=onEvent;this.reset();}
 reset(){this.notes=this.chart.map(n=>({...n,duration:n.duration||0,result:null,holding:false,suspended:false}));this.held=new Map();this.status='ready';this.time=-4*BEAT;this.score=0;this.hits=0;this.holdHits=0;this.misses=0;this.strays=0;this.combo=0;this.best=0;this.listen=false;}
 start(listen=false){this.reset();this.listen=listen;this.status='playing';}
 advance(time){if(this.status!=='playing')return;this.time=Math.max(this.time,Math.min(this.duration+.4,time));
  for(const n of this.notes){if(n.result)continue;const end=n.time+n.duration;
   if(this.listen){if(this.time>=end)this.resolve(n,'listen');continue;}
   if(n.holding){if(this.time>=end)this.resolve(n,n.grade);continue;}
   if(n.suspended){if(this.time>Math.min(n.resumeDeadline,end+WINDOW)){n.failure='resume';this.resolve(n,'miss');}continue;}
   if(this.time>n.time+WINDOW)this.resolve(n,'miss');
  }
  if(this.time>=this.duration){for(const n of this.notes)if(!n.result)this.resolve(n,this.listen?'listen':'miss');this.status='done';this.onEvent({type:'done',hits:this.hits,listen:this.listen});}
 }
 resolve(note,kind){if(note.result)return;note.result=kind;note.holding=false;note.suspended=false;this.held.delete(note.lane);
  if(kind==='miss'){this.misses++;this.combo=0;}else if(kind!=='listen'){this.hits++;this.holdHits+=Number(note.duration>0);this.combo++;this.best=Math.max(this.best,this.combo);this.score+=(kind==='perfect'?100:70)+(note.duration?50:0);}
  this.onEvent({type:kind,note,combo:this.combo,reason:note.failure||'late'});
 }
 press(lane,time=this.time){if(this.status!=='playing'||this.listen||time<0)return false;this.advance(time);time=this.time;if(this.status!=='playing'||this.held.has(lane))return false;
  const suspended=this.notes.find(n=>n.lane===lane&&n.suspended&&!n.result&&time<=n.resumeDeadline&&time<=n.time+n.duration+WINDOW);
  const candidates=suspended?[suspended]:this.notes.filter(n=>!n.result&&!n.holding&&!n.suspended&&n.lane===lane&&Math.abs(n.time-time)<=WINDOW);
  candidates.sort((a,b)=>Math.abs(a.time-time)-Math.abs(b.time-time));const note=candidates[0];
  if(!note){this.strays++;this.combo=0;this.onEvent({type:'stray',lane});return false;}
  if(!note.duration){this.resolve(note,Math.abs(note.time-time)<=.13?'perfect':'good');return true;}
  note.grade??=Math.abs(note.time-time)<=.13?'perfect':'good';note.startedAt??=time;note.suspended=false;note.holding=true;this.held.set(lane,note);this.onEvent({type:'hold-start',note});return true;
 }
 tap(lane,time=this.time){return this.press(lane,time);}
 release(lane,time=this.time,cancelled=false){if(this.status!=='playing'||this.listen)return false;this.advance(time);time=this.time;const n=this.held.get(lane);if(!n)return false;
  n.failure=cancelled?'cancel':'early';this.resolve(n,!cancelled&&time>=n.time+n.duration-.16?n.grade:'miss');return !!n.result&&n.result!=='miss';
 }
 pause(){if(this.status!=='playing')return;this.status='paused';for(const n of this.held.values()){n.holding=false;n.suspended=true;}this.held.clear();}
 resume(){if(this.status!=='paused')return;for(const n of this.notes)if(n.suspended)n.resumeDeadline=this.time+.9;this.status='playing';}
 get accuracy(){return this.notes.length?Math.round(this.hits/this.notes.length*100):0;}
}
export class Transport{
 constructor(){this.position=-4*BEAT;this.anchor=0;this.running=false;}
 start(now){this.position=-4*BEAT;this.anchor=now;this.running=true;}
 at(now){return this.position+(this.running?Math.max(0,now-this.anchor):0);}
 pause(now){this.position=this.at(now);this.running=false;return this.position;}
 resume(now){this.anchor=now;this.running=true;}
}

