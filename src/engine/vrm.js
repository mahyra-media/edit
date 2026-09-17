import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { fetchAsset } from './asset.js';

// Memuat .vrm langsung (JANGAN dikonversi ke .glb — blend shape ekspresi & lip-sync ada di data VRM)
export async function loadVRM(path) {
  const res = await fetchAsset(path);
  if (!res) return null;
  const buf = await res.arrayBuffer();
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const gltf = await loader.parseAsync(buf, '');
  const vrm = gltf.userData.vrm;
  if (!vrm) throw new Error(`${path} bukan file VRM`);
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  if (VRMUtils.combineSkeletons) VRMUtils.combineSkeletons(gltf.scene);
  else if (VRMUtils.removeUnnecessaryJoints) VRMUtils.removeUnnecessaryJoints(gltf.scene);
  VRMUtils.rotateVRM0(vrm);
  vrm.scene.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; }
  });
  return vrm;
}
