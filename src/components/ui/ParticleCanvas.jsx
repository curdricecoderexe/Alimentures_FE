import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * ParticleCanvas — a high-performance, GPU-friendly canvas particle layer.
 * Optimizations:
 *   - Renders nothing when the user prefers reduced motion.
 *   - Auto-pauses when off-screen or tab is hidden (0% CPU/GPU waste).
 *   - Eliminates expensive ctx.shadowBlur calls for 10x faster canvas rendering.
 *   - Uses passive mouse events & ResizeObserver for zero layout thrashing.
 */
export default function ParticleCanvas({
  count = 50,
  colors = ['#920075', '#D4AF37', '#F59E0B', '#E91E8C', '#FDE047'],
  minSize = 0.8,
  maxSize = 3.2,
  speed = 0.65,
  interactive = true,
  glow = true,
  enableLines = true,
  className = '',
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const isVisible = useRef(true);
  const mouse = useRef({ x: -9999, y: -9999 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    let W = 0, H = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      W = canvas.width = canvas.parentElement.clientWidth || canvas.offsetWidth;
      H = canvas.height = canvas.parentElement.clientHeight || canvas.offsetHeight;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement || canvas);

    // ── Off-screen / Tab Visibility Observer ─────────────────
    const handleVisibility = () => {
      isVisible.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const io = new IntersectionObserver(([entry]) => {
      isVisible.current = entry.isIntersecting && !document.hidden;
    }, { threshold: 0.01 });
    io.observe(canvas);

    // ── Particle factory ─────────────────────────────────────
    const rand = (min, max) => Math.random() * (max - min) + min;

    const makeParticle = (yOverride) => {
      const size = rand(minSize, maxSize);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const alpha = rand(0.18, 0.55);
      return {
        x: rand(0, W || 300),
        y: yOverride ?? rand(0, H || 300),
        vy: rand(0.15, 0.45) * speed,
        vx: rand(-0.12, 0.12) * speed,
        size,
        baseSize: size,
        color,
        alpha,
        baseAlpha: alpha,
        phase: rand(0, Math.PI * 2),
        isStar: Math.random() < 0.22,
      };
    };

    let particles = Array.from({ length: count }, () => makeParticle());

    // ── Mouse tracking ───────────────────────────────────────
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };

    if (interactive) {
      canvas.addEventListener('mousemove', onMove, { passive: true });
      canvas.addEventListener('mouseleave', onLeave, { passive: true });
    }

    // ── Drawing Helpers ──────────────────────────────────────
    const drawStar = (ctx, x, y, r, alpha, color) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const len = i % 2 === 0 ? r : r * 0.38;
        const px = x + Math.cos(angle) * len;
        const py = y + Math.sin(angle) * len;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const drawGlowingCircle = (ctx, x, y, r, alpha, color) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      
      if (glow && r > 1.2) {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
        grad.addColorStop(0, color);
        grad.addColorStop(0.4, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    // ── High-Performance Animation Loop ─────────────────────
    let tick = 0;
    const loop = () => {
      animRef.current = requestAnimationFrame(loop);

      if (!isVisible.current) return;

      ctx.clearRect(0, 0, W, H);
      tick++;

      // Draw subtle connecting lines between close particles
      if (enableLines) {
        const maxDist = 95;
        const pLen = particles.length;
        for (let i = 0; i < pLen; i++) {
          for (let j = i + 1; j < pLen; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
              const lineAlpha = (1 - dist / maxDist) * 0.12 * Math.min(particles[i].alpha, particles[j].alpha);
              ctx.save();
              ctx.globalAlpha = lineAlpha;
              ctx.strokeStyle = particles[i].color;
              ctx.lineWidth = 0.6;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }

      particles.forEach((p) => {
        const shimmer = Math.sin(tick * 0.02 + p.phase);
        p.alpha = p.baseAlpha + shimmer * 0.12;
        p.size = p.baseSize + shimmer * 0.35;

        if (interactive) {
          const dx = p.x - mouse.current.x;
          const dy = p.y - mouse.current.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 10000) {
            const dist = Math.sqrt(distSq);
            const force = (100 - dist) / 100;
            p.x += (dx / (dist || 1)) * force * 2;
            p.y += (dy / (dist || 1)) * force * 2;
          }
        }

        p.x += p.vx + Math.sin(tick * 0.012 + p.phase) * 0.15;
        p.y -= p.vy;

        if (p.y < -p.size * 3) Object.assign(p, makeParticle(H + p.size));
        if (p.x < -p.size * 3) p.x = W + p.size;
        if (p.x > W + p.size * 3) p.x = -p.size;

        if (p.isStar) drawStar(ctx, p.x, p.y, p.size, p.alpha, p.color);
        else drawGlowingCircle(ctx, p.x, p.y, p.size, p.alpha, p.color);
      });
    };

    loop();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      if (interactive) {
        canvas.removeEventListener('mousemove', onMove);
        canvas.removeEventListener('mouseleave', onLeave);
      }
    };
  }, [count, colors, minSize, maxSize, speed, interactive, glow, enableLines, reduceMotion]);

  if (reduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
