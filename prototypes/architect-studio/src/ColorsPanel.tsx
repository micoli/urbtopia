import { useEffect, useRef } from 'react';

type ColorKey = 'wallColor' | 'roofColor';

interface ColorFieldProps {
  label: string;
  value: string;
  onPreview: (value: string) => void;
  onCommit: (value: string) => void;
}

// The change event fires when the picker closes; the input event streams the colours while dragging.
function ColorField({ label, value, onPreview, onCommit }: ColorFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const element = input.current!;
    const commit = () => onCommit(element.value);
    element.addEventListener('change', commit);
    return () => element.removeEventListener('change', commit);
  }, [onCommit]);
  return (
    <label className="row">
      <span>{label}</span>
      <input ref={input} type="color" value={value} onChange={(event) => onPreview(event.target.value)} />
    </label>
  );
}

interface ColorsPanelProps {
  wallColor: string;
  roofColor: string;
  onPreview: (key: ColorKey, value: string) => void;
  onCommit: (key: ColorKey, value: string) => void;
}

export function ColorsPanel({ wallColor, roofColor, onPreview, onCommit }: ColorsPanelProps) {
  return (
    <section>
      <h2>Couleurs</h2>
      <ColorField label="Façade" value={wallColor} onPreview={(value) => onPreview('wallColor', value)} onCommit={(value) => onCommit('wallColor', value)} />
      <ColorField label="Toit" value={roofColor} onPreview={(value) => onPreview('roofColor', value)} onCommit={(value) => onCommit('roofColor', value)} />
    </section>
  );
}
