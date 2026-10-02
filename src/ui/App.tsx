import { CameraButtons } from './CameraButtons';
import { ConfirmPad } from './ConfirmPad';
import { Dock } from './Dock';
import { Flyout } from './Flyout';
import { SceneCanvas } from './SceneCanvas';
import { SidePanel } from './SidePanel';
import { Toast } from './Toast';

export function App() {
  return (
    <>
      <SceneCanvas />
      <Dock />
      <Flyout />
      <SidePanel />
      <ConfirmPad />
      <Toast />
      <CameraButtons />
    </>
  );
}
