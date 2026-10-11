import { useEffect, useState } from 'react';
import { itemModelOf, type ItemId } from '../../core';
import { modelThumbnail } from '../collect/modelThumbnail';

export function ItemIcon({ item }: { item: ItemId }) {
  const [source, setSource] = useState<string | null>(null);
  const model = itemModelOf(item);

  useEffect(() => {
    if (!model) return;
    let current = true;
    void modelThumbnail(model).then((url) => {
      if (current) setSource(url);
    });
    return () => {
      current = false;
    };
  }, [model]);

  if (!source) return <span className="item-icon" />;
  return <img className="item-icon" src={source} alt="" draggable={false} />;
}
