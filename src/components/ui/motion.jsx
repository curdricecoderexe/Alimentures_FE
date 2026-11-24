import { motion, useReducedMotion } from 'framer-motion';

/**
 * Shared motion + surface primitives for the Alimenture light-glass system.
 * Everything here is presentational — no data, no side effects.
 * Every animation collapses to a static render when the visitor has
 * "reduce motion" turned on.
 */

const EASE = [0.16, 1, 0.3, 1];

/* ── Reveal ────────────────────────────────────────────────────────────
   Fades + lifts a block into view the first time it is scrolled to.   */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  duration = 0.7,
  as = 'div',
  className = '',
  ...rest
}) {
  const still = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (still) {
    const Tag = as;
    return <Tag className={className} {...rest}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/* ── Stagger ───────────────────────────────────────────────────────────
   Wrap a grid in <Stagger> and each child in <StaggerItem>.            */
export function Stagger({ children, step = 0.07, className = '', ...rest }) {
  const still = useReducedMotion();
  if (still) return <div className={className} {...rest}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '-70px' }}
      variants={{ shown: { transition: { staggerChildren: step } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '', y = 24, ...rest }) {
  const still = useReducedMotion();
  if (still) return <div className={className} {...rest}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ── Field ─────────────────────────────────────────────────────────────
   Ambient blurred colour orbs + grain that sit behind frosted glass.
   `orbs` is a list of { size, color, top/bottom, left/right, drift }.   */
export function Field({ orbs = [], grain = true, className = '' }) {
  const still = useReducedMotion();

  return (
    <div className={`field ${className}`} aria-hidden="true">
      {orbs.map((o, i) => (
        <span
          key={i}
          className={`orb ${!still && o.drift !== false ? (i % 2 ? 'animate-orb-drift-slow' : 'animate-orb-drift') : ''}`}
          style={{
            width: o.size,
            height: o.size,
            background: o.color,
            top: o.top,
            bottom: o.bottom,
            left: o.left,
            right: o.right,
            animationDelay: `${i * 1.6}s`,
          }}
        />
      ))}
      {grain && <span className="grain" />}
    </div>
  );
}

/* Preset orb palettes so sections stay consistent */
export const ORB_BERRY = 'rgba(176,18,143,.15)';
export const ORB_BERRY_STRONG = 'rgba(176,18,143,.22)';
export const ORB_GOLD = 'rgba(214,170,80,.18)';
export const ORB_GOLD_STRONG = 'rgba(214,170,80,.26)';

/* ── PageBackdrop ──────────────────────────────────────────────────────
   The ONE background shared by every customer route: a plain cream field,
   fixed to the viewport. Rendered once in CustomerLayout — pages keep
   transparent roots.                                                     */
export function PageBackdrop() {
  // Plain cream page field. (The pink top wash and glow orbs that used to sit
  // here tinted the top of every page; removed for a cleaner, calmer look.)
  return <div className="fixed inset-0 -z-10 pointer-events-none bg-cream" aria-hidden="true" />;
}

/* ── SectionHead ───────────────────────────────────────────────────────
   The numbered "N⁰ 01 — Label / Headline / rule" pattern.              */
export function SectionHead({
  index,
  label,
  children,
  centered = false,
  rule = true,
  className = '',
}) {
  return (
    <Reveal
      className={`flex flex-col gap-3.5 ${centered ? 'items-center text-center' : ''} ${className}`}
    >
      {(index || label) && (
        <div className="flex items-baseline gap-3.5">
          {index && <span className="kicker text-berry">N&#8304; {index}</span>}
          {label && <span className="kicker text-ink-soft">{label}</span>}
        </div>
      )}
      {children}
      {rule && <span className="rule-berry" />}
    </Reveal>
  );
}

/* ── Tap ───────────────────────────────────────────────────────────────
   Small press feedback for buttons that aren't full <Button>s.         */
export function Tap({ children, className = '', scale = 0.96, ...rest }) {
  const still = useReducedMotion();
  if (still) return <div className={className} {...rest}>{children}</div>;
  return (
    <motion.div className={className} whileTap={{ scale }} {...rest}>
      {children}
    </motion.div>
  );
}
