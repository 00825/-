import {VOICES,MUSIC,voiceForText} from './audio-tracks.js';

export function bindAudioUI(sound,{getOpening,isOpening}){
 const $=id=>document.getElementById(id);let current=null,scope=null,unlocked=false;
 function button(id,text,parent){const b=document.createElement('button');b.type='button';b.id=id;b.textContent=text;parent.append(b);return b;}
 const replay=button('voice-replay','重听',document.querySelector('.dialogue-name'));replay.className='voice-replay';
 const photoReplay=button('photo-voice-replay','重听这一句',$('photo-chat'));photoReplay.className='photo-voice-replay';
 const openingSound=button('opening-sound','关闭声音',document.querySelector('.opening-top'));
 const openingListen=button('opening-listen','重听这段',document.querySelector('.opening-bottom'));
 const controls=document.createElement('section');controls.className='audio-settings';controls.setAttribute('aria-label','声音设置');
 controls.innerHTML='<h3>声音设置</h3><p>人物配音默认开启，进入对话后自动播放。可分别关闭音乐与配音，字幕始终保留。</p><div class="audio-switches"><button type="button" id="voice-toggle" aria-pressed="true">配音开</button><button type="button" id="music-toggle" aria-pressed="true">音乐开</button></div><label>背景音量 <input id="music-level" type="range" min="0" max="60" value="22" aria-label="背景音乐音量"><output id="music-level-value">22%</output></label><p id="audio-status" role="status" aria-live="polite">配音默认开启。</p>';
 $('about-dialog').append(controls);
 const names={opening:'开场',courtyard:'院落',archive:'档案与纸景'};
 sound.onState=state=>{
  $('sound').setAttribute('aria-pressed',String(state.on));$('sound').setAttribute('aria-label',state.on?'关闭声音':'开启声音');$('sound').querySelector('span').textContent=state.on?'声音开':'声音关';
  openingSound.textContent=state.on?'关闭声音':'开启声音';
  $('voice-toggle').textContent=state.voiceEnabled?'配音开':'配音关';$('voice-toggle').setAttribute('aria-pressed',String(state.voiceEnabled));
  $('music-toggle').textContent=state.musicEnabled?'音乐开':'音乐关';$('music-toggle').setAttribute('aria-pressed',String(state.musicEnabled));
  const who=state.voiceId&&VOICES[state.voiceId]?.who;
  document.body.dataset.voicePlaying=state.voiceState==='playing'?who||'':'';
  const label=who==='aqi'?'阿奇':'林姨';
  const musicState=state.musicState==='loading'?'（载入中）':state.musicState==='paused'?'（暂停）':state.musicState==='playing'?'（播放中）':'';
  $('audio-status').textContent=!state.on?'声音尚未开启。':state.issue||`${state.musicEnabled?'音乐：'+(names[state.musicKey]||'院落')+musicState:'音乐已关闭'} · ${state.voiceState==='playing'?'正在播放'+label:state.voiceState==='paused'?'配音已暂停':'可点击重听当前对白'}`;
 };
 function lineId(){return current?voiceForText(current.text,current.who):null;}
 async function activate(){unlocked=true;if(!sound.on)await sound.toggle();}
 async function replayLine(){await activate();if(!sound.voiceEnabled)sound.setVoiceEnabled(true);const id=lineId();if(id)await sound.speak(id);}
 replay.onclick=photoReplay.onclick=replayLine;
 async function toggle(){unlocked=true;await sound.toggle();if(sound.on){if(isOpening()){const state=getOpening().state();if(state.playing)playOpening(state);}else{const id=lineId();if(id)sound.speak(id);}}}
 $('sound').onclick=()=>toggle().catch(()=>{});
 openingSound.onclick=()=>toggle().catch(()=>{});
 openingListen.onclick=async()=>{await activate();if(!sound.voiceEnabled)sound.setVoiceEnabled(true);getOpening().seekCurrent();const state=getOpening().state();const id=voiceForText(state.shot.line,state.shot.who);if(id)sound.speak(id);};
 $('voice-toggle').onclick=()=>sound.setVoiceEnabled(!sound.voiceEnabled);
 $('music-toggle').onclick=()=>sound.setMusicEnabled(!sound.musicEnabled);
 $('music-level').oninput=e=>{sound.setMusicGain(Number(e.target.value)/100);$('music-level-value').textContent=e.target.value+'%';};
 function playOpening(state){const id=voiceForText(state.shot.line,state.shot.who);if(state.playing&&id)sound.speak(id,{offset:state.offset/1000});else sound.stopVoice();}
 // Use the normal first interaction to satisfy browser audio policy. A later
 // gesture must never undo an intentional mute or restart an ongoing line.
 function unlockOnEntry(event){
  if(!event.isTrusted||unlocked||!sound.on)return;
  if(event.type==='keydown'&&(event.repeat||!['Enter',' ','ArrowLeft','ArrowRight'].includes(event.key)))return;
  if(event.target?.closest?.('#sound,#opening-sound,#voice-toggle,#music-toggle,#voice-replay,#photo-voice-replay,#opening-listen'))return;
  unlocked=true;sound.resumeMusic();
  if(isOpening()){const state=getOpening().state();if(state.playing&&!state.buffering)playOpening(state);}
  else if(sound.voiceState!=='playing'&&sound.voiceState!=='loading'){const id=lineId();if(id)sound.speak(id);}
 }
 document.addEventListener('click',unlockOnEntry,true);
 document.addEventListener('keydown',unlockOnEntry,true);
 sound.emit();
 return{
  line(line){current=line;scope=$('photo-dialog').open?'photo-dialog':null;const id=lineId();replay.disabled=photoReplay.disabled=!id;replay.setAttribute('aria-label',id?'重听'+(line.who==='aqi'?'阿奇':'林姨')+'这一句':'这句暂未配音');if(!isOpening()){if(id)sound.speak(id);else sound.stopVoice();}},
  opening(event){if(event.type==='finish'){sound.stopVoice();return;}sound.setScene('opening');if(event.buffering){sound.pauseVoice();sound.pauseMusic();return;}if(!event.playing){if(event.type==='pause')sound.pauseVoice();else sound.stopVoice();sound.pauseMusic();return;}sound.resumeMusic();if(event.type==='resume'){if(sound.voicePaused&&sound.voice&&sound.voiceId===voiceForText(event.shot.line,event.shot.who)&&!sound.voice.ended)sound.resumeVoice();else playOpening(event);}else playOpening(event);},
  cut(){scope=null;sound.stopVoice();},
  closeModal(id){if(scope===id){scope=null;sound.stopVoice();}},
  replay:replayLine,
  totalVoices:Object.keys(VOICES).length,totalMusic:Object.keys(MUSIC).length
 };
}
