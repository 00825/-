import {VOICES} from './voices.js';
import {SHOTS,shotAt} from './ending.js';
export function filmCueAt(time){const shot=SHOTS[shotAt(time)],id=shot.voice,track=VOICES[id];return track&&time>=shot.at&&time<shot.at+track.duration?{id,offset:time-shot.at,at:shot.at}:null;}
// One owned media element for all speech. Version guards cancel late play/load callbacks.
export class GateVoice{
 constructor({tracks=VOICES,createAudio=src=>new Audio(src),onState=()=>{},onDuck=()=>{}}={}){Object.assign(this,{tracks,createAudio,onState,onDuck});this.enabled=true;this.unlocked=false;this.hidden=false;this.current=null;this.wanted=null;this.mode='dialogue';this.phase='idle';this.version=0;this.lastFilmTime=null;}
 emit(phase){this.phase=phase;this.onDuck(phase==='playing');this.onState({phase,id:this.wanted?.id||null,mode:this.mode,track:this.tracks[this.wanted?.id]||null});}
 halt(){this.version++;const a=this.current;this.current=null;if(a){a.pause();a.remove?.();}this.onDuck(false);}
 stop(){const changed=!!this.current||!!this.wanted||this.phase!=='idle';this.halt();this.wanted=null;if(changed)this.emit('idle');}
 say(id){this.stop();this.mode='dialogue';this.lastFilmTime=null;if(!this.tracks[id])return;this.wanted={id,offset:0};this.start();}
 start(){if(!this.wanted)return;if(!this.enabled){this.emit('muted');return;}if(this.hidden){this.emit('paused');return;}if(!this.unlocked){this.emit('waiting');return;}
  this.halt();const wanted={...this.wanted},v=this.version,a=this.createAudio(this.tracks[wanted.id].src);this.current=a;a.preload='auto';a.volume=.9;
  const valid=()=>v===this.version&&a===this.current;
  const seek=()=>{if(!valid())return;try{a.currentTime=wanted.offset;}catch{}};
  a.onloadedmetadata=seek;seek();
  a.onended=()=>{if(!valid())return;this.halt();this.emit('ended');};
  a.onerror=()=>{if(!valid())return;this.halt();this.emit('error');};
  this.emit('loading');let result;try{result=a.play();}catch{this.halt();this.emit('blocked');return;}
  Promise.resolve(result).then(()=>{if(!valid()||!this.enabled||this.hidden){a.pause();a.remove?.();return;}this.emit('playing');}).catch(()=>{if(!valid())return;this.halt();this.emit('blocked');});
 }
 unlock(){const first=!this.unlocked;this.unlocked=true;if(this.wanted&&this.enabled&&!this.hidden&&(first||this.phase==='waiting'||this.phase==='blocked'))this.start();}
 replay(){if(!this.wanted)return;this.wanted.offset=0;this.start();}
 setEnabled(on){if(this.enabled===on)return;this.enabled=on;if(!on){this.halt();this.emit('muted');}else if(this.wanted&&this.mode!=='film')this.start();}
 visibility(hidden){this.hidden=hidden;if(hidden){if(this.current&&this.wanted)this.wanted.offset=this.current.currentTime||0;this.halt();this.emit(this.wanted?'paused':'idle');}}
 pause(){if(!this.wanted)return;if(this.current)this.wanted.offset=this.current.currentTime||0;this.halt();this.emit('paused');}
 syncFilm(time,running,{force=false}={}){const cue=filmCueAt(time),jump=force||this.lastFilmTime!==null&&(time<this.lastFilmTime-.12||time>this.lastFilmTime+.75);this.lastFilmTime=time;
  const changed=this.mode!=='film'||this.wanted?.id!==cue?.id;this.mode='film';
  if(!cue){if(this.wanted||this.current)this.stop();return;}
  if(changed||jump){this.halt();this.wanted={id:cue.id,offset:cue.offset};this.phase='idle';}
  if(!this.enabled){if(this.phase!=='muted')this.emit('muted');return;}
  if(!running||this.hidden){this.wanted.offset=cue.offset;if(this.current||this.phase!=='paused'){this.halt();this.emit('paused');}return;}
  if(changed||jump||['idle','paused','waiting','muted'].includes(this.phase)){this.wanted.offset=cue.offset;this.start();return;}
  // Only recover a substantial drift, not repeatedly seek a normally advancing decoder.
  if(this.phase==='playing'&&this.current&&Math.abs(this.current.currentTime-cue.offset)>.6){try{this.current.currentTime=cue.offset;}catch{}}
 }
}
