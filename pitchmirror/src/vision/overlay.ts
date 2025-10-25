import type { PoseFrame, FaceFrame } from './types';

/**
 * Draws pose skeleton and face landmarks on a canvas
 * Optimized for 60fps rendering - no allocations in hot path
 * 
 * @param ctx - Canvas 2D rendering context
 * @param dims - Canvas dimensions {w, h}
 * @param pose - Optional pose frame with body landmarks
 * @param face - Optional face frame with facial landmarks
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  dims: { w: number; h: number },
  pose?: PoseFrame,
  face?: FaceFrame
): void {
  // Clear canvas
  ctx.clearRect(0, 0, dims.w, dims.h);
  
  // Scale factors for normalized coordinates
  const { w, h } = dims;
  
  // Configure drawing style
  const lineWidth = Math.max(2, w * 0.003);
  const circleRadius = Math.max(3, w * 0.005);
  
  // Draw pose skeleton
  if (pose) {
    ctx.strokeStyle = '#60a5fa'; // Blue
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    
    // Shoulders line
    ctx.beginPath();
    ctx.moveTo(pose.shoulders.L.x * w, pose.shoulders.L.y * h);
    ctx.lineTo(pose.shoulders.R.x * w, pose.shoulders.R.y * h);
    ctx.stroke();
    
    // Hips line
    ctx.beginPath();
    ctx.moveTo(pose.hips.L.x * w, pose.hips.L.y * h);
    ctx.lineTo(pose.hips.R.x * w, pose.hips.R.y * h);
    ctx.stroke();
    
    // Torso line (shoulder mid to hip mid)
    const shoulderMid = {
      x: (pose.shoulders.L.x + pose.shoulders.R.x) / 2,
      y: (pose.shoulders.L.y + pose.shoulders.R.y) / 2,
    };
    const hipMid = {
      x: (pose.hips.L.x + pose.hips.R.x) / 2,
      y: (pose.hips.L.y + pose.hips.R.y) / 2,
    };
    
    ctx.beginPath();
    ctx.moveTo(shoulderMid.x * w, shoulderMid.y * h);
    ctx.lineTo(hipMid.x * w, hipMid.y * h);
    ctx.stroke();
    
    // Left arm
    ctx.beginPath();
    ctx.moveTo(pose.shoulders.L.x * w, pose.shoulders.L.y * h);
    ctx.lineTo(pose.wrists.L.x * w, pose.wrists.L.y * h);
    ctx.stroke();
    
    // Right arm
    ctx.beginPath();
    ctx.moveTo(pose.shoulders.R.x * w, pose.shoulders.R.y * h);
    ctx.lineTo(pose.wrists.R.x * w, pose.wrists.R.y * h);
    ctx.stroke();
    
    // Joint circles
    ctx.fillStyle = '#60a5fa';
    
    [
      pose.shoulders.L,
      pose.shoulders.R,
      pose.hips.L,
      pose.hips.R,
      pose.wrists.L,
      pose.wrists.R,
    ].forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x * w, point.y * h, circleRadius, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
  
  // Draw face landmarks
  if (face) {
    ctx.fillStyle = '#34d399'; // Green
    
    // Iris centers
    [face.iris.L, face.iris.R].forEach(iris => {
      ctx.beginPath();
      ctx.arc(iris.x * w, iris.y * h, circleRadius * 1.5, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Nose tip
    ctx.fillStyle = '#fbbf24'; // Yellow
    ctx.beginPath();
    ctx.arc(face.noseTip.x * w, face.noseTip.y * h, circleRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Eye corners (optional, subtle)
    ctx.fillStyle = 'rgba(52, 211, 153, 0.5)'; // Semi-transparent green
    const eyePoints = [
      face.eyes.L_outer,
      face.eyes.L_inner,
      face.eyes.R_inner,
      face.eyes.R_outer,
    ];
    
    eyePoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x * w, point.y * h, circleRadius * 0.7, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
}

