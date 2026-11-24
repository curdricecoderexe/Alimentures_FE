/**
 * Suspense fallback for Admin / Staff routes. Unlike the storefront's
 * AppSkeleton it has no page background of its own and no nav, so it sits
 * inside the portal shell in whatever theme is active. When the shell itself
 * is still loading (first visit), it paints the saved theme so a dark-mode
 * user never sees a light flash.
 */
export default function OpsPageSkeleton({ standalone = false }) {
  const dark = typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'dark';
  const block = 'bg-gray-100 animate-pulse rounded-xl';
  const body = (
    <div aria-busy="true" aria-label="Loading">
      <div className={`h-8 w-56 ${block}`} />
      <div className={`mt-3 h-4 w-80 max-w-full ${block}`} />
      <div className="mt-8 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`h-28 ${block}`} />)}
      </div>
      <div className={`mt-6 h-80 ${block}`} />
    </div>
  );
  if (!standalone) return body;
  return (
    <div className={`ops-theme min-h-screen ${dark ? 'dark-theme' : 'bg-cream'}`}>
      <div className="lg:ml-72 max-w-[1600px] pt-24 sm:pt-28 lg:pt-20 px-3 sm:px-6 lg:px-10">{body}</div>
    </div>
  );
}
