# 🏗️ PitchMirror — Architecture & Coding Reference (MVP)

> **Purpose:** This document is the single source of truth for Cursor to implement the PitchMirror MVP quickly and cleanly.
> **Principles:** Browser‑only, privacy‑first, smooth at 10–15 FPS analysis, interpretable heuristics, minimal dependencies.

---

## 1) High‑Level System

```
getUserMedia (webcam)
  ↓
MediaPipe Pose + Face Landmarker (with Iris)
  ↓ landmarks + visibility + confidence
Normalize & Scale (face/torso units)
  ↓
Feature Extraction (angles, velocities, stability)
  ↓
Temporal Smoothing (EMA per metric)
  ↓
Sub‑Scores (P/E/S/C ∈ [0,1])
  ↓
Weighted Confidence (0–100)
  ↓
UI (overlay, meters, tips)
```

**State machine:** `INIT → CALIBRATING(3s) → RUNNING ↔ PAUSED` (error recovery back to `RUNNING` when possible).

---

## 2) Tech Stack & Dependencies

* **Framework:** React + Vite + Tailwind
* **Vision:** MediaPipe Tasks Vision (FaceLandmarker with iris) + MediaPipe Pose (BlazePose)
* **State:** React context or Zustand (simple global store)
* **Lang:** TypeScript preferred (but JS acceptable for sprint)
* **Optional:** Zod (runtime schema), Lucide (icons)

Browser APIs: `getUserMedia`, `WebGL`/`WebAssembly`, `requestAnimationFrame`.

---

## 3) File/Folder Structure

```
/src
  /components
    AppShell.jsx/tsx
    PitchMirror.jsx/tsx
    VideoCanvas.jsx/tsx          # draws camera frames
    OverlayCanvas.jsx/tsx        # skeleton/iris/guides
    ScorePanel.jsx/tsx           # overall + subscores bars
    SubscoreBar.jsx/tsx
    TipsPanel.jsx/tsx
    CalibrationBanner.jsx/tsx
    DebugPanel.jsx/tsx
  /hooks
    useCamera.ts                 # getUserMedia lifecycle
    useMediaPipe.ts              # load/run Pose & Face models
    useScoringLoop.ts            # rAF loop -> features -> scores
  /lib
    mediapipeLoader.ts           # lazy loaders for models
    types.ts                     # shared TS types/interfaces
    normalize.ts                 # scale/visibility helpers
    geometry.ts                  # angles, distances, vector math
    gaze.ts                      # eye/iris-based gaze estimation
    smoothing.ts                 # EMA + rolling stats
    featureProcessor.ts          # posture/eye/smooth/pacing
    scoreEngine.ts               # weights -> overall score
    tipsEngine.ts                # rules -> top 2 tips
    config.ts                    # thresholds/weights/tunables
  /fixtures
    frames.sample.json           # 3–5 example frames for tests
  /styles
    globals.css
main.tsx
index.html
```

---

## 4) Types & Data Contracts (TS‑style)

```ts
export type Vec2 = { x: number; y: number };
export type Vec3 = { x: number; y: number; z?: number };

export interface Landmark extends Vec3 { visibility?: number; }

export interface PoseFrame {
  shoulders: { L: Landmark; R: Landmark };
  hips: { L: Landmark; R: Landmark };
  wrists: { L: Landmark; R: Landmark };
  torsoMid: Landmark;   // (S_L+S_R)/2 and (H_L+H_R)/2 → midpoint
}

export interface FaceFrame {
  iris: { L: Landmark; R: Landmark };
  eyes: { L_outer: Landmark; L_inner: Landmark; R_inner: Landmark; R_outer: Landmark };
  noseTip: Landmark;
  faceCenter: Landmark; // mean of keypoints
}

export interface FramePack {
  ts: number;                // ms
  pose?: PoseFrame;          // undefined → degrade gracefully
  face?: FaceFrame;
  quality: { poseOk: boolean; faceOk: boolean };
  scales: { faceWidth: number; torsoLength: number };
}

export interface Features {
  postureAngleDeg: number;     // torso vs vertical
  swaySigma: number;           // pixel/normalized units
  gazeDevDeg: number;          // off-center angle
  gazeBreaksPerMin: number;    // EMA estimate
  wristVelStd: number;         // normalized by face width
  torsoSpeed: number;          // normalized units/sec
}

export interface Subscores { P: number; E: number; S: number; C: number; }
export interface Scores extends Subscores { overall: number; }
```

---

## 5) Config & Tunables (`config.ts`)

```ts
export const WEIGHTS = { P: 0.4, E: 0.3, S: 0.2, C: 0.1 } as const;
export const EMA_BETA = 0.3;            // smoothing for subscores
export const WINDOW_MS = 1500;          // for rolling stats

// Thresholds
export const TH = {
  postureMaxDeg: 12,         // ≤ good
  swayMax: 0.02,             // torso units
  gazeGoodDeg: 10,
  gazeMaxBreaksPerMin: 12,
  wristVelLo: 0.01,          // normalized
  wristVelHi: 0.08,
  paceIdealMax: 0.08         // units/sec
} as const;

// Tips rules (see §9) optionally loaded as JSON
```

---

## 6) Normalization & Quality Gating (`normalize.ts`)

* **Scale invariance:** Compute `faceWidth` (distance between eye outers) and `torsoLength` (distance between shoulder and hip midpoints). Normalize all distances/velocities by one of these scales.
* **Visibility/confidence:** If landmarks `visibility < v_min` (e.g., 0.5), mark metric as temporarily **unreliable**; hold last good value ("grace period" 500 ms) rather than dropping to 0.
* **Centering:** Convert to screen‑space coordinates; Y axis awareness (DOM canvas origin top‑left).

---

## 7) Feature Extraction (`featureProcessor.ts`)

### A) Posture

* Torso vector: `v = S_mid − H_mid`, with midpoints from shoulders/hips.
* Vertical deviation angle (deg): `theta = atan2(|v.x|, |v.y|) * 180/π`.
* Sway: rolling σ of `S_mid.x` and `H_mid.x` over `WINDOW_MS`, normalized by `torsoLength`.

**Score P:**

```
P_angle = 1 − clamp(theta / TH.postureMaxDeg, 0, 1)
P_sway  = 1 − clamp(swaySigma / TH.swayMax, 0, 1)
P = clamp(0.6*P_angle + 0.4*P_sway, 0, 1)
```

### B) Eye Contact

* Approx gaze vector per eye: from eye center to iris center; average both.
* Deviation angle from camera center: compute angle between gaze vector and screen normal.
* Gaze break: a contiguous run where `gazeDevDeg > TH.gazeGoodDeg` for ≥200 ms counts as one break. Track with EMA to estimate per‑minute rate.

**Score E:**

```
E_dev    = 1 − clamp(gazeDevDeg / (TH.gazeGoodDeg*1.8), 0, 1)
E_breaks = 1 − clamp(gazeBreaksPerMin / TH.gazeMaxBreaksPerMin, 0, 1)
E = clamp(0.7*E_dev + 0.3*E_breaks, 0, 1)
```

### C) Motion Smoothness (Hands)

* Per wrist velocity: `|p_t − p_{t−Δ}| / Δt` (normalized by `faceWidth`).
* Rolling `std dev` of velocity magnitude across `WINDOW_MS`.

**Score S:**

```
S = 1 − clamp((wristVelStd − TH.wristVelLo)/(TH.wristVelHi − TH.wristVelLo), 0, 1)
```

### D) Pacing (Body translation)

* Torso midpoint speed: `|torsoMid_t − torsoMid_{t−Δ}| / Δt` (normalized by `torsoLength`).

**Score C:**

```
C = 1 − clamp(torsoSpeed / (TH.paceIdealMax*1.5), 0, 1)
```

---

## 8) Scoring & Smoothing (`scoreEngine.ts`, `smoothing.ts`)

* Per metric EMA: `s_t = β x_t + (1−β) s_{t−1}` with `β = EMA_BETA`.
* Overall:

```
Confidence = 100 * (WEIGHTS.P*P + WEIGHTS.E*E + WEIGHTS.S*S + WEIGHTS.C*C)
```

* Clamp everything to `[0,1]` before weighting.

Timing loop: run feature extraction every `~80–120 ms` (≈ 8–12 Hz), UI redraw at 60 FPS; decouple via state store to avoid blocking.

---

## 9) Tips Engine (`tipsEngine.ts`)

**Rule shape:**

```ts
export interface TipRule {
  id: string;
  metric: keyof Features | keyof Subscores; // e.g., 'gazeDevDeg' or 'E'
  op: '>' | '<';
  threshold: number;         // compare against normalized/deg
  windowSec: number;         // condition must hold this long
  message: string;           // user-facing
  priority: 1|2|3;           // 1 highest
  cooldownSec: number;       // suppress repeats
}
```

**Starter rules (examples):**

* `{ id:'eye1', metric:'gazeDevDeg', op:'>', threshold:TH.gazeGoodDeg, windowSec:2, msg:'👀 Keep your eyes closer to the lens.', priority:1, cooldownSec:6 }`
* `{ id:'hand1', metric:'wristVelStd', op:'>', threshold:TH.wristVelHi, windowSec:2, msg:'🖐️ Hands a bit fidgety — add pauses.', priority:2, cooldownSec:6 }`
* `{ id:'post1', metric:'P', op:'<', threshold:0.7, windowSec:2, msg:'💪 Stack shoulders over hips.', priority:2, cooldownSec:6 }`
* `{ id:'pace1', metric:'torsoSpeed', op:'>', threshold:TH.paceIdealMax, windowSec:2, msg:'🚶 You’re pacing — plant your feet.', priority:3, cooldownSec:6 }`

Engine returns **top 2** active tips by priority; rules evaluate on **smoothed** metrics.

---

## 10) React Components & Responsibilities

* **AppShell**: global layout, theme, error boundaries.
* **PitchMirror**: orchestrates state machine; mounts camera, models, loop.
* **VideoCanvas**: renders webcam frames to `<canvas>`.
* **OverlayCanvas**: optional: pose skeleton + gaze ray; toggled in Debug.
* **ScorePanel**: large gauge + numeric 0–100.
* **SubscoreBar**: four small bars (P/E/S/C) with tooltips.
* **TipsPanel**: shows up to two current tips; fades with cooldown.
* **CalibrationBanner**: 3s instructions; checks lighting/centering.
* **DebugPanel**: toggles overlay, shows raw metrics, FPS, quality flags.

---

## 11) Hooks & Loops

* **useCamera**: request permissions; handle device selection; expose media stream; emits errors.
* **useMediaPipe**: lazy‑load models; expose `detect(frame)` returning `FramePack` + confidences.
* **useScoringLoop**: `requestAnimationFrame` + throttled analysis tick; writes `Features → Subscores → Scores` to store; invokes Tips Engine.

Performance notes:

* Use a hidden `<video>` as source for two canvases (video + overlay).
* Consider processing **every other frame** on low‑power machines.
* Avoid reallocating arrays inside the loop; reuse buffers.

---

## 12) UI/UX Details

* Dark theme; neon accent on the overall score.
* Color code subscores: red (<0.5), amber (0.5–0.7), green (>0.7).
* Micro‑copy is **supportive**. Avoid negative/judgmental phrasing.
* Accessibility: keyboard shortcuts: `Space` pause/resume; `O` overlay; `D` debug.

---

## 13) Degradation & Error Handling

* **No face but pose OK:** compute P/S/C; dim Eye Contact card with note.
* **Low visibility:** freeze last good metric for ≤500 ms; then gracefully decay toward neutral (0.6) rather than 0.
* **Camera denied:** show permission instructions; allow retry.

---

## 14) Testing & Debugging

* **Fixtures:** `/fixtures/frames.sample.json` with 20–30 synthetic frames (pose/face) to unit test feature functions.
* **Unit tests:** (optional in sprint) for geometry, smoothing, and each metric function.
* **Manual QA:** DebugPanel displays raw metrics and smoothed values; a sparkline for each metric is a plus (post‑MVP).

---

## 15) Build & Run

* Create app: `npm create vite@latest pitchmirror -- --template react`
* Install: `npm i @mediapipe/tasks-vision @mediapipe/pose zustand`
* Dev: `npm run dev` (serve over HTTPS for camera if needed)
* Deploy: Vercel/Netlify (no server required)

---

## 16) Demo Script (2–3 minutes)

1. Open app → 3‑second calibration banner.
2. Stand centered; watch **Confidence** climb when posture/gaze improve.
3. Intentionally look away or fidget → watch subscores and **Tips** update.
4. Toggle DebugOverlay to show judges it’s interpretable, not a black box.

---

## 17) Stretch (Post‑MVP)

* Local session history (rolling 10 sessions in `localStorage`).
* Shareable badge export (PNG) with overall + subscores.
* Weight presets (Interview / Keynote / Sales).

---

## 18) Pseudocode Snippets

**Scoring tick:**

```ts
function tick(nowMs: number) {
  const frame = detector.detect(videoEl);              // useMediaPipe
  const feat  = extractFeatures(frame);                // featureProcessor
  const sub   = smoothAndScore(feat);                  // smoothing + scoreEngine
  const tips  = selectTips(sub, feat, nowMs);          // tipsEngine
  store.set({ frame, feat, sub, tips, overall: computeOverall(sub) });
}
```

**EMA:**

```ts
const ema = (prev: number, x: number, beta = EMA_BETA) => beta*x + (1-beta)*prev;
```

---

## 19) Coding Tasks Checklist (for Cursor)

* [ ] Camera + canvases wiring
* [ ] MediaPipe loaders + detectors
* [ ] Normalization + quality gating
* [ ] Feature functions (P/E/S/C) + unit helpers
* [ ] EMA smoothing + overall scoring
* [ ] Tips Engine (rules + cooldown)
* [ ] UI components (meters, bars, tips, debug)
* [ ] State machine & calibration flow
* [ ] Performance pass (throttle, reuse buffers)

