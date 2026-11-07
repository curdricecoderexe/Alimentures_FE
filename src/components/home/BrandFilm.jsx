import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2, X, Film } from 'lucide-react';
import { Field, ORB_BERRY, ORB_GOLD } from '../ui/motion';
import { useHomeVideo, DEFAULT_FILM_SRC } from '../../lib/homeVideo';


/** Full-screen player with sound and native controls. */
function FilmModal({ src, title, startAt, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = startAt || 0;
    v.play().catch(() => { /* user can press play */ });
  }, [startAt]);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#120A0E]/92 backdrop-blur-xl p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 h-11 w-11 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      <motion.div
        className="w-full max-w-6xl aspect-video rounded-2xl sm:rounded-[26px] overflow-hidden shadow-[0_40px_120px_-20px_rgba(165,13,90,0.55)] ring-1 ring-white/10 bg-black"
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <video ref={ref} src={src} controls playsInline className="w-full h-full object-contain bg-black" />
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/**
 * ⸻ BRAND FILM ⸻
 * A muted, looping cinematic preview that grows into place as it scrolls into
 * view, pauses off-screen, and opens a full player with sound on demand.
 * Source + copy are admin-managed (Admin → Templates → Homepage film).
 */
export default function BrandFilm() {
  const film = useHomeVideo();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const [failedSrc, setFailedSrc] = useState(null); // an uploaded film that failed → play the bundled one
  const [inView, setInView] = useState(false);
  const [primed, setPrimed] = useState(false); // once near the viewport, keep the source loaded
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [modalAt, setModalAt] = useState(null);
  const [ratio, setRatio] = useState(16 / 9); // the film's own width/height, read once metadata loads

  const src = film.src === failedSrc ? DEFAULT_FILM_SRC : film.src;

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'center center'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [56, 28]);
  const captionY = useTransform(scrollYProgress, [0.4, 1], [40, 0]);

  // Only fetch / play while the film is near the viewport.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) setPrimed(true);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [film.enabled]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView && !reduceMotion && modalAt === null) {
      v.play().catch(() => setPlaying(false));
    } else {
      v.pause();
    }
  }, [inView, primed, reduceMotion, modalAt, src]);

  if (!film.enabled) return null;

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) v.play().catch(() => {});
  };

  const openModal = () => setModalAt(videoRef.current?.currentTime || 0);

  return (
    <section
      id="brand-film"
      ref={sectionRef}
      className="relative z-10 overflow-hidden py-20 sm:py-28 bg-[#FBF7EF] font-sans"
    >
      <Field orbs={[{ size: 520, color: ORB_BERRY, top: -140, left: -160 }, { size: 480, color: ORB_GOLD, bottom: -160, right: -140 }]} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1320px] relative z-10">
        {/* header */}
        <motion.div
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col gap-4 max-w-2xl items-center text-center lg:items-start lg:text-left mx-auto lg:mx-0">
            <span className="kicker text-berry inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-berry/15 px-4 py-2 rounded-full">
              <Film className="h-3.5 w-3.5" /> The Alimentures Film
            </span>
            <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-[3.6rem] leading-[1.03] tracking-tight text-[#221B1F]">
              {film.title}
            </h2>
            <span className="rule-berry" />
          </div>
          <div className="flex flex-col gap-4 max-w-md items-center text-center lg:items-start lg:text-left mx-auto lg:mx-0">
            <p className="text-ink-soft text-[14px] sm:text-[15px] leading-relaxed font-medium">{film.subtitle}</p>
            <button
              onClick={openModal}
              className="btn-berry inline-flex items-center gap-2.5 h-12 pl-2 pr-5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em]"
            >
              <span className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              </span>
              Watch with sound
            </button>
          </div>
        </motion.div>

        {/* film frame */}
        <motion.div
          // Frame takes the film's native shape so nothing is cropped on any screen.
          style={{
            aspectRatio: ratio,
            maxWidth: `calc(78vh * ${ratio})`,
            ...(reduceMotion ? { borderRadius: 28 } : { scale, borderRadius: radius }),
          }}
          className="group relative mx-auto w-full overflow-hidden bg-gradient-to-br from-berry-deep via-berry to-gold shadow-[0_50px_100px_-30px_rgba(121,8,63,0.45)] ring-1 ring-black/5 will-change-transform"
        >
          <video
            ref={videoRef}
            src={primed ? src : undefined}
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const { videoWidth: w, videoHeight: h } = e.currentTarget;
              if (w && h) setRatio(w / h);
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress(v.currentTime / v.duration);
            }}
            onError={() => { if (src !== DEFAULT_FILM_SRC) setFailedSrc(src); }}
            className="absolute inset-0 w-full h-full object-contain"
            aria-label={film.title}
          />

          {/* cinematic washes */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120A0E]/80 via-[#120A0E]/10 to-[#120A0E]/25 pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-60"
            style={{ background: 'radial-gradient(120% 80% at 20% 100%, rgba(165,13,90,0.55), transparent 60%)' }}
          />

          {/* live badge */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-black/30 backdrop-blur-md border border-white/15 text-white text-[10.5px] font-extrabold uppercase tracking-[0.2em]">
            <span className="relative flex h-2 w-2">
              {playing && <span className="absolute inline-flex h-full w-full rounded-full bg-[#FF5FA8] opacity-75 animate-ping" />}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF5FA8]" />
            </span>
            {playing ? 'Now playing' : 'Paused'}
          </div>

          {/* expand */}
          <button
            onClick={openModal}
            aria-label="Open full-screen player"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 h-10 w-10 rounded-full bg-black/30 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-white hover:text-berry transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* centre play (when paused) */}
          <AnimatePresence>
            {!playing && (
              <motion.button
                key="big-play"
                onClick={togglePlay}
                aria-label="Play film"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 m-auto h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white/90 text-berry flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
              >
                <span className="absolute inset-0 rounded-full border-2 border-white/60 animate-ping opacity-40" />
                <Play className="h-8 w-8 sm:h-9 sm:w-9 fill-current ml-1" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* bottom bar: playback controls */}
          <motion.div
            style={reduceMotion ? undefined : { y: captionY }}
            className="absolute inset-x-0 bottom-0 p-4 sm:p-7 flex items-end justify-end gap-4"
          >
            <div className="flex items-center gap-2 self-end">
              <button
                onClick={togglePlay}
                aria-label={playing ? 'Pause film' : 'Play film'}
                className="h-11 w-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-white hover:text-berry transition-colors"
              >
                {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </button>
              <button
                onClick={toggleMute}
                aria-label={muted ? 'Unmute' : 'Mute'}
                className="h-11 pl-3.5 pr-4 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] hover:bg-white hover:text-berry transition-colors"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {muted ? 'Sound off' : 'Sound on'}
              </button>
            </div>
          </motion.div>

          {/* progress */}
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
            <div
              className="h-full bg-gradient-to-r from-berry-bright to-gold-light transition-[width] duration-300 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {modalAt !== null && (
          <FilmModal src={src} title={film.title} startAt={modalAt} onClose={() => setModalAt(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
