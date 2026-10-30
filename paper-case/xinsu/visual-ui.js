const icons={
 sound:'<path d="M3 10h4l5-4v16l-5-4H3z"/><path d="M17 9c3 3 3 7 0 10m3-14c5 5 5 13 0 18"/>',
 notebook:'<path d="M6 4h16v23H6zM3 8h6m-6 5h6m-6 5h6m-6 5h6m4-13h5m-5 5h5"/>',
 about:'<circle cx="15" cy="15" r="11"/><path d="M15 13v8m0-14v1"/>'
};
export function bindVisualUI({onFlip=()=>{}}={}){
 const $=id=>document.getElementById(id);
 for(const[id,paths]of Object.entries(icons)){const button=$(id),span=button.querySelector('span:last-of-type');for(const node of [...button.childNodes])if(node!==span)node.remove();button.insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 30 30" aria-hidden="true">${paths}</svg>`);}
 $('notebook').setAttribute('aria-label','打开调查簿');
 for(const file of document.querySelectorAll('.archive-file')){
  for(const name of ['archive-sheet','archive-flap']){const el=document.createElement('i');el.className=name;el.setAttribute('aria-hidden','true');file.prepend(el);}
 }
 function setBadge(back){$('badge-object').classList.toggle('turned',back);$('badge-flip').setAttribute('aria-pressed',String(back));$('badge-flip').textContent=back?'翻回正面，认认陈师傅 ↻':'翻到背面，看看留言 ↻';const sides=$('badge-object').children;sides[0].setAttribute('aria-hidden',String(back));sides[1].setAttribute('aria-hidden',String(!back));}
 $('badge-flip').onclick=()=>{setBadge($('badge-flip').getAttribute('aria-pressed')!=='true');onFlip();};
 setBadge(false);
 return{resetBadge(){setBadge(false);}};
}
