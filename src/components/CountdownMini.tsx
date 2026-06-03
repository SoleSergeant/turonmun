import React, { useEffect, useState } from 'react';

interface Props {
  targetDate: Date;
  label: string;          // e.g. "Applications open in" / "Applications close in"
  accent?: 'gold' | 'emerald' | 'amber';
}

const calc = (target: Date) => {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const CountdownMini: React.FC<Props> = ({ targetDate, label, accent = 'gold' }) => {
  const [t, setT] = useState(() => calc(targetDate));

  useEffect(() => {
    const id = setInterval(() => setT(calc(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!t) return null;

  const color =
    accent === 'emerald' ? 'text-emerald-300' :
    accent === 'amber' ? 'text-amber-300' : 'text-gold-300';

  const cells = [
    { v: t.days, l: 'Days' },
    { v: t.hours, l: 'Hrs' },
    { v: t.minutes, l: 'Min' },
    { v: t.seconds, l: 'Sec' },
  ];

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">{label}</span>
      <div className="flex items-center gap-2">
        {cells.map((c, i) => (
          <React.Fragment key={c.l}>
            <div className="flex flex-col items-center min-w-[44px] px-2 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className={`text-xl font-display font-bold ${color}`}>{String(c.v).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase tracking-wider text-white/40">{c.l}</span>
            </div>
            {i < cells.length - 1 && <span className="text-white/20 font-bold">:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CountdownMini;
