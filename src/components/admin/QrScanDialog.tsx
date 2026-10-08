import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';

/**
 * Camera QR scanner for the check-in desk. Calls onResult once with the
 * decoded text and stops. qr-scanner is loaded only when the dialog opens.
 */
export default function QrScanDialog({ onResult, onClose }: { onResult: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let scanner: { start: () => Promise<void>; stop: () => void; destroy: () => void } | null = null;
    let done = false;
    (async () => {
      try {
        const { default: QrScanner } = await import('qr-scanner');
        if (!videoRef.current || done) return;
        if (!(await QrScanner.hasCamera())) throw new Error('No camera found on this device.');
        scanner = new QrScanner(
          videoRef.current,
          result => {
            if (done) return;
            done = true;
            scanner?.stop();
            onResult(result.data);
          },
          { preferredCamera: 'environment', highlightScanRegion: true, returnDetailedScanResult: true },
        );
        await scanner.start();
        setStarting(false);
      } catch (err: any) {
        setStarting(false);
        setError(
          err?.name === 'NotAllowedError' || /permission/i.test(String(err))
            ? 'Camera access was blocked. Allow the camera for this site in the browser settings, or search by name instead.'
            : err?.message || String(err),
        );
      }
    })();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      done = true;
      window.removeEventListener('keydown', onKey);
      scanner?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Scan a delegate's QR code">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold text-gray-900">Scan QR code</h2>
          <button onClick={onClose} aria-label="Close scanner" className="rounded p-1 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="relative aspect-square bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {starting && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-white"><Loader2 className="h-8 w-8 animate-spin" /></div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">{error}</div>
          )}
        </div>
        <p className="px-4 py-3 text-center text-sm text-gray-600">
          Point the camera at the QR code on the delegate's dashboard.
        </p>
      </div>
    </div>
  );
}
