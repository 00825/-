import {CompanionDrag,clamp} from './companion-motion.js';
const visible=e=>!!e&&!e.hidden&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden';
const q=s=>s?document.querySelector(s):null;
export function bindExperience({chapter,getStep}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,drag=new CompanionDrag();
 const root=document.createElement('div');root.id='experience-layer';root.dataset.chapter=chapter;
 root.innerHTML='<button id="wayfinder" class="xp-cue" aria-label="定位下一步"><small></small><b></b><span aria-hidden="true">↓</span></button><div class="xp-friend"><div class="xp-bubble" role="status" hidden></div><button id="aqi-friend" class="xp-actor" aria-label="阿奇：点一下打招呼，拖动换个落脚点；方向键移动，Home回到原处"><span class="xp-shadow"></span><span class="xp-facing"><i class="xp-sprite"></i></span><small>阿奇 · 可以拖动</small></button></div>';
 document.body.append(root);document.body.classList.add('xp-enabled');document.body.dataset.edition='living';
 const actor=root.querySelector('.xp-actor'),sprite=root.querySelector('.xp-sprite'),cue=root.querySelector('.xp-cue'),bubble=root.querySelector('.xp-bubble'),friend=root.querySelector('.xp-friend');
 let context=null,target=null,oldTarget=null,scene='',earned=0,local=false,pending=0,poseTimer,bubbleTimer,suppressClick=false,lastHint=0,dead=false;
 const primary=['#story-next','#badge-continue','#unfold','#photo-chat-next','#flip-photo','#next','#photo-done','#building-done','#racket-done','#flip-card','#mark-destination','#next-line','#enter-stage','#begin','#play','#collect','#export','.next-chapter','#opening-begin','#opening-start','#enter-board','#confirm-board','#enter-search','#to-delivery','#read-letter','#to-route','#start-ending','#take-photo'];
 for(const selector of primary)document.querySelectorAll(selector).forEach(e=>e.classList.add('xp-primary'));
 const heading=q(chapter==='xinsu'?'.yard-title':chapter==='neighbour'?'.title':'.story-column');
 if(heading){const token=document.createElement('span');token.className='xp-case-tab';token.textContent={xinsu:'01 / 寻迹 · 一枚旧工牌',neighbour:'02 / 相遇 · 一支旧球拍',culture:'03 / 开场 · 一张排练签',nano:'04 / 探索 · 一张借还签',gate:'05 / 相见 · 一封邀请'}[chapter]||'';heading.append(token);heading.classList.add('xp-has-tab');}
 if(chapter==='culture'){const prop=document.createElement('img');prop.className='xp-theatre-vignette';prop.src='../neighbour/assets/art-v3/programme-vignette.webp';prop.alt='';prop.setAttribute('aria-hidden','true');q('.chapter-stamp')?.append(prop);}
 function pose(name,ms=1100){clearTimeout(poseTimer);actor.dataset.pose=name;poseTimer=setTimeout(()=>actor.dataset.pose='idle',reduced?180:ms);}
 function speak(text){bubble.textContent=text;bubble.hidden=false;clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>bubble.hidden=true,3300);}
 function box(){const size=innerWidth<761?94:124,r=q(context?.host)?.getBoundingClientRect();const top=Math.max(85,r?.top??85),bottom=Math.min(innerHeight-60,r?.bottom??innerHeight-60);return {left:Math.max(10,r?.left??10),right:Math.min(innerWidth-size-10,(r?.right??innerWidth)-size-10),top,bottom:Math.max(top,bottom-size-24),size,visible:!r||(r.bottom>100&&r.top<innerHeight-130)};}
 function paintPosition(){const b=box();friend.style.left=drag.position.x+'px';friend.style.top=drag.position.y+'px';friend.style.setProperty('--friend-size',b.size+'px');friend.style.setProperty('--face',String(drag.facing));bubble.style.left=clamp(15,10-drag.position.x,innerWidth-drag.position.x-220)+'px';}
 function home(){const b=box(),old=q('#aqi')?.getBoundingClientRect(),phone=innerWidth<761,phoneSquare=chapter==='neighbour'&&context?.scene==='square'&&phone,phoneModel=phone&&['.building-sheet','.model-sheet','.model-host'].includes(context?.host);drag.place(phoneSquare?{x:innerWidth-b.size-18,y:145}:phoneModel?{x:b.left+8,y:b.bottom-65}:{x:old?.width?old.left:b.left+14,y:old?.height?old.top:b.bottom},b);local=false;paintPosition();}
 function locate(){if(!target)return;target.scrollIntoView({block:'center',behavior:reduced?'instant':'smooth'});target.focus?.({preventScroll:true});target.classList.remove('xp-flash');void target.offsetWidth;target.classList.add('xp-flash');pose('inspect');}
 cue.onclick=locate;
 function greeting(){pose('happy',650);speak(['我在呢，继续走吧。','借我挪个位置，看看那边？','收到！一起找。'][lastHint++%3]);}
 actor.addEventListener('click',e=>{if(suppressClick){suppressClick=false;return;}greeting();});
 actor.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(!drag.start(e.pointerId,e.clientX,e.clientY))return;clearTimeout(poseTimer);suppressClick=false;actor.setPointerCapture(e.pointerId);actor.dataset.dragging='true';bubble.hidden=true;});
 actor.addEventListener('pointermove',e=>{if(!drag.move(e.pointerId,e.clientX,e.clientY,box()))return;paintPosition();if(drag.active.moved){actor.dataset.pose='fly';local=true;}});
 function end(e,cancel=false){const result=drag.end(e.pointerId,cancel);if(!result)return;actor.dataset.dragging='false';suppressClick=!result.cancelled&&result.dragged;if(result.cancelled){paintPosition();pose('idle');return;}if(result.dragged){local=true;pose('land',550);const r=target?.getBoundingClientRect(),b=box();if(r&&Math.hypot(drag.position.x+b.size/2-r.left-r.width/2,drag.position.y+b.size/2-r.top-r.height/2)<Math.max(100,r.width/2)){speak('就在这里，点一下看看。');target.classList.add('xp-flash');}else speak('这个位置不错，继续找线索吧。');paintPosition();}}
 actor.addEventListener('pointerup',e=>end(e));actor.addEventListener('pointercancel',e=>end(e,true));actor.addEventListener('lostpointercapture',e=>{if(drag.active)end(e,true);});
 actor.addEventListener('keydown',e=>{const moves={ArrowLeft:[-22,0],ArrowRight:[22,0],ArrowUp:[0,-22],ArrowDown:[0,22]};if(moves[e.key]){e.preventDefault();drag.nudge(...moves[e.key],box());local=true;pose('fly',180);paintPosition();}else if(e.key==='Home'){e.preventDefault();home();pose('land',500);}else if(e.key==='Escape'&&drag.active){end({pointerId:drag.active.id},true);}});
 function refresh(){pending=0;if(dead)return;context=getStep();const modal=q('dialog[open]'),intro=['#intro','#arrival','#opening','#loading'].some(s=>visible(q(s)));const blocked=!!modal||intro;
  target=q(context?.target);if(target!==oldTarget){oldTarget?.classList.remove('xp-next');oldTarget=target;target?.classList.add('xp-next');}
  if(scene!==context.scene){scene=context.scene;home();pose('arrive',900);local=false;earned=context.earned||0;}else if((context.earned||0)>earned){earned=context.earned;pose('happy',800);}
  const hidden=blocked||context.hideActor||!box().visible;friend.hidden=hidden;
  if(hidden&&drag.active)end({pointerId:drag.active.id},true);
  if(!hidden&&!drag.active){if(!local)home();else{drag.place(drag.position,box());paintPosition();}}
  cue.hidden=blocked||context.hideCue||(context.compactCue&&innerWidth<761)||!visible(target)||target?.disabled;
  if(!cue.hidden){const r=target.getBoundingClientRect(),w=Math.min(285,innerWidth-32),onscreen=r.top>75&&r.bottom<innerHeight-35;cue.classList.toggle('xp-edge',!onscreen);cue.style.width=w+'px';let x=clamp(r.left+r.width/2-w/2,16,innerWidth-w-16),y=r.top-58;
   if(!onscreen){x=innerWidth-w-16;y=innerHeight-76;const talk=q('.story:not([hidden]),#dialogue:not([hidden])');if(visible(talk)){const tr=talk.getBoundingClientRect();if(tr.top<y+50)y=Math.max(90,tr.top-64);}}else if(y<80)y=r.bottom+8;
   cue.style.left=x+'px';cue.style.top=y+'px';const small=`下一步 / ${String(context.number).padStart(2,'0')}`,label=context.label;if(cue.querySelector('small').textContent!==small)cue.querySelector('small').textContent=small;if(cue.querySelector('b').textContent!==label)cue.querySelector('b').textContent=label;cue.setAttribute('aria-label','定位下一步：'+label);cue.querySelector('span').textContent=onscreen?'↓':'↘';}
 }
 function schedule(){if(!pending)pending=requestAnimationFrame(refresh);}
 const observer=new MutationObserver(records=>{if(records.some(r=>!root.contains(r.target)))schedule();});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open','data-view','aria-pressed']});
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
 const idle=setInterval(()=>{if(!friend.hidden&&!drag.active&&actor.dataset.pose==='idle'&&!document.hidden){pose('curious',650);}},6200);
 const start=setTimeout(()=>{actor.dataset.pose='idle';schedule();},900);schedule();
 window.addEventListener('pagehide',e=>{if(e.persisted)return;dead=true;observer.disconnect();clearInterval(idle);clearTimeout(start);clearTimeout(poseTimer);clearTimeout(bubbleTimer);cancelAnimationFrame(pending);});
 return {refresh:schedule,react:pose};
}
