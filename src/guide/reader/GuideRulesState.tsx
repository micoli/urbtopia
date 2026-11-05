import type { ReactNode } from 'react';
import { RulesStateContext } from '../../ui/codex/rulesStateContext';
import { useReaderState } from './useReaderState';

interface GuideRulesStateProps {
  children: ReactNode;
}

export function GuideRulesState({ children }: GuideRulesStateProps) {
  return <RulesStateContext value={useReaderState()}>{children}</RulesStateContext>;
}
