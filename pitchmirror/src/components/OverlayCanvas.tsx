import { useEffect, useRef } from 'react';
import { FramePack } from '../lib/types';

export interface OverlayCanvasProps {
  frame: FramePack | null;
  show: boolean;
}

/**
 * OverlayCanvas - Draws pose skeleton and gaze ray overlay
 * 
 * Uses requestAnimationFrame for smooth rendering
 * Color codes based on quality flags
 * Only draws when show=true
 */
export default function OverlayCanvas({ frame, show }: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawOverlay = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!show || !frame) {
        rafRef.current = requestAnimationFrame(drawOverlay);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Helper to convert normalized coords (0-1) to canvas pixels
      const toPixel = (x: number, y: number) => ({
        x: x * width,
        y: y * height,
      });

      // Draw pose skeleton if available
      if (frame.pose) {
        const { shoulders, hips, wrists } = frame.pose;
        const color = frame.quality.poseOk ? '#39ff14' : '#ff4444';

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Draw shoulder line
        const lShoulder = toPixel(shoulders.L.x, shoulders.L.y);
        const rShoulder = toPixel(shoulders.R.x, shoulders.R.y);
        ctx.beginPath();
        ctx.moveTo(lShoulder.x, lShoulder.y);
        ctx.lineTo(rShoulder.x, rShoulder.y);
        ctx.stroke();

        // Draw hip line
        const lHip = toPixel(hips.L.x, hips.L.y);
        const rHip = toPixel(hips.R.x, hips.R.y);
        ctx.beginPath();
        ctx.moveTo(lHip.x, lHip.y);
        ctx.lineTo(rHip.x, rHip.y);
        ctx.stroke();

        // Draw spine (torso)
        const shoulderMid = toPixel(
          (shoulders.L.x + shoulders.R.x) / 2,
          (shoulders.L.y + shoulders.R.y) / 2
        );
        const hipMid = toPixel(
          (hips.L.x + hips.R.x) / 2,
          (hips.L.y + hips.R.y) / 2
        );
        ctx.beginPath();
        ctx.moveTo(shoulderMid.x, shoulderMid.y);
        ctx.lineTo(hipMid.x, hipMid.y);
        ctx.stroke();

        // Draw arms
        const lWrist = toPixel(wrists.L.x, wrists.L.y);
        const rWrist = toPixel(wrists.R.x, wrists.R.y);
        
        ctx.beginPath();
        ctx.moveTo(lShoulder.x, lShoulder.y);
        ctx.lineTo(lWrist.x, lWrist.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rShoulder.x, rShoulder.y);
        ctx.lineTo(rWrist.x, rWrist.y);
        ctx.stroke();

        // Draw joint circles
        ctx.fillStyle = color;
        [lShoulder, rShoulder, lHip, rHip, lWrist, rWrist].forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw face/gaze indicators if available
      if (frame.face) {
        const { iris, faceCenter } = frame.face;
        const color = frame.quality.faceOk ? '#00ffff' : '#ff4444';

        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        // Draw eye landmarks
        const lIris = toPixel(iris.L.x, iris.L.y);
        const rIris = toPixel(iris.R.x, iris.R.y);

        // Draw iris positions
        ctx.beginPath();
        ctx.arc(lIris.x, lIris.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rIris.x, rIris.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw gaze ray from face center
        const faceCenterPx = toPixel(faceCenter.x, faceCenter.y);
        const avgIrisX = (iris.L.x + iris.R.x) / 2;
        const avgIrisY = (iris.L.y + iris.R.y) / 2;
        
        // Calculate gaze direction
        const gazeVecX = avgIrisX - faceCenter.x;
        const gazeVecY = avgIrisY - faceCenter.y;
        
        // Draw gaze ray
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(faceCenterPx.x, faceCenterPx.y);
        ctx.lineTo(
          faceCenterPx.x + gazeVecX * width * 3,
          faceCenterPx.y + gazeVecY * height * 3
        );
        ctx.stroke();

        // Draw face center point
        ctx.beginPath();
        ctx.arc(faceCenterPx.x, faceCenterPx.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(drawOverlay);
    };

    rafRef.current = requestAnimationFrame(drawOverlay);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [frame, show]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: show ? 1 : 0, transition: 'opacity 0.3s' }}
    />
  );
}

