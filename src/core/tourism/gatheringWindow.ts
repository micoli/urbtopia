import type { Building, GatheringData } from '../engine/state';

// The crowd arrives in the hour before the start and leaves in the hour after the end.
export const CROWD_WINDOW_MS = 3_600_000;

export const isCrowdMoving = (gathering: GatheringData, now: number): boolean => gathering.startsAt - CROWD_WINDOW_MS <= now && now < gathering.endsAt + CROWD_WINDOW_MS;

export const movingGathering = (building: Pick<Building, 'attraction'>, now: number): GatheringData | undefined => {
  const gathering = building.attraction?.gathering;
  return gathering && isCrowdMoving(gathering, now) ? gathering : undefined;
};

// How far the neighbours of an Attraction without a reach of its own feel its crowd.
export const GATHERING_REACH = 14;

// A time skip moves the timers of the city back; the Gatherings, the cooldowns, the Championship calendar and the Tourist boost follow, so the skipped hours count for them too.
export const shiftAttractionTimers = <T extends Pick<Building, 'attraction' | 'club'>>(building: T, shiftMs: number): T => {
  const { attraction, club } = building;
  const championship = club?.championship;
  if (!attraction && !championship) return building;
  const shiftedAttraction = attraction && {
    ...attraction,
    ...(attraction.cooldownUntil === undefined ? {} : { cooldownUntil: attraction.cooldownUntil + shiftMs }),
    ...(attraction.boostUntil === undefined ? {} : { boostUntil: attraction.boostUntil + shiftMs }),
    ...(attraction.meetingAt === undefined ? {} : { meetingAt: attraction.meetingAt + shiftMs }),
    ...(attraction.gathering ? { gathering: { ...attraction.gathering, startsAt: attraction.gathering.startsAt + shiftMs, endsAt: attraction.gathering.endsAt + shiftMs } } : {}),
  };
  const shiftedClub = club && championship && { ...club, championship: { ...championship, fixtures: championship.fixtures.map(fixture => ({ ...fixture, at: fixture.at + shiftMs })) } };
  return { ...building, ...(shiftedAttraction ? { attraction: shiftedAttraction } : {}), ...(shiftedClub ? { club: shiftedClub } : {}) };
};
