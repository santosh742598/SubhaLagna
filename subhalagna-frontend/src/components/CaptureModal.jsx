/**
 * @file        SubhaLagna v3.1.8 — Capture Modal
 * @description   Reusable webcam capture component. Uses MediaDevices API
 *                to provide a live preview and snapshot capability.
 * @author        SubhaLagna Team
 * @version      3.1.8
 */

import React, { useRef, useState, useEffect } from 'react';

const CaptureModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  // Start stream when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera Error:', err);
      setError(err.name === 'NotAllowedError' ? 'Camera access denied' : 'Could not access camera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Set canvas dimensions to video frame
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to Blob/File
    canvas.toBlob(
      (blob) => {
        const file = new File([blob], `snap-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.9,
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20 relative group">
        {/* Header */}
        <div className="px-8 py-6 border-b border-rose-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-serif font-bold text-gray-800">Direct Capture</h3>
            <p className="text-xs text-gray-400 font-medium">Smile for your profile photo! ✨</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-gray-400 hover:text-rose-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
          {error ? (
            <div className="text-center p-10">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-white font-bold">{error}</p>
              <button
                onClick={startCamera}
                className="mt-4 text-rose-400 text-sm font-bold hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-500 ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </>
          )}

          {/* Overlay Guide */}
          <div className="absolute inset-0 border-40 border-black/20 pointer-events-none rounded-4xl">
            <div className="w-full h-full border-2 border-white/40 border-dashed rounded-2xl relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-rose-500/50 rounded-full" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-8 flex items-center justify-between bg-gray-50/50">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
            Privacy: Stream is processed locally
          </p>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCapture}
              disabled={!isStreaming}
              className="px-8 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Capture Snapshot
            </button>
          </div>
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CaptureModal;
