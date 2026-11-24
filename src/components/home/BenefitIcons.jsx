/*
 * Duotone benefit icons for the band under the hero.
 * 24px grid, 1.5px rounded strokes in `currentColor` with a faint secondary
 * fill — calm, professional line icons for tinted badges.
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

/** Grain stalk — heritage millets & native rice. */
export function IconGrains(props) {
  const kernel = 'c1.7-.4 2.9-1.6 3.1-3.4-1.8 0-3.2 1.2-3.1 3.4z';
  return (
    <svg {...base} {...props}>
      <path d="M12 21.5V9" />
      {/* right kernels */}
      <path d={`M12 18.2${kernel}`} fill="currentColor" fillOpacity=".14" />
      <path d={`M12 14.6${kernel}`} fill="currentColor" fillOpacity=".14" />
      <path d={`M12 11${kernel}`} fill="currentColor" fillOpacity=".14" />
      {/* left kernels (mirrored) */}
      <path d="M12 18.2c-1.7-.4-2.9-1.6-3.1-3.4 1.8 0 3.2 1.2 3.1 3.4z" fill="currentColor" fillOpacity=".14" />
      <path d="M12 14.6c-1.7-.4-2.9-1.6-3.1-3.4 1.8 0 3.2 1.2 3.1 3.4z" fill="currentColor" fillOpacity=".14" />
      <path d="M12 11c-1.7-.4-2.9-1.6-3.1-3.4 1.8 0 3.2 1.2 3.1 3.4z" fill="currentColor" fillOpacity=".14" />
      {/* tip */}
      <path d="M12 9c-.9-1.1-.9-3 0-5.5.9 2.5.9 4.4 0 5.5z" fill="currentColor" />
    </svg>
  );
}

/** Flour sack with a wheat mark, struck through — no refined flour (maida). */
export function IconNoMaida(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 4.5h8l-1.2 2.6c2.6 1.6 4 4.4 4 7.6 0 3.6-2.9 5.8-6.8 5.8h-.1c-3.9 0-6.7-2.2-6.7-5.8 0-3.2 1.4-6 4-7.6L8 4.5z" fill="currentColor" fillOpacity=".12" />
      <path d="M9.2 7.1h5.6" />
      <path d="M12 17.6v-5" />
      <path d="M12 14.2c1-.2 1.8-.9 1.9-2-1.1 0-2 .8-1.9 2zM12 14.2c-1-.2-1.8-.9-1.9-2 1.1 0 2 .8 1.9 2z" fill="currentColor" />
      <path d="M3.5 3.5l17 17" strokeWidth="1.6" />
    </svg>
  );
}

/** Sugar cubes, struck through — no white sugar. */
export function IconNoSugar(props) {
  return (
    <svg {...base} {...props}>
      {/* back cube */}
      <path d="M12.5 5.2l4.3-2 4.2 2v4.6l-4.2 2-4.3-2V5.2z" fill="currentColor" fillOpacity=".1" />
      <path d="M12.5 5.2l4.3 2 4.2-2M16.8 7.2v4.6" />
      {/* front cube */}
      <path d="M4 11.4l5-2.4 5 2.4v5.4L9 19.2l-5-2.4v-5.4z" fill="currentColor" fillOpacity=".14" />
      <path d="M4 11.4l5 2.4 5-2.4M9 13.8v5.4" />
      <path d="M3 3l18 18" strokeWidth="1.6" />
    </svg>
  );
}

/** Shield with check and a leaf — FSSAI-registered kitchen. */
export function IconCertified(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.8l7.2 2.7v5.6c0 4.6-3 8.5-7.2 10.1-4.2-1.6-7.2-5.5-7.2-10.1V5.5L12 2.8z" fill="currentColor" fillOpacity=".12" />
      <path d="M8.6 12.1l2.4 2.4 4.6-4.9" strokeWidth="1.7" />
      <path d="M17.6 2.4c1.9.1 3.3 1.3 3.6 3.2-1.9.2-3.4-.9-3.6-3.2z" fill="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
