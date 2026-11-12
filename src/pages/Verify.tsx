import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Loader2, SearchCheck, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { certificateText } from '@/lib/certificateText';
import { ROLE_LABEL } from '@/lib/participations';

type Result = { full_name: string; event: string; role: string; committee: string | null; country: string | null; award: string | null };

/** Public check for a certificate: /verify/CODE (the QR on every certificate). */
export default function Verify() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(code);
  const [state, setState] = useState<'idle' | 'loading' | 'valid' | 'invalid' | 'error'>(code ? 'loading' : 'idle');
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    setInput(code);
    if (!code) { setState('idle'); return; }
    setState('loading');
    supabase.rpc('verify_certificate', { p_code: code }).then(({ data, error }) => {
      if (error) return setState('error');
      setResult(data?.[0] ?? null);
      setState(data?.[0] ? 'valid' : 'invalid');
    });
  }, [code]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = input.trim().toUpperCase();
    if (c) navigate(`/verify/${encodeURIComponent(c)}`);
  };

  const t = result && certificateText(result);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white to-diplomatic-50">
      <Navbar />
      <main className="flex-grow px-4 pb-16 pt-28">
        <div className="mx-auto max-w-xl">
          <h1 className="mb-2 text-center font-display text-3xl font-bold text-diplomatic-900 md:text-4xl">Verify a certificate</h1>
          <p className="mb-8 text-center text-neutral-600">Enter the number printed on a TuronMUN certificate, or scan its QR code.</p>

          <form onSubmit={submit} className="mb-8 flex gap-2">
            <label htmlFor="cert-code" className="sr-only">Certificate number</label>
            <input
              id="cert-code"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. 3F9A1C07B2"
              autoComplete="off"
              className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 font-mono uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal"
            />
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-diplomatic-900 px-5 py-3 font-medium text-white hover:bg-diplomatic-800">
              <SearchCheck className="h-5 w-5" /> Check
            </button>
          </form>

          {state === 'loading' && (
            <div className="flex justify-center py-8 text-neutral-500"><Loader2 className="h-6 w-6 animate-spin" /></div>
          )}

          {state === 'valid' && result && t && (
            <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm" role="status">
              <p className="mb-4 flex items-center gap-2 font-semibold text-green-700">
                <BadgeCheck className="h-6 w-6" /> Valid TuronMUN certificate
              </p>
              <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-neutral-500">Name</dt><dd className="font-semibold text-diplomatic-900">{result.full_name}</dd>
                <dt className="text-neutral-500">Event</dt><dd className="text-neutral-900">{t.event.replace(/^at /, '')}</dd>
                <dt className="text-neutral-500">Role</dt><dd className="text-neutral-900">{ROLE_LABEL[result.role] ?? result.role}</dd>
                {result.committee && <><dt className="text-neutral-500">{t.isDebate ? 'Team' : 'Committee'}</dt><dd className="text-neutral-900">{result.committee}</dd></>}
                {result.country && <><dt className="text-neutral-500">Country</dt><dd className="text-neutral-900">{result.country}</dd></>}
                {result.award && <><dt className="text-neutral-500">Award</dt><dd className="font-semibold text-amber-700">{result.award}</dd></>}
                <dt className="text-neutral-500">Number</dt><dd className="font-mono text-neutral-900">{code.toUpperCase()}</dd>
              </dl>
            </div>
          )}

          {state === 'invalid' && (
            <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm" role="status">
              <XCircle className="mx-auto mb-2 h-8 w-8 text-red-500" />
              <p className="font-semibold text-red-700">No valid certificate with this number</p>
              <p className="mt-1 text-sm text-neutral-600">Check the number for typos. If it's printed on a certificate, contact the TuronMUN Secretariat.</p>
            </div>
          )}

          {state === 'error' && (
            <p className="text-center text-red-600">Could not check right now. Please try again in a minute.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
