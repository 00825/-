export const GOAL=6;
export const fresh=()=>({version:2,started:false,photo:false,build:0,architecture:false,racket:false,hits:0,skipped:false,card:false,back:false,destination:false});
export function restore(raw){const s=fresh();if(![1,2].includes(raw?.version))return s;s.started=!!raw.started;s.photo=s.started&&!!raw.photo;const migrated=raw.version===1&&s.photo&&!!raw.racket;s.architecture=s.photo&&(migrated||!!raw.architecture);s.build=s.architecture?1:s.photo?Math.max(0,Math.min(1,Number(raw.build)||0)):0;s.racket=s.architecture&&!!raw.racket;s.hits=s.racket?Math.max(0,Math.min(999,Math.floor(Number(raw.hits)||0))):0;s.skipped=s.racket&&!!raw.skipped;s.card=s.racket&&(s.hits>=GOAL||s.skipped)&&!!raw.card;s.back=s.card&&!!raw.back;s.destination=s.back&&!!raw.destination;return s;}
export function inspectArchitecture(s){if(!s.photo||s.build<.94)return false;s.architecture=true;return true;}
export function inspectRacket(s){if(!s.photo||!s.architecture)return false;s.racket=true;return true;}
export function addHit(s){if(!s.racket)return false;s.hits++;return s.hits>=GOAL;}
export function collect(s,{skip=false}={}){if(!s.racket)return false;if(skip)s.skipped=true;if(s.hits<GOAL&&!s.skipped)return false;s.card=true;return true;}
export function finish(s){if(!s.card||!s.back)return false;s.destination=true;return true;}
export function goal(s){return s.destination?'下一站：苏州文化艺术中心。':s.card?'翻开节目卡，看看陈师傅留下的去处。':s.racket?'陪球友接几拍，也可以先收好节目卡。':s.architecture?'看看球拍柄上的旧胶带。':s.photo?'展开建筑模型，走近桥廊核对合影。':'对照合影，认一认桥廊与圆雨棚。';}
