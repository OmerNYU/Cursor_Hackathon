export const ANALYSIS_INTERVAL_MS = 100;
export const EMA_BETA = 0.3;
export const WINDOW_MS = 1500;
export const GRACE_PERIOD_MS = 500;
export const NEUTRAL_FEATURES = {
  postureAngleDeg: 6,
  swaySigma: 0.01,
  gazeDevDeg: 8,
  gazeBreaksPerMin: 4,
  wristVelStd: 0.025,
  torsoSpeed: 0.04,
};
export const THRESHOLDS = {
  postureMaxDeg: 12,
  swayMax: 0.02,
  gazeGoodDeg: 10,
  gazeMaxBreaksPerMin: 12,
  wristVelLow: 0.01,
  wristVelHigh: 0.08,
  paceIdealMax: 0.08,
} as const;
export const WEIGHTS = { P: 0.4, E: 0.3, S: 0.2, C: 0.1 } as const;
