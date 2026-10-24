import { totalCitizens } from '../core';
import { CURRENT_VERSION, parseEnvelope, serializeEnvelope, type ParseOptions } from '../persistence/envelope';

export interface ShowcaseContent {
  envelope: string;
  formatVersion: number;
  citizens: number;
}

export function showcaseContent(envelope: string, options?: ParseOptions): ShowcaseContent | null {
  const parsed = parseEnvelope(envelope, options);
  if (!parsed.ok) return null;
  return {
    envelope: serializeEnvelope({ ...parsed.state, tradeLedger: [] }, parsed.savedAt),
    formatVersion: CURRENT_VERSION,
    citizens: totalCitizens(parsed.state),
  };
}
