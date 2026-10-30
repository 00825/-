import {FACTORY_BLOCKS} from '../../assembly/factory.js';
export function blueprint(){
 const c=document.createElement('canvas');c.width=1200;c.height=720;const x=c.getContext('2d');
 x.fillStyle='#f3e8cc';x.fillRect(0,0,1200,720);x.strokeStyle='#397b7820';x.lineWidth=1;
 for(let a=0;a<1200;a+=30){x.beginPath();x.moveTo(a,0);x.lineTo(a,720);x.stroke();}for(let a=0;a<720;a+=30){x.beginPath();x.moveTo(0,a);x.lineTo(1200,a);x.stroke();}
 const spec=FACTORY_BLOCKS[0];x.strokeStyle='#213e4a';x.lineWidth=4;x.fillStyle='#f9efd7';x.fillRect(70,145,1060,465);x.strokeRect(70,145,1060,465);
 for(let f=0;f<5;f++){const yy=164+f*88;x.fillStyle=f===1||f===2?'#d49c42aa':'#e9dcc1';x.fillRect(73,yy-2,1054,62);x.strokeStyle='#607a78';x.lineWidth=2;x.beginPath();x.moveTo(70,yy+66);x.lineTo(1130,yy+66);x.stroke();for(let b=0;b<spec.bays;b++){const xx=89+b*86,stair=spec.stairs.includes(b);x.fillStyle=stair?'#397b78':'#729594';x.fillRect(xx,yy,stair?61:44,stair?69:44);x.strokeStyle='#213e4a';x.strokeRect(xx,yy,stair?61:44,stair?69:44);x.beginPath();x.moveTo(xx+(stair?30:22),yy);x.lineTo(xx+(stair?30:22),yy+(stair?69:44));x.moveTo(xx,yy+22);x.lineTo(xx+(stair?61:44),yy+22);x.stroke();}}
 x.fillStyle='#eddfc0';x.strokeStyle='#213e4a';for(const b of spec.stairs){const xx=83+b*86;x.fillRect(xx,105,77,40);x.strokeRect(xx,105,77,40);for(let j=0;j<4;j++)x.strokeRect(xx+10+j*16,115,5,20);}
 x.fillStyle='#397b78';x.fillRect(680,548,65,62);x.fillStyle='#d49c42';x.fillRect(647,537,130,13);x.strokeStyle='#213e4a';x.strokeRect(647,537,130,13);
 x.lineWidth=2;x.beginPath();x.moveTo(50,640);x.lineTo(1150,640);x.moveTo(50,630);x.lineTo(50,650);x.moveTo(1150,630);x.lineTo(1150,650);x.stroke();
 x.fillStyle='#213e4a';x.font='24px serif';x.fillText('新苏工业坊 · 立面示意',72,62);x.font='17px sans-serif';x.fillText('依据已有程序模型绘制 / 非历史施工图',72,690);x.font='20px serif';x.fillText('檐口',1080,90);x.beginPath();x.moveTo(1105,100);x.lineTo(1105,135);x.stroke();return c.toDataURL('image/png');
}
export function gearPath(teeth=20,r=54,depth=7){const p=[];for(let i=0;i<teeth*4;i++){const a=i/(teeth*4)*Math.PI*2,rr=i%4===0||i%4===3?r:r+depth;p.push(`${Math.cos(a)*rr},${Math.sin(a)*rr}`);}return p.join(' ');}
export const bridgeIcon=`<svg viewBox="0 0 240 120" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><path d="M12 104V35h65v69M163 104V35h65v69M77 55h86M77 82h86M95 104V38m50 66V38M85 38Q120 0 155 38Z"/><path d="M23 48h42m-42 17h42m-42 17h42m110-34h42m-42 17h42m-42 17h42M5 110h230"/></g></svg>`;
