import type { FaceFrame, FramePack, Landmark, PoseFrame } from './types';
import { distance, midpoint } from './math';

type RawLandmark = { x: number; y: number; z?: number; visibility?: number };
const present = (landmarks: RawLandmark[], indexes: number[]) => indexes.every((index) => landmarks[index] && (landmarks[index].visibility ?? 1) >= 0.5);
const point = (landmarks: RawLandmark[], index: number): Landmark => landmarks[index];

export function toFramePack(ts: number, poseLandmarks: RawLandmark[], faceLandmarks: RawLandmark[]): FramePack {
  const poseOk = present(poseLandmarks, [11, 12, 23, 24, 15, 16]);
  const faceOk = faceLandmarks.length >= 478;
  const pose: PoseFrame | undefined = poseOk ? {
    shoulders: { L: point(poseLandmarks, 11), R: point(poseLandmarks, 12) }, hips: { L: point(poseLandmarks, 23), R: point(poseLandmarks, 24) }, wrists: { L: point(poseLandmarks, 15), R: point(poseLandmarks, 16) },
    torsoMid: midpoint(midpoint(point(poseLandmarks, 11), point(poseLandmarks, 12)), midpoint(point(poseLandmarks, 23), point(poseLandmarks, 24))),
  } : undefined;
  const face: FaceFrame | undefined = faceOk ? {
    iris: { L: point(faceLandmarks, 468), R: point(faceLandmarks, 473) },
    eyes: { L_outer: point(faceLandmarks, 33), L_inner: point(faceLandmarks, 133), R_inner: point(faceLandmarks, 362), R_outer: point(faceLandmarks, 263) },
    noseTip: point(faceLandmarks, 1), faceCenter: midpoint(point(faceLandmarks, 33), point(faceLandmarks, 263)),
  } : undefined;
  return { ts, pose, face, quality: { poseOk, faceOk }, scales: { faceWidth: face ? distance(face.eyes.L_outer, face.eyes.R_outer) : 0, torsoLength: pose ? distance(midpoint(pose.shoulders.L, pose.shoulders.R), midpoint(pose.hips.L, pose.hips.R)) : 0 } };
}
