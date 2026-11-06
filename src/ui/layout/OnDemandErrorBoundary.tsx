import { Component, type ReactNode } from 'react';
import { isChunkLoadError, reloadOnceForStaleChunk } from '../../pwa/reloadOnStaleChunk';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

// A lazy dialog that fails to load must not take the whole game down with it.
export class OnDemandErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    console.error(error);
    if (isChunkLoadError(error)) reloadOnceForStaleChunk();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
