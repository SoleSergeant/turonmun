import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, ChevronDown, CalendarClock } from 'lucide-react';
import { useContent } from '@/content/store';
import { youtubeId, youtubeEmbedUrl } from '@/lib/youtube';
import DebateLayout, { useDebateRegistrationOpen } from './DebateLayout';
import { useDebatePath } from './paths';

/** Turon Debate landing (turonmun.com/debat) — everything on it is edited in Site content → Turon Debate. */
export default function DebateLanding() {
  const d = useContent('debate');
  const { open, deadline } = useDebateRegistrationOpen();
  const videoId = youtubeId(d.video_url);
  const path = useDebatePath();

  return (
    <DebateLayout>
      {/* Hero + video */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(247,163,28,0.18),_transparent_60%)]" />
        <div className="container relative mx-auto px-4 pb-16 pt-14 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-block rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-300">
              {d.tagline}
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-6xl">{d.name}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/70 md:text-lg">{d.intro}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-10 max-w-4xl"
          >
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl shadow-black/50">
              {videoId ? (
                <iframe
                  src={youtubeEmbedUrl(videoId)}
                  title={d.video_caption || d.name}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50">
                  <PlayCircle className="h-14 w-14" />
                  <p className="text-sm">Video coming soon</p>
                </div>
              )}
            </div>
            {d.video_caption && <p className="mt-3 text-center text-sm text-white/50">{d.video_caption}</p>}
          </motion.div>

          <div className="mt-10 flex flex-col items-center gap-3">
            {open ? (
              <>
                <Link
                  to={path('/register')}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gold-400 px-8 py-4 text-lg font-bold text-diplomatic-950 shadow-lg shadow-gold-400/20 transition hover:bg-gold-300"
                >
                  {d.register_button}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                {deadline && !isNaN(deadline.getTime()) && (
                  <p className="inline-flex items-center gap-1.5 text-sm text-white/60">
                    <CalendarClock className="h-4 w-4" />
                    Registration closes {deadline.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                )}
              </>
            ) : (
              <p className="max-w-md rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center text-white/70">{d.closed_message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Key details */}
      {d.info.length > 0 && (
        <section className="border-y border-white/10 bg-white/[0.03]">
          <div className="container mx-auto grid grid-cols-2 gap-px px-4 md:grid-cols-4">
            {d.info.map(item => (
              <div key={item.label} className="px-4 py-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-gold-300/80">{item.label}</p>
                <p className="mt-1 text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      {d.steps.length > 0 && (
        <section className="container mx-auto px-4 py-16 md:py-20">
          <h2 className="text-center font-display text-3xl font-bold md:text-4xl">{d.steps_title}</h2>
          <ol className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {d.steps.map((step, i) => (
              <li key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-400 font-bold text-diplomatic-950">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-white/60">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* FAQ */}
      {d.faq.length > 0 && (
        <section className="container mx-auto max-w-3xl px-4 pb-20">
          <h2 className="mb-6 text-center font-display text-3xl font-bold">{d.faq_title}</h2>
          <div className="space-y-3">
            {d.faq.map((item, i) => (
              <details key={i} className="group rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {item.question}
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 whitespace-pre-line text-white/70">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </DebateLayout>
  );
}
