import { sceneHandle } from '../store/sceneHandle';

export function CameraButtons() {
  return (
    <div className="camera-buttons">
      <button type="button" aria-label="Rotate left" onClick={() => sceneHandle.current?.camera.rotate(-1)}>
        ⟲
      </button>
      <button type="button" aria-label="Rotate right" onClick={() => sceneHandle.current?.camera.rotate(1)}>
        ⟳
      </button>
    </div>
  );
}
