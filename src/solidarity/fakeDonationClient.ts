import type { DonationRecord } from '../core';
import { solidarityMedal } from './medal';
import type { DonationClient, DonationSnapshot } from './types';

export class FakeDonationWorld {
  private receipts = new Map<string, DonationRecord>();
  private medals = new Map<string, DonationSnapshot['medal']>();

  constructor(private now: () => number = Date.now) {}

  client(accountId: string): DonationClient {
    return { record: async donations => this.record(accountId, donations) };
  }

  private record(accountId: string, donations: readonly DonationRecord[]): DonationSnapshot {
    if (donations.length > 100) throw new Error('Invalid donations');
    const next = new Map(this.receipts);
    for (const donation of donations) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(donation.id) || !Number.isSafeInteger(donation.value) || donation.value <= 0) throw new Error('Invalid donation');
      const existing = next.get(donation.id);
      if (existing && (existing.accountId !== accountId || existing.value !== donation.value)) throw new Error('Donation conflict');
      next.set(donation.id, { ...donation, accountId });
    }
    const value = [...next.values()].filter(receipt => receipt.accountId === accountId).reduce((sum, receipt) => sum + receipt.value, 0);
    if (!Number.isSafeInteger(value)) throw new Error('Invalid donation total');
    this.receipts = next;
    const previous = this.medals.get(accountId);
    const medal = solidarityMedal(value, this.now());
    if (medal?.nameEn === previous?.nameEn) return { value, medal: previous ?? null };
    this.medals.set(accountId, medal);
    return { value, medal };
  }
}
