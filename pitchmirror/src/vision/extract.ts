import type { Landmark, PoseFrame, FaceFrame } from './types';
import { midpoint } from './math';

/**
 * MediaPipe Pose Landmark Indices
 * Reference: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 */
const POSE_INDICES = {
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_HIP: 23,
  R_HIP: 24,
  L_WRIST: 15,
  R_WRIST: 16,
} as const;

/**
 * MediaPipe Face Landmark Indices
 * Reference: https://developers.google.com/mediapipe/solutions/vision/face_landmarker
 */
const FACE_INDICES = {
  L_EYE_OUTER: 33,
  L_EYE_INNER: 133,
  R_EYE_INNER: 362,
  R_EYE_OUTER: 263,
  L_IRIS_CENTER: 468,
  R_IRIS_CENTER: 473,
  NOSE_TIP: 1,
} as const;

/**
 * Extracts pose landmarks from MediaPipe result
 * Returns undefined if critical landmarks are missing
 * 
 * @param lms - Array of landmarks from MediaPipe pose detection
 * @returns Object with PoseFrame and visibility scores, or undefined frame if invalid
 */
export function extractPose(
  lms: Landmark[] | undefined
): { frame?: PoseFrame; vis: number[] } {
  if (!lms || lms.length === 0) {
    return { frame: undefined, vis: [] };
  }

  // Extract critical landmarks
  const lShoulder = lms[POSE_INDICES.L_SHOULDER];
  const rShoulder = lms[POSE_INDICES.R_SHOULDER];
  const lHip = lms[POSE_INDICES.L_HIP];
  const rHip = lms[POSE_INDICES.R_HIP];
  const lWrist = lms[POSE_INDICES.L_WRIST];
  const rWrist = lms[POSE_INDICES.R_WRIST];

  // Check if all critical landmarks exist
  if (!lShoulder || !rShoulder || !lHip || !rHip || !lWrist || !rWrist) {
    return { frame: undefined, vis: [] };
  }

  // Calculate torso midpoint
  // midpoint between (shoulder midpoint) and (hip midpoint)
  const shoulderMid = midpoint(lShoulder, rShoulder);
  const hipMid = midpoint(lHip, rHip);
  const torsoMid = midpoint(shoulderMid, hipMid);

  // Build pose frame
  const frame: PoseFrame = {
    shoulders: {
      L: lShoulder,
      R: rShoulder,
    },
    hips: {
      L: lHip,
      R: rHip,
    },
    wrists: {
      L: lWrist,
      R: rWrist,
    },
    torsoMid,
  };

  // Collect visibility scores
  const vis = [
    lShoulder.visibility ?? 0,
    rShoulder.visibility ?? 0,
    lHip.visibility ?? 0,
    rHip.visibility ?? 0,
    lWrist.visibility ?? 0,
    rWrist.visibility ?? 0,
  ];

  return { frame, vis };
}

/**
 * Extracts face landmarks from MediaPipe result
 * Returns undefined if critical landmarks are missing
 * 
 * @param lms - Array of landmarks from MediaPipe face detection
 * @returns Object with FaceFrame and visibility scores, or undefined frame if invalid
 */
export function extractFace(
  lms: Landmark[] | undefined
): { frame?: FaceFrame; vis: number[] } {
  if (!lms || lms.length === 0) {
    return { frame: undefined, vis: [] };
  }

  // Extract critical landmarks
  const lEyeOuter = lms[FACE_INDICES.L_EYE_OUTER];
  const lEyeInner = lms[FACE_INDICES.L_EYE_INNER];
  const rEyeInner = lms[FACE_INDICES.R_EYE_INNER];
  const rEyeOuter = lms[FACE_INDICES.R_EYE_OUTER];
  const lIris = lms[FACE_INDICES.L_IRIS_CENTER];
  const rIris = lms[FACE_INDICES.R_IRIS_CENTER];
  const noseTip = lms[FACE_INDICES.NOSE_TIP];

  // Check if all critical landmarks exist
  if (!lEyeOuter || !lEyeInner || !rEyeInner || !rEyeOuter || !lIris || !rIris || !noseTip) {
    return { frame: undefined, vis: [] };
  }

  // Calculate face center
  // midpoint between left eye midpoint and right eye midpoint
  const lEyeMid = midpoint(lEyeOuter, lEyeInner);
  const rEyeMid = midpoint(rEyeInner, rEyeOuter);
  const faceCenter = midpoint(lEyeMid, rEyeMid);

  // Build face frame
  const frame: FaceFrame = {
    iris: {
      L: lIris,
      R: rIris,
    },
    eyes: {
      L_outer: lEyeOuter,
      L_inner: lEyeInner,
      R_inner: rEyeInner,
      R_outer: rEyeOuter,
    },
    noseTip,
    faceCenter,
  };

  // Collect visibility scores (face landmarks typically have high visibility)
  const vis = [
    lEyeOuter.visibility ?? 1,
    lEyeInner.visibility ?? 1,
    rEyeInner.visibility ?? 1,
    rEyeOuter.visibility ?? 1,
    lIris.visibility ?? 1,
    rIris.visibility ?? 1,
    noseTip.visibility ?? 1,
  ];

  return { frame, vis };
}

