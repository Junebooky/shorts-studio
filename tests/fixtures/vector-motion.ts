import {VectorSchema,type VectorVisual} from '../../src/core/vector-motion';
type Path=VectorVisual['layers'][number]['paths'][number];
const path=(d:string,fill:Path['fill']='none',stroke:Path['stroke']='foreground',width=4):Path=>({d,fill,stroke,width});
export const sentences=['핵분열로 원자로에서 열이 발생합니다.','증기가 터빈을 회전시켜 에너지를 전달합니다.','발전기가 회전 에너지를 전기로 바꿉니다.'];
export const vectorScript=sentences.join(' ');
export const vectorScenes:VectorVisual[]=[
 VectorSchema.parse({type:'vector',subject:'원자로의 열 발생 개념도',layers:[
 {id:'vessel',paths:[path('M 180 365 L 180 135 Q 180 55 300 55 Q 420 55 420 135 L 420 365 Z','muted'),path('M 225 305 L 225 150 Q 225 100 300 100 Q 375 100 375 150 L 375 305 Z','background'),path('M 245 260 L 245 145 M 280 260 L 280 145 M 320 260 L 320 145 M 355 260 L 355 145','none','foreground',8)]},
 {id:'heat',paths:[path('M 267 285 C 237 248 300 235 267 195 M 300 285 C 270 248 333 235 300 195 M 333 285 C 303 248 366 235 333 195','none','accent',5)],motion:{kind:'draw',slot:0}},
 {id:'outlet',paths:[path('M 420 180 L 535 180 Q 570 180 570 220 L 570 270','none','accent',9)]}
 ],labels:[{text:'원자로',x:300,y:409},{text:'열 전달',x:570,y:316}]}),
 VectorSchema.parse({type:'vector',subject:'증기 터빈의 회전 개념도',layers:[
 {id:'housing',paths:[path('M 185 135 L 305 105 L 510 105 L 590 160 L 590 310 L 510 365 L 305 365 L 185 335 Z','muted'),path('M 80 220 L 185 220 M 590 220 L 720 220','none','accent',9),path('M 160 235 L 640 235','none','foreground',10)]},
 {id:'rotor',paths:[path('M 400 235 L 360 157 Q 401 132 420 180 Z','accent'),path('M 400 235 L 478 195 Q 503 236 455 255 Z','accent'),path('M 400 235 L 440 313 Q 399 338 380 290 Z','accent'),path('M 400 235 L 322 275 Q 297 234 345 215 Z','accent')],motion:{kind:'rotate',slot:0,degrees:360,cx:400,cy:235}}
 ],labels:[{text:'증기',x:130,y:180},{text:'터빈',x:400,y:410}]}),
 VectorSchema.parse({type:'vector',subject:'발전기의 전기 에너지 변환 개념도',layers:[
 {id:'case',paths:[path('M 145 150 L 450 150 Q 490 150 490 190 L 490 315 Q 490 350 450 350 L 145 350 Z','muted'),path('M 210 180 L 410 180 L 410 320 L 210 320 Z','background'),path('M 90 250 L 450 250','none','foreground',10),path('M 245 210 C 265 160 285 340 305 290 C 325 240 345 160 365 210','none','accent',8)]},
 {id:'output',paths:[path('M 490 250 L 570 250 L 570 165 L 690 165 M 650 145 L 690 165 L 650 185','none','accent',6)],motion:{kind:'draw',slot:0}}
 ],labels:[{text:'발전기',x:315,y:397},{text:'전기',x:620,y:220}]})
];
