import {createOpeningMedia} from './opening-media.js';
import {SHOTS,OPENING_DURATION,MOVIE_AT,GREET_AT,ENTER_AT,shotAt,openingFrame} from './opening-score.js';
export {SHOTS,OPENING_DURATION,shotAt,openingFrame};
export function createOpening(root,{reduced=false,onFinish,onState=()=>{}}){
 const $=s=>root.querySelector(s);let active=false,playing=false,ready=true,time=0,last=0,raf=0,dead=false,current=-1,closing=false,mode='',buffering=false,seekSerial=0,seekBusy=false;
 const media=createOpeningMedia($('#opening-film'),{reduced,walkAt:MOVIE_AT,greetAt:GREET_AT});
 const nav=[...root.querySelectorAll('[data-shot]')];
 function isolate(on){for(const el of root.parentElement.children)if(el!==root)el.inert=on;}
 function state(){const index=shotAt(time);return{active,index,time,offset:time-SHOTS[index].at,playing,ready,buffering,shot:SHOTS[index]};}
 function controls(){const n=shotAt(time),enter=time>=ENTER_AT,end=time>=OPENING_DURATION,key=[n,playing,ready,enter,end,seekBusy,buffering].join('|');if(key===mode)return;mode=key;
  root.dataset.shot=n;root.dataset.playing=String(playing);root.dataset.ready=String(ready);root.dataset.buffering=String(buffering);
  $('.opening-timing').textContent=ready?'序章 / 点击后开始':`${String(n+1).padStart(2,'0')} / 04`;
  $('#opening-begin').hidden=!ready;$('#opening-pause').hidden=ready;$('#opening-next').hidden=ready||end||enter;$('.opening-dots').hidden=ready;
  $('#opening-pause').textContent=end?'重播':playing?'暂停':'播放';$('#opening-next').textContent=n===3?'循声走进院落 →':'下一段 →';$('#opening-start').hidden=!enter;
  for(const b of [...nav,$('#opening-next'),$('#opening-pause')])b.disabled=seekBusy;
 }
 function draw(event){
  const f=openingFrame(time),n=f.index;
  for(const[key,value]of Object.entries({'opening-p':f.progress,'shot-p':f.shotProgress,'walk-p':f.walk,'flap-p':f.flap,'note-p':f.note,'route-p':f.route,'badge-p':f.badge,'badge-alpha':f.badgeAlpha,'reveal-p':f.reveal,'film-p':f.film,'reader-p':f.reader,'reader-lift':f.readerLift,'cover-p':f.cover,'greet-p':f.greet,'callout-p':f.callout}))root.style.setProperty('--'+key,value.toFixed(4));
  const changed=n!==current;
  if(changed){current=n;$('.opening-speaker').textContent=SHOTS[n].speaker;$('.opening-line').textContent=SHOTS[n].line;
   $('#opening-scene-index').textContent=String(n+1).padStart(2,'0');$('#opening-scene-label').textContent=SHOTS[n].label;
   nav.forEach((b,i)=>b.setAttribute('aria-current',String(i===n)));
   if(!ready&&!reduced)$('.opening-caption').animate?.([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});
  }
  media.sync(state(),{seek:event==='seek'});buffering=playing&&media.waiting(state());controls();if(changed||event)onState({type:changed?'shot':event,...state()});
 }
 function tick(now){if(dead)return;raf=requestAnimationFrame(tick);if(!active)return;
  if(playing&&!document.hidden){const wasBuffering=buffering,next=Math.min(OPENING_DURATION,time+(last?Math.max(0,now-last):0));buffering=media.waiting({...state(),time:next});if(!buffering)time=next;if(time>=OPENING_DURATION)playing=false;draw(!playing?'pause':buffering&&!wasBuffering?'buffer':!buffering&&wasBuffering?'resume':null);}
  else media.sync(state());last=now;
 }
 function begin(){if(closing||seekBusy)return;ready=false;playing=true;last=performance.now();media.sync(state());buffering=media.waiting(state());draw(buffering?'buffer':'resume');}
 function seekTo(target){if(closing||seekBusy)return;const serial=++seekSerial;ready=false;
  if(reduced){time=target;playing=false;draw('seek');return;}
  playing=false;seekBusy=true;root.dataset.seeking='true';draw('pause');
  setTimeout(()=>{if(serial!==seekSerial||dead||closing)return;time=target;playing=true;last=performance.now();draw('seek');},180);
  setTimeout(()=>{if(serial!==seekSerial||dead||closing)return;seekBusy=false;root.dataset.seeking='false';controls();},440);
 }
 $('#opening-begin').onclick=begin;
 $('#opening-pause').onclick=()=>{if(closing||seekBusy)return;if(time>=OPENING_DURATION){time=0;current=-1;playing=true;draw('seek');}else{playing=!playing;draw(playing?'resume':'pause');}last=performance.now();};
 $('#opening-next').onclick=()=>{const n=shotAt(time);if(n===3)finish();else seekTo(SHOTS[n+1].at);};
 nav.forEach(b=>b.onclick=()=>seekTo(SHOTS[Number(b.dataset.shot)].at));
 async function finish(){if(closing)return;closing=true;seekSerial++;seekBusy=false;playing=false;active=false;onState({type:'finish',...state()});media.sync(state());root.dataset.departing='true';for(const b of root.querySelectorAll('button'))b.disabled=true;
  if(!reduced)await new Promise(r=>setTimeout(r,850));if(dead)return;root.hidden=true;root.dataset.departing='false';closing=false;isolate(false);await onFinish();
 }
 $('#opening-start').onclick=finish;$('#opening-skip').onclick=finish;
 function show(){seekSerial++;active=true;playing=false;ready=true;time=0;last=performance.now();current=-1;mode='';closing=buffering=seekBusy=false;root.hidden=false;root.dataset.departing=root.dataset.seeking='false';for(const b of root.querySelectorAll('button'))b.disabled=false;
  $('.opening-title h1').textContent='未送出的\n邀请';$('.opening-title-note').textContent='一封邀请，一位还没找到的收信人。';isolate(true);draw('shot');$('#opening-begin').focus({preventScroll:true});
 }
 function visibility(){last=performance.now();if(!active)return;media.sync(state());if(!document.hidden&&playing)onState({type:'resume',...state()});}
 document.addEventListener('visibilitychange',visibility);raf=requestAnimationFrame(tick);
 return{show,restart(){show();begin();},state,seekCurrent(){seekSerial++;seekBusy=false;root.dataset.seeking='false';ready=false;time=SHOTS[shotAt(time)].at;playing=false;draw('seek');},dispose(){dead=true;seekSerial++;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);media.dispose();isolate(false);},pause(){playing=false;draw('pause');}};
}
