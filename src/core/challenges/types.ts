import type { TradeLine } from '../trade/types';

// The accepted Challenge as the save knows it: its goal, what has been set aside so far and the server deadline.
export interface ChallengeProgress {
  id: string;
  goal: TradeLine[];
  stock: Partial<Record<string, number>>;
  deadline: number;
}
