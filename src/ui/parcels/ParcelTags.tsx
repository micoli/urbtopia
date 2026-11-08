import { buyableParcels, parcelPrice } from '../../core';
import { useGame, useUi } from '../common/hooks';
import { ParcelTag } from './ParcelTag';

export function ParcelTags() {
  const tool = useUi((store) => store.tool);
  const isParcelTool = tool?.kind === 'parcel';
  const state = useGame((store) => (isParcelTool ? store.state : null));
  if (!state) return null;

  const price = parcelPrice(state);
  return (
    <>
      {buyableParcels(state).map((parcel) => (
        <ParcelTag key={`${parcel.x},${parcel.y}`} parcelX={parcel.x} parcelY={parcel.y} price={price} />
      ))}
    </>
  );
}
