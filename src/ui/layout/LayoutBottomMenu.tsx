import { BottomBar } from './BottomBar';
import { BottomSheet } from './BottomSheet';
import { TopBar } from './TopBar';

export function LayoutBottomMenu() {
  return (
    <>
      <TopBar />
      <BottomSheet />
      <BottomBar />
    </>
  );
}
