import {VOICES,MUSIC} from './audio-tracks.js';

const SFX={pick:'02-badge-pick',folder:'03-folder-open',snap:'04-piece-place',bad:'07-piece-return',success:'11-clue-collect',flip:'06-photo-flip',fold:'05-fold-creak',lock:'08-fold-lock',page:'12-page-turn'};
export class Sound{
 constructor({enabled=false,createAudio=src=>new Audio(src),hidden=()=>document.hidden,now=()=>performance.now(),onState=()=>{}}={}){
  this.createAudio=createAudio;this.hidden=hidden;this.now=now;this.onState=onState;
  this.on=enabled;this.voiceEnabled=true;this.musicEnabled=true;this.sfxEnabled=true;this.musicGain=.22;
  this.voice=null;this.voiceId=null;this.voiceState='idle';this.voiceSerial=0;this.voicePaused=false;
  this.scene='courtyard';this.musicKey=null;this.musicPaused=false;this.slots=[];this.timer=null;this.cue=null;this.effects=new Set();this.lastEffect=new Map();this.dead=false;this.issue='';
 }
 state(){const current=this.slots.find(s=>s.target===1);return{on:this.on,voiceEnabled:this.voiceEnabled,musicEnabled:this.musicEnabled,voiceId:this.voiceId,voiceState:this.voiceState,musicKey:this.musicKey,musicState:!this.on||!this.musicEnabled||this.musicPaused?'paused':current?.state||'idle',issue:this.issue};}
 emit(){this.onState(this.state());}
 _audio(src){const a=this.createAudio(src);a.preload='none';return a;}
 async toggle(){if(this.on){this.on=false;this.pause();}else{this.on=true;this.issue='';this.resume();}this.emit();return this.on;}
 setScene(scene){this.scene=scene;if(scene!=='opening')this.musicPaused=false;const key=scene==='opening'?'opening':scene==='desk'||scene==='paper'?'archive':'courtyard';if(this.on&&!this.hidden()&&this.musicEnabled)this._music(key);else this.musicKey=key;}
 _music(key){
  if(this.dead||this.musicPaused||!MUSIC[key])return;
  const current=this.slots.find(s=>s.key===key&&s.target===1);
  if(current){if(current.audio.paused)this._startMusic(current);this._timer();return;}
  const stamp=this.now();
  for(const slot of this.slots){slot.from=slot.level;slot.target=0;slot.start=stamp;}
  const a=this._audio(MUSIC[key].src);a.volume=0;a.loop=MUSIC[key].loop;
  const slot={audio:a,key,level:0,from:0,target:1,start:stamp,state:'loading'};this.slots.push(slot);this.musicKey=key;
  a.onerror=()=>{if(!this.dead&&slot.target===1){this.issue='这段音乐暂未载入，可以继续阅读';this.emit();}};
  this._startMusic(slot);
  this._timer();this.emit();
 }
 _startMusic(slot){
  slot.state='loading';
  slot.audio.play().then(()=>{if(!this.on||this.hidden()||!this.musicEnabled||this.musicPaused||slot.target!==1){slot.audio.pause();return;}slot.state='playing';if(this.issue==='音乐暂未能播放'||this.issue==='点击声音开关可再试一次')this.issue='';this.emit();}).catch(error=>{if(error?.name==='AbortError'||!this.on||this.hidden()||!this.musicEnabled||this.musicPaused||slot.target!==1)return;slot.state='error';this.issue='点击声音开关可再试一次';this.emit();});
 }
 _timer(){if(!this.timer&&!this.dead)this.timer=setInterval(()=>this._mix(),50);}
 _mix(){
  const stamp=this.now(),duck=this.voiceState==='playing'?.25:1,cueDuck=this.cue?.paused===false?.5:1;
  for(const slot of [...this.slots]){
   const p=Math.min(1,Math.max(0,(stamp-slot.start)/1200));slot.level=slot.from+(slot.target-slot.from)*p;
   slot.audio.volume=Math.min(1,Math.max(0,slot.level*this.musicGain*duck*cueDuck));
   if(slot.target===0&&p===1){slot.audio.pause();slot.audio.removeAttribute?.('src');slot.audio.load?.();this.slots.splice(this.slots.indexOf(slot),1);}
  }
 }
 async speak(id,{offset=0,allowUnverified=false}={}){
  this.stopVoice();const track=VOICES[id];
  if(!track||!this.on||!this.voiceEnabled||this.hidden()||this.dead||(!track.approved&&!allowUnverified)||offset>=track.duration)return false;
  const serial=++this.voiceSerial,a=this._audio(track.src);this.voice=a;this.voiceId=id;this.voiceState='loading';this.voicePaused=false;a.volume=.92;
  a.onended=()=>{if(serial===this.voiceSerial){this.voiceState='ended';this._mix();this.emit();}};
  a.onerror=()=>{if(serial===this.voiceSerial){this.voiceState='error';this.issue='这一句暂未能播放，字幕仍可阅读';this._mix();this.emit();}};
  if(offset>0)a.onloadedmetadata=()=>{if(serial===this.voiceSerial){try{a.currentTime=Math.min(offset,Math.max(0,a.duration-.03));}catch{}}};
  this.emit();
  try{await a.play();if(serial!==this.voiceSerial||!this.on||this.hidden()){a.pause();return false;}this.voiceState=this.voicePaused?'paused':'playing';if(this.voicePaused)a.pause();this._mix();this.emit();return true;}
  catch{if(serial===this.voiceSerial){this.voiceState='error';this.issue='配音暂未播放，请点重听';this._mix();this.emit();}return false;}
 }
 stopVoice(){this.voiceSerial++;if(this.voice){this.voice.pause();this.voice.onended=null;this.voice.onerror=null;}this.voice=null;this.voiceId=null;this.voiceState='idle';this.voicePaused=false;this._mix();this.emit();}
 pauseVoice(){if(!this.voice)return;this.voicePaused=true;this.voice.pause();this.voiceState='paused';this._mix();this.emit();}
 async resumeVoice(){const a=this.voice,serial=this.voiceSerial;if(!a||!this.on||this.hidden()||a.ended)return false;this.voicePaused=false;try{await a.play();if(serial!==this.voiceSerial||!this.on||this.hidden()){a.pause();return false;}this.voiceState='playing';this._mix();this.emit();return true;}catch{return false;}}
 setVoiceEnabled(on){this.voiceEnabled=on;if(!on)this.stopVoice();this.emit();}
 pauseMusic(){this.musicPaused=true;for(const s of this.slots)s.audio.pause();}
 resumeMusic(){this.musicPaused=false;if(this.on&&this.musicEnabled&&!this.hidden())this.setScene(this.scene);}
 setMusicEnabled(on){this.musicEnabled=on;if(!on){for(const s of this.slots)s.audio.pause();if(this.cue)this.cue.pause();}else if(this.on)this.setScene(this.scene);this.emit();}
 setMusicGain(v){this.musicGain=Math.max(0,Math.min(.6,Number(v)||0));this._mix();}
 play(kind){
  if(!this.on||this.hidden()||!this.sfxEnabled||this.dead)return;
  const key=SFX[kind]||SFX.pick,stamp=this.now(),gap=kind==='fold'?450:100;
  if(stamp-(this.lastEffect.get(kind)??-Infinity)<gap||this.effects.size>=4)return;this.lastEffect.set(kind,stamp);
  const a=this._audio('./assets/audio/sfx/'+key+'.ogg');a.volume=kind==='fold'?.12:.22;this.effects.add(a);
  const done=()=>this.effects.delete(a);a.onended=done;a.onerror=done;a.play().catch(done);
 }
 reveal(){
  if(!this.on||!this.musicEnabled||this.hidden()||this.dead)return;
  this.cue?.pause();const a=this._audio(MUSIC.discovery.src);this.cue=a;a.volume=.26;
  a.onended=()=>{if(this.cue===a){this.cue=null;this._mix();}};a.onerror=a.onended;
  a.play().catch(()=>{if(this.cue===a)this.cue=null;});this._mix();
 }
 pause(){this.stopVoice();for(const s of this.slots)s.audio.pause();this.cue?.pause();for(const a of this.effects)a.pause();this.effects.clear();clearInterval(this.timer);this.timer=null;}
 resume(){if(this.on&&!this.hidden()&&!this.dead){this.setScene(this.scene);this._timer();}}
 dispose(){this.dead=true;this.on=false;this.pause();for(const s of this.slots){s.audio.removeAttribute?.('src');s.audio.load?.();}this.slots=[];this.cue=null;}
}
