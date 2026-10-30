import {CHART} from './score.js';
export const fresh=()=>({version:2,started:false,build:0,seen:[],played:false,listen:false,best:0,card:false});
export function restore(raw){const s=fresh();if(![1,2].includes(raw?.version))return s;s.started=!!raw.started;s.build=s.started?Math.max(0,Math.min(1,Number(raw.build)||0)):0;s.seen=s.started?[...new Set((Array.isArray(raw.seen)?raw.seen:[]).filter(x=>['wall','pearl','garden'].includes(x)))]:[];s.played=s.seen.length===3&&!!raw.played;s.listen=s.played&&!!raw.listen;s.best=s.played&&raw.version===2?Math.max(0,Math.min(CHART.length,Math.floor(Number(raw.best)||0))):0;s.card=s.played&&!!raw.card;return s;}
export function inspect(s,part){if(s.build<.94||!['wall','pearl','garden'].includes(part))return false;if(!s.seen.includes(part))s.seen.push(part);return true;}
export const ready=s=>s.seen.length===3;
export function complete(s,{hits,listen}){if(!ready(s))return false;s.played=true;s.listen=!!listen;s.best=Math.max(s.best,Math.min(CHART.length,Math.max(0,Math.floor(Number(hits)||0))));return true;}
export function collect(s){if(!s.played)return false;s.card=true;return true;}
