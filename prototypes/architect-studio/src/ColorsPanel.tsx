import { ColorCombo } from './ColorCombo.tsx';
import { ROOF_SWATCHES, WALL_SWATCHES } from './editorConstants.ts';

type ColorKey = 'wallColor' | 'roofColor';

interface ColorsPanelProps {
  wallColor: string;
  roofColor: string;
  onPick: (key: ColorKey, value: string) => void;
}

export function ColorsPanel({ wallColor, roofColor, onPick }: ColorsPanelProps) {
  return (
    <section>
      <h2>Couleurs</h2>
      <ColorCombo label="Façade" swatches={WALL_SWATCHES} value={wallColor} onPick={(value) => onPick('wallColor', value)} />
      <ColorCombo label="Toit" swatches={ROOF_SWATCHES} value={roofColor} onPick={(value) => onPick('roofColor', value)} />
    </section>
  );
}
