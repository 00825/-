export const PEOPLE={aqi:{name:'阿奇',role:'来送邀请的小家伙'},lin:{name:'林姨',role:'老厂区资料整理员'}};
const a=(text,action='听她说')=>({who:'aqi',text,action}),l=(text,action='接着聊')=>({who:'lin',text,action});
export const SCRIPTS={
 arrival:[a('您好，我找陈师傅。有人托我把这封邀请交给他。'),l('老陈？他早不在这儿上班啦。你手里还有别的线索吗？'),a('只有一枚旧工牌。','拿出来看看'),l('翻过来瞧瞧。以前的档案编号，常写在背面。','看看工牌')],
 badge:[a('背面写着 A-07。'),l('那就找 A-07 那一卷。桌上的档案都按编号放着。','去找档案')],
 archive:[l('找对了。老陈留过图纸，也留过一张合影。'),a('图纸散开了，照片会不会夹在里面？'),l('先把它铺完整。横着接窗带，竖着接楼梯间。','试着拼一拼')],
 assembled:[a('拼好了！不过，它还是平的。'),l('旁边这只轮子能带动纸折页。慢慢转，看看门廊那一页。','去转轮子')],
 paper:[l('先把纸景立起来。图纸里的门廊太小，得换个角度看。','开始展开')],
 raised:[a('厂房立起来了。您说的照片呢？'),l('门廊后面露着一角纸。绕到这边，离近些看看。','看看门廊')],
 inspected:[a('找到了！门廊这一页夹着张照片。'),l('拿出来吧。老陈常把话写在照片背面。','拿起合影')],
 photo:[a('左边戴圆眼镜的，是陈师傅？'),l('是他。那时候，他一下班就往邻里那边走。','翻到背面')],
 reverse:[a('“下班以后，老地方见。”还画着桥和圆雨棚。'),l('那会儿买菜、办事、跟朋友碰面，都往邻里中心去。你对照一下地点资料。','找找是哪儿')],
 finish:[a('我去新城邻里中心问问！'),l('去吧。别光认工牌，也问问那里的人。老陈下了班，可不只聊工作。','把线索收好')]
};
export function stepKey(s){if(s.destination)return'finish';if(s.photo)return s.back?'reverse':'photo';if(s.inspected&&s.open>=.94)return'inspected';if(s.placed.length===6)return s.open>=.94?'raised':'paper';if(s.archive)return'archive';return s.badge?'badge':'arrival';}
export function hints(s){const k=stepKey(s);return {
 arrival:['先弄清楚工牌上留下了什么。','点院落里的工牌，读背面的字。','工牌在院落左下方，档案桌的左边。'],
 badge:['去找和工牌有关的档案。','编号是 A-07，和卷宗封面逐个对照。','点“档案桌”，再找中间那卷 A-07。'],
 archive:['图纸接完整，才好翻找夹在里面的合影。','先找写着“檐口”的上边，再接横向窗带和竖向楼梯间。','点“对照完整图”看原样。先选一块，再点它该在的位置；选错不丢图纸。'],
 paper:['照片还在纸景里，要先把它展开。','沿轮缘拖动，或把刻度往“展开”一边拉。','转到完整展开。反方向可以收回，松手就停。'],
 raised:['找那张夹在门廊一页的合影。','换个角度看纸景，别只看正面。','点“走到门廊这边”，或把纸景向右拖一段，再拿露出的合影。'],
 inspected:['把门廊旁露出来的合影拿出来。','点纸景上那张浅色小纸签。','点“拿起这张合影”，翻面后再判断下一站。'],
 photo:['照片背面可能留着去处。','先点“翻到背面”。','背面有桥廊和圆雨棚的简图。'],
 reverse:['把背面的字和画一起看，找生活配套的地方。','打开“对照三处地点的资料”。','新城邻里中心既有商业，也有居民服务，和“下班以后”的线索对得上。'],
 finish:['第一章的线索齐了，下一站是新城邻里中心。','可以回看合影，或者保存这一张线索。','第二章已开放试读，沿着合影去新城邻里中心继续找人。']
}[k];}
export class Dialogue{
 constructor(render){this.render=render;this.lines=[];this.index=0;this.id=null;this.done=null;}
 start(id,done=null){this.id=id;this.lines=SCRIPTS[id]||[];this.index=0;this.done=done;this.show();}
 show(){if(!this.lines.length)return;this.render({...this.lines[this.index],index:this.index,total:this.lines.length,last:this.index===this.lines.length-1});}
 next(){if(this.index<this.lines.length-1){this.index++;this.show();return true;}const done=this.done;this.done=null;done?.();return false;}
 interrupt(who,text,action='知道了'){this.id='hint';this.lines=[{who,text,action}];this.index=0;this.done=null;this.show();}
}
