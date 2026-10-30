// Seek only on entry, user navigation or paused inspection, never chase the
// decoder on every animation frame. Repeated currentTime writes caused jumps.
export function createOpeningMedia(video,{reduced=false,walkAt=14200,greetAt=22200,loadTimeout=8000}={}){
 let wanted=false,loaded=false,wasActive=false,dead=false,pending=false,failed=false,needsSeek=false,timeout=null;
 if(!video)return{sync(){},waiting(){return false;},dispose(){}};
 const root=video.closest('.opening');video.muted=true;video.playsInline=true;
 function fallback(){if(dead)return;clearTimeout(timeout);failed=true;wanted=false;root.dataset.media='fallback';video.pause();}
 video.onloadeddata=()=>{if(dead)return;loaded=true;needsSeek=true;clearTimeout(timeout);if(!failed)root.dataset.media='ready';};
 video.onerror=fallback;
 function waiting(s){return !reduced&&!failed&&!loaded&&s.active&&!s.ready&&s.time>=walkAt;}
 function sync(state,{seek=false}={}){
  if(dead)return;
  const active=state.active&&state.time>=walkAt&&!state.ready,target=Math.max(0,(Math.min(state.time,greetAt)-walkAt)/1000);
  if(!reduced&&!failed&&!state.ready&&!video.getAttribute('src')&&video.dataset.src){video.preload='auto';video.src=video.dataset.src;root.dataset.media='loading';timeout=setTimeout(fallback,loadTimeout);}
  wanted=active&&state.playing&&state.time<greetAt&&!document.hidden&&!reduced&&!failed;
  if(loaded&&active&&!failed){
   const end=Number.isFinite(video.duration)?Math.max(0,video.duration-.04):target,position=Math.min(target,end);
   if(seek||needsSeek||!wasActive||(!state.playing&&Math.abs(video.currentTime-position)>.06)){try{video.currentTime=position;}catch{}needsSeek=false;}
  }
  wasActive=active;
  if(wanted&&!video.ended){if(video.paused&&!pending){pending=true;video.play().then(()=>{if(!wanted||dead)video.pause();}).catch(e=>{if(e?.name!=='AbortError'&&wanted&&!dead)fallback();}).finally(()=>{pending=false;});}}else video.pause();
 }
 return{sync,waiting,dispose(){dead=true;wanted=false;clearTimeout(timeout);video.pause();video.onloadeddata=video.onerror=null;video.removeAttribute('src');video.load();}};
}
