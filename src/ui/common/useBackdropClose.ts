import { useRef, type MouseEvent } from 'react';

// A click closes only when it started and ended on the backdrop: a press on a control that moves away before the release must not close the dialog.
export function useBackdropClose(close: (event: MouseEvent<HTMLElement>) => void) {
  const pressedOnBackdrop = useRef(false);
  return {
    onMouseDown: (event: MouseEvent<HTMLElement>) => {
      pressedOnBackdrop.current = event.target === event.currentTarget;
    },
    onClick: (event: MouseEvent<HTMLElement>) => {
      const closes = pressedOnBackdrop.current && event.target === event.currentTarget;
      pressedOnBackdrop.current = false;
      if (closes) close(event);
    },
  };
}
