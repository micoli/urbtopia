import type { AchievementMedalClient } from './types';

// The server's rule in memory: one Medal per account and category, earned the first time only.
export class FakeAchievementMedalWorld {
  private medals = new Set<string>();

  client(accountId: string): AchievementMedalClient {
    return {
      award: async (category) => {
        if (!/^[a-z]{1,26}$/.test(category)) throw new Error('Invalid category');
        const key = `${accountId}:${category}`;
        const earned = !this.medals.has(key);
        this.medals.add(key);
        return { medalCode: `achievements-${category}`, earned };
      },
    };
  }
}
