// Retarget animasi Mixamo (FBX) ke rig VRM humanoid.
// Diadaptasi dari contoh resmi @pixiv/three-vrm (humanoidAnimation, lisensi MIT).
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { fetchAsset } from './asset.js';

const RIG = {
  mixamorigHips: 'hips', mixamorigSpine: 'spine', mixamorigSpine1: 'chest', mixamorigSpine2: 'upperChest',
  mixamorigNeck: 'neck', mixamorigHead: 'head',
  mixamorigLeftShoulder: 'leftShoulder', mixamorigLeftArm: 'leftUpperArm', mixamorigLeftForeArm: 'leftLowerArm', mixamorigLeftHand: 'leftHand',
  mixamorigRightShoulder: 'rightShoulder', mixamorigRightArm: 'rightUpperArm', mixamorigRightForeArm: 'rightLowerArm', mixamorigRightHand: 'rightHand',
  mixamorigLeftUpLeg: 'leftUpperLeg', mixamorigLeftLeg: 'leftLowerLeg', mixamorigLeftFoot: 'leftFoot', mixamorigLeftToeBase: 'leftToes',
  mixamorigRightUpLeg: 'rightUpperLeg', mixamorigRightLeg: 'rightLowerLeg', mixamorigRightFoot: 'rightFoot', mixamorigRightToeBase: 'rightToes',
  mixamorigLeftHandThumb1: 'leftThumbMetacarpal', mixamorigLeftHandThumb2: 'leftThumbProximal', mixamorigLeftHandThumb3: 'leftThumbDistal',
  mixamorigLeftHandIndex1: 'leftIndexProximal', mixamorigLeftHandIndex2: 'leftIndexIntermediate', mixamorigLeftHandIndex3: 'leftIndexDistal',
  mixamorigLeftHandMiddle1: 'leftMiddleProximal', mixamorigLeftHandMiddle2: 'leftMiddleIntermediate', mixamorigLeftHandMiddle3: 'leftMiddleDistal',
  mixamorigLeftHandRing1: 'leftRingProximal', mixamorigLeftHandRing2: 'leftRingIntermediate', mixamorigLeftHandRing3: 'leftRingDistal',
  mixamorigLeftHandPinky1: 'leftLittleProximal', mixamorigLeftHandPinky2: 'leftLittleIntermediate', mixamorigLeftHandPinky3: 'leftLittleDistal',
  mixamorigRightHandThumb1: 'rightThumbMetacarpal', mixamorigRightHandThumb2: 'rightThumbProximal', mixamorigRightHandThumb3: 'rightThumbDistal',
  mixamorigRightHandIndex1: 'rightIndexProximal', mixamorigRightHandIndex2: 'rightIndexIntermediate', mixamorigRightHandIndex3: 'rightIndexDistal',
  mixamorigRightHandMiddle1: 'rightMiddleProximal', mixamorigRightHandMiddle2: 'rightMiddleIntermediate', mixamorigRightHandMiddle3: 'rightMiddleDistal',
  mixamorigRightHandRing1: 'rightRingProximal', mixamorigRightHandRing2: 'rightRingIntermediate', mixamorigRightHandRing3: 'rightRingDistal',
  mixamorigRightHandPinky1: 'rightLittleProximal', mixamorigRightHandPinky2: 'rightLittleIntermediate', mixamorigRightHandPinky3: 'rightLittleDistal',
};

const fbxCache = new Map();
async function loadFBX(path) {
  if (!fbxCache.has(path)) {
    fbxCache.set(path, (async () => {
      const res = await fetchAsset(path);
      if (!res) return null;
      return new FBXLoader().parse(await res.arrayBuffer(), '');
    })());
  }
  return fbxCache.get(path);
}

export async function loadMixamoClip(path, vrm) {
  const asset = await loadFBX(path);
  if (!asset) return null;
  const src = THREE.AnimationClip.findByName(asset.animations, 'mixamo.com') || asset.animations[0];
  if (!src) return null;
  const clip = src.clone();
  const tracks = [];
  const restInv = new THREE.Quaternion();
  const parentRest = new THREE.Quaternion();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();

  const hipsNode = asset.getObjectByName('mixamorigHips');
  const motionHipsHeight = hipsNode ? hipsNode.position.y : 1;
  const vrmHipsY = vrm.humanoid.getNormalizedBoneNode('hips').getWorldPosition(v).y;
  const vrmRootY = vrm.scene.getWorldPosition(v).y;
  const hipsScale = Math.abs(vrmHipsY - vrmRootY) / motionHipsHeight;
  const isVRM0 = vrm.meta?.metaVersion === '0';

  for (const track of clip.tracks) {
    const [rigName, prop] = track.name.split('.');
    const boneName = RIG[rigName];
    const node = boneName && vrm.humanoid.getNormalizedBoneNode(boneName);
    const rigNode = asset.getObjectByName(rigName);
    if (!node || !rigNode) continue;
    rigNode.getWorldQuaternion(restInv).invert();
    rigNode.parent.getWorldQuaternion(parentRest);

    if (track instanceof THREE.QuaternionKeyframeTrack) {
      const values = track.values.slice();
      for (let i = 0; i < values.length; i += 4) {
        q.fromArray(values, i).premultiply(parentRest).multiply(restInv).toArray(values, i);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(`${node.name}.${prop}`, track.times,
        values.map((x, i) => (isVRM0 && i % 2 === 0 ? -x : x))));
    } else if (track instanceof THREE.VectorKeyframeTrack && boneName === 'hips') {
      tracks.push(new THREE.VectorKeyframeTrack(`${node.name}.${prop}`, track.times,
        track.values.map((x, i) => (isVRM0 && i % 3 !== 1 ? -x : x) * hipsScale)));
    }
  }
  return new THREE.AnimationClip(path, clip.duration, tracks);
}
