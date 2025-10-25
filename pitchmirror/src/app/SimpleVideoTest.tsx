import { useRef, useState } from 'react';

export function SimpleVideoTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [message, setMessage] = useState('Click Start to begin');

  const handleStart = async () => {
    try {
      setMessage('Requesting camera...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      });
      
      setMessage('Got stream, connecting to video...');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          setMessage('Video loaded, playing...');
          videoRef.current?.play().then(() => {
            setMessage(`✅ WORKING! ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
            setStream(mediaStream);
          }).catch(err => {
            setMessage(`❌ Play failed: ${err.message}`);
          });
        };
      }
    } catch (err) {
      setMessage(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleStop = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStream(null);
      setMessage('Stopped');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Simple Video Test</h1>
      <p className="text-xl mb-8">{message}</p>
      
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleStart}
          disabled={!!stream}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={!stream}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg"
        >
          Stop
        </button>
      </div>

      <div className="bg-black rounded-lg overflow-hidden max-w-4xl">
        <video
          ref={videoRef}
          className="w-full"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
      </div>
    </div>
  );
}

