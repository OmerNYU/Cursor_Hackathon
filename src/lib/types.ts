export type Landmark = { x: number; y: number; z?: number; visibility?: number };

export type PoseFrame = {
  shoulders: { L: Landmark; R: Landmark };
  hips: { L: Landmark; R: Landmark };
  wrists: { L: Landmark; R: Landmark };
  torsoMid: Landmark;
};

export type FaceFrame = {
  iris: { L: Landmark; R: Landmark };
  eyes: { L_outer: Landmark; L_inner: Landmark; R_inner: Landmark; R_outer: Landmark };
  noseTip: Landmark;
  faceCenter: Landmark;
};

export type FramePack = {
  ts: number;
  pose?: PoseFrame;
  face?: FaceFrame;
  quality: { poseOk: boolean; faceOk: boolean };
  scales: { faceWidth: number; torsoLength: number };
};

export type Features = {
  postureAngleDeg: number;
  swaySigma: number;
  gazeDevDeg: number;
  gazeBreaksPerMin: number;
  wristVelStd: number;
  torsoSpeed: number;
};

export type Subscores = { P: number; E: number; S: number; C: number };
export type Scores = Subscores & { overall: number };
export type TipId = 'camera' | 'posture' | 'gaze' | 'hands' | 'pacing';
export type Tip = { id: TipId; message: string; priority: number };
export type Evaluation = { features: Features; scores: Scores; tips: Tip[] };
