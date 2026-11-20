interface FloorTabsProps {
  floorCount: number;
  floor: number;
  roofLevel: boolean;
  withRoof: boolean;
  onPickFloor: (floor: number) => void;
  onPickRoof: () => void;
}

export function FloorTabs({ floorCount, floor, roofLevel, withRoof, onPickFloor, onPickRoof }: FloorTabsProps) {
  return (
    <div className="chips">
      {Array.from({ length: floorCount }, (_, f) => (
        <button key={f} className={f === floor && !roofLevel ? 'chip on' : 'chip'} onClick={() => onPickFloor(f)}>
          {f === 0 ? 'RDC' : `Étage ${f}`}
        </button>
      ))}
      {withRoof && (
        <button className={roofLevel ? 'chip on' : 'chip'} onClick={onPickRoof}>
          Toit
        </button>
      )}
    </div>
  );
}
