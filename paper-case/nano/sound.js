export class NanoSound{
 constructor(){this.on=true;this.music=null;this.ctx=null;this.voices=new Set();}
 unlock(){try{this.ctx??=new(window.AudioContext||window.webkitAudioContext)();this.ctx.resume().catch(()=>{});if(!this.music){this.music=new Audio('../xinsu/assets/audio/music/mus_03_archive.mp3');this.music.loop=true;this.music.volume=.13;}if(this.on)this.music.play().catch(()=>{});}catch{}}
 effect(kind){if(!this.on||!this.ctx||this.ctx.state!=='running')return;const notes=kind==='success'?[523,659,784]:kind==='found'?[659,880]:kind==='light'?[523]:[330];for(const [i,f]of notes.entries()){const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime+i*.1;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.035,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.28);o.connect(g).connect(this.ctx.destination);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};o.start(t);o.stop(t+.3);}}
 toggle(){this.on=!this.on;if(this.on)this.unlock();else this.pause();return this.on;}
 pause(){this.music?.pause();for(const o of this.voices){try{o.stop();}catch{}}this.voices.clear();}
 dispose(){this.pause();this.ctx?.close().catch(()=>{});}
}
