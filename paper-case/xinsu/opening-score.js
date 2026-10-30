// One clock for the colour film, captions, voices and code-driven fallback.
export const SHOTS=[
 {at:0,label:'一封邀请',title:'未送出的\n邀请',note:'信封里，夹着一枚旧工牌。',who:'aqi',speaker:'信上的留言',line:'“请把这封邀请，交给陈师傅。他以前在新苏工作。”'},
 {at:6000,label:'一个旧地址',title:'名字还在，\n人呢？',note:'圆眼镜、陈师傅，还有 A—07。',who:'aqi',speaker:'阿奇',line:'“联系方式变了……那就先去工牌上写的地方。”'},
 {at:10500,label:'走进老厂区',title:'走进\n老厂区。',note:'新苏工业坊 / 寻人的第一站',who:'aqi',speaker:'阿奇',line:'“有人在这里吗？我想找一个人。”'},
 {at:15700,label:'有人应了声',title:'有人，\n记得他。',note:'故事，从这一声招呼开始。',who:'lin',speaker:'林姨',line:'“小家伙，找谁呀？”'}
];
export const OPENING_DURATION=22000,MOVIE_AT=0,GREET_AT=15700,ENTER_AT=18400;
const clamp=n=>Math.max(0,Math.min(1,n));
const phase=(t,a,b)=>{const p=clamp((t-a)/(b-a));return p*p*(3-2*p);};
export function shotAt(time){let n=0;for(let i=0;i<SHOTS.length;i++)if(time>=SHOTS[i].at)n=i;return n;}
export function openingFrame(time){
 const index=shotAt(time),start=SHOTS[index].at,end=SHOTS[index+1]?.at??OPENING_DURATION;
 return{index,progress:clamp(time/OPENING_DURATION),shotProgress:clamp((time-start)/(end-start)),
  flap:phase(time,500,1650),note:phase(time,1400,3400),badge:phase(time,4700,6800),badgeAlpha:phase(time,4900,6500)*(1-phase(time,9400,10300)),
  route:phase(time,7000,10000),reveal:phase(time,9900,11200),film:1,
  walk:phase(time,SHOTS[2].at,SHOTS[3].at),reader:1-phase(time,9500,9900),readerLift:Math.sin(time/650)*2,
  cover:1-phase(time,400,950),greet:phase(time,15500,16700),callout:phase(time,15900,16500)};
}
