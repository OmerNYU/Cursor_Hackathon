import { useEffect, useRef } from 'react';
import type { FramePack, Landmark } from '../lib/types';

const lines: Array<[string, string]> = [['shoulders.L', 'shoulders.R'], ['shoulders.L', 'hips.L'], ['shoulders.R', 'hips.R'], ['hips.L', 'hips.R'], ['shoulders.L', 'wrists.L'], ['shoulders.R', 'wrists.R']];
const get = (pose: NonNullable<FramePack['pose']>, path: string): Landmark => path.split('.').reduce((value, key) => (value as Record<string, unknown>)[key], pose as unknown) as Landmark;

export default function Overlay({ frame, visible }: { frame?: FramePack; visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    context.clearRect(0, 0, width, height);
    if (!visible || !frame?.pose) return;
    context.strokeStyle = '#45d6a4'; context.fillStyle = '#d8fff3'; context.lineWidth = 3;
    for (const [from, to] of lines) {
      const a = get(frame.pose, from); const b = get(frame.pose, to);
      context.beginPath(); context.moveTo((1 - a.x) * width, a.y * height); context.lineTo((1 - b.x) * width, b.y * height); context.stroke();
    }
    Object.values(frame.pose.shoulders).concat(Object.values(frame.pose.hips), Object.values(frame.pose.wrists)).forEach((point) => {
      context.beginPath(); context.arc((1 - point.x) * width, point.y * height, 4, 0, Math.PI * 2); context.fill();
    });
  }, [frame, visible]);
  return <canvas aria-hidden="true" ref={canvasRef} className="overlay" />;
}
