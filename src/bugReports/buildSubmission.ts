import type { CityAttachment } from './cityAttachment';
import { MAX_DESCRIPTION_LENGTH } from './limits';
import type { ReportSnapshot } from './liveReportSnapshot';
import type { BugReportSubmission } from './types';

export type ImageChoice = 'map' | 'screen' | 'none';

export interface ReportDraft {
  description: string;
  image: ImageChoice;
  attachCity: boolean;
}

export function imageOf(snapshot: Pick<ReportSnapshot, 'map' | 'screen'>, choice: ImageChoice): string | null {
  if (choice === 'none') return null;
  return choice === 'screen' ? snapshot.screen : snapshot.map;
}

export function canSend(description: string): boolean {
  const length = description.trim().length;
  return length > 0 && length <= MAX_DESCRIPTION_LENGTH;
}

export function buildSubmission(
  draft: ReportDraft,
  snapshot: Pick<ReportSnapshot, 'map' | 'screen' | 'pose' | 'cityId' | 'citySeed'>,
  city: CityAttachment | null,
  context: Record<string, unknown>,
): BugReportSubmission {
  return {
    description: draft.description.trim(),
    camera: snapshot.pose,
    context,
    cityId: snapshot.cityId,
    citySeed: snapshot.citySeed,
    screenshot: imageOf(snapshot, draft.image),
    city: draft.attachCity ? city : null,
  };
}
