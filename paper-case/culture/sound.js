import {BEAT,SONG} from './score.js';
const hz=m=>440*2**((m-69)/12);
export class RehearsalSound{
 constructor(){this.enabled=true;this.nodes=new Set();this.ctx=null;this.buffer=null;this.loading=null;this.song=null;}
 async unlock(){try{
  this.ctx??=new(window.AudioContext||window.webkitAudioContext)();
  if(!this.master){this.master=this.ctx.createGain();this.master.gain.value=this.enabled?.85:0;this.master.connect(this.ctx.destination);}
  await this.ctx.resume();
  if(!this.buffer){this.loading??=fetch(SONG.src).then(r=>{if(!r.ok)throw Error('song load');return r.arrayBuffer();}).then(data=>this.ctx.decodeAudioData(data)).then(b=>this.buffer=b).catch(e=>{this.loading=null;throw e;});await this.loading;}
  await this.ctx.resume();return this.ctx.state==='running';
 }catch{return false;}}
 now(){return this.ctx?.currentTime??performance.now()/1000;}
 tone(midi,when,duration=.12,volume=.025,kind='sine'){
  if(!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=kind;o.frequency.value=hz(midi);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(volume,when+.008);g.gain.exponentialRampToValueAtTime(.0001,when+duration);o.connect(g).connect(this.master);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};o.start(when);o.stop(when+duration+.02);
 }
 schedule(position){this.stop();if(!this.ctx||!this.buffer)return;const now=this.now(),offset=Math.max(0,position);
  if(offset<this.buffer.duration){const source=this.ctx.createBufferSource();source.buffer=this.buffer;source.connect(this.master);this.song=source;source.onended=()=>{if(this.song===source)this.song=null;source.disconnect();};source.start(now+Math.max(0,-position),offset);}
  for(let b=-4;b<0;b++){const at=b*BEAT;if(at>=position)this.tone(b===-1?81:76,now+at-position,.07,.035,'triangle');}
 }
 accent(){this.tone(88,this.now(),.045,.008,'triangle');}
 finish(){this.stop();[60,67,72].forEach((n,i)=>this.tone(n,this.now()+i*.12,.65,.035));}
 toggle(){this.enabled=!this.enabled;if(this.master)this.master.gain.setTargetAtTime(this.enabled?.85:0,this.now(),.035);return this.enabled;}
 stop(){if(this.song){const old=this.song;this.song=null;try{old.stop();old.disconnect();}catch{}}for(const o of this.nodes){try{o.stop();}catch{}}this.nodes.clear();}
 dispose(){this.stop();this.ctx?.close().catch(()=>{});}
}

