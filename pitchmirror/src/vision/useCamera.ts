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

      // Assign stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for metadata to load
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }

          const video = videoRef.current;
          
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };

          const onError = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Failed to load video metadata'));
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
        });

        // Play video
        try {
          await videoRef.current.play();
        } catch {
          throw new Error('Autoplay blocked. Please interact with the page first.');
        }

        // Wait for video to have valid dimensions with timeout
        await new Promise<void>((resolve, reject) => {
          const startTime = Date.now();
          const timeout = 5000; // 5 second timeout
          
          const checkDimensions = () => {
            if (!videoRef.current) {
              reject(new Error('Video element lost during dimension check'));
              return;
            }
            
            const width = videoRef.current.videoWidth;
            const height = videoRef.current.videoHeight;
            
            console.log(`[Camera] Checking dimensions: ${width}x${height}`);
            
            if (width > 0 && height > 0) {
              console.log(`[Camera] ✓ Video dimensions ready: ${width}x${height}`);
              resolve();
            } else if (Date.now() - startTime > timeout) {
              // Timeout - try to force dimensions by reading from stream
              const track = streamRef.current?.getVideoTracks()[0];
              const settings = track?.getSettings();
              console.log('[Camera] Dimension timeout, track settings:', settings);
              
              if (settings?.width && settings?.height) {
                console.log(`[Camera] Using track dimensions: ${settings.width}x${settings.height}`);
                resolve();
              } else {
                reject(new Error(`Video dimensions never became valid after ${timeout}ms`));
              }
            } else {
              setTimeout(checkDimensions, 100);
            }
          };
          checkDimensions();
        });

        setIsReady(true);
        console.log('[Camera] ✓✓✓ Camera is ready ✓✓✓');
        
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

