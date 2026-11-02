import * as THREE from './vendor/three.module.js';

const parents = {pelvis:null,spine:'pelvis',chest:'spine',neck:'chest',head:'neck',leftShoulder:'chest',leftElbow:'leftShoulder',leftWrist:'leftElbow',rightShoulder:'chest',rightElbow:'rightShoulder',rightWrist:'rightElbow',leftHip:'pelvis',leftKnee:'leftHip',leftAnkle:'leftKnee',rightHip:'pelvis',rightKnee:'rightHip',rightAnkle:'rightKnee'};
const names = {
  pelvis:['root'],spine:['spine04'],chest:['spine02'],neck:['neck01'],head:['head']
};
for(const [side,letter] of [['left','l'],['right','r']])for(const [part,candidates] of Object.entries({Shoulder:['upperarm01','upperarm','upper_arm','arm'],Elbow:['lowerarm01','lowerarm','forearm','fore_arm'],Wrist:['hand','wrist'],Hip:['upperleg01','upperleg','thigh','up_leg'],Knee:['lowerleg01','lowerleg','shin','leg'],Ankle:['foot','ankle']}))names[side+part]=candidates.flatMap(c=>[c+'.'+letter,c+'_'+letter,letter+'_'+c,side+c,side+'_'+c]);
const normalize = s=>s.toLowerCase().replace(/^.*:/,'').replace(/[^a-z0-9]/g,'');

export function mapHumanBones(bones) {
  const map={},used=new Set();
  for(const key of Object.keys(parents)) {
    for(const candidate of names[key]) {
      const bone=bones.find(b=>!used.has(b)&&normalize(b.name)===normalize(candidate));
      if(bone){map[key]=bone;used.add(bone);break;}
    }
  }
  const missing=Object.keys(parents).filter(k=>!map[k]);
  if(missing.length)throw Error('Human rig requires a verified bone mapping for: '+missing.join(', ')+'. Available bones: '+bones.map(b=>b.name).join(', '));
  return map;
}

// Pose controls store deltas, separate from the model's nonzero bind rotations.
// This keeps reset/presets/save files from accidentally destroying its rest pose.
export function createHumanControls(model, container, mapping=mapHumanBones(model.bones)) {
  container.updateMatrixWorld(true);
  const joints={},restOrientation={},world=new THREE.Vector3();
  function relativeQuaternion(node){const chain=[];while(node&&node!==container){chain.push(node);node=node.parent;}const q=new THREE.Quaternion();for(let i=chain.length-1;i>=0;i--)q.multiply(chain[i].quaternion);return q.normalize();}
  for(const [name,parent] of Object.entries(parents)) {
    const control=new THREE.Group();control.name=name;control.userData.jointName=name;
    mapping[name].getWorldPosition(world);container.worldToLocal(world);
    if(parent)world.sub(joints[parent].userData.restPosition);
    control.position.copy(world);(parent?joints[parent]:container).add(control);
    control.userData.restPosition=parent?world.clone().add(joints[parent].userData.restPosition):world.clone();
    joints[name]=control;
    restOrientation[name]=relativeQuaternion(mapping[name]);
  }
  const ordered=Object.entries(mapping).sort((a,b)=>depth(a[1])-depth(b[1]));
  function depth(node){let n=0;while(node.parent){node=node.parent;n++;}return n;}
  function sync(){
    container.updateMatrixWorld(true);
    for(const [name,bone] of ordered){
      const desired=relativeQuaternion(joints[name]).multiply(restOrientation[name]);
      const inverseParent=relativeQuaternion(bone.parent).invert();
      bone.quaternion.copy(inverseParent.multiply(desired)).normalize();bone.updateMatrix();
    }
    model.root.updateMatrixWorld(true);for(const skeleton of model.skeletons)skeleton.update();
  }
  return {joints,mapping,sync};
}
