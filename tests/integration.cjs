const fs=require('fs'),assert=require('assert/strict'),path=require('path');
process.chdir(path.resolve(__dirname,'..'));
(async()=>{
const mod=await import('../vendor/three.module.js');
const html=fs.readFileSync('index.html','utf8'),elements={};
for(const m of html.matchAll(/<(\w+)\b([^>]*\bid="([^"]+)"[^>]*)>/g)){const attrs=m[2],value=attrs.match(/\bvalue="([^"]*)"/);elements[m[3]]={value:value?.[1]||'',checked:/\bchecked\b/.test(attrs),hidden:false,textContent:'',innerHTML:'',children:[],style:{},classList:{add(){},remove(){}},append(x){this.children.push(x)},appendChild(x){this.children.push(x)},addEventListener(){},getBoundingClientRect(){return {left:0,top:0,width:1000,height:700}},clientWidth:1000,clientHeight:700};}
for(const [id,val]of Object.entries({surface:'clay',outerCloth:'none',effector:'leftWrist',exportSize:'1'}))elements[id].value=val;
let callback;const canvas={addEventListener(){},toBlob(cb){cb(new Blob(['png']))},getBoundingClientRect(){return {left:0,top:0,width:1000,height:700}}};
class Renderer{constructor(){this.domElement=canvas;this.shadowMap={};this.size=new mod.Vector2(1000,700);}setPixelRatio(){}setSize(x,y){this.size.set(x,y)}getSize(v){return v.copy(this.size)}render(){} }
class Orbit{constructor(c){this.object=c;this.target=new mod.Vector3()}update(){}}
class Transform{constructor(){this.helper=new mod.Group()}getHelper(){return this.helper}setSize(){}addEventListener(){}detach(){}attach(){}setMode(){}}
const THREE={...mod,WebGLRenderer:Renderer};const document={getElementById:id=>{assert(elements[id],`missing ${id}`);return elements[id]},querySelectorAll:()=>[],addEventListener(){},createElement:()=>({style:{},classList:{add(){},remove(){}},append(){},click(){},remove(){}}),body:{appendChild(){}}};const window={addEventListener(){}};const storage=new Map();
const code=fs.readFileSync('app.js','utf8').replace(/^import .*;\r?\n/gm,'');
new Function('THREE','OrbitControls','TransformControls','document','window','ResizeObserver','requestAnimationFrame','devicePixelRatio','localStorage','confirm',code)(THREE,Orbit,Transform,document,window,class{observe(){}},()=>{},1,{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)},()=>true);
const api=window.figureStudio,results=[];function test(name,fn){fn();results.push(name);console.log('PASS '+name)}
test('Boot creates one independent figure',()=>assert.equal(api.objects.length,1));
const first=api.objects[0],second=api.figure('Second',1,0);
test('Preset changes only selected figure',()=>{api.applyPose(second,'action');assert.equal(first.joints.leftHip.rotation.x,0);assert.notEqual(second.joints.leftHip.rotation.x,0)});
test('Joint clamp rejects elbow hyperextension',()=>{first.joints.leftElbow.rotation.set(2,1,1);api.clampJoint(first.joints.leftElbow,'leftElbow');assert.equal(first.joints.leftElbow.rotation.x,0);assert.equal(first.joints.leftElbow.rotation.y,0)});
test('IK reduces reachable hand error',()=>{api.applyPose(first,'neutral');first.root.updateMatrixWorld(true);const target=new mod.Vector3(-.38,1.4,.35),before=first.joints.leftWrist.getWorldPosition(new mod.Vector3()).distanceTo(target);const error=api.solveIK(first,'leftWrist',target);assert(error<before,`${error} >= ${before}`);assert(error<.08,`residual ${error}`)});
test('Unreachable IK remains finite and constrained',()=>{const error=api.solveIK(first,'rightAnkle',new mod.Vector3(20,20,20));assert(Number.isFinite(error));assert(first.joints.rightKnee.rotation.x>=0&&first.joints.rightKnee.rotation.x<=Math.PI*150/180)});
test('Layered wardrobe and fit are independent',()=>{api.select(second);elements.topCloth.value='long';elements.topCloth.onchange({target:elements.topCloth});elements.outerCloth.oninput({target:{value:'jacket'}});elements.fit.oninput({target:{value:'22'}});assert(second.clothes.length>8);assert.equal(first.clothes.length,0);assert.equal(second.fit,.22)});
api.prop('stool','Study stool');let state;
test('Scene roundtrip preserves pose, layers, props and camera',()=>{state=api.saveData();api.loadData(JSON.parse(JSON.stringify(state)));assert.deepEqual(api.saveData(),state)});
test('Malformed scene rejection keeps current scene',()=>{const bad=structuredClone(state);bad.objects[0].position=[null,1,2];assert.throws(()=>api.loadData(bad));assert.deepEqual(api.saveData(),state)});
test('v0.1 scene migration',()=>{const old=structuredClone(state);old.version=1;delete old.settings;old.objects=old.objects.filter(o=>o.type!=='stool');for(const o of old.objects)for(const k of ['outer','outerColor','fit','sleeve','build'])delete o[k];api.loadData(old);assert.equal(api.objects[0].fit,.08);assert.equal(api.objects.length,2)});
test('Undo and redo restore scene state',()=>{api.checkpoint();const n=api.objects.length;api.figure('History');api.checkpoint();api.travel(-1);assert.equal(api.objects.length,n);api.travel(1);assert.equal(api.objects.length,n+1)});
test('Orthographic switch retains camera position',()=>{const before=api.camera.position.toArray();elements.ortho.checked=true;elements.ortho.onchange();assert(api.camera.isOrthographicCamera);assert.deepEqual(api.camera.position.toArray(),before)});
test('PNG handler restores scene visibility',()=>{elements.transparent.checked=true;elements.exportPng.onclick();assert(api.scene.background);assert.equal(api.renderer.size.x,1000)});
console.log(`${results.length} integration checks passed. Rendering and actual browser downloads are not exercised.`);
fs.writeFileSync('tests/results.json',JSON.stringify({passed:results.length,checks:results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});

