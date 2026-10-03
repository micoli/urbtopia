import { BottomSheet } from './BottomSheet';
import { MinimalStats } from '../stats/MinimalStats';
import { RadialMenu } from './RadialMenu';

export function LayoutB() {
  return (
    <>
      <MinimalStats />
      <BottomSheet />
      <RadialMenu />
    </>
  );
}
