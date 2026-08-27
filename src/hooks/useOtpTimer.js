import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Countdown helper for OTP screens.
 *
 * Returns:
 *   - `secondsLeft`  — seconds until the code is considered expired (0 = expired)
 *   - `expired`      — convenience boolean
 *   - `cooldown`     — seconds until "Resend" is allowed again (0 = allowed)
 *   - `label`        — "m:ss" formatted `secondsLeft`
 *   - `start(opts)`  — (re)start the timers; opts.ttl / opts.cooldown override defaults
 *
 * @param {object} [opts]
 * @param {number} [opts.ttl=600]       code lifetime in seconds (backend TTL is 10 min)
 * @param {number} [opts.cooldown=30]   resend lockout in seconds
 * @param {boolean} [opts.autoStart=false]
 */
export default function useOtpTimer({ ttl = 600, cooldown = 30, autoStart = false } = {}) {
  const [secondsLeft, setSecondsLeft] = useState(autoStart ? ttl : 0);
  const [cooldownLeft, setCooldownLeft] = useState(autoStart ? cooldown : 0);
  const intervalRef = useRef(null);

  const tick = useCallback(() => {
    setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    setCooldownLeft((s) => (s > 0 ? s - 1 : 0));
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0 && cooldownLeft <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (!intervalRef.current) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [secondsLeft, cooldownLeft, tick]);

  const start = useCallback(
    (override = {}) => {
      setSecondsLeft(override.ttl ?? ttl);
      setCooldownLeft(override.cooldown ?? cooldown);
    },
    [ttl, cooldown],
  );

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return {
    secondsLeft,
    expired: secondsLeft <= 0,
    cooldown: cooldownLeft,
    label: `${mm}:${ss}`,
    start,
  };
}
