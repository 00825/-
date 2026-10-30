// Exact-text recordings only. Aqi uses the user's existing recordings, never a clone.
export const VOICES={
 aqi_arrival:{who:'aqi',src:'../xinsu/assets/audio/voices/vo_arrival_01_aqi.wav',text:'您好，我找陈师傅。有人托我把这封邀请交给他。',duration:3.96,source:'用户原录音'},
 aqi_photo:{who:'aqi',src:'../xinsu/assets/audio/voices/vo_reverse_01_aqi.wav',text:'“下班以后，老地方见。”还画着桥和圆雨棚。',duration:5.76,source:'用户原录音'},
 n02_zhou_01:{who:'zhou',src:'./assets/audio/voices/n02_zhou_01.wav',text:'你找老陈？他刚走。拍子还留在这儿呢。',duration:5.84625,source:'Grady 合成配音'},
 n02_zhou_02:{who:'zhou',src:'./assets/audio/voices/n02_zhou_02.wav',text:'先看看拍柄。那是他修的，一眼就认得出来。',duration:5.5509167,source:'Grady 合成配音'},
 n02_zhou_03:{who:'zhou',src:'./assets/audio/voices/n02_zhou_03.wav',text:'以前下了班，买点菜、打会儿球，再一起往家走。老陈就爱热闹。',duration:7.6737917,source:'Grady 合成配音'},
 n02_zhou_04:{who:'zhou',src:'./assets/audio/voices/n02_zhou_04.wav',text:'对。胶带别粘死，下回就好拆。他修东西，总想着下一次。',duration:9.4454583,source:'Grady 合成配音'},
 n02_zhou_05:{who:'zhou',src:'./assets/audio/voices/n02_zhou_05.wav',text:'陪我接几拍？我再把他留下的节目卡给你。着急找人也没关系，卡先带上。',duration:10.09675,source:'Grady 合成配音'},
 n02_zhou_06:{who:'zhou',src:'./assets/audio/voices/n02_zhou_06.wav',text:'老陈说，他去湖边的剧场帮忙修道具。节目卡背面写着地址，你带上吧。',duration:8.7934583,source:'Grady 合成配音'}
};
const line=(id,face=0)=>[VOICES[id].who,VOICES[id].text,id,face];
export const SCRIPTS={arrival:[line('aqi_arrival'),line('n02_zhou_01'),line('n02_zhou_02')],photo:[line('aqi_photo'),line('n02_zhou_03',3)],racket:[line('n02_zhou_04',3),line('n02_zhou_05',2)]};
export const PROGRAMME_VOICE='n02_zhou_06';
