# PitchMirror - Frontend Implementation

AI-powered confidence scorer for presentations running entirely in the browser.

## Features

- **Real-time Analysis**: Analyzes posture, eye contact, motion smoothness, and pacing at 10Hz
- **Live Scores**: Overall confidence score (0-100) with detailed subscores (P/E/S/C)
- **Coaching Tips**: Up to 2 actionable tips displayed in real-time
- **Privacy-First**: All processing happens client-side, no data leaves your device
- **Demo Mode**: Works with mock data when camera is unavailable

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand (ready for integration)

## Getting Started

### Prerequisites

- Node.js 20+ (installed via conda in this setup)
- npm

### Installation

```bash
cd pitchmirror
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
pitchmirror/
├── src/
│   ├── components/          # React UI components
│   │   ├── PitchMirror.tsx     # Main orchestrator
│   │   ├── VideoCanvas.tsx      # Webcam display
│   │   ├── OverlayCanvas.tsx    # Pose/gaze overlay
│   │   ├── ScorePanel.tsx       # Overall score display
│   │   ├── SubscoreBar.tsx      # Individual subscore bars
│   │   ├── TipsPanel.tsx        # Coaching tips
│   │   ├── CalibrationBanner.tsx # Initial setup banner
│   │   └── DebugPanel.tsx       # Debug information
│   ├── hooks/               # Custom React hooks
│   │   └── useScoringLoop.ts    # Main state management
│   ├── lib/                 # Utilities and types
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── mockVision.ts        # Mock Vision layer
│   │   └── mockLogic.ts         # Mock Logic layer
│   ├── fixtures/            # Test data
│   │   └── frames.sample.json   # Sample frame data
│   └── styles/              # Global styles
│       └── globals.css          # Tailwind + custom CSS
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Keyboard Shortcuts

- **Space**: Pause/Resume scoring updates
- **O**: Toggle pose/gaze overlay
- **D**: Toggle debug panel

## UI Components

### PitchMirror (Main Component)
State machine with three phases:
1. **INIT**: Initial loading
2. **CALIBRATING**: 3-second setup period
3. **RUNNING**: Active scoring

### VideoCanvas
Renders mirrored webcam feed using `requestAnimationFrame` for 60 FPS display.

### OverlayCanvas
Draws skeletal overlay and gaze indicators:
- Green = good quality
- Red = poor quality
- Transparent when disabled

### ScorePanel
Large confidence score with color-coded display:
- Green (80+): Excellent
- Blue (60-79): Good
- Yellow (40-59): Fair
- Red (<40): Needs improvement

### SubscoreBar
Individual bars for:
- **P** (Presence): Posture and stability
- **E** (Eye Contact): Gaze direction and breaks
- **S** (Stillness): Hand movement control
- **C** (Composure): Body pacing

### TipsPanel
Displays up to 2 coaching tips based on lowest subscores.

### CalibrationBanner
Shown during calibration with setup instructions.

### DebugPanel
Developer overlay showing:
- FPS counter
- Quality flags (pose/face OK)
- Mode (MOCK vs LIVE)
- Raw feature values

## Integration with Vision & Logic Layers

The frontend is designed to be **integration-ready**:

### Vision Layer Integration
Replace mock in `src/hooks/useScoringLoop.ts`:
```typescript
// Current (mock):
import { useMediaPipe } from '../lib/mockVision';

// Replace with real implementation:
import { useMediaPipe } from '../path/to/real/vision';
```

### Logic Layer Integration
Replace mock in `src/hooks/useScoringLoop.ts`:
```typescript
// Current (mock):
import { evaluate } from '../lib/mockLogic';

// Replace with real implementation:
import { evaluate } from '../path/to/real/logic';
```

All interfaces in `src/lib/types.ts` match the specifications exactly, ensuring seamless integration.

## State Management

The `useScoringLoop` hook:
- Updates React state at 10Hz (not every animation frame)
- Tracks FPS independently
- Manages pause/overlay states
- Respects quality flags from Vision layer
- Falls back to mock mode gracefully

## Mock Data

Sample frames in `src/fixtures/frames.sample.json` provide:
- 5 frames with various poses and quality states
- Realistic landmark coordinates
- Both good and degraded quality examples
- Loopable for continuous testing

## Performance

- **Canvas rendering**: 60 FPS via `requestAnimationFrame`
- **Score updates**: 10 Hz (throttled React state)
- **Build size**: ~212 KB JS, ~18 KB CSS (gzipped: 65 KB + 4 KB)
- **No blocking operations**: All heavy lifting delegated to Vision/Logic

## Styling

- Dark theme (zinc-950 background)
- Neon accents for scores
- Smooth animations for all transitions
- Responsive layout (mobile-friendly)
- Accessible color contrasts

## Future Enhancements

When integrating with real Vision/Logic:
1. Test with actual webcam feed
2. Tune throttling intervals based on performance
3. Add session history (localStorage)
4. Implement shareable badges
5. Add weight customization
6. Performance monitoring

## Development Notes

- Built with TypeScript strict mode
- All components are functional (no classes)
- Uses modern React patterns (hooks, refs)
- Minimal dependencies for fast builds
- No runtime errors in production build

## License

Part of the PitchMirror project.

