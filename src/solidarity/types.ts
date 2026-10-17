import type { MedalInfo } from '../challenges/types';
import type { DonationRecord } from '../core';

export interface DonationSnapshot {
  value: number;
  medal: MedalInfo | null;
}

export interface DonationClient {
  record(donations: readonly DonationRecord[]): Promise<DonationSnapshot>;
}
