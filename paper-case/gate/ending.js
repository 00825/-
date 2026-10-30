export const FILM_DURATION=31;
export const SHOTS=[
 {at:0,label:'这封信，终于到了。',who:'阿奇',line:'“我去了四个地方，怎么都说你刚走？”',voice:'c05_aqi_02'},
 {at:6,label:'总有一点小事，等着他。',who:'陈师傅',line:'“今天答应的事有点多。这回，走吧。”',voice:'c05_chen_05'},
 {at:15,label:'从一处厂房，走到一座城的生活里。',who:'沿途的手记',line:'工牌、球拍、排练签、观察片……每一站，都有人记得他。'},
 {at:23,label:'下一程，一起走。',who:'阿奇',line:'“这回先别走，大家等你一起出发。”',voice:'c05_aqi_03'}
];
// Give the complete 7.84 s take a 9 s shot; preserve the established visual poses.
export function visualTime(t){if(t<=6)return Math.max(0,t);if(t<=15)return 6+(t-6)*2/3;return Math.min(28,12+(t-15));}
export const shotAt=t=>Math.max(0,SHOTS.findLastIndex(s=>t>=s.at));
// A visible-time clock, deliberately independent of wall-clock time while paused/hidden.
export class FilmClock{
 constructor(duration=FILM_DURATION){this.duration=duration;this.time=0;this.running=false;this.last=null;}
 play(now){this.running=true;this.last=now;}
 pause(){this.running=false;this.last=null;}
 seek(t){this.time=Math.max(0,Math.min(this.duration,Number(t)||0));this.last=null;return this.time;}
 tick(now){if(!this.running)return this.time;if(this.last!==null)this.time=Math.min(this.duration,this.time+Math.min(.1,Math.max(0,(now-this.last)/1000)));this.last=now;if(this.time>=this.duration)this.pause();return this.time;}
}
