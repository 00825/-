export class VoicePlayer{
 constructor({tracks,createAudio=src=>new Audio(src),onState=()=>{},onDuck=()=>{}}){this.tracks=tracks;this.createAudio=createAudio;this.onState=onState;this.onDuck=onDuck;this.enabled=true;this.unlocked=false;this.hidden=false;this.current=null;this.wanted=null;this.version=0;this.phase='idle';}
 emit(phase){this.phase=phase;this.onDuck(phase==='playing');this.onState({phase,id:this.wanted,track:this.tracks[this.wanted]||null});}
 halt(){this.version++;const a=this.current;this.current=null;if(a){a.pause();a.remove?.();}this.onDuck(false);}
 say(id){this.halt();this.wanted=this.tracks[id]?id:null;if(!this.wanted){this.emit('idle');return;}if(!this.enabled){this.emit('muted');return;}if(this.hidden){this.emit('paused');return;}if(!this.unlocked){this.emit('waiting');return;}this.start();}
 start(){if(!this.enabled||this.hidden||!this.unlocked||!this.wanted)return;this.halt();const id=this.wanted,v=this.version,a=this.createAudio(this.tracks[id].src);this.current=a;a.volume=.88;a.preload='auto';
  a.onended=()=>{if(v!==this.version||a!==this.current)return;this.halt();this.emit('ended');};
  a.onerror=()=>{if(v!==this.version||a!==this.current)return;this.halt();this.emit('error');};
  this.emit('loading');let result;try{result=a.play();}catch{this.halt();this.emit('blocked');return;}
  Promise.resolve(result).then(()=>{if(v!==this.version||this.current!==a||!this.enabled||this.hidden){a.pause();a.remove?.();return;}this.emit('playing');}).catch(()=>{if(v!==this.version||this.current!==a)return;this.halt();this.emit('blocked');});
 }
 unlock(){if(!this.enabled)return;const first=!this.unlocked;this.unlocked=true;if(this.wanted&&(first||['waiting','blocked'].includes(this.phase)))this.start();}
 setEnabled(on){if(this.enabled===on)return;this.enabled=on;if(!on){this.halt();this.emit('muted');}else if(this.wanted){if(this.unlocked&&!this.hidden)this.start();else this.emit('waiting');}}
 visibility(hidden){this.hidden=hidden;if(hidden){this.halt();this.emit(this.wanted?'paused':'idle');}}
 stop(){this.halt();this.wanted=null;this.emit('idle');}
}
