import * as THREE from './vendor/three.module.js';

// Deliberately small GLB 2.0 loader for uncompressed, skinned human study models.
// Geometry, normals, UVs, skeletons, rest transforms and skin weights are retained.
// Embedded textures/animations are not needed for the neutral clay study surface.
export function parseHumanGLB(buffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== buffer.byteLength) throw Error('Expected a complete GLB 2.0 file.');
  let json, binary;
  for (let offset = 12; offset < buffer.byteLength;) {
    if (offset + 8 > buffer.byteLength) throw Error('Truncated GLB chunk.');
    const length = view.getUint32(offset, true), type = view.getUint32(offset + 4, true);
    offset += 8;
    if (offset + length > buffer.byteLength) throw Error('Truncated GLB data.');
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, offset, length)).trim());
    if (type === 0x004e4942) binary = buffer.slice(offset, offset + length);
    offset += length;
  }
  if (!json || !binary || json.buffers?.length !== 1 || json.buffers[0].uri) throw Error('The human model must be a self-contained GLB.');
  if (json.extensionsRequired?.length) throw Error('Compressed or extension-dependent GLBs are not supported by this study loader: ' + json.extensionsRequired.join(', '));
  const sizes = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16};
  const types = {5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array};
  const readers = {5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32'};
  const accessorCache = new Map();
  function accessor(index) {
    if (accessorCache.has(index)) return accessorCache.get(index);
    const a = json.accessors?.[index], b = json.bufferViews?.[a?.bufferView], Type = types[a?.componentType], size = sizes[a?.type];
    if (!a || !b || !Type || !size || a.sparse || b.buffer !== 0 || !Number.isInteger(a.count) || a.count < 0 || a.count > 2000000) throw Error('Unsupported or invalid model accessor.');
    const bytes = Type.BYTES_PER_ELEMENT, stride = b.byteStride || size * bytes, start = (b.byteOffset || 0) + (a.byteOffset || 0);
    const end = a.count ? start + (a.count - 1) * stride + size * bytes : start;
    if (end > binary.byteLength || end > (b.byteOffset || 0) + b.byteLength || stride < size * bytes) throw Error('Model accessor is out of bounds.');
    const data = new Type(a.count * size), dv = new DataView(binary);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < size; k++) data[i * size + k] = dv[readers[a.componentType]](start + i * stride + k * bytes, true);
    const result = new THREE.BufferAttribute(data, size, !!a.normalized);
    accessorCache.set(index, result);
    return result;
  }
  const jointIndices = new Set((json.skins || []).flatMap(s => s.joints));
  if (!jointIndices.size) throw Error('This body has no skeleton or skin weights.');
  const nodes = (json.nodes || []).map((n, i) => {
    const node = jointIndices.has(i) ? new THREE.Bone() : new THREE.Group();
    node.name = n.name || 'node_' + i;
    if (n.matrix) { new THREE.Matrix4().fromArray(n.matrix).decompose(node.position, node.quaternion, node.scale); }
    else { if (n.translation) node.position.fromArray(n.translation); if (n.rotation) node.quaternion.fromArray(n.rotation); if (n.scale) node.scale.fromArray(n.scale); }
    return node;
  });
  const meshes = [], skinJobs = [];
  const attrNames = {POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv', JOINTS_0: 'skinIndex', WEIGHTS_0: 'skinWeight'};
  (json.nodes || []).forEach((n, index) => {
    for (const child of n.children || []) { if (!nodes[child]) throw Error('Invalid model hierarchy.'); nodes[index].add(nodes[child]); }
    if (n.mesh === undefined) return;
    const source = json.meshes?.[n.mesh];
    if (!source) throw Error('Invalid model mesh.');
    for (const primitive of source.primitives) {
      if ((primitive.mode ?? 4) !== 4 || primitive.extensions) throw Error('Only uncompressed triangle meshes are supported.');
      const geometry = new THREE.BufferGeometry();
      for (const [semantic, name] of Object.entries(attrNames)) if (primitive.attributes[semantic] !== undefined) geometry.setAttribute(name, accessor(primitive.attributes[semantic]));
      if (!geometry.attributes.position) throw Error('Body mesh has no vertices.');
      if (primitive.indices !== undefined) geometry.setIndex(accessor(primitive.indices));
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({color: '#c6b7a4', roughness: .72, metalness: 0, side: THREE.DoubleSide});
      const mesh = n.skin === undefined ? new THREE.Mesh(geometry, material) : new THREE.SkinnedMesh(geometry, material);
      mesh.name = source.name || nodes[index].name;
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      // A conservative animated envelope avoids stale rest-pose raycast bounds.
      mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0,.9,0),3);
      nodes[index].add(mesh); meshes.push(mesh);
      if (n.skin !== undefined) {
        if (!geometry.attributes.skinIndex || !geometry.attributes.skinWeight) throw Error('Skinned body is missing skin weights.');
        skinJobs.push({mesh, index: n.skin});
      }
    }
  });
  const root = new THREE.Group(); root.name = 'MakeHuman body';
  const selectedScene = json.scenes?.[json.scene || 0];
  for (const i of selectedScene?.nodes || nodes.map((_, i) => i).filter(i => !nodes[i].parent)) root.add(nodes[i]);
  root.updateMatrixWorld(true);
  const skeletons = (json.skins || []).map(s => {
    if (!s.joints.every(i => nodes[i]?.isBone)) throw Error('Invalid skeleton joints.');
    const inverseAttribute = s.inverseBindMatrices === undefined ? null : accessor(s.inverseBindMatrices);
    if (inverseAttribute && inverseAttribute.count !== s.joints.length) throw Error('Invalid inverse bind matrices.');
    const inverses = inverseAttribute ? s.joints.map((_, i) => new THREE.Matrix4().fromArray(inverseAttribute.array, i * 16)) : s.joints.map(() => new THREE.Matrix4());
    return new THREE.Skeleton(s.joints.map(i => nodes[i]), inverses);
  });
  for (const {mesh, index} of skinJobs) {
    const skeleton = skeletons[index]; if (!skeleton) throw Error('Missing body skeleton.');
    const indices = mesh.geometry.attributes.skinIndex;
    for (const i of indices.array) if (i >= skeleton.bones.length) throw Error('Skin weight references an invalid bone.');
    mesh.bind(skeleton, new THREE.Matrix4()); mesh.normalizeSkinWeights();
  }
  if (!skinJobs.length) throw Error('The model has no skinned surfaces.');
  return {root, meshes, bones: nodes.filter(n => n.isBone), skeletons, json};
}
