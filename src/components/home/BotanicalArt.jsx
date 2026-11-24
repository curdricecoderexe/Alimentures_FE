/*
 * Engraved botanical line art — drawn to match the illustration style of the
 * Alimenture catalogue (docs/Untitled design.pdf): millet / sorghum ears made of
 * many small engraved grains, gold wheat, long veined leaves, single-colour
 * strokes on cream. Pure SVG: scales cleanly, themable via `color`.
 *
 * Everything is deterministic (no randomness) so server prerender and client
 * render produce identical markup.
 */

const lerp = (a, b, t) => a + (b - a) * t;

/** Point + tangent angle on a quadratic Bézier. */
function quad(p0, p1, p2, t) {
  const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
  const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
  const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI };
}

/** One engraved grain: filled teardrop with a light centre line (the "hatch"). */
function Grain({ x, y, rot, len, color, hatch }) {
  const w = len * 0.58;
  const d = `M0,0 C${w},${-len * 0.25} ${w * 0.8},${-len * 0.85} 0,${-len} C${-w * 0.8},${-len * 0.85} ${-w},${-len * 0.25} 0,0 Z`;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)})`}>
      <path d={d} fill={color} />
      <path d={`M0,${-len * 0.12} L0,${-len * 0.8}`} stroke={hatch} strokeWidth={Math.max(0.5, len * 0.07)} strokeLinecap="round" />
    </g>
  );
}

/**
 * An ear of grain along a curved stem.
 * base → ctrl → tip; grains alternate left/right, shrinking toward the tip.
 * `kind`: 'millet' (dense, rounded) or 'wheat' (fewer, longer, with awns).
 */
export function Ear({ base, ctrl, tip, grains = 16, size = 9, color = '#B0128F', hatch = '#FBF5EA', kind = 'millet', stem = true }) {
  const p0 = base; const p1 = ctrl; const p2 = tip;
  const items = [];
  // Seed heads sit on the top part of the stem and are packed tight,
  // like the engraved millet / sorghum heads in the catalogue.
  const start = kind === 'wheat' ? 0.42 : 0.4;
  for (let i = 0; i < grains; i += 1) {
    const t = lerp(start, 0.985, i / (grains - 1));
    const { x, y, a } = quad(p0, p1, p2, t);
    const swell = Math.sin(Math.PI * lerp(0.15, 1, i / (grains - 1))); // fullest mid-head
    const len = size * (kind === 'wheat' ? lerp(1, 0.75, i / grains) : lerp(0.65, 1.05, swell));
    const spread = kind === 'wheat' ? 20 : 26 + (i % 3) * 7;
    const side = i % 2 === 0 ? 1 : -1;
    items.push({ x, y, rot: a + 90 + side * spread, len, key: i });
    if (kind === 'wheat') {
      // wheat spikelets come in tight pairs, overlapping up the ear
      items.push({ x, y, rot: a + 90 - side * spread, len: len * 0.96, key: `${i}w` });
    }
    if (kind === 'millet') {
      items.push({ x, y, rot: a + 90 - side * (spread * 0.9), len: len * 0.92, key: `${i}b` });
      if (i % 2 === 0) items.push({ x, y, rot: a + 90 + side * 6, len: len * 0.78, key: `${i}c` });
    }
  }
  return (
    <g>
      {stem && (
        <path
          d={`M${p0[0]},${p0[1]} Q${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`}
          fill="none"
          stroke={color}
          strokeWidth={kind === 'wheat' ? 1.3 : 1.5}
          strokeLinecap="round"
        />
      )}
      {items.map((g) => (
        <g key={g.key}>
          <Grain x={g.x} y={g.y} rot={g.rot} len={g.len} color={color} hatch={hatch} />
          {kind === 'wheat' && (
            // awns: fine whiskers off each wheat grain
            <path
              d={`M${g.x.toFixed(1)},${g.y.toFixed(1)} l${(Math.cos(((g.rot - 90) * Math.PI) / 180) * g.len * 2.4).toFixed(1)},${(Math.sin(((g.rot - 90) * Math.PI) / 180) * g.len * 2.4).toFixed(1)}`}
              stroke={color}
              strokeWidth="0.6"
              strokeLinecap="round"
              opacity="0.8"
            />
          )}
        </g>
      ))}
    </g>
  );
}

/** Long veined leaf blade: outline + midrib + a few engraved veins. */
export function Leaf({ base, ctrl, tip, width = 14, color = '#B0128F', veins = 6 }) {
  const mid = quad(base, ctrl, tip, 0.5);
  const nx = Math.cos(((mid.a + 90) * Math.PI) / 180) * width;
  const ny = Math.sin(((mid.a + 90) * Math.PI) / 180) * width;
  const outline = `M${base[0]},${base[1]} Q${ctrl[0] + nx},${ctrl[1] + ny} ${tip[0]},${tip[1]} Q${ctrl[0] - nx * 0.6},${ctrl[1] - ny * 0.6} ${base[0]},${base[1]} Z`;
  const vs = [];
  for (let i = 1; i <= veins; i += 1) {
    const t = i / (veins + 1);
    const p = quad(base, ctrl, tip, t);
    const vl = width * 0.75 * Math.sin(Math.PI * t);
    const ang = ((p.a + 35) * Math.PI) / 180;
    vs.push(`M${p.x.toFixed(1)},${p.y.toFixed(1)} l${(Math.cos(ang) * vl).toFixed(1)},${(Math.sin(ang) * vl).toFixed(1)}`);
  }
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d={outline} strokeWidth="1.2" fill={color} fillOpacity="0.08" />
      <path d={`M${base[0]},${base[1]} Q${ctrl[0]},${ctrl[1]} ${tip[0]},${tip[1]}`} strokeWidth="0.9" />
      {vs.map((d) => <path key={d} d={d} strokeWidth="0.6" opacity="0.8" />)}
    </g>
  );
}

/* ── Compositions ─────────────────────────────────────────────────── */

/** Corner spray of millet / sorghum ears with leaves — the catalogue's page frame. */
export function MilletSpray({ className = '', color = '#B0128F', accent = '#C7801A' }) {
  return (
    <svg viewBox="0 0 320 420" className={className} aria-hidden="true" focusable="false">
      <Leaf base={[60, 420]} ctrl={[30, 300]} tip={[95, 190]} width={16} color={color} veins={7} />
      <Leaf base={[80, 420]} ctrl={[170, 330]} tip={[250, 300]} width={12} color={color} veins={6} />
      <Ear base={[70, 420]} ctrl={[60, 240]} tip={[150, 60]} grains={30} size={17} color={color} />
      <Ear base={[78, 420]} ctrl={[130, 260]} tip={[260, 140]} grains={26} size={15} color={color} />
      <Ear base={[64, 420]} ctrl={[10, 250]} tip={[38, 100]} grains={22} size={14} color={color} />
      <Ear base={[82, 420]} ctrl={[170, 330]} tip={[305, 250]} grains={19} size={13} color={accent} kind="wheat" />
    </svg>
  );
}

/** Gold wheat spray (mirrors the gold stalks on the catalogue pages). */
export function WheatSpray({ className = '', color = '#C7801A', accent = '#B0128F' }) {
  return (
    <svg viewBox="0 0 320 420" className={className} aria-hidden="true" focusable="false">
      <Leaf base={[250, 420]} ctrl={[300, 300]} tip={[220, 190]} width={13} color={accent} veins={6} />
      <Ear base={[245, 420]} ctrl={[250, 250]} tip={[180, 50]} grains={25} size={18} color={color} kind="wheat" />
      <Ear base={[240, 420]} ctrl={[200, 270]} tip={[70, 140]} grains={24} size={16} color={color} kind="wheat" />
      <Ear base={[250, 420]} ctrl={[310, 260]} tip={[300, 110]} grains={22} size={15} color={color} kind="wheat" />
      <Ear base={[238, 420]} ctrl={[170, 340]} tip={[40, 300]} grains={20} size={12} color={accent} />
    </svg>
  );
}

/* ── Small spot illustrations for the benefit tiles (56×56) ───────── */

export function SpotMillet({ className = '', color = '#B0128F' }) {
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden="true" focusable="false">
      <Leaf base={[24, 54]} ctrl={[8, 40]} tip={[10, 24]} width={5} color={color} veins={3} />
      <Ear base={[26, 54]} ctrl={[24, 30]} tip={[38, 3]} grains={18} size={7.5} color={color} />
    </svg>
  );
}

export function SpotWholeGrain({ className = '', color = '#B0128F', accent = '#C7801A' }) {
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden="true" focusable="false">
      <Ear base={[18, 54]} ctrl={[18, 30]} tip={[8, 4]} grains={16} size={8} color={accent} kind="wheat" />
      <Ear base={[38, 54]} ctrl={[38, 30]} tip={[48, 4]} grains={16} size={7} color={color} />
    </svg>
  );
}

export function SpotSugarcane({ className = '', color = '#B0128F', accent = '#C7801A' }) {
  const nodes = [46, 34, 22, 10];
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden="true" focusable="false">
      <path d="M22,55 L28,3" stroke={accent} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M22,55 L28,3" stroke="#FBF5EA" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7" />
      {nodes.map((y) => {
        const x = 22 + ((55 - y) / 52) * 6;
        return <path key={y} d={`M${x - 3.6},${y + 0.4} L${x + 3.6},${y - 0.4}`} stroke={color} strokeWidth="1.3" strokeLinecap="round" />;
      })}
      <Leaf base={[26, 22]} ctrl={[40, 14]} tip={[52, 26]} width={4} color={color} veins={3} />
      <Leaf base={[24, 36]} ctrl={[10, 30]} tip={[4, 44]} width={3.5} color={color} veins={2} />
    </svg>
  );
}

export function SpotSeal({ className = '', color = '#B0128F', accent = '#C7801A' }) {
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden="true" focusable="false">
      <circle cx="28" cy="28" r="24" fill="none" stroke={accent} strokeWidth="1.2" strokeDasharray="2 3" />
      <circle cx="28" cy="28" r="19" fill={color} fillOpacity="0.07" stroke={color} strokeWidth="1" />
      <Leaf base={[20, 40]} ctrl={[18, 26]} tip={[34, 14]} width={6} color={color} veins={4} />
      <path d="M22,30 l4,4 l9,-10" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Pantry still life (catalogue section) ─────────────────────────────
   Same engraved line-art language, different subject: a honey jar with a
   dipper, a stack of millet cookies, a jaggery block and wheat ears.
   Cocoa strokes (logo flower centre) with honey-gold fills (logo bee). */
export function PantryStillLife({ className = '', ink = '#5C3410', gold = '#F8A830', accent = '#C7801A' }) {
  // deterministic seed specks on each cookie
  const specks = (cx, cy, rx, ry, n, k) => Array.from({ length: n }, (_, i) => {
    const a = (i * 137.5 + k * 41) * (Math.PI / 180);
    const r = 0.25 + ((i * 53 + k * 17) % 60) / 100;
    return { x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r * 0.8, key: `${k}-${i}` };
  });
  const cookies = [
    { cy: 214, rx: 62, ry: 15 },
    { cy: 194, rx: 58, ry: 14 },
    { cy: 175, rx: 55, ry: 13 },
  ];
  return (
    <svg viewBox="0 0 380 260" className={className} aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* wheat behind */}
      <Ear base={[330, 250]} ctrl={[338, 150]} tip={[318, 40]} grains={20} size={13} color={accent} kind="wheat" />
      <Ear base={[318, 250]} ctrl={[300, 160]} tip={[262, 70]} grains={16} size={11} color={accent} kind="wheat" />

      {/* ground line */}
      <path d="M14 238 H366" stroke={ink} strokeWidth="1.2" opacity="0.35" />

      {/* honey jar */}
      <g stroke={ink} strokeWidth="1.6">
        <path d="M50 96 C46 104 40 112 40 128 V214 C40 228 52 236 66 236 H118 C132 236 144 228 144 214 V128 C144 112 138 104 134 96 Z" fill={gold} fillOpacity="0.22" />
        <rect x="52" y="80" width="80" height="18" rx="5" fill={gold} fillOpacity="0.45" />
        <path d="M58 86 H126 M58 92 H126" strokeWidth="0.8" opacity="0.6" />
        {/* label */}
        <rect x="56" y="150" width="72" height="44" rx="6" fill="#FFFDF8" />
        <path d="M68 166 H116 M74 176 H110" strokeWidth="1.1" />
        <path d="M92 158 l3 -6 l3 6" strokeWidth="1" />
        {/* honey level + drips */}
        <path d="M44 132 C70 126 112 138 140 130" strokeWidth="1" opacity="0.7" />
        <path d="M62 136 v8 M80 134 v12 M108 135 v7 M124 133 v10" strokeWidth="0.9" opacity="0.55" />
        {/* engraved glass shading */}
        <path d="M48 200 v14 M54 206 v18 M136 198 v16 M130 206 v18" strokeWidth="0.8" opacity="0.45" />
      </g>

      {/* honey dipper */}
      <g stroke={ink} strokeWidth="1.6">
        <path d="M160 18 L104 96" strokeWidth="2.2" />
        <g transform="rotate(-54 100 100)">
          <rect x="84" y="94" width="34" height="16" rx="8" fill={gold} fillOpacity="0.5" />
          <path d="M92 94 v16 M100 94 v16 M108 94 v16" strokeWidth="1" />
        </g>
      </g>

      {/* jaggery block */}
      <g stroke={ink} strokeWidth="1.4">
        <path d="M150 236 L150 214 L172 204 L196 212 L196 234 L174 244 Z" fill={accent} fillOpacity="0.28" />
        <path d="M150 214 L174 222 L196 212 M174 222 V244" />
        <path d="M156 222 l4 8 M182 226 l3 7 M164 210 l6 -2" strokeWidth="0.8" opacity="0.6" />
      </g>

      {/* cookie stack */}
      <g stroke={ink} strokeWidth="1.5">
        {cookies.map((c, k) => (
          <g key={c.cy}>
            <path d={`M${262 - c.rx} ${c.cy} v7 a${c.rx} ${c.ry} 0 0 0 ${c.rx * 2} 0 v-7`} fill={accent} fillOpacity="0.35" />
            <ellipse cx="262" cy={c.cy} rx={c.rx} ry={c.ry} fill={gold} fillOpacity="0.3" />
            {specks(262, c.cy, c.rx, c.ry, 9, k).map((s) => (
              <ellipse key={s.key} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} rx="2.4" ry="1.4" fill={ink} fillOpacity="0.55" stroke="none" />
            ))}
          </g>
        ))}
        {/* bitten top cookie edge */}
        <path d="M300 168 c4 4 10 4 14 1" strokeWidth="1.2" />
      </g>

      {/* loose grains */}
      {[[210, 246], [222, 249], [236, 245], [34, 246], [24, 249]].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="3" ry="1.8" fill={accent} fillOpacity="0.6" />
      ))}
    </svg>
  );
}

/* ── Engraved honey bee (from the logo's bee) ─────────────────────────
   Striped honey-gold body, cocoa outline, veined translucent wings.
   Faces left like the logo; flip with CSS if needed. `flap` toggles the
   wing beat (pure CSS, off under reduced motion). */
export function EngravedBee({ className = '', ink = '#5C3410', gold = '#F8A830', flap = true }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true" focusable="false" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* wings */}
      <g className={flap ? 'motion-safe:animate-[beeWing_0.18s_ease-in-out_infinite_alternate]' : ''} style={{ transformOrigin: '62px 38px' }}>
        <path d="M60 38 C52 14 70 2 84 10 C94 16 86 34 60 38 Z" fill="#FFFFFF" fillOpacity="0.55" stroke={ink} strokeWidth="1.4" />
        <path d="M62 36 C68 24 76 16 84 12 M64 37 C72 30 80 26 88 22" stroke={ink} strokeWidth="0.7" opacity="0.6" />
        <path d="M58 38 C44 22 52 8 64 10 C74 12 74 28 58 38 Z" fill="#FFFFFF" fillOpacity="0.4" stroke={ink} strokeWidth="1.2" />
      </g>
      {/* body */}
      <path d="M18 52 C18 40 34 34 54 36 C76 38 92 44 92 52 C92 60 76 66 54 68 C34 70 18 64 18 52 Z" fill={gold} stroke={ink} strokeWidth="1.6" />
      {/* stripes */}
      <path d="M44 37 C40 46 40 58 44 67 M58 36 C54 46 54 58 58 68 M72 39 C68 47 68 57 72 65" stroke={ink} strokeWidth="3.2" opacity="0.85" />
      {/* engraved shading */}
      <path d="M26 58 c6 4 14 6 22 6 M30 47 c4 -3 10 -5 16 -5" stroke={ink} strokeWidth="0.8" opacity="0.5" />
      {/* head + eye + antenna */}
      <circle cx="16" cy="52" r="9" fill={ink} />
      <circle cx="13" cy="50" r="1.8" fill="#FFFFFF" />
      <path d="M12 44 C8 36 4 34 2 34 M16 43 C16 34 13 30 10 29" stroke={ink} strokeWidth="1.3" />
      {/* stinger */}
      <path d="M92 52 L102 53 L92 55" fill={ink} stroke={ink} strokeWidth="1" />
    </svg>
  );
}
