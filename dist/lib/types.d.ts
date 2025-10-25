/**
 * Core type definitions for PitchMirror feature processing engine
 * Aligned with Architecture §4
 */
export type Vec2 = {
    x: number;
    y: number;
};
export type Vec3 = {
    x: number;
    y: number;
    z?: number;
};
export interface Landmark extends Vec3 {
    visibility?: number;
}
export interface PoseFrame {
    shoulders: {
        L: Landmark;
        R: Landmark;
    };
    hips: {
        L: Landmark;
        R: Landmark;
    };
    wrists: {
        L: Landmark;
        R: Landmark;
    };
    torsoMid: Landmark;
}
export interface FaceFrame {
    iris: {
        L: Landmark;
        R: Landmark;
    };
    eyes: {
        L_outer: Landmark;
        L_inner: Landmark;
        R_inner: Landmark;
        R_outer: Landmark;
    };
    noseTip: Landmark;
    faceCenter: Landmark;
}
export interface FramePack {
    ts: number;
    pose?: PoseFrame;
    face?: FaceFrame;
    quality: {
        poseOk: boolean;
        faceOk: boolean;
    };
    scales: {
        faceWidthPx: number;
        torsoLengthPx: number;
    };
}
/**
 * Six extracted features from FramePack
 */
export interface Features {
    postureAngleDeg: number;
    swaySigma: number;
    gazeDevDeg: number;
    gazeBreaksPerMin: number;
    wristVelStd: number;
    torsoSpeed: number;
    [key: string]: number;
}
/**
 * Four subscores (Posture, Eye contact, Smoothness, Composure/pacing)
 * Each in [0, 1]
 */
export interface Subscores {
    P: number;
    E: number;
    S: number;
    C: number;
    [key: string]: number;
}
/**
 * Overall score extends subscores with weighted overall [0, 100]
 */
export interface Scores extends Subscores {
    overall: number;
}
/**
 * Tip rule interface for tips engine
 */
export interface TipRule {
    id: string;
    priority: number;
    windowSec: number;
    cooldownSec: number;
    when: (features: Features, subscores: Subscores) => boolean;
    message: string;
}
/**
 * Active tip with trigger timestamp
 */
export interface ActiveTip {
    rule: TipRule;
    triggeredAt: number;
}
//# sourceMappingURL=types.d.ts.map