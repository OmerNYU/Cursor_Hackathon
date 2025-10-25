import { useRef, useState } from 'react';

/**
 * Simple camera test component - NO MediaPipe
 * Just shows raw camera feed to verify camera works
 */
export function SimpleCameraTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('[SimpleTest] Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        },
        audio: false,
      });

      console.log('[SimpleTest] Camera stream obtained:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('[SimpleTest] Stream assigned to video element');
        
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('[SimpleTest] Video metadata loaded');
              resolve();
            };
          }
        });

        await videoRef.current.play();
        console.log('[SimpleTest] Video playing!');
        setIsStarted(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[SimpleTest] Error:', err);
      setError(errorMsg);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStarted(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-400 mb-4">
          Simple Camera Test
        </h1>
        <p className="text-gray-400 mb-6">
          Testing camera without MediaPipe - just raw video feed
        </p>

        <div className="mb-4 flex gap-4">
          {!isStarted ? (
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
            >
              Stop Camera
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="bg-gray-900/50 rounded-lg p-4">
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Video Feed</h2>
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              style={{ transform: 'scaleX(-1)' }}
              playsInline
              muted
              autoPlay
            />
            {!isStarted && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                Click "Start Camera" to begin
              </div>
            )}
          </div>

          {isStarted && (
            <div className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
              ✅ <strong>Camera Working!</strong> You should see your video feed above.
              <br />
              <span className="text-sm text-gray-400">
                If this works, the issue is with MediaPipe model loading, not the camera.
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="font-semibold text-gray-200 mb-2">Debug Info:</h3>
          <div className="text-sm font-mono text-gray-400 space-y-1">
            <div>Camera Status: {isStarted ? '✅ Running' : '⏸️ Stopped'}</div>
            <div>Video Element: {videoRef.current ? '✅ Exists' : '❌ Missing'}</div>
            <div>Stream: {videoRef.current?.srcObject ? '✅ Connected' : '⏸️ Not connected'}</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <h3 className="font-semibold text-blue-200 mb-2">🔍 What This Tests:</h3>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>Camera permission and access</li>
            <li>Video element rendering</li>
            <li>Video playback</li>
            <li>Mirror effect (scaleX transformation)</li>
          </ul>
          <p className="text-sm text-gray-400 mt-3">
            <strong>If this works:</strong> Your camera is fine, and the issue is MediaPipe model loading.
            <br />
            <strong>If this doesn't work:</strong> There's a browser/permission issue.
          </p>
        </div>
      </div>
    </div>
  );
}

