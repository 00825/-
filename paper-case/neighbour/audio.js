import {VoicePlayer} from './voice-player.js';
import {VOICES} from './voices.js';
// Original procedural sound effects; music/Aqi are user supplied, Zhou uses generated preset speech.
export class AudioRoom{
 constructor({onVoiceState=()=>{}}={}){this.enabled=true;this.unlocked=false;this.hidden=false;this.baseVolume=.16;this.ducked=false;this.music=new Audio('../xinsu/assets/audio/music/mus_02_courtyard.mp3');this.music.id='neighbour-music';this.music.hidden=true;this.music.loop=true;this.music.volume=this.baseVolume;document.body.append(this.music);this.voice=new VoicePlayer({tracks:VOICES,onState:onVoiceState,onDuck:active=>{this.ducked=active;this.music.volume=this.baseVolume*(active?.28:1);},createAudio:src=>{const a=new Audio(src);a.id='neighbour-voice';a.hidden=true;document.body.append(a);return a;}});}
 unlock(){if(!this.enabled)return;this.unlocked=true;this.voice.unlock();try{this.ctx??=new(window.AudioContext||window.webkitAudioContext)();this.ctx.resume().catch(()=>{});if(!this.hidden)this.music.play().catch(()=>{});}catch{}}
 toggle(){this.enabled=!this.enabled;this.voice.setEnabled(this.enabled);if(this.enabled)this.unlock();else{this.music.pause();this.ctx?.suspend().catch(()=>{});}return this.enabled;}
 visibility(hidden){this.hidden=hidden;this.voice.visibility(hidden);if(hidden)this.music.pause();else if(this.enabled&&this.unlocked)this.music.play().catch(()=>{});}
 court(on){this.baseVolume=on?.10:.16;this.music.volume=this.baseVolume*(this.ducked?.28:1);}
 speak(id){this.voice.say(id);}
 stopVoice(){this.voice.stop();}
 effect(type){if(!this.enabled||!this.unlocked||!this.ctx||this.ctx.state!=='running')return;const ctx=this.ctx,t=ctx.currentTime;
  const notes=type==='card'?[523,659,784]:type==='smash'?[185,980]:type==='hit'?[740]:type==='net'?[125]:type==='point'?[330,262]:type==='jump'?[280]:[440];
  notes.forEach((hz,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=['net','smash'].includes(type)?'triangle':'sine';osc.frequency.setValueAtTime(hz,t+i*.09);osc.frequency.exponentialRampToValueAtTime(Math.max(70,hz*.65),t+i*.09+.08);gain.gain.setValueAtTime(.0001,t+i*.09);gain.gain.exponentialRampToValueAtTime(['hit','smash'].includes(type)?.12:.055,t+i*.09+.005);gain.gain.exponentialRampToValueAtTime(.0001,t+i*.09+.16);osc.connect(gain).connect(ctx.destination);osc.start(t+i*.09);osc.stop(t+i*.09+.18);});
 }
}
