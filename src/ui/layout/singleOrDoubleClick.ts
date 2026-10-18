export const DOUBLE_CLICK_MS = 250;

export interface ClickHandler {
  click: () => void;
  dispose: () => void;
}

export function singleOrDoubleClick(onSingle: () => void, onDouble: (() => void) | undefined): ClickHandler {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const dispose = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const click = () => {
    if (!onDouble) return onSingle();
    if (timer) {
      dispose();
      return onDouble();
    }
    timer = setTimeout(() => {
      timer = null;
      onSingle();
    }, DOUBLE_CLICK_MS);
  };
  return { click, dispose };
}
