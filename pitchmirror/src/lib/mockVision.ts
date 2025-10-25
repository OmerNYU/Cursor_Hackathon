import { useRef, useEffect, useState } from 'react';
import { FramePack, UseMediaPipeResult } from './types';
import sampleFrames from '../fixtures/frames.sample.json';

/**
 * Mock implementation of useMediaPipe hook
 * Returns fixture data in a loop to simulate live camera feed
 * This allows UI testing without actual Vision layer
 */
export function useMediaPipe(): UseMediaPipeResult {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const [framePack, setFramePack] = useState<FramePack | null>(null);
  const [isReady, setIsReady] = useState(false);
  const frameIndexRef = useRef(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Simulate loading time
    const loadTimer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Update frames at ~10Hz to simulate real MediaPipe output
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
    error: null,
  };
}

