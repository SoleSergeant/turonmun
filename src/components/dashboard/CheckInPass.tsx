import React, { useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';
import { checkInCode, type CheckInKind } from '@/lib/checkInCode';

/**
 * QR code the check-in desk scans at the door. It holds only the
 * application (or chair account) id. qrcode is loaded on demand.
 */
export default function CheckInPass({ kind, id, name, detail }: { kind: CheckInKind; id: string; name: string; detail?: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('qrcode').then(({ default: QRCode }) =>
      QRCode.toString(checkInCode(kind, id), { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0a1a30', light: '#ffffff' } }),
    ).then(markup => { if (!cancelled) setSvg(markup); }).catch(() => {});
    return () => { cancelled = true; };
  }, [kind, id]);

  return (
    <div className="glass-card flex flex-col items-center gap-5 p-5 sm:flex-row">
      <div
        className="h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
        role="img"
        aria-label={`Check-in QR code for ${name}`}
        // Generated locally from a fixed-format id, not user input.
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
      <div className="text-center sm:text-left">
        <p className="mb-1 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-gold-300 sm:justify-start">
          <QrCode className="h-4 w-4" /> Your check-in pass
        </p>
        <p className="text-lg font-semibold text-white">{name}</p>
        {detail && <p className="text-sm text-white/70">{detail}</p>}
        <p className="mt-2 text-xs text-white/60">Show this at the registration desk when you arrive. A screenshot works too.</p>
      </div>
    </div>
  );
}
