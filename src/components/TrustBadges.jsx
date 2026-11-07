import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import FssaiDownloadDialog from './FssaiDownloadDialog';
import { cachedFetch, API_BASE } from '../lib/api';

/* Partner logos live in /public. Each sits on a same-size white tile. */
const Tile = ({ src, alt, logoClass = 'h-5' }) => (
  <span className="h-10 w-[104px] shrink-0 rounded-lg bg-white flex items-center justify-center px-3">
    <img src={src} alt={alt} className={`${logoClass} w-auto max-w-full object-contain select-none`} loading="lazy" decoding="async" draggable="false" />
  </span>
);

const Item = ({ children, className = '' }) => (
  <div className={`flex items-center gap-3 text-left ${className}`}>{children}</div>
);

const Caption = ({ label, value }) => (
  <span className="leading-tight">
    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">{label}</span>
    <span className="block text-[12.5px] font-semibold text-white/90">{value}</span>
  </span>
);

/**
 * Footer trust row: payment gateway, food-safety licence and shipping partner.
 * The FSSAI number comes from Admin → Catalogue (same source as the homepage card).
 */
export default function TrustBadges() {
  const [fssai, setFssai] = useState(null);

  useEffect(() => {
    let alive = true;
    cachedFetch(`${API_BASE}/catalogue/fssai`, 10 * 60 * 1000)
      .then((j) => { if (alive && j?.success) setFssai(j.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const closeDialog = useCallback(() => setDialogOpen(false), []);

  return (
    <section
      aria-label="Trusted and certified"
      className="mb-8 py-5 border-y border-white/15 flex flex-col lg:flex-row items-center gap-4 lg:gap-10"
    >
      <p className="shrink-0 text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-[#D7A94E]">
        Trusted &amp; Certified
      </p>

      <div className="flex-1 w-full flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-center lg:justify-between gap-4 sm:gap-x-8 max-w-xs sm:max-w-none mx-auto lg:mx-0">
        <Item>
          <Tile src="/razorpay.png" alt="Razorpay" />
          <Caption label="Payments" value="100% secure checkout" />
        </Item>

        <div className="flex items-center gap-3 text-left">
          <Tile src="/fssai.png" alt="FSSAI" logoClass="h-7" />
          <span className="leading-tight">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
              FSSAI Licence{fssai?.registrationNo && <> · <span className="font-mono tracking-wide normal-case">{fssai.registrationNo}</span></>}
            </span>
            {fssai?.available ? (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="py-2 -my-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#F1D58F] hover:text-white underline underline-offset-4 decoration-[#F1D58F]/40 hover:decoration-white/60 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Download certificate
              </button>
            ) : (
              <span className="block text-[12.5px] font-semibold text-white/90">Registered food business</span>
            )}
          </span>
        </div>

        <Item>
          <Tile src="/shiprocket.png" alt="Shiprocket" />
          <Caption label="Shipping" value="Tracked pan-India delivery" />
        </Item>
      </div>

      <FssaiDownloadDialog open={dialogOpen} onClose={closeDialog} info={fssai} />
    </section>
  );
}
