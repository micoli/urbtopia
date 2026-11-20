import { MODES, MODE_LABEL, type Mode } from './editorConstants.ts';

interface ModeTabsProps {
  mode: Mode;
  onPick: (mode: Mode) => void;
}

export function ModeTabs({ mode, onPick }: ModeTabsProps) {
  return (
    <div className="modes">
      {MODES.map((m) => (
        <button key={m} className={m === mode ? 'mode on' : 'mode'} onClick={() => onPick(m)}>
          {MODE_LABEL[m]}
        </button>
      ))}
    </div>
  );
}
