import { useEffect, useState } from 'react';
import { partIcon } from '../../scene/puzzle/puzzleIcons';
import { partLook } from '../../scene/puzzle/puzzleModels';

interface PuzzlePartIconProps {
  kind: string;
}

// The picture of a Part: its model drawn once, turned over for the left-hand Parts. Empty until the model has loaded.
export function PuzzlePartIcon({ kind }: PuzzlePartIconProps) {
  const [source, setSource] = useState<string | undefined>(undefined);
  const { model, mirrored } = partLook(kind);

  useEffect(() => {
    let current = true;
    void partIcon(model).then((url) => {
      if (current) setSource(url);
    });
    return () => {
      current = false;
    };
  }, [model]);

  return <span className={mirrored ? 'puzzle-part-icon puzzle-part-icon--mirrored' : 'puzzle-part-icon'}>{source ? <img src={source} alt="" draggable={false} /> : null}</span>;
}
