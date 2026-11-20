import { RadioChipGroup } from '../../../src/ui/common/RadioChipGroup.tsx';
import { t } from './i18n.ts';

const ROOF = 'roof';

interface LevelBarProps {
  floorCount: number;
  floor: number;
  roofLevel: boolean;
  withRoof: boolean;
  onPickFloor: (floor: number) => void;
  onPickRoof: () => void;
}

// Floats over the 3D view: the level to edit, the roof on top.
export function LevelBar({ floorCount, floor, roofLevel, withRoof, onPickFloor, onPickRoof }: LevelBarProps) {
  const floors = Array.from({ length: floorCount }, (_, f) => ({ value: String(f), label: f === 0 ? t('architect.floor.ground') : `${t('architect.floor.short')}${f}` })).reverse();
  const options = [...(withRoof ? [{ value: ROOF, label: t('architect.roofLevel') }] : []), ...floors];
  return (
    <RadioChipGroup
      className="studio-levels"
      label={t('architect.levels')}
      options={options}
      value={roofLevel ? ROOF : String(floor)}
      onChange={(value) => (value === ROOF ? onPickRoof() : onPickFloor(Number(value)))}
    />
  );
}
