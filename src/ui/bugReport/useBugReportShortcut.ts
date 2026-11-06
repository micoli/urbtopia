import { useEffect } from 'react';
import { isTypingTarget } from '../../dom/isTypingTarget';
import { isBugReportShortcut } from './isBugReportShortcut';
import { requestBugReport } from './requestBugReport';

export function useBugReportShortcut(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isBugReportShortcut(event) || isTypingTarget(event.target)) return;
      event.preventDefault();
      void requestBugReport();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
