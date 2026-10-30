const step=(scene,target,label,number,extra={})=>({scene,target,label,number,...extra});
export function xinsuStep(s,view,selection=null){
 if(view==='finish')return step(view,'.next-chapter','沿着合影，去邻里中心',5,{host:'.finish-inner'});
 if(view==='yard')return step(view,s.badge?'#go-desk':'#badge',s.badge?'去档案桌找 A—07':'先看看陈师傅的工牌',1,{host:'#yard-view',earned:Number(s.badge)});
 if(view==='desk'){
  if(!s.archive)return step(view,'[data-file="A-07"]','按工牌编号，找到档案',2,{host:'#desk-view'});
  if(s.placed.length===6)return step(view,'#unfold','让拼好的图纸立起来',2,{host:'#desk-view',earned:7,hideActor:true});
  return step(view,selection===null?'#tray':'#board',selection===null?'选一块图纸，接上窗带':'对照窗带，把图纸放入空位',2,{host:'#desk-view',earned:s.placed.length,hideActor:true,compactCue:true});
 }
 return step(view,s.open<.94?'#fold':!s.inspected?'#inspect-entry':'#photo-pick',s.open<.94?'拖动刻度，把厂房展开':!s.inspected?'换个角度，看看门廊':'取下门廊里的合影',3,{host:'.model-host',earned:Number(s.inspected)+7});
}
export function neighbourStep(s,view,paused=true){
 if(view==='finish')return step(view,'.next-chapter','跟着节目卡，去湖边',5,{host:'.finish>div'});
 if(view==='court')return step(view,paused?'#pause':s.hits>=6?'#collect-card':'#hit',paused?'继续这一局':s.hits>=6?'小周拿来了节目卡':'看落点，接住这一拍',4,{hideActor:true,hideCue:!paused&&s.hits<6});
 if(view==='building')return step(view,s.build<.94?'#model-growth':s.architecture?'#building-done':'#model-inspect',s.build<.94?'拖动滑条，让建筑长出来':s.architecture?'桥廊对上了，去问球友':'展开了，走近桥廊看看',2,{host:'.building-sheet',earned:Number(s.architecture)});
 return step(view,!s.photo?'#photo':!s.architecture?'#model-entry':!s.racket?'#racket':'#court-entry',!s.photo?'先对照合影里的桥廊':!s.architecture?'把合影里的建筑展开':!s.racket?'看看球拍柄上的折角':'去活动角，陪小周接几拍',!s.photo?1:!s.architecture?2:3,{host:'#square',earned:Number(s.photo)+Number(s.architecture)+Number(s.racket)});
}
export function cultureStep(s,view,status='ready'){
 if(view==='finish')return step(view,'#export','把这张排练签带走',4,{host:'.rehearsal-pass'});
 if(view==='rehearsal')return step(view,status==='ready'?'#play':status==='paused'?'#pause':status==='done'?'#collect':null,status==='ready'?'试一段声音，让舞台亮起来':status==='paused'?'从停下的这一拍继续':'收好陈师傅的排练签',3,{hideActor:true,hideCue:status==='playing'});
 const part=['wall','pearl','garden'].find(p=>!s.seen.includes(p)),label={wall:'看看弧墙，光从哪里来',pearl:'找到中间的这颗珍珠',garden:'再看看建筑旁的园林'};
 return step(view,s.build<.94?'#growth':part?`[data-part="${part}"]`:'#enter-stage',s.build<.94?'拖动金色滑条，展开建筑':part?label[part]:'三处都找到了，去后台',s.build<.94?1:2,{host:'.model-sheet',earned:s.seen.length});
}
export function nanoStep(s,view,boardReady=false){
 if(view==='finish')return step(view,'#export','把这张借还签带走',4,{host:'.return-slip'});
 if(view==='board')return step(view,boardReady?'#confirm-board':'#board-panel',boardReady?'两处亮了，打开下一层':'点 ↻ 转动镜片，沿着光找两处圆圈',2,{hideActor:true,hideCue:!boardReady});
 if(view==='reveal')return step(view,s.fragments.length===2?'#collect':'#lens-position',s.fragments.length===2?'读清了，收好借还签':'移动观察片，找到花纹下的字',3,{hideActor:true});
 const part=['lab','link'].find(p=>!s.seen.includes(p));return step(view,s.build<.94?'#growth':part?`[data-part="${part}"]`:'#enter-board',s.build<.94?'拖动滑条，让研发楼与连廊长出来':part==='lab'?'先看看研发楼':part==='link'?'再看看连廊':'两个地方看过了，走近展台',1,{host:'.model-sheet',earned:s.seen.length});
}
