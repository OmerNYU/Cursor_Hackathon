# 💼 PitchMirror — AI-Powered Presentation Feedback

> A browser-only "smart mirror" that gives you real-time confidence scores and actionable tips for your presentations, interviews, and video calls.

## 🎯 What It Does

PitchMirror analyzes your body language in real-time using computer vision and provides:

- **Confidence Score (0-100)**: Overall presentation quality
- **4 Detailed Subscores**:
  - 💪 **Posture** (40%): Torso alignment and stability  
  - 👀 **Eye Contact** (30%): Gaze direction and steadiness
  - 🖐️ **Smoothness** (20%): Hand movement control
  - 🚶 **Pacing** (10%): Body movement speed
- **Actionable Tips**: Real-time suggestions based on your performance
- **Visual Overlay**: See pose skeleton and face landmarks

## 🔒 Privacy-First

- **100% client-side processing** using MediaPipe
- No video data leaves your device
- No cloud uploads, no data retention
- Works offline after initial load

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (currently using 20.17.0)
- Modern browser with webcam support
- Good lighting for optimal performance

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Open http://localhost:4173
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui
```

All 34 unit tests cover:
- Mathematical utilities (clamp, distance, EMA, median)
- Feature extraction (posture, eye contact, smoothness, pacing)
- Quality assessment and visibility handling

## 🎨 Features

### Core Functionality
- ✅ Real-time pose and face detection (10 Hz)
- ✅ Adaptive analysis throttling (80-150ms)
- ✅ Exponential moving average smoothing
- ✅ Visibility hold (500ms grace period)
- ✅ Document visibility pause/resume
- ✅ Consecutive error backoff

### UI Components
- ✅ Mirrored video feed
- ✅ Toggle-able skeleton overlay
- ✅ Live confidence meter
- ✅ Color-coded subscores
- ✅ Top 2 actionable tips
- ✅ Comprehensive debug panel

### Developer Tools
- ✅ Live threshold tuning panel (dev mode only)
- ✅ Debug metrics display
- ✅ Performance monitoring
- ✅ LocalStorage settings persistence

## 📊 Scoring Logic

### Confidence Formula

```
Confidence = 100 × (0.4×P + 0.3×E + 0.2×S + 0.1×C)
```

Where:
- **P** = Posture Score (0-1)
- **E** = Eye Contact Score (0-1)
- **S** = Smoothness Score (0-1)
- **C** = Pacing Score (0-1)

### Default Thresholds

| Metric | Threshold | Meaning |
|--------|-----------|---------|
| Posture Tilt | ≤12° | Good vertical alignment |
| Eye Off-Center | ≤10° | Looking at camera |
| Gaze Breaks | ≤12/min | Steady eye contact |
| Wrist Velocity σ | ≤0.025 | Smooth hand movements |
| Torso Speed | ≤0.08 units/s | Minimal pacing |

*Thresholds are adjustable via the Dev Tuning Panel*

## 🏗️ Architecture

```
src/
├── app/
│   └── VisionHarness.tsx        # Main UI component
├── vision/
│   ├── types.ts                 # TypeScript interfaces
│   ├── math.ts                  # Utility functions
│   ├── useCamera.ts             # Camera lifecycle hook
│   ├── mediapipeLoader.ts       # Model loading (singleton)
│   ├── extract.ts               # Landmark extraction
│   ├── useVision.ts             # Main orchestrator hook
│   ├── features.ts              # Feature computation
│   ├── scoring.ts               # Confidence & tips
│   ├── adaptor.ts               # UI data adapter
│   ├── overlay.ts               # Canvas rendering
│   ├── TuningPanel.tsx          # Dev tuning UI
│   ├── fixtures/                # Test data
│   │   └── frames.sample.json
│   └── __tests__/               # Unit tests
│       ├── math.test.ts
│       └── features.test.ts
├── main.tsx                     # App entry point
└── index.css                    # Global styles

docs/
└── vision-qa.md                 # Manual QA checklist
```

## 🔧 Tech Stack

- **Framework**: React 19 + Vite 7
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Vision**: MediaPipe Tasks Vision
- **State**: React Hooks + Zustand (ready)
- **Testing**: Vitest + Testing Library
- **Build**: Vite (ESM)

## 📦 Key Dependencies

```json
{
  "@mediapipe/tasks-vision": "^0.10.22",
  "react": "^19.1.1",
  "zustand": "^5.0.8",
  "zod": "^4.1.12",
  "tailwindcss": "^4.1.16",
  "vitest": "^4.0.3"
}
```

## 🎯 Usage

1. **Click "Start Camera"** - Grant camera permission
2. **Position yourself** - Face camera at eye level, 2-4 feet away
3. **Watch scores update** - Confidence and subscores update in real-time
4. **Read tips** - Follow actionable suggestions
5. **Toggle overlay** - See visual feedback on pose tracking
6. **Adjust thresholds** - Use Dev Tuning panel (dev mode only)

## 🐛 Troubleshooting

### Camera not starting
- Check browser permissions (chrome://settings/content/camera)
- Ensure no other app is using the camera
- Try a different browser

### Low scores despite good posture
- Check lighting (face should be well-lit)
- Verify camera angle (eye level is best)
- Adjust thresholds via Dev Tuning Panel

### Performance issues
- Close other tabs/applications
- Check CPU usage in browser task manager
- Reduce video resolution (modify constraints in useCamera.ts)

### Detection drops
- Improve lighting conditions
- Stay within camera frame
- Avoid rapid movements

## 📋 Manual QA

See [docs/vision-qa.md](./docs/vision-qa.md) for complete manual testing checklist covering:
- Camera setup & initialization
- All 4 subscore validations
- Occlusion recovery
- Performance & stability
- Background tab behavior
- Error handling

## 🚦 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Recommended |
| Edge 90+ | ✅ Full | Recommended |
| Firefox 88+ | ✅ Good | Slight perf differences |
| Safari 14+ | ⚠️ Partial | WebGL required |
| IE11 | ❌ None | Not supported |

## 🛣️ Roadmap

- [x] Core vision system
- [x] Real-time scoring
- [x] Tips engine
- [x] Visual overlay
- [x] Dev tuning panel
- [ ] Session history (localStorage)
- [ ] Shareable badges
- [ ] Custom weight profiles
- [ ] Recording & playback
- [ ] Multi-language support

## 📄 License

Apache 2.0 - See LICENSE file

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

## 🏆 Cursor Hackathon

Built for the Cursor Hackathon - AI-assisted development showcase.

**Branch**: `hassan_pipeline`

---

Made with ❤️ using Cursor AI
