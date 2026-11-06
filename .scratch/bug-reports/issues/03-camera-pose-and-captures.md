# 03 - Camera pose and captures

Status: done

Spec: [spec.md](../spec.md)

## What

- **Camera pose**: read and write position, zoom, rotation (yaw) and Level on the scene (`CameraController` already exposes `view`/`setView` for position and zoom; add yaw and Level), as a pure `CameraPose` type with parse/serialize.
- **Map capture**: render then read the WebGL canvas in the same frame (no `preserveDrawingBuffer`), resized to about 1,280 px, WebP/JPEG quality 0.7, base64.
- **Whole-screen capture**: canvas composed with the rendered DOM (`html-to-image`, check the bundle budget with `check:bundle`; load it on demand). On failure only the map capture is offered.
- A `captureReportSnapshot()` that returns both captures, the pose and a copy of the City (`exportEnvelope`) in one frozen object.

## Done when

Unit tests for pose parse/serialize and image sizing; the scene capture is checked by hand in the browser; the capture library is not in the main bundle.
