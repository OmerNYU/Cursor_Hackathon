# 💼 PitchMirror — AI That Reflects Your Confidence

> **One-liner:** A browser‑only “smart mirror” that gives you a real‑time Confidence Score (0–100) with transparent sub‑scores for posture, eye contact, motion smoothness, and pacing.

---

## 🎯 Problem

Remote pitches and interviews are now the norm, but most people lack feedback on **how they look and move** on camera. Existing tools are either subjective, slow (human coaching), or privacy‑invasive (cloud uploads).

---

## ✅ Solution

**PitchMirror** runs entirely **client‑side** in the browser using MediaPipe. It analyzes pose, gaze, and motion in real time and outputs:

* **Confidence Score (0–100)**
* **Four sub‑scores**: Posture, Eye Contact, Motion Smoothness, Pacing
* **Actionable tips** surfaced live (e.g., “Keep your gaze nearer the lens”)

No video ever leaves the device.

---

## 👤 Target Users & Jobs-to-be-Done

* **Founders & students**: Practice demo days, thesis defenses, class presentations.
* **Job seekers**: Optimize body language for virtual interviews.
* **Sales/CSM reps**: Improve presence on client calls.
* **Public speakers**: Rehearse talks with measurable progress.

**JTBD:** “When I rehearse on camera, I want objective, real‑time feedback so I can adjust posture, gaze, and movement to appear confident.”

---

## 🧠 How It Works (High level)

```
webcam → MediaPipe (Pose + Face Landmarker/Iris)
      → landmarks + visibility
      → feature calculator (angles, velocities, stability)
      → temporal smoothing (EMA)
      → sub‑scores (0–1)
      → weighted Confidence Score (0–100)
      → UI overlay + tips
```

---

## 📐 Metrics Computed (v1 heuristics)

| Aspect                | Landmarks                   | What We Measure                     | Scoring (0–1)                                                 |
| --------------------- | --------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| **Posture**           | L/R Shoulders & Hips        | Torso verticality + sway            | Based on deviation angle (≤12° good) + shoulder/hip stability |
| **Eye Contact**       | Iris, eye corners, nose tip | Gaze direction + gaze breaks/min    | Penalizes >10° off‑center or >12 breaks/min                   |
| **Motion Smoothness** | L/R Wrists                  | Hand fidgeting (velocity std. dev.) | Lower jitter → higher score                                   |
| **Pacing**            | Torso midpoint              | Distance moved per second           | Excessive movement (>0.08 normalized units/s) lowers score    |

**Smoothing:** EMA with β≈0.3 for stable, real‑time feedback.

---

## 🧮 Confidence Formula

[ \text{Confidence} = 100 \times (0.4P + 0.3E + 0.2S + 0.1C) ]

| Symbol | Meaning           | Weight |
| ------ | ----------------- | ------ |
| P      | Posture Score     | 0.40   |
| E      | Eye Contact Score | 0.30   |
| S      | Smoothness Score  | 0.20   |
| C      | Pacing Score      | 0.10   |

> **Design note:** Weights are adjustable post‑MVP via quick user testing.

---

## 💬 Tips Engine (Examples)

* 👀 *“Try keeping your eyes closer to the camera.”*
* 💪 *“Great posture — keep shoulders stacked over hips.”*
* 🖐️ *“Hands a bit fidgety — add purposeful pauses.”*
* 🚶 *“You’re pacing a lot — plant your feet for emphasis.”*

Rules: Trigger tips when a sub‑score stays <0.7 for ≥2s. Surface at most **two** tips at once.

---

## 🖥️ UI/UX Sketch

* **Left:** Live webcam with optional skeleton/iris overlay.
* **Right:** Big confidence meter + 4 mini‑bars + top 2 tips.
* **3‑sec Calibration:** “Center yourself, check lighting, camera at eye level.”
* Minimal dark theme (React + Tailwind).

---

## 🔒 Privacy & ⚡ Performance

* 100% **in‑browser** (MediaPipe/TensorFlow.js). No uploads.
* Target **10–15 FPS** analysis; 30 FPS display.
* Works on modern desktop browsers; graceful degradation on low‑end hardware.

---

## 💸 Monetization

* **Free tier:** 3 runs/day, no login required.
* **Pro ($10/mo):** Unlimited sessions, session history, trends, exportable reports, custom weights.
* **Team ($29/mo/user):** Shared dashboards, benchmarks, badges.

---

## 🧲 Differentiators

* Transparent, interpretable **sub‑scores** (not a black‑box coach).
* **Privacy‑first:** Runs locally; no data retention risk.
* **Instant gratification:** Visible change as you adjust your behavior.

---

## 🔬 Rapid Validation Plan (Week 1)

1. Launch MVP link; collect **time‑to‑first‑score** and **avg session duration** (optional, local-only counters or opt‑in telemetry later).
2. 20 user tests (founders/students) → tune thresholds and weights.
3. Ship **shareable badge** (“Confidence 93/100”) for viral loop.

**Success criteria:** ≥60% say feedback felt *useful* and *supportive*; ≥30% return within 48h.

---

## 🗺️ Roadmap

* **Sprint 1 (MVP):** Webcam → heuristics → scores → tips → UI.
* **Sprint 2:** Session history (localStorage), shareable badge, custom weights.
* **Sprint 3:** Premium gating, simple analytics, export PDF.

---

## ⚠️ Risks & Mitigations

* **Lighting/occlusion:** Provide calibration guidance; fallback to partial scoring when confidence on landmarks < threshold.
* **Over‑coaching fatigue:** Cap tips to 2 at a time; rotate phrasing.
* **Device variance:** Use feature normalization (relative to torso/face scale).

---

## ❓ Open Questions

* Should we gamify (Bronze → Silver → Gold) or keep neutral/coaching tone?
* Do we allow **custom weight profiles** (e.g., interviewing vs. keynote)?
* Should we expose **raw feature graphs** for power users?

---

## 📎 Appendix A — Initial Heuristic Thresholds

* Posture: good ≤12° torso deviation; sway σ < 0.02 torso units.
* Eye contact: off‑center >10° penalty; >12 gaze breaks/min penalty.
* Smoothness: wrist velocity σ normalized by face width; lower is better.
* Pacing: torso speed ideal <0.08 normalized units/s; penalize above.

---

## 🏷️ Shareable Badge (v1 spec)

* “Confidence **XX/100**” + sub‑score chips (P/E/S/C) and timestamp.
* Light/dark variants; PNG export.
* Optional watermark: “Made with PitchMirror.”
