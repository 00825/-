import {bindExperience} from '../shared/experience.js';
import {xinsuStep} from '../shared/guide-steps.js';
import {fresh,restore,complete,chooseArchive,place,turn,inspectEntry,takePhoto,destination,goal,INITIAL_ORDER,clamp} from './model.js';
import {blueprint,gearPath,bridgeIcon} from './art.js';
import {createStage} from './stage.js';
import {Sound} from './sound.js';
import {bindAudioUI} from './audio-ui.js';
import {Dialogue,PEOPLE,stepKey,hints} from './narrative.js';
import {createOpening} from './opening.js';
import {bindVisualUI} from './visual-ui.js';
const previewId=new URLSearchParams(location.search).get('preview');
const $=id=>document.getElementById(id),KEY=previewId==='1'?'aqi-xinsu-story-preview-v2':/^[2-9][0-9]?$/.test(previewId||'')?`aqi-xinsu-story-preview-v2-${previewId}`:'aqi-xinsu-first-chapter-v1',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let s=fresh();try{s=restore(JSON.parse(localStorage.getItem(KEY)));}catch{}
let view='yard',stage=null,selection=null,drag=null,dragCopy=null,toastTimer,saveTimer,flightTimer,transitioning=false,dead=false,photoFlipped=s.back,walkTimer;
const sound=new Sound({enabled:true}),plan=blueprint();document.documentElement.style.setProperty('--plan',`url("${plan}")`);$('gear-shape').setAttribute('points',gearPath());$('photo-bridge').innerHTML=$('finish-bridge').innerHTML=bridgeIcon;$('fallback').querySelector('img').src=plan;
const audioUI=bindAudioUI(sound,{getOpening:()=>opening,isOpening:()=>!$('intro').hidden});
const visualUI=bindVisualUI({onFlip:()=>sound.play('flip')});
function save(){clearTimeout(saveTimer);try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
const dialogueSeen=new Set();
const dialogue=new Dialogue(line=>{const p=PEOPLE[line.who];$('story-name').textContent=p.name;$('story-role').textContent=p.role;$('story-line').textContent=line.text;$('photo-chat-name').textContent=p.name;$('photo-chat-line').textContent=line.text;$('photo-chat-next').textContent=line.action+' →';$('photo-chat-next').hidden=false;document.querySelector('.story').dataset.speaker=line.who;$('story-next').textContent=line.action+' →';$('story-next').classList.remove('finished');$('story-next').hidden=false;$('dialogue-count').textContent=line.total>1?`${line.index+1} / ${line.total}`:'';$('guide-character').classList.toggle('speaking',line.who==='lin');if(line.who==='aqi')react('curious');audioUI.line(line);});
function say(text,who='lin'){dialogue.interrupt(who,text);}
function pointTo(id){const el=$(id);if(!el||el.hidden)return;el.classList.add('attention');setTimeout(()=>el.classList.remove('attention'),3600);el.focus({preventScroll:true});}
function talk(id,force=false){if(!force&&dialogueSeen.has(id))return;dialogueSeen.add(id);dialogue.start(id,()=>{
 const actions={arrival:inspectBadge,badge:()=>view==='yard'?$('go-desk').click():pointTo('archive-shelf'),assembled:()=>view==='desk'?$('unfold').click():pointTo('wheel'),raised:()=>$('inspect-entry').click(),inspected:openPhoto,photo:()=>{if(!photoFlipped)$('flip-photo').click();},reverse:()=>{$('destination').scrollIntoView({block:'nearest',behavior:reduced?'instant':'smooth'});pointTo('destination');},finish:notebook};
 if(actions[id])actions[id]();else pointTo(id==='archive'?'reference':'wheel');
});}
const opening=createOpening($('intro'),{reduced,onState:event=>audioUI.opening(event),onFinish:async()=>{s.started=true;s.openingSeen=true;save();await go(s.destination?'finish':complete(s)?'paper':s.archive?'desk':'yard',true);talk(stepKey(s),true);react('happy');}});
function advanceDialogue(){const id=dialogue.id;if(!dialogue.next()&&dialogue.id===id){$('story-next').hidden=true;$('photo-chat-next').hidden=true;}}
$('story-next').onclick=$('photo-chat-next').onclick=advanceDialogue;
function showGuide(){audioUI.cut();$('guide-task').textContent=goal(s);$('guide-dialog').showModal();}
$('guide-character').onclick=showGuide;
document.querySelectorAll('[data-hint]').forEach(b=>b.onclick=()=>{const level=Number(b.dataset.hint);$('guide-dialog').close();say(hints(s)[level]);if(level===2){const key=stepKey(s);pointTo({arrival:'badge',badge:view==='yard'?'go-desk':'badge-again',archive:'reference',paper:'wheel',raised:'inspect-entry',inspected:'photo-pick'}[key]);}});
$('opening-replay').onclick=()=>{$('about-dialog').close();opening.show();};
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3600);}
function react(kind='curious'){const a=$('aqi');clearTimeout(flightTimer);a.classList.remove('hop','fly');void a.offsetWidth;const pos=kind==='happy'?'0% 100%':kind==='inspect'?'100% 0%':'50% 0%';$('aqi-sprite').style.backgroundPosition=pos;if(kind==='happy')a.classList.add('hop');if(kind==='fly'&&!reduced)a.classList.add('fly');flightTimer=setTimeout(()=>{$('aqi-sprite').style.backgroundPosition='0% 0%';a.classList.remove('hop','fly');},reduced?0:kind==='fly'?750:1500);}
function update(){
 $('task').textContent=s.destination?'下一站 / 新城邻里中心':s.archive?'档案 A—07 / 厂房图纸':s.badge?'已收好 / 工牌 A—07':'未送出的邀请';$('piece-count').textContent=`${s.placed.length} / 6`;
 $('unfold').hidden=!complete(s);$('photo-pick').hidden=!complete(s)||s.open<.94||!s.inspected;$('inspect-entry').hidden=!complete(s)||s.open<.94||s.inspected;
 $('fold').value=Math.round(s.open*1000);$('fold-value').textContent=Math.round(s.open*100)+'%';$('wheel').setAttribute('aria-valuenow',Math.round(s.open*100));$('wheel').setAttribute('aria-valuetext',`纸景展开 ${Math.round(s.open*100)}%`);$('gear').setAttribute('transform',`translate(80 80) rotate(${s.open*648})`);
 $('wheel-guide').textContent=s.open>.93?(s.inspected?'照片在门廊这页。':'展开了，换个角度看门廊。'):s.open>.3?'接着转，下一层也会立起来。':'沿着轮缘转动，或拖动旁边的刻度。';
 stage?.setProgress(s.open);$('fallback').querySelector('img').style.transform=`rotateX(${(1-s.open)*65}deg) scale(${.65+s.open*.35})`;
 $('destination').hidden=!s.back;$('photo-turn').classList.toggle('turned',photoFlipped);$('flip-photo').textContent=photoFlipped?'翻回正面看合影 ↻':'翻到背面，看看笔记 ↻';
 document.querySelector('.photo-front').setAttribute('aria-hidden',String(photoFlipped));document.querySelector('.photo-back').setAttribute('aria-hidden',String(!photoFlipped));
 $('puzzle').hidden=!s.archive;document.body.classList.toggle('puzzle-open',s.archive&&view==='desk');document.querySelector('.archive-files').hidden=s.archive;
 $('puzzle').classList.toggle('is-complete',complete(s));
 for(let i=0;i<6;i++){const slot=$('board').children[i],p=$('tray').querySelector(`[data-piece="${i}"]`);const filled=s.placed.includes(i);slot.classList.toggle('filled',filled);slot.setAttribute('aria-label',`图纸位置 ${i+1}${filled?'，已拼好':''}`);p.classList.toggle('used',filled);p.disabled=filled;}
}
async function go(next,instant=false){if(transitioning)return;transitioning=true;audioUI.cut();sound.setScene(next);clearDrag();if(!instant&&!reduced){$('curtain').classList.add('on');await new Promise(r=>setTimeout(r,190));}view=next;document.body.dataset.view=next;for(const v of['yard','desk','paper','finish']){$(v+'-view').hidden=v!==next;$(v+'-view').classList.toggle('enter',v===next);}stage?.setActive(next==='paper');$('back').hidden=next==='yard'||next==='finish';$('back').textContent=next==='paper'?'← 回档案桌':'← 回院落';$('aqi').style.opacity=next==='finish'?'.45':'';update();talk(stepKey(s));if(!reduced){$('guide-character').classList.remove('walking');void $('guide-character').offsetWidth;$('guide-character').classList.add('walking');clearTimeout(walkTimer);walkTimer=setTimeout(()=>$('guide-character').classList.remove('walking'),1200);}if(!instant&&!reduced)await new Promise(r=>setTimeout(r,40));$('curtain').classList.remove('on');transitioning=false;}
function inspectBadge(){s.badge=true;save();update();visualUI.resetBadge();$('badge-dialog').showModal();react('curious');sound.play('pick');}
$('badge').onclick=inspectBadge;$('badge-again').onclick=inspectBadge;
$('badge-continue').onclick=()=>{$('badge-dialog').close();go('desk');talk('badge',true);};
$('go-desk').onclick=()=>{if(!s.badge){inspectBadge();return;}go('desk');};
$('back').onclick=()=>go(view==='paper'?'desk':'yard');
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>audioUI.closeModal(d.id)));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
let archiveOpening=false;
document.querySelectorAll('[data-file]').forEach(b=>b.onclick=async()=>{if(archiveOpening)return;const r=chooseArchive(s,b.dataset.file);if(!r.ok){toast(r.reason);say('不是这一卷。工牌背面写的是什么编号？');sound.play('bad');b.classList.add('shake');setTimeout(()=>b.classList.remove('shake'),350);return;}archiveOpening=true;save();b.classList.add('opening');sound.play('folder');if(!reduced)await new Promise(r=>setTimeout(r,700));b.classList.remove('opening');archiveOpening=false;update();if(view==='desk'){talk('archive',true);react('inspect');}});
function piecePosition(el,piece){el.style.backgroundPosition=`${piece%3*50}% ${Math.floor(piece/3)*100}%`;}
for(let i=0;i<6;i++){const b=document.createElement('button');b.className='slot';b.dataset.slot=i;b.setAttribute('aria-label',`图纸位置 ${i+1}`);piecePosition(b,i);b.onclick=()=>{if(selection!==null)drop(selection,i);else toast('先选一张图纸，再点这里。');};$('board').append(b);}
for(const i of INITIAL_ORDER){const b=document.createElement('button');b.className='piece';b.dataset.piece=i;b.setAttribute('aria-label',`图纸 ${i+1}`);b.setAttribute('aria-pressed','false');piecePosition(b,i);$('tray').append(b);
 b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i);}};
 b.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();select(i);b.setPointerCapture(e.pointerId);const r=b.getBoundingClientRect();drag={piece:i,x:e.clientX,y:e.clientY,w:r.width,h:r.height,moved:false};};
 b.onpointermove=e=>{if(!drag||drag.piece!==i)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5){drag.moved=true;if(!dragCopy){dragCopy=b.cloneNode(true);dragCopy.className='piece drag-copy';dragCopy.setAttribute('aria-hidden','true');dragCopy.style.width=drag.w+'px';dragCopy.style.height=drag.h+'px';document.body.append(dragCopy);}dragCopy.style.left=e.clientX-drag.w/2+'px';dragCopy.style.top=e.clientY-drag.h/2+'px';const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');for(const slot of $('board').children)slot.classList.toggle('target',slot===target);}};
 b.onpointerup=e=>{if(!drag)return;const moved=drag.moved,target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');clearDrag();if(moved&&target)drop(i,Number(target.dataset.slot));};b.onpointercancel=clearDrag;
 b.onclick=e=>{if(e.detail===0)select(i);};
}
function select(i){if(s.placed.includes(i))return;selection=i;document.querySelectorAll('.piece').forEach(b=>{const v=Number(b.dataset.piece)===i;b.classList.toggle('selected',v);b.setAttribute('aria-pressed',String(v));});}
function clearDrag(){drag=null;dragCopy?.remove();dragCopy=null;for(const el of $('board').children)el.classList.remove('target');}
function drop(piece,slot){const r=place(s,piece,slot);if(!r.ok){toast(r.reason);sound.play('bad');react('curious');const el=$('board').children[slot];el.classList.add('shake');setTimeout(()=>el.classList.remove('shake'),350);return;}selection=null;document.querySelectorAll('.piece').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});update();save();sound.play(r.complete?'success':'snap');const el=$('board').children[slot];el.classList.add('just-placed');setTimeout(()=>el.classList.remove('just-placed'),500);if(r.complete){talk('assembled',true);react('happy');$('unfold').focus({preventScroll:true});}else if(s.placed.length===2)say('这段接上了。再找找往上连的楼梯间。','aqi');}
$('reference').onclick=()=>{const on=$('reference').getAttribute('aria-pressed')!=='true';$('reference').setAttribute('aria-pressed',String(on));$('board').classList.toggle('reference',on);};
$('unfold').onclick=()=>{if(complete(s)){go('paper');react('happy');}};
let lastFlutter=0;
function setFold(value){const was=s.open;if(Math.abs(value-was)>.001)sound.play('fold');if(!turn(s,value))return;update();clearTimeout(saveTimer);saveTimer=setTimeout(save,220);if(s.open>.94&&was<=.94){talk('raised');sound.play('lock');react('happy');}else if(s.open<.9&&was>=.9)say('收回来也没关系，图纸不会散。要找照片，再把它展开。');else if(Math.abs(s.open-was)>.001&&performance.now()-lastFlutter>900){lastFlutter=performance.now();react('fly');}}
$('fold').oninput=e=>setFold(Number(e.target.value)/1000);
let wheelDrag=null;const angle=e=>{const r=$('wheel').getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2);};
$('wheel').onpointerdown=e=>{e.preventDefault();$('wheel').setPointerCapture(e.pointerId);wheelDrag={angle:angle(e)};};$('wheel').onpointermove=e=>{if(!wheelDrag)return;const a=angle(e);let delta=a-wheelDrag.angle;if(delta>Math.PI)delta-=Math.PI*2;if(delta<-Math.PI)delta+=Math.PI*2;wheelDrag.angle=a;setFold(s.open+delta/(Math.PI*3.6));};$('wheel').onpointerup=$('wheel').onpointercancel=()=>{wheelDrag=null;save();};$('wheel').onkeydown=e=>{if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();setFold(e.key==='Home'?0:e.key==='End'?1:s.open+(['ArrowRight','ArrowUp'].includes(e.key)?.04:-.04));}};
$('reset-camera').onclick=()=>stage?.resetView();
function openPhoto(){if(!s.photo&&!takePhoto(s))return;$('photo-feedback').textContent='';save();update();$('photo-dialog').showModal();react('curious');talk(s.back?'reverse':'photo',true);sound.play('pick');}
$('photo-pick').onclick=openPhoto;$('revisit').onclick=openPhoto;
$('flip-photo').onclick=()=>{sound.play('flip');photoFlipped=!photoFlipped;if(photoFlipped)s.back=true;update();save();if(photoFlipped)talk('reverse',true);};
document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{const r=destination(s,b.dataset.place);if(!r.ok){$('photo-feedback').textContent=r.reason;sound.play('bad');return;}$('photo-dialog').close();save();go('finish');sound.play('success');sound.reveal();react('happy');});
$('hint').onclick=showGuide;
// Master sound, channel controls and replay are bound by audio-ui.js.
$('about').onclick=$('sources').onclick=()=>{audioUI.cut();$('about-dialog').showModal();};
function notebook(){const list=$('evidence-list');list.replaceChildren();const items=s.badge?[['工牌 A—07','工牌指向一卷厂房图纸。','工牌',inspectBadge]]:[];if(s.archive)items.push(['厂房图纸',complete(s)?'六块已拼合，可从图纸展开立体纸景。':'六块图纸还没接完整。','图纸',()=>{$('notebook-dialog').close();go('desk');}]);if(s.photo)items.push(['工友合影','左边戴圆眼镜的是陈师傅。背面留着生活地点的线索。','合影',()=>{$('notebook-dialog').close();openPhoto();}]);if(s.destination)items.push(['下一站：新城邻里中心','桥廊、圆雨棚，以及“下班以后”的约定。',null,null]);if(!items.length){const p=document.createElement('p');p.textContent='还没有收好线索。先看看院落里的工牌。';list.append(p);}for(const [title,desc,label,fn]of items){const row=document.createElement('div');row.className='evidence';const h=document.createElement('strong'),p=document.createElement('p');h.textContent=title;p.textContent=desc;row.append(h,p);if(label){const b=document.createElement('button');b.textContent='查看'+label+' ↗';b.onclick=()=>{if($('notebook-dialog').open)$('notebook-dialog').close();fn();};row.append(b);}list.append(row);}$('notebook-dialog').showModal();}
$('notebook').onclick=notebook;
$('replay').onclick=()=>{s=fresh();selection=null;photoFlipped=false;dialogueSeen.clear();stage?.resetInspection();save();update();go('yard',true);opening.show();};
function loaded(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
$('export').onclick=async()=>{if(!s.destination)return;const b=$('export');b.disabled=true;try{const im=await loaded('./assets/memory.jpg'),c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');x.fillStyle='#f3e8cc';x.fillRect(0,0,1080,1350);x.fillStyle='#193c46';x.font='22px sans-serif';x.fillText('阿奇 · 城市接力 / 第一张线索',75,90);x.font='bold 66px SimSun,serif';x.fillText('下班以后，到邻里见。',75,210);x.drawImage(im,70,285,940,627);x.font='27px SimSun,serif';x.fillText('同一个人，走出厂房，还有另一段生活。',75,995);x.font='22px sans-serif';x.fillText('新苏工业坊 → 新城邻里中心',75,1080);x.strokeStyle='#397b78';x.beginPath();x.moveTo(75,1150);x.lineTo(1005,1150);x.stroke();x.font='17px sans-serif';x.fillText('图为本项目生成的虚构工友漫画，并非历史现场照片。',75,1200);x.fillText('阿奇：项目幼鹭角色 / 生成式工具辅助美术 / 非官方吉祥物',75,1235);const blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob)throw Error('导出失败');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='阿奇-第一张线索-下班以后.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('线索已导出为 1080 × 1350 PNG。');}catch{toast('图片暂未能导出，请稍后再试。');}finally{b.disabled=false;}};
for(let i=0;i<(innerWidth<700?7:13);i++){const el=document.createElement('i');el.style.left=(i*37%100)+'%';el.style.animationDelay=(-i*1.83)+'s';el.style.animationDuration=(14+i%5*3)+'s';$('dust').append(el);}
document.addEventListener('keydown',e=>{if(!$('intro').hidden&&e.key==='Tab'){const buttons=[...$('intro').querySelectorAll('button')].filter(b=>!b.disabled&&b.getClientRects().length);const index=buttons.indexOf(document.activeElement);if(e.shiftKey&&index<=0){e.preventDefault();buttons.at(-1)?.focus();}else if(!e.shiftKey&&(index<0||index===buttons.length-1)){e.preventDefault();buttons[0]?.focus();}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();sound.pause();}else sound.resume();});window.addEventListener('pagehide',()=>{dead=true;save();stage?.dispose();opening.dispose();sound.dispose();clearDrag();clearTimeout(walkTimer);});
function foundEntrance(){if(s.inspected||!inspectEntry(s))return;save();update();talk('inspected',true);react('inspect');sound.play('pick');}
$('inspect-entry').onclick=()=>{if(stage)stage.inspectEntry();else foundEntrance();};
function photoAnchor(p){const b=$('photo-pick'),host=document.querySelector('.model-host');b.classList.add('world-anchor');b.style.left=clamp(p.x,90,Math.max(90,host.clientWidth-90))+'px';b.style.top=clamp(p.y,50,Math.max(50,host.clientHeight-45))+'px';}
$('load-retry').onclick=()=>location.reload();
let loadCount=0;
const sceneAssets=['./assets/courtyard.jpg','./assets/aqi-sprites.png','./assets/memory.jpg','./assets/lin-sprites.png','./assets/chen-portrait-v4.png','./assets/opening-clean-frame-v6.jpg'];$('load-progress').max=sceneAssets.length;$('load-count').textContent='正在准备这一页 · 0 / '+sceneAssets.length;
async function loadSceneAsset(url){const im=await loaded(url);loadCount++;$('load-progress').value=loadCount;$('load-count').textContent='正在准备这一页 · '+loadCount+' / '+sceneAssets.length;return im;}
let loadFailed=false;
try{
 stage=createStage($('world'),{reduced,plan,onInspect:foundEntrance,onPhotoAnchor:photoAnchor,onError:()=>{$('world').hidden=true;$('fallback').hidden=false;$('model-note').textContent='当前设备使用二维折叠降级；三维纸景未启用。';$('inspect-entry').textContent='查看门廊折页 →';}});
 update();
 await Promise.all(sceneAssets.map(loadSceneAsset));
}catch(e){loadFailed=true;console.warn(e);$('load-count').textContent='这一页有素材没准备好，点下面重试。';$('load-retry').hidden=false;}
finally{if(!dead&&!loadFailed){$('loading').hidden=true;await go(s.destination?'finish':complete(s)?'paper':s.archive?'desk':'yard',true);if(s.inspected)stage?.inspectEntry();if(!s.openingSeen)opening.show();else $('intro').hidden=true;}}

const experience=bindExperience({chapter:'xinsu',getStep:()=>xinsuStep(s,view,selection)});
