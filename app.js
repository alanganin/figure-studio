import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';

const $=id=>document.getElementById(id), mount=$('viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#1d2633');scene.fog=new THREE.Fog('#1d2633',18,42);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;mount.appendChild(renderer.domElement);
let camera=new THREE.PerspectiveCamera(45,1,.05,100);camera.position.set(4,3.0,5.8);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.1,0);orbit.enableDamping=true;orbit.minDistance=.7;orbit.maxDistance=35;
const ambient=new THREE.HemisphereLight(0xe6f2ff,0x425267,1.05);scene.add(ambient);
const key=new THREE.DirectionalLight(0xfff0dc,2.4);key.position.set(3,8,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;key.shadow.bias=-.0003;scene.add(key);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#293645',roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(30,30,0x5b718b,0x415166);grid.material.transparent=true;grid.material.opacity=.42;grid.position.y=.012;scene.add(grid);
const transform=new TransformControls(camera,renderer.domElement);transform.setSize(.72);scene.add(transform.getHelper());transform.addEventListener('dragging-changed',e=>{orbit.enabled=!e.value;if(!e.value)refreshInspector();});transform.addEventListener('objectChange',()=>{if(currentJoint)clampJoint(current.joints[currentJoint],currentJoint);refreshInspector(false);});
const material=(hex)=>new THREE.MeshStandardMaterial({color:hex,roughness:.75,metalness:0});
const skin=material('#bfb1a1'),jointMat=new THREE.MeshBasicMaterial({color:0x62b5ff,depthTest:false,transparent:true,opacity:.93});
const segmentGeo=(radiusTop,radiusBottom,length)=>new THREE.CylinderGeometry(radiusTop,radiusBottom,length,12,1);
let objects=[],current=null,currentJoint=null,uid=1,notificationTimer=null;
const jointNames=['pelvis','spine','chest','neck','head','leftShoulder','leftElbow','leftWrist','rightShoulder','rightElbow','rightWrist','leftHip','leftKnee','leftAnkle','rightHip','rightKnee','rightAnkle'];
const limits={leftElbow:[[-155,0],[-10,10],[-12,12]],rightElbow:[[-155,0],[-10,10],[-12,12]],leftKnee:[[0,150],[-8,8],[-8,8]],rightKnee:[[0,150],[-8,8],[-8,8]],leftShoulder:[[-165,95],[-80,80],[-120,120]],rightShoulder:[[-165,95],[-80,80],[-120,120]],leftHip:[[-110,95],[-50,50],[-65,65]],rightHip:[[-110,95],[-50,50],[-65,65]],spine:[[-35,35],[-40,40],[-30,30]],chest:[[-30,30],[-45,45],[-35,35]],neck:[[-45,45],[-70,70],[-35,35]],head:[[-30,30],[-40,40],[-30,30]]};
function mesh(parent,geo,mat,pos=[0,0,0],clickData=null){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;if(clickData)m.userData.pick=clickData;parent.add(m);return m;}
function ball(parent,r,pos,mat=skin,data=null){return mesh(parent,new THREE.SphereGeometry(r,14,10),mat,pos,data);}
function capsule(parent,a,b,r1,r2,mat,data){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),vec=end.clone().sub(start);const obj=mesh(parent,segmentGeo(r1,r2,vec.length()),mat,start.clone().add(end).multiplyScalar(.5).toArray(),data);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());return obj;}
function figure(title,x=0,z=0){if(objects.length>=100)throw Error('Scene limit: 100 objects');const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);const item={id:uid++,type:'figure',name:title,root,joints:{},handles:[],skin:[],clothes:[],top:'none',bottom:'none',color:'#4e92bb',outer:'none',fit:.08,sleeve:1,build:1,outerColor:'#384953'};
 function joint(name,parent,pos){const g=new THREE.Group();g.position.set(...pos);g.userData.jointName=name;parent.add(g);item.joints[name]=g;const h=ball(g,.055,[0,0,0],jointMat,{id:item.id,joint:name});h.renderOrder=2;item.handles.push(h);return g;}
 const hip=joint('pelvis',root,[0,1.0,0]);
 const torso=joint('spine',hip,[0,.12,0]);
 const torsoShape=mesh(torso,new THREE.CylinderGeometry(.235,.175,.52,16),skin,[0,.265,0],{id:item.id,joint:'spine'});torsoShape.scale.z=.75;item.skin.push(torsoShape);
 const chest=joint('chest',torso,[0,.45,0]);const chestShape=mesh(chest,new THREE.SphereGeometry(1,16,12),skin,[0,.075,0],{id:item.id,joint:'chest'});chestShape.scale.set(.27,.185,.155);item.skin.push(chestShape);
 const neck=joint('neck',chest,[0,.21,0]);const n=capsule(neck,[0,0,0],[0,.14,0],.07,.07,skin,{id:item.id,joint:'neck'});item.skin.push(n);
 const head=joint('head',neck,[0,.19,0]);const hd=mesh(head,new THREE.SphereGeometry(1,20,14),skin,[0,.12,0],{id:item.id,joint:'head'});hd.scale.set(.13,.19,.13);item.skin.push(hd);
 const nose=mesh(head,new THREE.ConeGeometry(.032,.075,7),skin,[0,.105,.145],{id:item.id,joint:'head'});nose.rotation.x=Math.PI/2;item.skin.push(nose);
 for(const side of ['left','right']){const s=side==='left'?-1:1;const shoulder=joint(`${side}Shoulder`,chest,[s*.235,.075,0]);const upper=capsule(shoulder,[0,0,0],[s*.095,-.31,0],.098,.075,skin,{id:item.id,joint:`${side}Shoulder`});item.skin.push(upper);const elbow=joint(`${side}Elbow`,shoulder,[s*.095,-.31,0]);const fore=capsule(elbow,[0,0,0],[s*.012,-.28,0],.073,.050,skin,{id:item.id,joint:`${side}Elbow`});item.skin.push(fore);const wrist=joint(`${side}Wrist`,elbow,[s*.012,-.28,0]);const hand=mesh(wrist,new THREE.SphereGeometry(1,12,10),skin,[0,-.09,0],{id:item.id,joint:`${side}Wrist`});hand.scale.set(.065,.115,.04);item.skin.push(hand);
 const h=joint(`${side}Hip`,hip,[s*.13,-.075,0]);const thigh=capsule(h,[0,0,0],[0,-.44,0],.145,.105,skin,{id:item.id,joint:`${side}Hip`});item.skin.push(thigh);const knee=joint(`${side}Knee`,h,[0,-.44,0]);const shin=capsule(knee,[0,0,0],[0,-.42,0],.103,.065,skin,{id:item.id,joint:`${side}Knee`});item.skin.push(shin);const ankle=joint(`${side}Ankle`,knee,[0,-.42,0]);const foot=mesh(ankle,new THREE.BoxGeometry(.14,.10,.28),skin,[0,-.025,.09],{id:item.id,joint:`${side}Ankle`});item.skin.push(foot);
 }
 const pelvicMesh=mesh(hip,new THREE.SphereGeometry(1,16,12),skin,[0,-.005,0],{id:item.id,joint:'pelvis'});pelvicMesh.scale.set(.2,.16,.145);item.skin.push(pelvicMesh);
 enhanceFigure(item);objects.push(item);updateWardrobe(item);select(item);return item;}
function baseWardrobe(item){if(item.type!=='figure')return;for(const obj of item.clothes){obj.parent.remove(obj);obj.geometry.dispose();obj.material.dispose();}item.clothes=[];const fabric=material(item.color);const add=(parent,geo,pos,scale)=>{const m=mesh(parent,geo,fabric.clone(),pos,{id:item.id,joint:parent.userData.jointName});if(scale)m.scale.set(...scale);item.clothes.push(m);m.scale.x*=1+item.fit;m.scale.z*=1+item.fit;};
 if(item.top!=='none') {add(item.joints.spine,new THREE.CylinderGeometry(.265,.215,.47,16),[0,.24,0],[1,1,.83]);if(item.top!=='tank') for(const s of ['left','right']){const sign=s==='left'?-1:1;add(item.joints[`${s}Shoulder`],new THREE.CylinderGeometry(.115,.11,item.top==='long'?.30:.16,12),[sign*(item.top==='long'?.05:.024),item.top==='long'?-.15:-.08,0]);if(item.top==='long')add(item.joints[`${s}Elbow`],new THREE.CylinderGeometry(.098,.07,.275,12),[0,-.135,0]);}}
 if(item.bottom!=='none'){add(item.joints.pelvis,new THREE.CylinderGeometry(.23,.235,.2,16),[0,-.075,0],[1,1,.76]);for(const s of ['left','right']){const len=item.bottom==='pants'?.44:.19;add(item.joints[`${s}Hip`],new THREE.CylinderGeometry(.16,.13,len,12),[0,-len/2,0]);if(item.bottom==='pants')add(item.joints[`${s}Knee`],new THREE.CylinderGeometry(.115,.09,.415,12),[0,-.205,0]);}}
}
function prop(type,name,x=0,z=0){if(objects.length>=100)throw Error('Scene limit: 100 objects');const root=new THREE.Group();root.position.set(x,type==='box'?.38:type==='sphere'?.45:0,z);scene.add(root);const mat=material(type==='box'?'#a8886b':type==='sphere'?'#b9a0dc':'#6f8196');const geom=type==='box'?new THREE.BoxGeometry(.8,.75,.8):type==='sphere'?new THREE.SphereGeometry(.42,22,16):new THREE.BoxGeometry(2.1,.12,2.1);const item={id:uid++,type,name,root};mesh(root,geom,mat,[0,0,0],{id:item.id});if(type==='stool'){root.position.y=0;root.clear();mesh(root,new THREE.CylinderGeometry(.35,.35,.1,32),mat,[0,.6,0],{id:item.id});for(const x of [-.23,.23])for(const z of [-.23,.23])mesh(root,new THREE.CylinderGeometry(.035,.035,.6,10),mat,[x,.3,z],{id:item.id});}objects.push(item);select(item);return item;}
function select(item,jointName=null){current=item;currentJoint=item?.type==='figure'&&jointName?jointName:null;transform.detach();if(item){if(currentJoint){transform.attach(item.joints[currentJoint]);transform.setMode('rotate');transform.showX=true;transform.showY=true;transform.showZ=true;}else{transform.attach(item.root);transform.setMode('translate');}}drawObjects();refreshInspector();}
function toast(t){$('notification').textContent=t;$('notification').classList.add('show');clearTimeout(notificationTimer);notificationTimer=setTimeout(()=>$('notification').classList.remove('show'),2600);}
function drawObjects(){$('objects').innerHTML='';objects.forEach(o=>{const row=document.createElement('div');row.className='scene-item'+(o===current?' active':'');const icon=document.createElement('span');icon.className='symbol';icon.textContent=o.type==='figure'?'♟':o.type==='sphere'?'●':'▣';const main=document.createElement('span');main.className='itemmain';main.textContent=o.name;main.title=o.name;main.onclick=()=>select(o);const eye=document.createElement('button');eye.textContent=o.root.visible?'◉':'◌';eye.title='Toggle visibility';eye.onclick=()=>{o.root.visible=!o.root.visible;eye.textContent=o.root.visible?'◉':'◌';};row.append(icon,main,eye);$('objects').append(row);});$('figureCount').textContent=objects.filter(o=>o.type==='figure').length;$('objectCount').textContent=objects.length;}
function refreshInspector(updateSliders=true){$('inspector').hidden=!current;$('inspectorEmpty').hidden=!!current;$('selectionName').textContent=current?current.name+(currentJoint?' · '+currentJoint:''):'No selection';if(!current)return;$('selectedTitle').textContent=current.name;$('selectedType').textContent=current.type;$('objectName').value=current.name;$('wardrobe').hidden=current.type!=='figure';$('figureTools').hidden=current.type!=='figure';if(current.type==='figure'){$('jointSelect').value=currentJoint||'';for(const [id,key] of [['outerCloth','outer'],['outerColor','outerColor']])$(id).value=current[key];$('fit').value=current.fit*100;$('sleeve').value=current.sleeve*100;$('build').value=current.build*100;}$('jointControls').hidden=!currentJoint;$('propControls').hidden=!!currentJoint;
 if(currentJoint){$('jointTitle').textContent=currentJoint.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());const j=current.joints[currentJoint],l=limits[currentJoint]||[[-80,80],[-80,80],[-80,80]];['X','Y','Z'].forEach((axis,i)=>{const inp=$('joint'+axis);inp.min=l[i][0];inp.max=l[i][1];const value=Math.round(THREE.MathUtils.radToDeg(j.rotation[axis.toLowerCase()]));if(updateSliders)inp.value=value;$('joint'+axis+'Text').textContent=value+'°';});}else{['X','Y','Z'].forEach(a=>{$('pos'+a).value=current.root.position[a.toLowerCase()].toFixed(2)});$('yaw').value=Math.round(THREE.MathUtils.radToDeg(current.root.rotation.y));$('yawValue').textContent=$('yaw').value+'°';$('objScale').value=Math.round(current.root.scale.x*100);$('scaleValue').textContent=current.root.scale.x.toFixed(2);}
 if(current.type==='figure'){$('topCloth').value=current.top;$('bottomCloth').value=current.bottom;$('clothColor').value=current.color;}}
const poses={neutral:{},walk:{leftHip:[-25,0,0],rightHip:[25,0,0],leftKnee:[25,0,0],rightKnee:[25,0,0],leftShoulder:[25,0,0],rightShoulder:[-25,0,0],leftElbow:[-24,0,0]},reach:{leftShoulder:[-115,0,0],leftElbow:[-15,0,0],rightShoulder:[-15,0,0],chest:[-10,0,0],head:[10,0,0]},sit:{leftHip:[-85,0,0],rightHip:[-85,0,0],leftKnee:[105,0,0],rightKnee:[105,0,0],leftShoulder:[-20,0,0],rightShoulder:[-20,0,0]},action:{leftHip:[-60,0,12],rightHip:[35,0,-10],leftKnee:[95,0,0],rightKnee:[25,0,0],spine:[-18,18,8],leftShoulder:[-90,0,-25],rightShoulder:[30,0,30],leftElbow:[-65,0,0],rightElbow:[-65,0,0]}};
function applyPose(item,name){if(!item||item.type!=='figure'){toast('Select a figure first');return;}const pose=poses[name];if(!pose)return;for(const [n,j] of Object.entries(item.joints)){const a=pose[n]||[0,0,0];j.rotation.set(...a.map(THREE.MathUtils.degToRad));clampJoint(j,n);}refreshInspector();}
function serializeObject(o){const state={type:o.type,name:o.name,visible:o.root.visible,position:o.root.position.toArray(),rotation:o.root.rotation.toArray().slice(0,3),scale:o.root.scale.x};if(o.type==='figure'){state.joints=Object.fromEntries(Object.entries(o.joints).map(([n,j])=>[n,j.rotation.toArray().slice(0,3)]));state.top=o.top;state.bottom=o.bottom;state.color=o.color;state.outer=o.outer;state.fit=o.fit;state.sleeve=o.sleeve;state.build=o.build;state.outerColor=o.outerColor;}return state;}
function saveData(){return {format:'figure-studio',version:2,settings:readSettings(),camera:{position:camera.position.toArray(),target:orbit.target.toArray()},lighting:{key:key.intensity,ambient:ambient.intensity},objects:objects.map(serializeObject)};}
function clearScene(){transform.detach();current=null;currentJoint=null;for(const o of objects){scene.remove(o.root);o.root.traverse(child=>{if(child.isMesh){child.geometry.dispose();if(child.material!==skin&&child.material!==jointMat)child.material.dispose();}});}objects=[];refreshInspector();drawObjects();}
function restoreObject(st){const o=st.type==='figure'?figure(st.name):prop(st.type,st.name);o.root.position.fromArray(st.position||[0,0,0]);if(st.rotation)o.root.rotation.set(...st.rotation);o.root.scale.setScalar(st.scale||1);o.root.visible=st.visible!==false;if(o.type==='figure'){for(const [n,a] of Object.entries(st.joints||{})){if(o.joints[n]){o.joints[n].rotation.set(...a);clampJoint(o.joints[n],n);}}o.outer=st.outer||'none';o.fit=st.fit??.08;o.sleeve=st.sleeve??1;o.build=st.build??1;o.outerColor=st.outerColor||'#384953';o.top=st.top||'none';o.bottom=st.bottom||'none';o.color=/^#[a-fA-F0-9]{6}$/.test(st.color)?st.color:'#4e92bb';updateWardrobe(o);}return o;}
function loadData(data){if(data?.format!=='figure-studio'||!Array.isArray(data.objects)||data.objects.length>100){throw Error('Not a valid Figure Studio scene (maximum 100 objects).');}validateScene(data);clearScene();data.objects.forEach(restoreObject);if(data.settings)applySettings(data.settings);if(data.camera?.position&&data.camera?.target){camera.position.fromArray(data.camera.position);orbit.target.fromArray(data.camera.target);}if(data.lighting){key.intensity=data.lighting.key;ambient.intensity=data.lighting.ambient;}$('lightPower').value=Math.round(key.intensity/2.4*100);$('ambientPower').value=Math.round(ambient.intensity/1.05*70);select(objects[0]||null);}
function download(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('addFigure').onclick=()=>{const n=objects.filter(o=>o.type==='figure').length;figure(`Figure ${String(n+1).padStart(2,'0')}`,n*.95,0);};$('addBox').onclick=()=>prop('box','Box');$('addPlatform').onclick=()=>prop('platform','Platform');$('addSphere').onclick=()=>prop('sphere','Sphere');
document.querySelectorAll('[data-pose]').forEach(b=>b.onclick=()=>applyPose(current,b.dataset.pose));
$('mirrorPose').onclick=()=>{if(!current||current.type!=='figure')return toast('Select a figure');for(const side of ['Shoulder','Elbow','Wrist','Hip','Knee','Ankle']){const l=current.joints['left'+side],r=current.joints['right'+side];const a=l.rotation.toArray().slice(0,3),b=r.rotation.toArray().slice(0,3);l.rotation.set(b[0],-b[1],-b[2]);r.rotation.set(a[0],-a[1],-a[2]);}refreshInspector();};
$('objectName').onchange=e=>{if(current){current.name=e.target.value.trim()||current.name;drawObjects();refreshInspector();}};
for(const axis of ['X','Y','Z']){$('pos'+axis).onchange=e=>{if(current&&!currentJoint){const n=Number(e.target.value);if(Number.isFinite(n))current.root.position[axis.toLowerCase()]=THREE.MathUtils.clamp(n,-50,50);refreshInspector();}};$('joint'+axis).oninput=e=>{if(currentJoint){current.joints[currentJoint].rotation[axis.toLowerCase()]=THREE.MathUtils.degToRad(+e.target.value);$('joint'+axis+'Text').textContent=e.target.value+'°';}};}
$('yaw').oninput=e=>{if(current){current.root.rotation.y=THREE.MathUtils.degToRad(+e.target.value);$('yawValue').textContent=e.target.value+'°';}};
$('objScale').oninput=e=>{if(current){current.root.scale.setScalar(+e.target.value/100);$('scaleValue').textContent=(+e.target.value/100).toFixed(2);}};
$('resetJoint').onclick=()=>{if(currentJoint){current.joints[currentJoint].rotation.set(0,0,0);refreshInspector();}};
$('topCloth').onchange=e=>{if(current?.type==='figure'){current.top=e.target.value;updateWardrobe(current);}};$('bottomCloth').onchange=e=>{if(current?.type==='figure'){current.bottom=e.target.value;updateWardrobe(current);}};$('clothColor').oninput=e=>{if(current?.type==='figure'){current.color=e.target.value;updateWardrobe(current);}};
$('duplicate').onclick=()=>{if(!current)return;const s=serializeObject(current);s.name+=' copy';s.position[0]+=.75;select(restoreObject(s));};
$('remove').onclick=()=>{if(!current)return;const id=current.id;transform.detach();const o=objects.find(x=>x.id===id);scene.remove(o.root);objects=objects.filter(x=>x.id!==id);select(null);toast('Removed object');};
$('newScene').onclick=()=>{if(confirm('Start a new scene? Save your current scene first if needed.')){clearScene();figure('Figure 01');}};
$('saveFile').onclick=()=>download(new Blob([JSON.stringify(saveData(),null,2)],{type:'application/json'}),'figure-studio-scene.json');
$('openFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>2_000_000)throw Error('File too large');loadData(JSON.parse(await file.text()));toast('Scene loaded');}catch(err){toast(err.message||'Unable to open scene');console.error(err);}e.target.value='';};
$('exportPng').onclick=()=>{transform.visible=false;for(const o of objects)if(o.handles)o.handles.forEach(h=>h.visible=false);renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(blob)download(blob,'figure-studio-reference.png');transform.visible=true;for(const o of objects)if(o.handles)o.handles.forEach(h=>h.visible=$('showJoints').checked);},'image/png');};
$('showGrid').onchange=e=>grid.visible=e.target.checked;$('showJoints').onchange=e=>{for(const o of objects)if(o.handles)o.handles.forEach(h=>h.visible=e.target.checked);};
$('deselect').onclick=()=>select(null);$('resetCam').onclick=()=>{camera.position.set(4,3,5.8);orbit.target.set(0,1.1,0);orbit.update();};
document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{const d=b.dataset.camera;orbit.target.set(0,1.15,0);camera.position.set(...({front:[0,1.5,6],side:[6,1.5,0],top:[0,7,.01],three:[4,3,5.8]}[d]));orbit.update();});
$('lightPower').oninput=e=>{key.intensity=(+e.target.value/100)*2.4;$('lightText').textContent=e.target.value+'%';};$('ambientPower').oninput=e=>{ambient.intensity=(+e.target.value/70)*1.05;$('ambientText').textContent=e.target.value+'%';};
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart;renderer.domElement.addEventListener('pointerdown',e=>pointerStart=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;if(e.button!==0||transform.dragging)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const pickables=[];objects.filter(o=>o.root.visible).forEach(o=>o.root.traverse(child=>{if(child.isMesh&&child.visible&&child.userData.pick)pickables.push(child);}));const hits=raycaster.intersectObjects(pickables,false);if(hits.length){const p=hits[0].object.userData.pick;select(objects.find(o=>o.id===p.id),p.joint||null);}});
function resize(){const w=mount.clientWidth,h=mount.clientHeight;if(camera.isOrthographicCamera){camera.left=-2.5*w/h;camera.right=2.5*w/h;}else camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}new ResizeObserver(resize).observe(mount);resize();

function animate(){requestAnimationFrame(animate);for(const o of objects)if(o.type==='figure')for(const m of o.skin)if(m.userData.bicep){const flex=Math.abs(o.joints[m.userData.bicep+'Elbow'].rotation.x)/2.7;const b=m.userData.baseScale;m.scale.z=b[2]*o.build*(1+flex*.18);}orbit.update();renderer.render(scene,camera);}animate();

// Figure Studio extensions. Original v0.1 scene graph retained for scene compatibility.
function clampJoint(j,n){const ranges=limits[n]||[[-45,45],[-45,45],[-45,45]];['x','y','z'].forEach((axis,i)=>j.rotation[axis]=THREE.MathUtils.clamp(j.rotation[axis],...ranges[i].map(THREE.MathUtils.degToRad)));}
function enhanceFigure(o){
 const clay=material('#c6b7a4');o.skin.forEach(m=>m.material=clay);
 // Rounded volumes overlap at joints. This is an original procedural study model.
 function volume(parent,pos,scale){const m=mesh(parent,new THREE.SphereGeometry(1,28,20),clay,pos,{id:o.id,joint:parent.userData.jointName});m.scale.set(...scale);o.skin.push(m);return m;}
 volume(o.joints.spine,[0,.22,.015],[.185,.27,.135]);
 for(const side of ['left','right']){const s=side==='left'?-1:1;
  volume(o.joints.chest,[s*.12,.07,.09],[.137,.105,.085]);
  volume(o.joints[side+'Shoulder'],[s*.025,-.025,0],[.105,.115,.105]);
  const b=volume(o.joints[side+'Shoulder'],[s*.05,-.16,.025],[.075,.15,.075]);b.userData.bicep=side;
  volume(o.joints[side+'Hip'],[s*.015,-.2,.025],[.12,.235,.125]);
  volume(o.joints[side+'Knee'],[0,-.17,-.025],[.085,.17,.085]);
  volume(o.joints[side+'Elbow'],[0,0,0],[.071,.073,.072]);
  volume(o.joints[side+'Knee'],[0,0,.025],[.091,.086,.075]);
 }
 o.skin.forEach(m=>m.userData.baseScale=m.scale.toArray());
 o.handles.forEach(m=>{m.scale.setScalar(.65);m.visible=$('showJoints').checked;});
}
function updateWardrobe(o){if(o.type!=='figure')return;baseWardrobe(o);
 const add=(parent,geo,pos,color,scale=[1,1,1])=>{const m=mesh(parent,geo,material(color),pos,{id:o.id,joint:parent.userData.jointName});m.scale.set(...scale);o.clothes.push(m);return m;};
 if(o.outer==='jacket'){
  // Open-front jacket panels, back and sleeves stay attached to the articulated rig.
  const f=1+o.fit;
  for(const s of [-1,1])add(o.joints.spine,new THREE.BoxGeometry(.15*f,.46,.055),[s*.17,.25,.165],o.outerColor);
  add(o.joints.spine,new THREE.BoxGeometry(.47*f,.46,.055),[0,.25,-.16],o.outerColor);
  for(const side of ['left','right']){const s=side==='left'?-1:1;
   add(o.joints[side+'Shoulder'],new THREE.CylinderGeometry(.128*f,.114*f,.31,24),[s*.047,-.155,0],o.outerColor).rotation.z=s*.29;
   add(o.joints[side+'Elbow'],new THREE.CylinderGeometry(.108*f,.08*f,.275*o.sleeve,24),[0,-.1375*o.sleeve,0],o.outerColor);
  }
 }
 for(const m of o.clothes){m.userData.baseScale=m.scale.toArray();if(m.parent===o.joints.leftElbow||m.parent===o.joints.rightElbow){if(o.outer!=='jacket'){m.scale.y*=o.sleeve;m.position.y*=o.sleeve;}}}
 updateAppearance(o);
}
function updateAppearance(o){
 const mode=$('surface').value;
 for(const m of o.skin){const b=m.userData.baseScale;m.scale.set(b[0]*o.build,b[1],b[2]*o.build);m.material.wireframe=mode==='wire';m.material.color.set(mode==='muscle'?'#a56658':mode==='silhouette'?'#151b1d':'#c6b7a4');m.material.roughness=.7;}
 // Shared material per figure; build is only a width/depth approximation.
 for(const m of o.clothes){const b=m.userData.baseScale;m.scale.x=b[0]*o.build;m.scale.z=b[2]*o.build;}
}
function solveIK(o,endName,target){
 const arm=endName.includes('Wrist'),side=endName.startsWith('left')?'left':'right';
 const chain=arm?[side+'Elbow',side+'Shoulder']:[side+'Knee',side+'Hip'];
 const end=o.joints[endName],v=new THREE.Vector3(),w=new THREE.Vector3(),pivot=new THREE.Vector3();
 // Constrained cyclic coordinate descent, minimizing world-space endpoint error.
 // Euler constraints are reapplied after every local rotation, including gizmos.
 for(let iteration=0;iteration<55;iteration++){
  o.root.updateMatrixWorld(true);end.getWorldPosition(v);if(v.distanceTo(target)<.015)break;
  for(const name of chain){const j=o.joints[name];o.root.updateMatrixWorld(true);j.getWorldPosition(pivot);end.getWorldPosition(v);
   const inv=j.getWorldQuaternion(new THREE.Quaternion()).invert();v.sub(pivot).applyQuaternion(inv).normalize();w.copy(target).sub(pivot).applyQuaternion(inv).normalize();
   if(v.lengthSq()<.01||w.lengthSq()<.01)continue;
   const q=new THREE.Quaternion().setFromUnitVectors(v,w);q.slerp(new THREE.Quaternion(),.35);j.quaternion.multiply(q);clampJoint(j,name);
  }
 }
 o.root.updateMatrixWorld(true);end.getWorldPosition(v);return v.distanceTo(target);
}
function finiteArray(v,n,bound=100){return Array.isArray(v)&&v.length===n&&v.every(x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=bound);}
function validateScene(d){
 if(d.format!=='figure-studio'||![1,2].includes(d.version)||!Array.isArray(d.objects)||d.objects.length>100)throw Error('Unsupported scene or more than 100 objects.');
 for(const o of d.objects){if(!['figure','box','sphere','platform','stool'].includes(o.type)||typeof o.name!=='string'||o.name.length>100||!finiteArray(o.position,3)||!finiteArray(o.rotation,3,7)||!Number.isFinite(o.scale)||o.scale<.1||o.scale>5)throw Error('Invalid object transform. Your current scene has been kept.');
  if(o.joints){for(const [n,a] of Object.entries(o.joints))if(!jointNames.includes(n)||!finiteArray(a,3,7))throw Error('Invalid joint data.');}
  for(const [k,lo,hi] of [['fit',0,.3],['sleeve',.3,1],['build',.8,1.25]])if(o[k]!==undefined&&(!Number.isFinite(o[k])||o[k]<lo||o[k]>hi))throw Error('Invalid clothing or body setting.');
  for(const k of ['color','outerColor'])if(o[k]!==undefined&&!/^#[a-f\d]{6}$/i.test(o[k]))throw Error('Invalid color.');
 }
 if(d.camera&&(!finiteArray(d.camera.position,3)||!finiteArray(d.camera.target,3)))throw Error('Invalid camera.');
 if(d.settings){const s=d.settings;if(!Number.isFinite(s.fov)||s.fov<15||s.fov>85||!Number.isFinite(s.lightAngle)||Math.abs(s.lightAngle)>180||!/^#[a-f\d]{6}$/i.test(s.background)||!['clay','muscle','wire','silhouette'].includes(s.surface))throw Error('Invalid scene settings.');}
 if(d.lighting&&(!Number.isFinite(d.lighting.key)||!Number.isFinite(d.lighting.ambient)||d.lighting.key<0||d.lighting.key>10||d.lighting.ambient<0||d.lighting.ambient>10))throw Error('Invalid lighting.');
}
function readSettings(){return {surface:$('surface').value,fov:+$('fov').value,ortho:$('ortho').checked,background:$('background').value,lightAngle:+$('lightAngle').value,grid:$('showGrid').checked,joints:$('showJoints').checked};}
function applySettings(s){for(const id of ['surface','fov','background','lightAngle'])$(id).value=s[id];$('ortho').checked=!!s.ortho;$('showGrid').checked=s.grid!==false;$('showJoints').checked=s.joints!==false;updateCamera();updateEnvironment();objects.filter(o=>o.type==='figure').forEach(updateAppearance);}
function updateCamera(){const pos=camera.position.clone();const aspect=mount.clientWidth/mount.clientHeight;camera=$('ortho').checked?new THREE.OrthographicCamera(-2.5*aspect,2.5*aspect,2.5,-2.5,.05,100):new THREE.PerspectiveCamera(+$('fov').value,aspect,.05,100);camera.position.copy(pos);orbit.object=camera;transform.camera=camera;camera.lookAt(orbit.target);camera.updateProjectionMatrix();}
function updateEnvironment(){scene.background=new THREE.Color($('background').value);scene.fog.color.copy(scene.background);const angle=THREE.MathUtils.degToRad(+$('lightAngle').value);key.position.set(Math.sin(angle)*6,7,Math.cos(angle)*6);grid.visible=$('showGrid').checked;objects.forEach(o=>o.handles?.forEach(m=>m.visible=$('showJoints').checked));}
let history=[],historyIndex=-1,restoring=false,lastSaved='',studyInterval;
function checkpoint(){if(restoring)return;const text=JSON.stringify(saveData());if(history[historyIndex]===text)return;history=history.slice(0,historyIndex+1);history.push(text);if(history.length>60)history.shift();historyIndex=history.length-1;try{localStorage.setItem('figure-studio-v2',text);lastSaved=text;}catch{toast('Browser storage full. Save a scene file.');}updateHistory();}
function updateHistory(){$('undo').disabled=historyIndex<=0;$('redo').disabled=historyIndex>=history.length-1;}
function travel(step){if(historyIndex+step<0||historyIndex+step>=history.length)return;historyIndex+=step;restoring=true;loadData(JSON.parse(history[historyIndex]));restoring=false;updateHistory();}
function initialize(){
 limits.leftElbow=[[-155,0],[0,0],[0,0]];limits.rightElbow=[[-155,0],[0,0],[0,0]];limits.leftKnee=[[0,150],[0,0],[0,0]];limits.rightKnee=[[0,150],[0,0],[0,0]];
 for(const n of ['leftWrist','rightWrist'])limits[n]=[[-75,75],[-30,30],[-25,25]];
 for(const n of ['leftAnkle','rightAnkle'])limits[n]=[[-45,55],[-15,15],[-20,20]];
 limits.pelvis=[[-35,35],[-60,60],[-30,30]];
 Object.assign(poses,{crouch:{leftHip:[-100,0,-12],rightHip:[-100,0,12],leftKnee:[135,0,0],rightKnee:[135,0,0],spine:[25,0,0],leftShoulder:[-65,0,0],rightShoulder:[-65,0,0]},balance:{leftHip:[-65,0,-25],leftKnee:[85,0,0],leftShoulder:[0,0,-90],rightShoulder:[0,0,90]}});
 for(const n of jointNames){const opt=document.createElement('option');opt.value=n;opt.textContent=n.replace(/([A-Z])/g,' $1');$('jointSelect').append(opt);}
 $('jointSelect').onchange=e=>select(current,e.target.value||null);
 $('groundFigure').onclick=()=>{if(current?.type!=='figure')return;current.root.updateMatrixWorld(true);const box=new THREE.Box3();for(const s of ['left','right']){const foot=current.skin.find(m=>m.userData.pick?.joint===s+'Ankle');if(foot)box.expandByObject(foot);}if(!box.isEmpty())current.root.position.y-=box.min.y;refreshInspector();};$('addStool').onclick=()=>prop('stool','Stool');
 for(const [id,k,scale] of [['outerCloth','outer',1],['outerColor','outerColor',1],['fit','fit',.01],['sleeve','sleeve',.01],['build','build',.01]])$(id).oninput=e=>{if(current?.type==='figure'){current[k]=scale===1?e.target.value:+e.target.value*scale;updateWardrobe(current);}};
 $('surface').onchange=()=>objects.filter(o=>o.type==='figure').forEach(updateAppearance);
 $('ortho').onchange=updateCamera;$('fov').oninput=updateCamera;$('background').oninput=updateEnvironment;$('lightAngle').oninput=updateEnvironment;
 $('solveIK').onclick=()=>{if(current?.type!=='figure')return;const a=['X','Y','Z'].map(x=>Number($('ik'+x).value));if(!a.every(v=>Number.isFinite(v)&&Math.abs(v)<=50))return toast('Enter target coordinates between -50 and 50.');const error=solveIK(current,$('effector').value,new THREE.Vector3(...a));$('ikResult').textContent=error<.04?'Target reached.':`Closest constrained reach: ${(error*100).toFixed(1)} cm from target. Try moving the figure.`;refreshInspector();};
 $('undo').onclick=()=>travel(-1);$('redo').onclick=()=>travel(1);
 document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();travel(e.shiftKey?1:-1);}if(e.key==='Escape')select(null);});
 // Capture completed actions, never every render frame or slider tick.
 document.addEventListener('change',()=>setTimeout(checkpoint,0));document.addEventListener('pointerup',()=>setTimeout(checkpoint,0));document.addEventListener('click',()=>setTimeout(checkpoint,0));transform.addEventListener('mouseUp',checkpoint);
 $('saveCharacter').onclick=()=>{if(current?.type==='figure')download(new Blob([JSON.stringify({format:'figure-studio-character',object:serializeObject(current)},null,2)],{type:'application/json'}),'figure-character.json');};
 $('savePose').onclick=()=>{if(current?.type==='figure')download(new Blob([JSON.stringify({format:'figure-studio-pose',joints:serializeObject(current).joints},null,2)],{type:'application/json'}),'figure-pose.json');};
 for(const kind of ['Character','Pose'])$('open'+kind).onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>2000000)throw Error('File too large');const d=JSON.parse(await f.text());if(kind==='Character'){if(d.format!=='figure-studio-character'||d.object?.type!=='figure')throw Error('Not a character file');validateScene({format:'figure-studio',version:2,objects:[d.object]});select(restoreObject(d.object));}else{if(current?.type!=='figure')throw Error('Select a figure first');if(d.format!=='figure-studio-pose'||!d.joints||typeof d.joints!=='object')throw Error('Not a pose file');for(const [n,a] of Object.entries(d.joints))if(!jointNames.includes(n)||!finiteArray(a,3,7))throw Error('Invalid pose');for(const n of jointNames){current.joints[n].rotation.set(...(d.joints[n]||[0,0,0]));clampJoint(current.joints[n],n);}refreshInspector();}checkpoint();}catch(err){toast(err.message);}e.target.value='';};
 $('gesture').onclick=()=>{clearInterval(studyInterval);let seconds=60;$('timer').textContent='60 seconds · observe the line of action';studyInterval=setInterval(()=>{$('timer').textContent=--seconds>0?seconds+' seconds remaining':'Study complete · choose another pose';if(seconds<=0)clearInterval(studyInterval);},1000);};
 $('exportPng').onclick=()=>{const old=renderer.getSize(new THREE.Vector2()),bg=scene.background,fog=scene.fog,helper=transform.getHelper(),vis=helper.visible,gv=grid.visible;const handles=objects.flatMap(o=>o.handles||[]),hv=handles.map(m=>m.visible);try{helper.visible=false;handles.forEach(m=>m.visible=false);if($('transparent').checked){scene.background=null;scene.fog=null;floor.visible=false;grid.visible=false;}const factor=+$('exportSize').value;renderer.setSize(old.x*factor,old.y*factor,false);renderer.render(scene,camera);renderer.domElement.toBlob(b=>{if(b)download(b,'figure-studio-reference.png');else toast('PNG export failed');},'image/png');}finally{renderer.setSize(old.x,old.y,false);scene.background=bg;scene.fog=fog;floor.visible=true;grid.visible=gv;helper.visible=vis;handles.forEach((m,i)=>m.visible=hv[i]);}};
 figure('Figure 01');select(current);$('showJoints').checked=false;updateEnvironment();
 try{const saved=localStorage.getItem('figure-studio-v2');if(saved){loadData(JSON.parse(saved));toast('Recovered your last local session');}}catch{toast('Could not restore browser session. Open a saved JSON file.');}
 checkpoint();
 window.addEventListener('beforeunload',checkpoint);
 // Diagnostic interface for repeatable integration validation; no remote calls.
 window.figureStudio={get objects(){return objects;},get current(){return current;},figure,prop,select,saveData,loadData,applyPose,solveIK,clampJoint,checkpoint,travel,get camera(){return camera;},renderer,scene};
}

initialize();
