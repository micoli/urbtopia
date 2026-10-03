import { BottomBar } from './BottomBar';
import { BottomSheet } from './BottomSheet';
import { TopBar } from './TopBar';

export function LayoutA() {
  return (
    <>
      <TopBar />
      <BottomSheet />
      <BottomBar />
    </>
  );
}
