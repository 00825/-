import {bindExperience} from '../shared/experience.js';
import {neighbourStep} from '../shared/guide-steps.js';
import {Match,prepareSmashWindow} from './match.js';
import {fresh,restore,GOAL,inspectArchitecture,inspectRacket,addHit,collect,finish,goal} from './model.js';
import {createCourt} from './renderer.js';
import {AudioRoom} from './audio.js';
import {SCRIPTS,PROGRAMME_VOICE,VOICES} from './voices.js';

const $=s=>document.querySelector(s),preview=new URLSearchParams(location.search).get('preview'),key='aqi-neighbour-v1'+(preview?':preview:'+preview:'');
let state;try{state=restore(JSON.parse(localStorage.getItem(key)));}catch{state=fresh();}
const sound=new AudioRoom({onVoiceState:voiceState});let stage=null,stagePromise=null;let exportUrl=null;let view='square',raf=0,previous=0,dialogReturn=null,wasPaused=true,lines=[],lineIndex=0,afterTalk=null,toastTimer;
const save=()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{}$('#task').textContent=goal(state);};
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4200);}
function cheer(){$('#aqi').classList.remove('cheer');void $('#aqi').offsetWidth;$('#aqi').classList.add('cheer');}
function voiceState({phase,id,track}){
 const status={idle:'',waiting:'点重听，听听这句话',loading:'语音载入中…',playing:track?.who==='aqi'?'阿奇原声播放中':'小周说话中',ended:'可以再听一遍',muted:'声音已关闭',paused:'点重听继续',blocked:'点重听启用语音',error:'语音暂未载入，可继续读字幕'}[phase]||'';
 $('#voice-status').textContent=status;
 const playing=phase==='playing';$('#dialogue').dataset.speaking=String(playing);
 const active=lines[lineIndex];$('#dialogue').dataset.face=String(playing&&track?.who==='zhou'?1:(active?.[3]||0));
 $('#programme-voice-status').textContent=id===PROGRAMME_VOICE?status:'';
 $('#programme-voice').dataset.speaking=String(playing&&id===PROGRAMME_VOICE);
}
function talk(name,after=null){lines=SCRIPTS[name]||[];lineIndex=0;afterTalk=after;$('#dialogue').hidden=!lines.length;if(lines.length)showLine();else sound.stopVoice();}
function showLine(){if(!lines.length)return;const [who,text,id,face=0]=lines[lineIndex];$('#dialogue').dataset.who=who;$('#dialogue').dataset.face=String(face);$('#speaker').textContent=who==='aqi'?'阿奇':'小周 · 邻里球友';$('#line').textContent=text;$('#dialogue-count').textContent=`${lineIndex+1} / ${lines.length}`;$('#next').textContent=lineIndex===lines.length-1?'去看看 →':'接着聊 →';sound.speak(id);}
$('#replay-line').onclick=()=>{sound.unlock();sound.speak(lines[lineIndex]?.[2]);};
$('#next').onclick=()=>{sound.unlock();if(lineIndex<lines.length-1){lineIndex++;showLine();}else{sound.stopVoice();$('#dialogue').hidden=true;const fn=afterTalk;afterTalk=null;fn?.();}};
function pointTo(id){const el=$(id);el.classList.remove('attention');void el.offsetWidth;el.classList.add('attention');el.focus({preventScroll:true});}
function open(id){sound.stopVoice();dialogReturn=document.activeElement;wasPaused=match.paused;match.pause(true);updatePause();$(id).showModal();}
function closed(){if(view==='court'&&!wasPaused&&!document.hidden){match.pause(false);updatePause();}dialogReturn?.focus({preventScroll:true});}
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',()=>{if(d.id==='programme-dialog'&&sound.voice.wanted===PROGRAMME_VOICE)sound.stopVoice();closed();});d.querySelector('[data-close]').onclick=()=>d.close();});
function setView(next){sound.stopVoice();view=next;document.body.dataset.view=next;for(const id of['square','building','court','finish'])$('#'+id).hidden=id!==next;$('#dialogue').hidden=true;match.pause(next!=='court');sound.court(next==='court');stage?.setActive(next==='building');if(next==='building')setupBuilding();if(next==='court'){court.resize();updatePause();updateGame();startFrame();}else{cancelAnimationFrame(raf);raf=0;}window.scrollTo({top:0,behavior:'instant'});save();}
function event(e){court?.react(e);if(e.type==='hit'){sound.effect(e.kind==='smash'?'smash':'hit');$('#match-message').classList.toggle('smash-message',e.kind==='smash');if(e.side==='left'){addHit(state);save();updateGame();cheer();$('#match-message').textContent=e.kind==='smash'?`扣杀！高点下压，累计 ${state.hits} 拍。${state.hits>=GOAL?'节目卡已拿来，随时可以收好。':''}`:state.hits===GOAL?'六拍接住了！节目卡已经拿来，随时可以收好。':`接住了！累计 ${state.hits} 拍。${match.mode==='long'?'这一拍送到后场。':'这一拍落在网前。'}`;}}
 if(e.type==='serve')$('#match-message').textContent='看球的落点。脚下出现暖金圈时，点“挥拍”。';
 if(e.type==='smash-prepare')$('#match-message').textContent='起跳蓄拍——空中接近高球，才能完成扣杀。';
 if(e.type==='point'){$('#match-message').classList.remove('smash-message');sound.effect(e.reason==='net'?'net':'point');$('#match-message').textContent=(e.reason==='net'?'球碰网了。':e.winner==='left'?'这一分接得好。':'落地也没关系。')+' 已接住的拍数保留，点“再发一球”继续。';}
 if(e.type==='jump')sound.effect('jump');updateGame();}
const match=new Match({hits:state.hits,onEvent:event});match.pause(true);
const court=createCourt($('#court-canvas'),match);
function fallbackBuilding(){ $('#building-canvas').hidden=true;$('#building-fallback').hidden=false;$('#building-note').textContent='当前设备使用二维折页示意；仍可展开、核对桥廊并继续。'; }
async function setupBuilding(){
 $('#model-growth').value=String(Math.round(state.build*100));updateBuilding();$('#building-clue').hidden=!state.architecture;
 if(!stagePromise){stagePromise=import('./stage.js').then(({createNeighbourStage})=>{stage=createNeighbourStage($('#building-canvas'),{reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,onError:fallbackBuilding});if(stage){stage.setProgress(state.build);stage.setActive(view==='building');}else fallbackBuilding();}).catch(fallbackBuilding);}
 await stagePromise;stage?.setProgress(state.build);stage?.setActive(view==='building');
}
function updateBuilding(){const p=state.build;$('#model-percent').textContent=Math.round(p*100)+'%';$('#model-wheel').style.transform=`rotate(${p*300}deg)`;$('#model-inspect').disabled=p<.94;stage?.setProgress(p);$('#building-fallback svg').style.transform=`perspective(800px) rotateX(${(1-p)*62}deg) scale(${.65+p*.35})`;}
function enterBuilding(){if(!state.photo){toast('先对照合影，再把里面的建筑展开。');pointTo('#photo');return;}setView('building');}
$('#model-entry').onclick=enterBuilding;
$('#leave-building').onclick=()=>setView('square');
$('#model-growth').oninput=e=>{state.build=Number(e.target.value)/100;updateBuilding();save();};
$('#model-inspect').onclick=()=>{if(!inspectArchitecture(state))return;stage?.inspectBridge();$('#building-clue').hidden=false;save();sound.effect('card');};
$('#building-done').onclick=()=>{setView('square');talk('photo',()=>pointTo('#racket'));};
$('#model-left').onclick=()=>stage?.rotate(-1);$('#model-right').onclick=()=>stage?.rotate(1);$('#model-reset').onclick=()=>stage?.resetView();
window.addEventListener('pagehide',e=>{if(!e.persisted)stage?.dispose();});
function updateGame(){$('#smash-tip').textContent=match.smashes?`本次练习已完成 ${match.smashes} 次扣杀。高球时再点扣杀键，起跳到高点才能击中。`:'来球较高时，扣杀键亮起：点它起跳，空中高点击中才算扣杀。';const count=Math.min(GOAL,state.hits);$('#hit-count').textContent=`${count} / ${GOAL}`;$('#hit-progress').value=count;$('#player-score').textContent=match.score[0];$('#ai-score').textContent=match.score[1];$('#rally').textContent=match.status==='rally'?`${match.rally} 拍来回`:match.status==='point'?'歇一拍，再来':'准备接球';$('#hit').innerHTML=`${match.status==='rally'?'挥拍':match.status==='point'?'再发一球':'开始回合'} <span>空格 / 点按</span>`;$('#collect-card').hidden=state.hits<GOAL&&!state.card;$('#practice-note').textContent=state.card?'节目卡已经记在调查簿里。你还可以继续打球。':state.hits>=GOAL?'小周把卡拿来了：“老陈留的，背面还有字。”':'陪小周接几拍，他去拿陈师傅留下的节目卡。';}
function updatePause(){$('#pause').textContent=match.paused?'继续':'暂停';$('#pause').setAttribute('aria-pressed',String(match.paused));$('#hit').disabled=match.paused;$('#smash').disabled=match.paused||match.status!=='rally'||match.ball?.last!=='right';}
function startFrame(){if(raf)return;previous=performance.now();function frame(now){if(view!=='court'){raf=0;return;}match.step((now-previous)/1000);previous=now;const ready=court.draw(now);$('#hit').dataset.ready=String(ready);$('#smash').dataset.ready=String(prepareSmashWindow(match));$('#smash').disabled=match.paused||match.status!=='rally'||match.ball?.last!=='right';raf=requestAnimationFrame(frame);}raf=requestAnimationFrame(frame);}
function begin(){sound.unlock();state.started=true;save();$('#arrival').classList.add('leaving');setTimeout(()=>{$('#arrival').hidden=true;document.querySelector('main').inert=false;$('header').inert=false;$('footer').inert=false;setView(state.destination?'finish':'square');if(!state.photo)talk('arrival',()=>pointTo('#photo'));},matchMedia('(prefers-reduced-motion: reduce)').matches?0:520);}
$('#begin').onclick=begin;
$('#photo').onclick=()=>{sound.unlock();open('#photo-dialog');};
$('#photo-done').onclick=()=>{state.photo=true;save();$('#photo-dialog').close();enterBuilding();};
$('#racket').onclick=()=>{if(!state.photo){toast('先把合影里的桥廊对一对，再问球拍的事。');pointTo('#photo');return;}if(!state.architecture){toast('先展开建筑，核对桥廊的形。');enterBuilding();return;}open('#racket-dialog');};
$('#tape').onclick=()=>{inspectRacket(state);save();$('#racket-object').classList.add('inspected');$('#racket-line').textContent='阿奇：“原来是留给下次拆开的。陈师傅连这点都想到了。”';$('#racket-done').hidden=false;sound.effect('card');};
$('#racket-done').onclick=()=>{$('#racket-dialog').close();talk('racket',enterCourt);};
function enterCourt(){if(state.photo&&!state.architecture){enterBuilding();return;}if(!state.racket){toast(state.photo?'先看看拍柄上的胶带折角。':'先对照一下合影，弄清我们为什么来到这里。');pointTo(state.photo?'#racket':'#photo');return;}setView('court');$('#hit').focus({preventScroll:true});}
$('#court-entry').onclick=enterCourt;$('#leave-court').onclick=()=>{setView('square');talk(state.racket?'racket':'arrival');};
$('#hit').onclick=()=>{sound.unlock();match.swing();};$('#smash').onclick=()=>{sound.unlock();match.smash();};$('#jump').onclick=()=>{if(!match.paused)match.jump();};
function assist(on){match.setAssist(on);$('#assist').setAttribute('aria-pressed',String(on));$('#assist').textContent=`自动跑位 ${on?'开':'关'}`;}
$('#assist').onclick=()=>assist(!match.assist);
for(const mode of['long','short'])$('#'+mode).onclick=()=>{match.mode=mode;for(const m of['long','short'])$('#'+m).setAttribute('aria-pressed',String(m===mode));};
$('#pause').onclick=()=>{match.pause(!match.paused);updatePause();sound.unlock();};
for(const [id,dir] of[['#move-left','left'],['#move-right','right']]){const el=$(id);el.addEventListener('pointerdown',e=>{if(match.paused)return;e.preventDefault();el.setPointerCapture(e.pointerId);assist(false);match.keys[dir]=true;el.setAttribute('aria-pressed','true');});for(const t of['pointerup','pointercancel','lostpointercapture'])el.addEventListener(t,()=>{match.keys[dir]=false;el.setAttribute('aria-pressed','false');});}
let dragging=false;
$('#court-canvas').addEventListener('pointerdown',e=>{if(match.paused)return;const x=court.toWorld(e.clientX);if(x>480)return;dragging=true;e.currentTarget.setPointerCapture(e.pointerId);match.moveTo(x);assist(false);});
$('#court-canvas').addEventListener('pointermove',e=>{if(dragging)match.moveTo(court.toWorld(e.clientX));});
for(const t of['pointerup','pointercancel'])$('#court-canvas').addEventListener(t,()=>dragging=false);
document.addEventListener('keydown',e=>{if(view!=='court'||document.querySelector('dialog[open]')||e.ctrlKey||e.metaKey||e.altKey)return;if(['ArrowLeft','ArrowRight','ArrowUp',' ','a','d','w','A','D','W','s','S'].includes(e.key)){if(e.target instanceof HTMLButtonElement&&e.key===' ')return;e.preventDefault();sound.unlock();if(match.paused)return;if(e.key===' '){if(!e.repeat)match.swing();}else if(['s','S'].includes(e.key)){if(!e.repeat)match.smash();}else if(['ArrowUp','w','W'].includes(e.key)){if(!e.repeat)match.jump();}else{assist(false);match.keys[['ArrowLeft','a','A'].includes(e.key)?'left':'right']=true;}}});
document.addEventListener('keyup',e=>{if(['ArrowLeft','a','A'].includes(e.key))match.keys.left=false;if(['ArrowRight','d','D'].includes(e.key))match.keys.right=false;});
window.addEventListener('blur',()=>{match.keys={};});
document.addEventListener('visibilitychange',()=>{sound.visibility(document.hidden);if(document.hidden&&view==='court'){match.pause(true);updatePause();}});
function cardFace(back){$('#programme').classList.toggle('turned',back);$('.programme-front').setAttribute('aria-hidden',String(back));$('.programme-back').setAttribute('aria-hidden',String(!back));}
function programme(skip=false){if(!collect(state,{skip}))return;save();sound.effect('card');cardFace(state.back);$('#mark-destination').hidden=!state.back;$('#flip-card').textContent=state.back?'再看正面 ↻':'翻面读读他的留言 ↻';open('#programme-dialog');$('#programme-line').textContent=VOICES[PROGRAMME_VOICE].text;sound.speak(PROGRAMME_VOICE);}
$('#programme-replay').onclick=()=>{sound.unlock();sound.speak(PROGRAMME_VOICE);};
$('#story-first').onclick=()=>programme(true);$('#collect-card').onclick=()=>programme(false);$('#read-card').onclick=()=>programme(false);
$('#flip-card').onclick=()=>{const turned=!$('#programme').classList.contains('turned');cardFace(turned);$('#flip-card').textContent=turned?'再看正面 ↻':'翻面读读他的留言 ↻';if(turned){state.back=true;save();$('#mark-destination').hidden=false;sound.effect('card');}};
$('#mark-destination').onclick=()=>{if(!finish(state))return;save();wasPaused=true;$('#programme-dialog').close();setView('finish');cheer();sound.effect('card');};
$('#again').onclick=enterCourt;
$('#notebook').onclick=()=>{$('#evidence').replaceChildren();const facts=[['合影',state.photo?'桥廊与圆雨棚对上了。':'还没对照。'],['建筑纸景',state.architecture?'展开并认出了圆雨棚与桥廊。':'还没展开核对。'],['旧球拍',state.racket?'折起的胶带角，是陈师傅留给下次修理的方便。':'还没查看。'],['练习卡',`累计接住 ${state.hits} 拍。${state.skipped?'先收线索也能继续故事。':'失误不会清空。'}`],['节目卡',state.back?'背面的去处：苏州文化艺术中心。':state.card?'已拿到，翻面还有留言。':'还在小周那里。']];for(const [title,text]of facts){const div=document.createElement('div');div.className='evidence';const b=document.createElement('b'),p=document.createElement('p');b.textContent=title;p.textContent=text;div.append(b,p);$('#evidence').append(div);}open('#notebook-dialog');};
$('#about').onclick=()=>open('#about-dialog');
$('#hint').onclick=()=>{toast(goal(state));if(view==='building'){pointTo(state.build<.94?'#model-growth':'#model-inspect');return;}pointTo(state.destination?(view==='finish'?'#read-card':'#court-entry'):state.card?'#court-entry':state.racket?'#court-entry':state.photo?(state.architecture?'#racket':'#model-entry'):'#photo');};
$('#reset').onclick=()=>{state=fresh();match.hits=0;match.score=[0,0];match.status='ready';match.ball=null;match.trail=[];match.smashes=0;match.queued=0;match.smashQueued=0;stage?.setProgress(0);$('#building-clue').hidden=true;save();wasPaused=true;$('#notebook-dialog').close();$('#racket-done').hidden=true;$('#racket-object').classList.remove('inspected');$('#programme').classList.remove('turned');setView('square');$('#arrival').hidden=false;$('#arrival').classList.remove('leaving');document.querySelector('main').inert=true;$('header').inert=true;$('footer').inert=true;$('#begin').focus();};
$('#sound').onclick=()=>{const on=sound.toggle();$('#sound').setAttribute('aria-pressed',String(on));$('#sound').setAttribute('aria-label',on?'关闭音乐、配音与音效':'开启音乐、配音与音效');$('#sound').innerHTML=`${on?'♫':'♪'} <span>声音${on?'开':'关'}</span>`;};
document.addEventListener('click',e=>{if(!e.target.closest('#sound'))sound.unlock();},{capture:true});
$('#export').onclick=async()=>{const btn=$('#export');btn.disabled=true;try{const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const c=canvas.getContext('2d');const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});const [bg,bird]=await Promise.all([load('./assets/courtyard.jpg'),load('../xinsu/assets/aqi-sprites.png')]);c.fillStyle='#f3e8cc';c.fillRect(0,0,1080,1350);c.drawImage(bg,0,0,bg.width,bg.height,35,35,1010,710);c.strokeStyle='#193c46';c.lineWidth=3;c.strokeRect(35,35,1010,710);c.drawImage(bird,0,512,512,512,715,585,290,290);c.fillStyle='#193c46';c.font='22px sans-serif';c.fillText('阿奇城市寻人手记  /  02',65,815);c.font='58px SimSun,serif';c.fillText('下班以后，来一拍。',65,910);c.font='27px sans-serif';c.fillText('新城邻里中心',65,980);c.font='23px sans-serif';c.fillText('修过的球拍、折起的胶带角，还有一张湖边的约定。',65,1040);c.fillStyle='#397b78';c.fillText('新苏工业坊 → 新城邻里中心 → 苏州文化艺术中心',65,1110);c.strokeStyle='#193c4644';c.beginPath();c.moveTo(65,1160);c.lineTo(1015,1160);c.stroke();c.fillStyle='#193c46';c.font='18px sans-serif';c.fillText(`我的练习记录：累计回球 ${state.hits} 拍`,65,1215);c.font='15px sans-serif';c.fillText('建筑艺术化示意 · 阿奇为本项目原创IP · 人物、球场与节目卡为虚构故事',65,1280);const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw Error('PNG export');if(exportUrl)URL.revokeObjectURL(exportUrl);exportUrl=URL.createObjectURL(blob);$('#export-image').src=exportUrl;$('#download-image').href=exportUrl;open('#export-dialog');}catch{toast('图片暂未保存，请重试；也可以先截图保留。');}finally{btn.disabled=false;}};
for(let i=0;i<9;i++){const leaf=document.createElement('i');leaf.style.cssText=`--x:${5+i*11}%;--d:${14+i%4*3}s;--delay:${-i*3}s`;$('#leaves').append(leaf);}
save();updateGame();if(state.started){$('#arrival').hidden=true;setView(state.destination?'finish':'square');if(!state.destination){if(state.photo&&!state.architecture)setView('building');else talk(state.racket?'racket':state.photo?'photo':'arrival');}}else{document.querySelector('main').inert=true;$('header').inert=true;$('footer').inert=true;$('#dialogue').hidden=true;$('#begin').focus();}

const experience=bindExperience({chapter:'neighbour',getStep:()=>neighbourStep(state,view,match.paused)});
