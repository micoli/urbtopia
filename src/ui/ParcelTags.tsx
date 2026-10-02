import { buyableParcels, parcelPrice } from '../core';
import { useGame, useUi } from './hooks';
import { ParcelTag } from './ParcelTag';

export function ParcelTags() {
  const tool = useUi((store) => store.tool);
  const state = useGame((store) => store.state);
  if (tool?.kind !== 'parcel') return null;

  const price = parcelPrice(state);
  return (
    <>
      {buyableParcels(state).map((parcel) => (
        <ParcelTag key={`${parcel.x},${parcel.y}`} parcelX={parcel.x} parcelY={parcel.y} price={price} />
      ))}
    </>
  );
}
