import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, ChevronDown, CalendarClock, Clapperboard } from 'lucide-react';
import { useContent } from '@/content/store';
import { youtubeId, youtubeEmbedUrl } from '@/lib/youtube';
import DebateLayout, { useDebateRegistrationOpen, focusRing, goldButton } from './DebateLayout';
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
      <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold-400 text-diplomatic-950 shadow-2xl shadow-black/50 ring-8 ring-gold-400/20 transition group-hover:scale-110 sm:h-20 sm:w-20">
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
    <Link to={path('/register')} className={`${goldButton} group px-8 py-4 text-lg`}>
      {d.register_button}
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
    </Link>
  );

  return (
    <DebateLayout nav={nav}>
      {/* ── Hero + video ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_top,_rgba(247,163,28,0.20),_transparent_65%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        </div>

        <div className="container relative mx-auto px-4 pb-14 pt-10 sm:pb-20 sm:pt-16">
          {/* Rendered without a fade-in so the headline paints immediately. */}
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-gold-400/30 bg-gold-400/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-200 sm:text-xs">
              {d.tagline}
            </span>
            <h1 className="mt-5 bg-gradient-to-b from-white to-white/75 bg-clip-text font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-transparent sm:text-6xl md:text-7xl">
              {d.name}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{d.intro}</p>
          </div>

          <motion.div
            id="video"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mx-auto mt-9 max-w-4xl scroll-mt-24 sm:mt-12"
          >
            <figure>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-diplomatic-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/5">
                {videoId ? (
                  <VideoFacade id={videoId} title={d.video_caption || d.name} />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_center,_rgba(247,163,28,0.10),_transparent_60%)] text-white/60">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5">
                      <Clapperboard className="h-6 w-6" />
                    </span>
                    <p className="text-sm font-medium">Video coming soon</p>
                  </div>
                )}
              </div>
              {d.video_caption && <figcaption className="mt-3 text-center text-sm text-white/60">{d.video_caption}</figcaption>}
            </figure>
          </motion.div>

          <div ref={heroCta} className="mt-9 flex flex-col items-center gap-3 sm:mt-10">
            {open ? (
              <>
                {registerCta}
                {hasDeadline && (
                  <p className="inline-flex items-center gap-1.5 text-sm text-white/70">
                    <CalendarClock className="h-4 w-4 text-gold-300" />
                    Registration closes {deadline!.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                )}
              </>
            ) : (
              <p role="status" className="max-w-md rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center text-white/80">{d.closed_message}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Key details ──────────────────────────────────────────────── */}
      {d.info.length > 0 && (
        <section aria-label="Key details" className="border-y border-white/10 bg-white/[0.03]">
          <dl className="container mx-auto grid grid-cols-2 divide-white/10 px-4 md:grid-cols-4 md:divide-x">
            {d.info.map(item => (
              <div key={item.label} className="px-3 py-6 text-center sm:py-7">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">{item.label}</dt>
                <dd className="mt-1.5 text-base font-semibold sm:text-lg">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────────────── */}
      {d.steps.length > 0 && (
        <section id="how-it-works" className="container mx-auto scroll-mt-20 px-4 py-16 sm:py-24">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">{d.steps_title}</h2>
          <ol className="relative mx-auto mt-10 grid max-w-5xl gap-4 sm:mt-14 md:grid-cols-4 md:gap-5">
            {/* connector line (desktop) */}
            <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[1.375rem] hidden h-px bg-gradient-to-r from-gold-400/0 via-gold-400/40 to-gold-400/0 md:block" />
            {d.steps.map((step, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="relative flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:flex-col md:items-center md:border-0 md:bg-transparent md:p-0 md:text-center"
              >
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-400 font-display text-lg font-bold text-diplomatic-950 ring-4 ring-diplomatic-950">
                  {i + 1}
                </span>
                <div className="md:mt-4 md:w-full md:flex-1 md:rounded-2xl md:border md:border-white/10 md:bg-white/[0.04] md:p-5">
                  <h3 className="text-base font-semibold sm:text-lg">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">{step.description}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      {d.faq.length > 0 && (
        <section id="faq" className="container mx-auto max-w-3xl scroll-mt-20 px-4 pb-16 sm:pb-24">
          <h2 className="mb-8 text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">{d.faq_title}</h2>
          <div className="space-y-3">
            {d.faq.map((item, i) => (
              <details key={i} className="group rounded-xl border border-white/10 bg-white/[0.04] open:bg-white/[0.06]">
                <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-5 font-medium [&::-webkit-details-marker]:hidden ${focusRing}`}>
                  {item.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-gold-300 transition-transform group-open:rotate-180" />
                </summary>
                <p className="whitespace-pre-line px-5 pb-5 leading-relaxed text-white/75">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── Closing call to action ───────────────────────────────────── */}
      {open && (
        <section className="container mx-auto px-4 pb-24 sm:pb-28">
          <div className="relative overflow-hidden rounded-3xl border border-gold-400/20 bg-gradient-to-br from-diplomatic-800 via-diplomatic-900 to-diplomatic-950 px-6 py-12 text-center sm:px-12 sm:py-16">
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-gold-400/20 blur-3xl" />
            <h2 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">{d.cta_title}</h2>
            {d.cta_text && <p className="relative mt-3 text-white/75">{d.cta_text}</p>}
            <div className="relative mt-8 flex justify-center">{registerCta}</div>
          </div>
        </section>
      )}

      {/* ── Mobile: sticky register bar ──────────────────────────────── */}
      {open && (
        <div
          aria-hidden={!showBar}
          className={`fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-diplomatic-950/90 p-3 backdrop-blur-md transition-transform duration-300 md:hidden ${
            showBar ? 'translate-y-0' : 'pointer-events-none translate-y-full'
          }`}
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <Link to={path('/register')} tabIndex={showBar ? 0 : -1} className={`${goldButton} w-full py-3.5 text-base`}>
            {d.register_button}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      )}
    </DebateLayout>
  );
}
