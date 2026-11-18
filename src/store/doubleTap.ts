export const DOUBLE_TAP_MS = 350;

// Reports whether a tap on `key` follows, within the window, a tap on the same key. A tap with no key resets it.
export function createDoubleTapDetector(now: () => number = () => performance.now(), windowMs = DOUBLE_TAP_MS): (key: string | null) => boolean {
  let last: { key: string; at: number } | null = null;
  return (key) => {
    if (key === null) {
      last = null;
      return false;
    }
    const at = now();
    const double = last !== null && last.key === key && at - last.at <= windowMs;
    last = double ? null : { key, at };
    return double;
  };
}
