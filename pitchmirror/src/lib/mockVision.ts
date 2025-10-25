import { useRef, useEffect, useState } from 'react';
import { FramePack, UseMediaPipeResult } from './types';
import sampleFrames from '../fixtures/frames.sample.json';

/**
 * Mock implementation of useMediaPipe hook with REAL camera feed
 * - Displays live webcam video feed
 * - Returns fixture data for FramePack (pose/face landmarks)
 * This allows demo mode with real camera while keeping mock scoring
 */
export function useMediaPipe(): UseMediaPipeResult {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const [framePack, setFramePack] = useState<FramePack | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const frameIndexRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera access
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      try {
        // Request real camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });

        if (!mounted) {
          // Component unmounted, clean up stream
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        // Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }

        // Wait for video to be ready
        if (videoRef.current) {
          await videoRef.current.play();
        }

        setIsReady(true);
        setError(null);
      } catch (err) {
        console.error('Camera access error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Camera access denied');
          setIsReady(false);
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      // Clean up camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update mock fixture frames at ~10Hz for scoring data
  useEffect(() => {
    if (!isReady) return;

    // Update frames at ~10Hz to provide mock scoring data
    const interval = setInterval(() => {
      const frames = sampleFrames as FramePack[];
      const currentFrame = frames[frameIndexRef.current % frames.length];
      
      // Update timestamp to current time
      const updatedFrame: FramePack = {
        ...currentFrame,
        ts: Date.now() - startTimeRef.current,
      };

      setFramePack(updatedFrame);
      frameIndexRef.current++;
    }, 100); // ~10Hz

    return () => clearInterval(interval);
  }, [isReady]);

  return {
    framePack,
    videoRef,
    isReady,
    error,
  };
}

