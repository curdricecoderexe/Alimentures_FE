import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";

// Below lg the mobile dock owns the bottom of the screen, so toasts drop in
// from the top (just under the nav bar) instead of covering the dock.
const MOBILE_QUERY = "(max-width: 1023px)";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
};

const Toaster = ({ ...props }) => {
  const isMobile = useIsMobile();
  return (
    <Sonner
      className="toaster group"
      position={isMobile ? "top-center" : "bottom-right"}
      // Clear the fixed nav bar (56–60px tall) on mobile.
      mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 68px)", left: "12px", right: "12px" }}
      offset={isMobile ? { top: "76px" } : undefined}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
