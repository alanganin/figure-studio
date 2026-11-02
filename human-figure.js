import * as THREE from './vendor/three.module.js';
import {parseHumanGLB} from './human-glb.js';
import {createHumanControls} from './human-rig.js';

export async function loadHumanAsset(url){
  const response=await fetch(url);
  if(!response.ok)throw Error('Human body file could not load ('+response.status+'). Include assets/human-male.glb in the deployed folder.');
  const buffer=await response.arrayBuffer();
  // Validate once before enabling scene actions. Every instance owns its skeleton.
  const probe=parseHumanGLB(buffer);
  if(probe.bones.length!==163)throw Error('Unexpected human asset. This release requires the bundled 163-bone MakeHuman model.');
  for(const m of probe.meshes){m.geometry.dispose();m.material.dispose();}
  for(const skeleton of probe.skeletons)skeleton.dispose();
  return buffer;
}

export function createHumanFigure(buffer,id,name,x=0,z=0){
  const model=parseHumanGLB(buffer),root=new THREE.Group(),bodySpace=new THREE.Group();
  root.position.set(x,0,z);root.add(bodySpace);bodySpace.add(model.root);
  const bounds=new THREE.Box3().setFromObject(model.root);
  model.root.position.y-=bounds.min.y;
  root.updateMatrixWorld(true);
  const rig=createHumanControls(model,bodySpace);
  const item={id,type:'figure',name,root,bodySpace,model,rig,joints:rig.joints,handles:[],skin:model.meshes,clothes:[],top:'none',bottom:'none',outer:'none',color:'#4e92bb',outerColor:'#384953',fit:.08,sleeve:1,build:1,human:true};
  const handleMaterial=new THREE.MeshBasicMaterial({color:'#83cbbb',depthTest:false,transparent:true,opacity:.9});
  for(const [joint,control] of Object.entries(item.joints)){
    const handle=new THREE.Mesh(new THREE.SphereGeometry(.022,12,8),handleMaterial);
    handle.userData.pick={id,joint};handle.renderOrder=10;control.add(handle);item.handles.push(handle);
  }
  for(const m of item.skin)m.userData.pick={id,joint:'body'};
  item.sourceMesh=model.meshes.reduce((a,b)=>a.geometry.attributes.position.count>b.geometry.attributes.position.count?a:b);
  const source=item.sourceMesh,p=source.geometry.attributes.position;
  item.restPoints=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(source.matrixWorld);bodySpace.worldToLocal(v);v.toArray(item.restPoints,i*3);
  }
  item.restLandmarks=Object.fromEntries(Object.entries(rig.joints).map(([n,j])=>[n,j.userData.restPosition.clone()]));
  item.wardrobeSources=model.meshes.map(mesh=>{
    const a=mesh.geometry.attributes.position,points=new Float32Array(a.count*3),labels=[];
    for(let i=0;i<a.count;i++){
      const v=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld);bodySpace.worldToLocal(v);v.toArray(points,i*3);
      let best=-1,dominant=0;for(let k=0;k<4;k++){const w=mesh.geometry.attributes.skinWeight.array[i*4+k];if(w>best){best=w;dominant=mesh.geometry.attributes.skinIndex.array[i*4+k];}}labels.push(mesh.skeleton.bones[dominant].name);
    }
    return {mesh,points,labels};
  });
  item.lastRotations=[];
  syncHuman(item,true);
  return item;
}

export function syncHuman(item,force=false){
  const rotations=Object.values(item.joints).flatMap(j=>[j.quaternion.x,j.quaternion.y,j.quaternion.z,j.quaternion.w]);
  if(force||rotations.some((v,i)=>v!==item.lastRotations[i])){item.rig.sync();item.lastRotations=rotations;}
}

export function updateHumanAppearance(item,mode){
  item.bodySpace.scale.set(item.build,1,item.build);
  for(const m of item.skin){m.material.wireframe=mode==='wire';m.material.color.set(mode==='muscle'?'#a56658':mode==='silhouette'?'#151b1d':'#c6b7a4');}
  item.root.updateMatrixWorld(true);
}

export function updateHumanWardrobe(item){
  for(const m of item.clothes){m.removeFromParent();m.geometry.dispose();m.material.dispose();}item.clothes=[];
  for(const cached of item.wardrobeSources){
  const source=cached.mesh,geo=source.geometry,p=geo.attributes.position,n=geo.attributes.normal,points=cached.points,l=item.restLandmarks;
  const index=geo.index?.array||Array.from({length:p.count},(_,i)=>i);
  const labelAt=cached.labels;
  function included(i,kind){
    const v=new THREE.Vector3().fromArray(points,i*3),label=labelAt[i],side=v.x>=0?'left':'right';
    if(kind==='pants'||kind==='shorts')return v.y<l.pelvis.y+.09&&v.y>(kind==='shorts'?l[side+'Knee'].y+.1:l[side+'Ankle'].y+.03)&&/^(root|pelvis|spine05|upperleg|lowerleg)/.test(label);
    if(v.y<l.pelvis.y-.035||v.y>l.neck.y-.025)return false;
    const torso=/^(root|spine|breast|clavicle|shoulder)/.test(label);
    const arm=/^(upperarm|lowerarm|wrist)/.test(label);
    if(!torso&&!arm)return false;
    const armDistance=v.distanceTo(l[side+'Shoulder']),upperLength=l[side+'Shoulder'].distanceTo(l[side+'Elbow']);
    if(arm){
      if(kind==='tank')return false;
      const fullLength=upperLength+l[side+'Elbow'].distanceTo(l[side+'Wrist']);
      if(armDistance>(kind==='tee'?upperLength*.56:fullLength*(.55+.42*item.sleeve)))return false;
    }
    if(kind==='jacket'&&Math.abs(v.x)<.045&&v.z>l.chest.z+.04)return false;
    return true;
  }
  function layer(kind,color,ease){
    const selected=[];
    for(let i=0;i<index.length;i+=3){const a=index[i],b=index[i+1],c=index[i+2];if(included(a,kind)&&included(b,kind)&&included(c,kind))selected.push(a,b,c);}
    if(!selected.length)return;
    const geometry=new THREE.BufferGeometry();
    for(const [name,attribute] of Object.entries(geo.attributes))geometry.setAttribute(name,attribute.clone());
    const positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++)positions.setXYZ(i,p.getX(i)+n.getX(i)*ease,p.getY(i)+n.getY(i)*ease,p.getZ(i)+n.getZ(i)*ease);
    geometry.setIndex(selected);
    const material=new THREE.MeshStandardMaterial({color,roughness:.9,side:THREE.DoubleSide});
    const garment=new THREE.SkinnedMesh(geometry,material);
    garment.bind(source.skeleton,source.bindMatrix.clone());garment.castShadow=garment.receiveShadow=true;garment.frustumCulled=false;garment.userData.pick={id:item.id,joint:'body'};
    garment.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.9,0),3);
    source.parent.add(garment);item.clothes.push(garment);
  }
  if(item.top!=='none')layer(item.top,item.color,.005+item.fit*.07);
  if(item.bottom!=='none')layer(item.bottom,item.color,.006+item.fit*.07);
  if(item.outer==='jacket')layer('jacket',item.outerColor,.014+item.fit*.09);
  }
}

export function groundHuman(item){
  syncHuman(item);item.root.updateMatrixWorld(true);
  // Evaluate actual posed skin, not the undeformed GLB bounds.
  let minimum=Infinity;
  for(const mesh of item.skin){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const v=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);minimum=Math.min(minimum,v.y);}}
  if(Number.isFinite(minimum))item.root.position.y-=minimum;
}
