import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, ChevronDown, CalendarClock, Clapperboard } from 'lucide-react';
import { useContent } from '@/content/store';
import { youtubeId, youtubeEmbedUrl } from '@/lib/youtube';
import DebateLayout, { useDebateRegistrationOpen, focusRing, primaryButton, headingCls } from './DebateLayout';
import { useDebatePath } from './paths';

/**
 * YouTube "facade": a thumbnail and play button until the visitor clicks.
 * The real player (~1 MB of scripts) only loads on demand, which keeps the
 * page fast on mobile data.
 */
function VideoFacade({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);

  if (playing) {
    return (
      <iframe
        src={`${youtubeEmbedUrl(id)}&autoplay=1`}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className={`group absolute inset-0 h-full w-full ${focusRing}`}
    >
      <img
        src={thumb}
        alt=""
        decoding="async"
        // maxresdefault doesn't exist for every video (YouTube then serves a
        // 120px placeholder); fall back to hqdefault, which always exists.
        onLoad={e => { if (e.currentTarget.naturalWidth <= 120) setThumb(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`); }}
        onError={() => setThumb(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02] group-hover:brightness-90"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-debate-blue-950/60 via-transparent to-transparent" />
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-debate-maroon text-white shadow-2xl shadow-black/40 ring-8 ring-white/30 transition group-hover:scale-110 sm:h-20 sm:w-20">
        <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />
      </span>
    </button>
  );
}

/** Turon Debate landing (turonmun.com/debat) — everything on it is edited in Site content → Turon Debate. */
export default function DebateLanding() {
  const d = useContent('debate');
  const { open, deadline } = useDebateRegistrationOpen();
  const videoId = youtubeId(d.video_url);
  const path = useDebatePath();

  // Mobile: show a bottom "Register" bar once the hero button has scrolled away.
  const heroCta = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = heroCta.current;
    if (!el || !open) return;
    const io = new IntersectionObserver(([entry]) => setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [open]);

  const hasDeadline = !!deadline && !isNaN(deadline.getTime());
  const nav = [
    ...(videoId ? [{ href: '#video', label: 'Video' }] : []),
    ...(d.steps.length ? [{ href: '#how-it-works', label: d.steps_title }] : []),
    ...(d.faq.length ? [{ href: '#faq', label: d.faq_title }] : []),
  ];

  const registerCta = (
    <Link to={path('/register')} className={`${primaryButton} group px-8 py-4 text-lg`}>
      {d.register_button}
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
    </Link>
  );

  return (
    <DebateLayout nav={nav}>
      {/* ── Hero + video ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-debate-blue-50 via-white to-white">
        {/* Faint podiums behind the headline */}
        <img
          src="/debate/podium.svg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-2 h-[22rem] w-auto max-w-none -translate-x-1/2 select-none opacity-[0.05] sm:h-[30rem]"
        />

        <div className="container relative mx-auto px-4 pb-14 pt-12 sm:pb-20 sm:pt-16">
          {/* Rendered without a fade-in so the headline paints immediately. */}
          <div className="mx-auto max-w-3xl text-center">
            <h1 className={`${headingCls} text-[2.6rem] leading-[1.02] text-debate-blue sm:text-6xl md:text-7xl`}>
              {d.name}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">{d.intro}</p>
          </div>

          <motion.div
            id="video"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mx-auto mt-9 max-w-4xl scroll-mt-24 sm:mt-12"
          >
            <figure>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-debate-blue shadow-[0_30px_70px_-25px_rgba(1,51,153,0.55)] ring-1 ring-debate-blue/10">
                {videoId ? (
                  <VideoFacade id={videoId} title={d.video_caption || d.name} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/80">
                    <img src="/debate/podium-reversed.svg" alt="" aria-hidden className="h-24 w-auto sm:h-32" />
                    <p className="flex items-center gap-2 text-sm font-medium"><Clapperboard className="h-4 w-4" /> Video coming soon</p>
                  </div>
                )}
              </div>
              {d.video_caption && <figcaption className="mt-3 text-center text-sm text-slate-500">{d.video_caption}</figcaption>}
            </figure>
          </motion.div>

          <div ref={heroCta} className="mt-9 flex flex-col items-center gap-3 sm:mt-10">
            {open ? (
              <>
                {registerCta}
                {hasDeadline && (
                  <p className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <CalendarClock className="h-4 w-4 text-debate-maroon" />
                    Registration closes {deadline!.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                )}
              </>
            ) : (
              <p role="status" className="max-w-md rounded-xl border border-slate-200 bg-white px-5 py-4 text-center text-slate-700 shadow-sm">{d.closed_message}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Key details ──────────────────────────────────────────────── */}
      {d.info.length > 0 && (
        <section aria-label="Key details" className="bg-debate-blue text-white">
          <dl className="container mx-auto grid grid-cols-2 divide-white/15 px-4 md:grid-cols-4 md:divide-x">
            {d.info.map(item => (
              <div key={item.label} className="px-3 py-7 text-center sm:py-8">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">{item.label}</dt>
                <dd className={`${headingCls} mt-1.5 text-lg sm:text-xl`}>{item.value}</dd>
              </div>
            ))}
          </dl>
          <div aria-hidden className="h-1 bg-debate-maroon" />
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────────────── */}
      {d.steps.length > 0 && (
        <section id="how-it-works" className="container mx-auto scroll-mt-20 px-4 py-16 sm:py-24">
          <h2 className={`${headingCls} text-center text-3xl text-debate-blue sm:text-4xl`}>{d.steps_title}</h2>
          <ol className="relative mx-auto mt-10 grid max-w-5xl gap-4 sm:mt-14 md:grid-cols-4 md:gap-5">
            {/* connector line (desktop) */}
            <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[1.375rem] hidden h-0.5 bg-gradient-to-r from-debate-blue/20 via-debate-maroon/30 to-debate-blue/20 md:block" />
            {d.steps.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-col md:items-center md:border-0 md:bg-transparent md:p-0 md:text-center md:shadow-none"
              >
                {/* Alternates the two podium colours. */}
                <span className={`${headingCls} relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-white ring-4 ring-white ${i % 2 ? 'bg-debate-maroon' : 'bg-debate-blue'}`}>
                  {i + 1}
                </span>
                <div className="md:mt-4 md:w-full md:flex-1 md:rounded-2xl md:border md:border-slate-200 md:bg-white md:p-5 md:shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900 sm:text-lg">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      {d.faq.length > 0 && (
        <section id="faq" className="scroll-mt-20 bg-slate-50 py-16 sm:py-24">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className={`${headingCls} mb-8 text-center text-3xl text-debate-blue sm:text-4xl`}>{d.faq_title}</h2>
            <div className="space-y-3">
              {d.faq.map((item, i) => (
                <details key={i} className="group rounded-xl border border-slate-200 bg-white shadow-sm open:border-debate-blue/30">
                  <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden ${focusRing}`}>
                    {item.question}
                    <ChevronDown className="h-4 w-4 shrink-0 text-debate-maroon transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="whitespace-pre-line px-5 pb-5 leading-relaxed text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Closing call to action ───────────────────────────────────── */}
      {open && (
        <section className="container mx-auto px-4 py-16 sm:py-24">
          <div className="relative overflow-hidden rounded-3xl bg-debate-blue px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <img src="/debate/podium-reversed.svg" alt="" aria-hidden className="pointer-events-none absolute -bottom-16 -right-8 h-72 w-auto select-none opacity-10" />
            <h2 className={`${headingCls} relative text-3xl sm:text-4xl`}>{d.cta_title}</h2>
            {d.cta_text && <p className="relative mt-3 text-white/80">{d.cta_text}</p>}
            <div className="relative mt-8 flex justify-center">
              {/* White on the blue panel so it stands out; maroon text keeps it the main action. */}
              <Link
                to={path('/register')}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-debate-maroon shadow-lg transition hover:bg-debate-maroon-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-debate-blue"
              >
                {d.register_button}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Mobile: sticky register bar ──────────────────────────────── */}
      {open && (
        <div
          aria-hidden={!showBar}
          className={`fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md transition-transform duration-300 md:hidden ${
            showBar ? 'translate-y-0' : 'pointer-events-none translate-y-full'
          }`}
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <Link to={path('/register')} tabIndex={showBar ? 0 : -1} className={`${primaryButton} w-full py-3.5 text-base`}>
            {d.register_button}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      )}
    </DebateLayout>
  );
}
