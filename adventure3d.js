// LEXORA 3D Adventure — playable third-person prototype
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const style = document.createElement('style');
style.textContent = `
#lx3d-launch{position:fixed;z-index:19;bottom:18px;left:18px;border:1px solid #75e5c0;background:linear-gradient(135deg,#17375a,#101b35);color:#fff;padding:13px 18px;border-radius:16px;font-weight:900;box-shadow:0 10px 32px #07122555;cursor:pointer}
#lx3d-launch span{color:#75e5c0}
#lx3d-game{position:fixed;inset:0;z-index:100;background:#081426;display:none;color:white;font-family:system-ui,sans-serif;overflow:hidden;direction:ltr}
#lx3d-game.open{display:block}
#lx3d-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#lx3d-hud{position:absolute;top:14px;left:14px;right:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;pointer-events:none}
.lx3d-panel{background:#0d1b2edb;border:1px solid #ffffff24;backdrop-filter:blur(10px);border-radius:15px;padding:10px 13px;box-shadow:0 8px 24px #0003}
#lx3d-title{font-size:14px;font-weight:900;letter-spacing:1px;color:#75e5c0}
#lx3d-stats{font-size:12px;color:#d6e3f0;margin-top:4px}
#lx3d-close{pointer-events:auto;border:1px solid #ffffff35;background:#10243c;color:white;border-radius:12px;padding:10px 14px;font-weight:800}
#lx3d-hint{position:absolute;top:88px;left:50%;transform:translateX(-50%);max-width:min(90vw,460px);text-align:center;font-size:13px;color:#eaf5ff;background:#0c1a2bd9;border:1px solid #ffffff24;padding:10px 15px;border-radius:14px;pointer-events:none}
#lx3d-bottom{position:absolute;left:14px;right:14px;bottom:18px;display:flex;justify-content:space-between;align-items:flex-end;pointer-events:none}
#lx3d-joystick{width:116px;height:116px;border:2px solid #ffffff40;background:#0c1b2b88;border-radius:50%;position:relative;pointer-events:auto;touch-action:none}
#lx3d-knob{width:48px;height:48px;position:absolute;left:32px;top:32px;border-radius:50%;background:#75e5c0d9;border:2px solid #eafff8;box-shadow:0 4px 14px #0005}
#lx3d-actions{display:flex;gap:9px;align-items:flex-end;pointer-events:auto}
.lx3d-action{width:66px;height:66px;border-radius:50%;border:2px solid #ffffff66;background:#16395bdf;color:white;font-weight:900;font-size:12px;box-shadow:0 7px 18px #0005;touch-action:manipulation}
.lx3d-action.main{width:78px;height:78px;background:#167c67;border-color:#9cf5d7}
#lx3d-dialog{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,calc(100vw - 28px));background:#10213aF5;border:1px solid #75e5c077;border-radius:22px;padding:22px;display:none;text-align:center;direction:rtl;box-shadow:0 25px 80px #0009}
#lx3d-dialog.show{display:block}
#lx3d-dialog h2{margin:0 0 9px;color:#8af0cc;font-size:21px}
#lx3d-dialog p{color:#d4e0ef;line-height:1.8;font-size:14px}
#lx3d-choices{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:15px}
.lx3d-choice{background:#1a3454;border:1px solid #ffffff2b;color:white;border-radius:12px;padding:12px;font-weight:700;direction:ltr}
.lx3d-choice:active{background:#216b5b}
#lx3d-result{min-height:22px;color:#8af0cc;font-weight:800;font-size:13px}
#lx3d-help{position:absolute;right:14px;bottom:20px;color:#e0e9f4;background:#0d1b2ebd;padding:9px 12px;border-radius:12px;font-size:11px;direction:rtl;pointer-events:none}
@media(max-width:600px){#lx3d-hint{top:82px;font-size:11px}#lx3d-joystick{width:100px;height:100px}#lx3d-knob{left:27px;top:27px}.lx3d-action{width:58px;height:58px}.lx3d-action.main{width:70px;height:70px}#lx3d-help{display:none}}
`;
document.head.appendChild(style);
const launch=document.createElement('button'); launch.id='lx3d-launch'; launch.innerHTML='🎮 <span>ادخل عالم LEXORA</span> ثلاثي الأبعاد'; document.body.appendChild(launch);
const root=document.createElement('div');root.id='lx3d-game';root.innerHTML=`
<canvas id="lx3d-canvas"></canvas>
<div id="lx3d-hud"><div class="lx3d-panel"><div id="lx3d-title">LEXORA · THE FIRST REALM</div><div id="lx3d-stats">💎 0 / 5 بلورات　|　⭐ 0 XP</div></div><button id="lx3d-close">✕ خروج</button></div>
<div id="lx3d-hint">استكشف الغابة واجمع البلورات، ثم تحدث مع الحارس.</div>
<div id="lx3d-bottom"><div id="lx3d-joystick"><div id="lx3d-knob"></div></div><div id="lx3d-actions"><button class="lx3d-action" id="lx3d-jump">قفز</button><button class="lx3d-action main" id="lx3d-interact">تفاعل</button></div></div>
<div id="lx3d-help">WASD / الأسهم للحركة · Space للقفز · E للتفاعل · حرّك عصا التحكم على الهاتف</div>
<div id="lx3d-dialog"><h2 id="lx3d-dialog-title">مهمة جديدة</h2><p id="lx3d-dialog-text"></p><div id="lx3d-choices"></div><div id="lx3d-result"></div><button id="lx3d-dialog-close" class="lx3d-choice" style="width:100%;margin-top:12px">متابعة المغامرة</button></div>
`;document.body.appendChild(root);
const $=id=>document.getElementById(id);
let renderer,scene,camera,player,clock,active=false,raf=0,disposed=false;
let move={x:0,z:0},keys={},yaw=0,velocityY=0,onGround=true,crystals=[],collected=0,xp=0,dialogOpen=false,questDone=false,quizIndex=0,quizWins=0;
const colliders=[];
const mat=(color,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness});
const green=mat('#347a54'),darkGreen=mat('#24563f'),bark=mat('#72513a'),stone=mat('#8395a4'),gold=mat('#f5c86a'),blue=mat('#4cd8c4'),cloth=mat('#245b91'),skin=mat('#d99d72');
function box(w,h,d,m,x,y,z,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;scene.add(o);return o;}
function sphere(r,m,x,y,z){const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o;}
function tree(x,z,s=1){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22*s,.34*s,2.2*s,7),bark);trunk.position.set(x,1.1*s,z);trunk.castShadow=true;scene.add(trunk);for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry((1.1-i*.12)*s,1),i%2?green:darkGreen);crown.position.set(x,(2.35+i*.58)*s,z);crown.castShadow=true;scene.add(crown);} }
function makeCharacter(){
 const g=new THREE.Group();
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.72,5,10),cloth);torso.position.y=1.35;torso.castShadow=true;g.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.31,18,14),skin);head.position.y=2.12;head.castShadow=true;g.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.32,16,10,0,Math.PI*2,0,Math.PI*.55),mat('#342b2a'));hair.position.y=2.22;g.add(hair);
 const legMat=mat('#24364c');for(const x of [-.2,.2]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.55,4,8),legMat);leg.position.set(x,.48,0);leg.castShadow=true;g.add(leg);}
 const armMat=mat('#d99d72');for(const x of [-.5,.5]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.5,4,8),armMat);arm.position.set(x,1.4,0);arm.rotation.z=x*.5;g.add(arm);}
 const pack=new THREE.Mesh(new THREE.BoxGeometry(.48,.52,.22),gold);pack.position.set(0,1.35,.36);g.add(pack);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.045,8,24),blue);ring.rotation.x=Math.PI/2;ring.position.y=.08;g.add(ring);
 scene.add(g);return g;
}
function buildWorld(){
 scene=new THREE.Scene();scene.background=new THREE.Color('#9bd7e5');scene.fog=new THREE.Fog('#b5d9d3',28,95);
 camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,160);
 renderer=new THREE.WebGLRenderer({canvas:$('lx3d-canvas'),antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 scene.add(new THREE.HemisphereLight('#e4f7ff','#456348',2));
 const sun=new THREE.DirectionalLight('#fff0cf',2.4);sun.position.set(-18,30,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;scene.add(sun);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),mat('#6caa72'));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 // winding stone path
 for(let i=0;i<25;i++){let z=12-i*1.65,x=Math.sin(i*.27)*2.5;const p=new THREE.Mesh(new THREE.CylinderGeometry(.8,.9,.12,7),mat(i%2?'#b8b49b':'#c8c2a9'));p.position.set(x,.08,z);p.rotation.y=i*.4;p.receiveShadow=true;scene.add(p);}
 // rolling hills
 for(let i=0;i<22;i++){let x=(Math.random()-.5)*75,z=(Math.random()-.5)*75;if(Math.abs(x)<7&&z<10&&z>-22)continue;const h=2+Math.random()*5;const hill=new THREE.Mesh(new THREE.SphereGeometry(4+Math.random()*5,12,8),i%2?green:darkGreen);hill.scale.y=.55;hill.position.set(x,-1.5-h*.1,z);scene.add(hill);}
 for(let i=0;i<100;i++){let x=(Math.random()-.5)*75,z=(Math.random()-.5)*75;if(Math.abs(x)<6&&z<12&&z>-24)continue;tree(x,z,.65+Math.random()*.8);}
 // ancient gate ahead
 for(const x of [-4.5,4.5]){box(1.1,7,1.2,stone,x,3.5,-28);const cap=new THREE.Mesh(new THREE.ConeGeometry(1,1.4,4),gold);cap.position.set(x,7.7,-28);scene.add(cap);}
 box(10,.8,1.4,stone,0,7,-28);const gate=new THREE.Mesh(new THREE.TorusGeometry(2.5,.22,12,32,Math.PI),gold);gate.position.set(0,3,-28);gate.rotation.z=Math.PI;scene.add(gate);
 // crystals
 for(let i=0;i<5;i++){const x=[-8,8,-11,11,0][i],z=[2,-5,-15,-20,-24][i];const c=new THREE.Mesh(new THREE.OctahedronGeometry(.65),new THREE.MeshStandardMaterial({color:'#5fffe0',emissive:'#13a98d',emissiveIntensity:1.5,metalness:.2,roughness:.2}));c.position.set(x,1.2,z);c.castShadow=true;scene.add(c);const halo=new THREE.Mesh(new THREE.TorusGeometry(.85,.035,8,24),gold);halo.rotation.x=Math.PI/2;halo.position.set(x,.15,z);scene.add(halo);crystals.push({mesh:c,baseY:1.2,phase:i*1.2,taken:false});}
 // guardian
 const npc=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,.7,5,10),mat('#8a6540'));body.position.y=1.25;npc.add(body);const nhead=new THREE.Mesh(new THREE.SphereGeometry(.34,16,12),mat('#e0b58b'));nhead.position.y=2.08;npc.add(nhead);const hood=new THREE.Mesh(new THREE.ConeGeometry(.48,.8,8),mat('#d7a94d'));hood.position.y=2.65;npc.add(hood);const staff=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,2.2,8),bark);staff.position.set(.62,1.1,0);npc.add(staff);const orb=new THREE.Mesh(new THREE.SphereGeometry(.19,12,10),blue);orb.position.set(.62,2.25,0);npc.add(orb);npc.position.set(0,0,-11);scene.add(npc);npc.userData.kind='guardian';scene.userData.guardian=npc;
 // glowing quest beacon
 const beacon=new THREE.PointLight('#65f3d0',3,10);beacon.position.set(0,3,-11);scene.add(beacon);
 player=makeCharacter();player.position.set(0,0,9);
 clock=new THREE.Clock();
}
function showDialog(title,text,choices=[]){dialogOpen=true;$('lx3d-dialog-title').textContent=title;$('lx3d-dialog-text').textContent=text;$('lx3d-result').textContent='';$('lx3d-choices').innerHTML='';choices.forEach((c,i)=>{const b=document.createElement('button');b.className='lx3d-choice';b.textContent=c.label;b.onclick=()=>c.action();$('lx3d-choices').appendChild(b);});$('lx3d-dialog').classList.add('show');}
function closeDialog(){dialogOpen=false;$('lx3d-dialog').classList.remove('show');}
const questions=[
 {q:'What is the meaning of “Brave”?',a:['شجاع','حزين','سريع','صغير'],correct:0},
 {q:'Choose the correct sentence:',a:['She are happy','She is happy','She am happy','She be happy'],correct:1},
 {q:'“Where are you from?” means:',a:['كم عمرك؟','أين تسكن؟','من أين أنت؟','ماذا تريد؟'],correct:2}
];
function startGuardian(){if(collected<5){showDialog('حارس الغابة','أهلاً أيها المستكشف! اجمع البلورات الخمس المنتشرة في الغابة أولاً، ثم أستطيع فتح بوابة القلعة لك.');return;}if(questDone){showDialog('بوابة القلعة','أحسنت! لقد فتحت البوابة وأكملت أول مهمة في رحلتك.');return;}quizIndex=0;quizWins=0;askQuiz();}
function askQuiz(){const q=questions[quizIndex];showDialog('اختبار الحارس · '+(quizIndex+1)+'/3',q.q,q.a.map((label,i)=>({label,action:()=>{if(i===q.correct){quizWins++;$('lx3d-result').textContent='✓ إجابة صحيحة!';}else{$('lx3d-result').textContent='ليست صحيحة، ركّز في السؤال التالي.';}setTimeout(()=>{if(quizIndex<2){quizIndex++;askQuiz();}else if(quizWins>=2){questDone=true;xp+=150;localStorage.setItem('lexora_xp',String((Number(localStorage.getItem('lexora_xp'))||0)+150));$('lx3d-stats').textContent='💎 5 / 5 بلورات　|　⭐ '+xp+' XP';showDialog('🏆 انتصار!','فتحت بوابة القلعة! ربحت 150 XP وأثبتّ مهارتك في الإنجليزية.',[{label:'العودة للعالم',action:closeDialog}]);}else{showDialog('حاول مرة أخرى','تحتاج إلى إجابتين صحيحتين على الأقل. لا تستسلم!',[{label:'إعادة الاختبار',action:()=>{quizIndex=0;quizWins=0;askQuiz();}}]);}},550);}})));}
function interact(){if(dialogOpen)return;const p=player.position,g=scene.userData.guardian;const d=p.distanceTo(g.position);if(d<4.2){startGuardian();return;}let nearest=null,dist=3;for(const c of crystals){if(c.taken)continue;const v=p.distanceTo(c.mesh.position);if(v<dist){dist=v;nearest=c;}}if(nearest){nearest.taken=true;nearest.mesh.visible=false;collected++;xp+=20;$('lx3d-stats').textContent='💎 '+collected+' / 5 بلورات　|　⭐ '+xp+' XP';$('lx3d-hint').textContent=collected===5?'جمعت كل البلورات! اذهب إلى الحارس عند الشعاع الأخضر.':'جميل! وجدت بلورة سحرية. ابحث عن البقية.';return;}$('lx3d-hint').textContent='اقترب من البلورة أو الحارس ثم اضغط تفاعل.';}
function jump(){if(onGround&&!dialogOpen){velocityY=7.5;onGround=false;}}
function animate(){if(!active)return;raf=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
 for(const c of crystals)if(!c.taken){c.mesh.position.y=c.baseY+Math.sin(t*2+c.phase)*.22;c.mesh.rotation.y+=dt*1.4;c.mesh.rotation.x+=dt*.4;}
 const guardian=scene.userData.guardian;guardian.rotation.y=Math.sin(t*.6)*.15;
 let ix=move.x,iz=move.z;
 if(keys.KeyW||keys.ArrowUp)iz-=1;if(keys.KeyS||keys.ArrowDown)iz+=1;if(keys.KeyA||keys.ArrowLeft)ix-=1;if(keys.KeyD||keys.ArrowRight)ix+=1;
 const len=Math.hypot(ix,iz);if(len>1){ix/=len;iz/=len;}
 if(!dialogOpen&&len>.05){const speed=7.2;const dx=ix*speed*dt,dz=iz*speed*dt;const nx=THREE.MathUtils.clamp(player.position.x+dx,-18,18),nz=THREE.MathUtils.clamp(player.position.z+dz,-34,18);player.position.x=nx;player.position.z=nz;yaw=Math.atan2(ix,-iz);player.rotation.y=yaw;player.userData.walk=(player.userData.walk||0)+dt*10;player.position.y=Math.abs(Math.sin(player.userData.walk))*.055;}
 velocityY-=18*dt;player.position.y+=velocityY*dt;if(player.position.y<=0){player.position.y=0;velocityY=0;onGround=true;}
 const behind=new THREE.Vector3(Math.sin(yaw)*8,5.2,Math.cos(yaw)*8);const target=player.position.clone().add(new THREE.Vector3(0,1.4,0));const desired=target.clone().add(behind);camera.position.lerp(desired,.11);camera.lookAt(target);
 renderer.render(scene,camera);
}
function openGame(){if(active)return;active=true;root.classList.add('open');$('lx3d-hint').textContent='استكشف الغابة واجمع البلورات الخمس، ثم تحدث مع الحارس.';if(!renderer){try{buildWorld();}catch(e){$('lx3d-hint').textContent='تعذر تشغيل الرسوم ثلاثية الأبعاد. جرّب متصفحاً يدعم WebGL.';console.error(e);active=false;return;}}clock.start();animate();}
function closeGame(){active=false;root.classList.remove('open');cancelAnimationFrame(raf);closeDialog();}
launch.addEventListener('click',openGame);$('lx3d-close').addEventListener('click',closeGame);$('lx3d-interact').addEventListener('click',interact);$('lx3d-jump').addEventListener('click',jump);$('lx3d-dialog-close').addEventListener('click',closeDialog);
window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space'){e.preventDefault();jump();}if(e.code==='KeyE'||e.code==='Enter')interact();});window.addEventListener('keyup',e=>keys[e.code]=false);
const joy=$('lx3d-joystick'),knob=$('lx3d-knob');let joyId=null;
function joyMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.34,l=Math.hypot(dx,dy);if(l>max){dx=dx/l*max;dy=dy/l*max;}move.x=dx/max;move.z=dy/max;knob.style.transform='translate('+dx+'px,'+dy+'px)';}
joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);joyMove(e);});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e);});function joyEnd(e){if(e.pointerId!==joyId)return;joyId=null;move={x:0,z:0};knob.style.transform='translate(0,0)';}joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
window.addEventListener('resize',()=>{if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));});
