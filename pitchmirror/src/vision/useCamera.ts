import { useEffect, useRef, useState, useCallback } from 'react';

export interface CameraAPI {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: (deviceId?: string) => Promise<void>;
  stop: () => void;
  isReady: boolean;
  error: string | null;
  devices: Array<{ deviceId: string; label: string }>;
  selectDevice: (deviceId: string) => Promise<void>;
}

/**
 * React hook for managing camera access and video stream
 * Handles getUserMedia, device enumeration, and stream lifecycle
 */
export function useCamera(): CameraAPI {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Array<{ deviceId: string; label: string }>>([]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const enumerateDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
        }));
      setDevices(videoDevices);
    } catch (err) {
      console.error('Failed to enumerate devices:', err);
    }
  }, []);

  const start = useCallback(async (deviceId?: string) => {
    try {
      setError(null);
      setIsReady(false);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Stop any existing stream
      stop();

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
              facingMode: 'user',
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

        // Assign stream to video element using the WORKING pattern from SimpleVideoTest
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('[Camera] Stream assigned to video element');
          
          // THIS is the pattern that works!
          await new Promise<void>((resolve, reject) => {
            if (!videoRef.current) {
              reject(new Error('Video element not available'));
              return;
            }

            const video = videoRef.current;
            
            video.onloadedmetadata = () => {
              console.log('[Camera] Video metadata loaded');
              video.play().then(() => {
                const width = video.videoWidth;
                const height = video.videoHeight;
                console.log(`[Camera] ✓✓✓ Video playing! ${width}x${height}`);
                setIsReady(true);
                resolve();
              }).catch(err => {
                reject(new Error(`Play failed: ${err.message}`));
              });
            };

            video.onerror = () => {
              reject(new Error('Video element error'));
            };
          });
        
        // Enumerate devices after successful permission
        await enumerateDevices();
      }
    } catch (err) {
      let errorMessage = 'Failed to access camera';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera access was denied. Please grant camera permission.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera device found. Please connect a camera.';
        } else if (err.message.includes('Autoplay')) {
          errorMessage = err.message;
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setIsReady(false);
      stop();
    }
  }, [stop, enumerateDevices]);

  const selectDevice = useCallback(
    async (deviceId: string) => {
      await start(deviceId);
    },
    [start]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    videoRef,
    start,
    stop,
    isReady,
    error,
    devices,
    selectDevice,
  };
}

