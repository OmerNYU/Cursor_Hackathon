# PitchMirror Vision QA Checklist

## Manual Test Scenarios

### 1. Camera Setup & Initialization
- [ ] App loads without errors
- [ ] "Start Camera" button is visible
- [ ] Click "Start Camera" - browser prompts for camera permission
- [ ] Grant permission - video feed appears (mirrored)
- [ ] Video quality is acceptable (not frozen, decent framerate)
- [ ] Device selector shows available cameras (if multiple exist)

### 2. Lighting and Camera Positioning
- [ ] Good lighting: Scores are stable and reasonable
- [ ] Poor lighting: App continues to work (may show degraded quality)
- [ ] Camera at eye level: Eye contact score is high
- [ ] Camera below eye level: Eye contact score decreases appropriately
- [ ] Move far from camera: Detections still work (scales adjust)
- [ ] Move close to camera: Detections still work

### 3. Posture Score Testing
- [ ] Sit/stand with good upright posture → Posture score >80
- [ ] Tilt head/torso to the side → Posture score decreases
- [ ] Slouch → Posture score decreases
- [ ] Return to good posture → Score recovers within 2-3 seconds

### 4. Eye Contact Score Testing
- [ ] Look directly at camera → Eye contact score >80
- [ ] Look away from camera (left/right) → Eye contact score decreases
- [ ] Look down/up → Eye contact score decreases
- [ ] Repeatedly break gaze → "Gaze Breaks/Min" increases
- [ ] Maintain steady gaze → Score stays high, breaks stay low

### 5. Smoothness Score Testing
- [ ] Keep hands still → Smoothness score >80
- [ ] Fidget with hands near face → Smoothness score decreases
- [ ] Make smooth, deliberate hand movements → Score stays reasonable
- [ ] Rapid, jerky hand movements → Score decreases significantly
- [ ] Return to stillness → Score recovers

### 6. Pacing Score Testing
- [ ] Stay relatively still (minimal body movement) → Pacing score >80
- [ ] Sway side to side → Pacing score decreases
- [ ] Lean forward/backward repeatedly → Pacing score decreases
- [ ] Rock back and forth → Pacing score decreases
- [ ] Return to stillness → Score recovers

### 7. Occlusion and Recovery
- [ ] Cover face briefly with hand → faceOk flag turns false
- [ ] Remove hand → faceOk recovers within 500ms
- [ ] Move out of frame partially → Quality flags respond appropriately
- [ ] Return to frame → Detection resumes without restart needed

### 8. Tips System
- [ ] With all good scores → "Strong presence. Keep it up!" appears
- [ ] Poor posture → Posture-related tip appears
- [ ] Poor eye contact → Eye contact tip appears
- [ ] Fidgeting → Smoothness tip appears
- [ ] Excessive movement → Pacing tip appears
- [ ] Tips display at most 2 at a time
- [ ] Tips are actionable and helpful

### 9. Overlay Testing
- [ ] Click "Show Overlay" → Skeleton and landmarks appear
- [ ] Overlay aligns with body/face accurately
- [ ] Move around → Overlay tracks movements
- [ ] Click "Hide Overlay" → Overlay disappears
- [ ] Toggle multiple times → Works consistently

### 10. Debug Panel
- [ ] Detect Time shows reasonable values (10-50ms typical)
- [ ] Interval shows 80-150ms range
- [ ] FPS shows ~8-12 Hz
- [ ] Pose Count increments when body visible
- [ ] Face Count increments when face visible
- [ ] Pose OK / Face OK flags reflect visibility
- [ ] Slow Path flag activates when system is stressed
- [ ] Tilt degree matches actual head tilt
- [ ] Gaze Breaks/Min tracks eye movement breaks

### 11. Performance & Stability
- [ ] App runs smoothly for 5+ minutes
- [ ] No memory leaks (check browser task manager)
- [ ] CPU usage is reasonable (<30% on modern hardware)
- [ ] No console errors during normal operation
- [ ] Scores update smoothly without jerky changes

### 12. Background Tab Behavior
- [ ] Switch to another tab
- [ ] Wait 10 seconds
- [ ] Return to PitchMirror tab
- [ ] Detection resumes automatically
- [ ] No errors in console
- [ ] Scores continue updating normally

### 13. Error Handling
- [ ] Deny camera permission → Clear error message displayed
- [ ] No camera connected → Appropriate error message
- [ ] Click "Stop Camera" → Everything stops cleanly
- [ ] Click "Start Camera" again → Restarts successfully
- [ ] Refresh page → App resets properly

### 14. Developer Tuning Panel (Dev Mode Only)
- [ ] "Dev Tuning" button appears in development
- [ ] Click button → Panel opens with sliders
- [ ] Adjust "Posture Max Tilt" slider → Posture score sensitivity changes
- [ ] Adjust other sliders → Respective scores respond
- [ ] Current values display when available
- [ ] Click "Reset to Defaults" → Values return to original
- [ ] Close panel → Settings persist (localStorage)

### 15. Build & Production
- [ ] `npm run build` completes successfully
- [ ] `npm run preview` serves production build
- [ ] Production build works in browser
- [ ] No dev-only features visible in production
- [ ] Bundle size is reasonable (<500KB gzipped)

## Known Limitations

- MediaPipe models require good lighting for optimal performance
- Very rapid movements may cause brief detection drops
- Extreme camera angles may reduce accuracy
- First detection after startup may take 1-2 seconds
- Node version warning is cosmetic (app works fine with Node 20.17)

## Browser Compatibility

- ✅ Chrome/Chromium 90+
- ✅ Edge 90+
- ✅ Firefox 88+ (may have slight performance differences)
- ⚠️ Safari 14+ (WebGL support required)
- ❌ IE11 (not supported)

## Test Environment

- **Recommended:** Modern laptop/desktop with webcam
- **Minimum:** Dual-core CPU, 4GB RAM, integrated GPU
- **Optimal:** Quad-core CPU, 8GB RAM, dedicated GPU
- **Lighting:** Well-lit room with face clearly visible
- **Distance:** 2-4 feet from camera

## Success Criteria

- ✅ All core features functional
- ✅ All tests pass (`npm run test`)
- ✅ Confidence score updates in real-time
- ✅ 4 subscores track independently
- ✅ Tips appear based on scores
- ✅ Overlay renders correctly
- ✅ No console errors during normal use
- ✅ Tab visibility pause/resume works
- ✅ Production build works correctly

