import { useEffect, useRef } from 'react';

export interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

/**
 * VideoCanvas - Renders mirrored webcam feed to canvas
 * 
 * Uses requestAnimationFrame for smooth rendering without React re-renders
 * Mirrors video horizontally so user sees themselves as in a mirror
 */
export default function VideoCanvas({ videoRef }: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = () => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        // Set canvas size to match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        // Mirror horizontally
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [videoRef]);

  return (
    <>
      {/* Hidden video element that receives webcam stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
      />
      
      {/* Canvas that displays the mirrored video */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover rounded-2xl bg-zinc-900"
      />
    </>
  );
}

