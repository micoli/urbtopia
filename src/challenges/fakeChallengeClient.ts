import { FIRST_CITY_ID } from '../persistence/cities';
import { ChallengeError, type AcceptedChallenge, type Challenge, type ChallengeClient, type ChallengeDeclaration, type ChallengeSnapshot, type Medal } from './types';

const DAY_MS = 86_400_000;

interface Acceptance extends AcceptedChallenge {
  state: 'accepted' | 'completed' | 'expired' | 'abandoned';
}

// In-memory world mirroring the server rules, shared by the fake clients of several players.
export class FakeChallengeWorld {
  challenges: Challenge[] = [];
  private acceptances = new Map<string, Acceptance[]>();
  private medals = new Map<string, Medal[]>();

  constructor(public now: () => number = Date.now) {}

  client(userId: string | null, options: { email?: boolean; handle?: boolean; cityId?: string } = {}): ChallengeClient {
    return new FakeChallengeClient(this, userId, options.email ?? true, options.handle ?? true, options.cityId ?? FIRST_CITY_ID);
  }

  acceptancesOf(userId: string, cityId: string = FIRST_CITY_ID): Acceptance[] {
    const key = `${userId}|${cityId}`;
    const found = this.acceptances.get(key) ?? [];
    for (const acceptance of found) if (acceptance.state === 'accepted' && acceptance.deadline <= this.now()) acceptance.state = 'expired';
    this.acceptances.set(key, found);
    return found;
  }

  medalsOf(userId: string): Medal[] {
    return this.medals.get(userId) ?? [];
  }

  addMedal(userId: string, medal: Medal): void {
    this.medals.set(userId, [...this.medalsOf(userId), medal]);
  }
}

class FakeChallengeClient implements ChallengeClient {
  constructor(
    private world: FakeChallengeWorld,
    private userId: string | null,
    private email: boolean,
    private handle: boolean,
    private cityId: string,
  ) {}

  async list(): Promise<ChallengeSnapshot> {
    const user = this.member();
    const now = this.world.now();
    const active = this.world.acceptancesOf(user, this.cityId).find(({ state }) => state === 'accepted');
    return {
      serverNow: now,
      challenges: this.world.challenges.filter(({ id, startsAt, endsAt }) => ((startsAt <= now && endsAt > now) || active?.challengeId === id) && !this.world.acceptancesOf(user, this.cityId).some((acceptance) => acceptance.challengeId === id && acceptance.state === 'completed')),
      abandoned: this.world.acceptancesOf(user, this.cityId).filter(({ state }) => state === 'abandoned').map(({ challengeId }) => challengeId),
      accepted: active ? { challengeId: active.challengeId, acceptedAt: active.acceptedAt, deadline: active.deadline } : null,
      medals: this.world.medalsOf(user),
    };
  }

  async accept(challengeId: string): Promise<AcceptedChallenge> {
    const user = this.member();
    const now = this.world.now();
    const acceptances = this.world.acceptancesOf(user, this.cityId);
    const existing = acceptances.find((acceptance) => acceptance.challengeId === challengeId);
    if (existing) {
      if (existing.state !== 'accepted') throw new ChallengeError('challenge-unavailable');
      return { challengeId, acceptedAt: existing.acceptedAt, deadline: existing.deadline };
    }
    const challenge = this.world.challenges.find(({ id, startsAt, endsAt }) => id === challengeId && startsAt <= now && endsAt > now);
    if (!challenge) throw new ChallengeError('challenge-unavailable');
    if (acceptances.some(({ state }) => state === 'accepted')) throw new ChallengeError('challenge-busy');
    const acceptance: Acceptance = { challengeId, acceptedAt: now, deadline: challenge.kind === 'daily' ? now + DAY_MS : challenge.endsAt, state: 'accepted' };
    acceptances.push(acceptance);
    return { challengeId, acceptedAt: acceptance.acceptedAt, deadline: acceptance.deadline };
  }

  async declare(challengeId: string): Promise<ChallengeDeclaration> {
    const user = this.member();
    const acceptance = this.world.acceptancesOf(user, this.cityId).find((candidate) => candidate.challengeId === challengeId);
    const challenge = this.world.challenges.find(({ id }) => id === challengeId);
    if (!acceptance || acceptance.state === 'expired' || !challenge) throw new ChallengeError('challenge-unavailable');
    const alreadyClaimed = acceptance.state === 'completed';
    if (!alreadyClaimed) {
      acceptance.state = 'completed';
      if (challenge.rewardKind === 'medal' && challenge.medalCode) this.world.addMedal(user, { challengeId, medalCode: challenge.medalCode, nameFr: challenge.nameFr, nameEn: challenge.nameEn, earnedAt: this.world.now() });
    }
    return { challengeId, rewardKind: challenge.rewardKind, goal: challenge.goal, medalCode: challenge.medalCode, alreadyClaimed };
  }

  async abandon(challengeId: string): Promise<void> {
    const acceptance = this.world.acceptancesOf(this.member(), this.cityId).find((candidate) => candidate.challengeId === challengeId);
    if (acceptance?.state !== 'accepted') throw new ChallengeError('challenge-unavailable');
    acceptance.state = 'abandoned';
  }

  private member(): string {
    if (this.userId === null) throw new ChallengeError('unauthenticated');
    if (!this.email) throw new ChallengeError('email-required');
    if (!this.handle) throw new ChallengeError('handle-required');
    return this.userId;
  }
}
