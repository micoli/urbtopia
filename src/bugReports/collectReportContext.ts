import { describeEnvironment, readGpuName } from './reportContext';
import { recentErrors } from './recentErrors';

export function collectReportContext(): Record<string, unknown> {
  return describeEnvironment({
    version: __RELEASE_NAME__,
    buildId: __BUILD_ID__,
    userAgent: navigator.userAgent,
    language: navigator.language,
    screen: { width: window.innerWidth, height: window.innerHeight, pixelRatio: window.devicePixelRatio },
    gpu: readGpuName(),
    errors: recentErrors(),
  });
}
