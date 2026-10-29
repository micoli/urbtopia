// The Codex is a native modal dialog, so the navigation sits under its backdrop: find the button a click on that backdrop was aimed at.
const NAV_BUTTONS = '.dock-button, .bottom-bar-button, .radial-item, .radial-fab';

export function navButtonAt(x: number, y: number): HTMLButtonElement | undefined {
  return [...document.querySelectorAll<HTMLButtonElement>(NAV_BUTTONS)].find((button) => {
    const box = button.getBoundingClientRect();
    return !button.disabled && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  });
}
