import type { DonationRecord } from '../core';
import type { DonationSnapshot } from './types';

export const DONATION_STORAGE_KEY = 'urbtopia:donations';

interface DonationData {
  pending: DonationRecord[];
  accounts: Record<string, DonationSnapshot>;
}

export function readDonationData(): DonationData {
  try {
    const raw = localStorage.getItem(DONATION_STORAGE_KEY);
    if (!raw) return { pending: [], accounts: {} };
    const data = JSON.parse(raw) as DonationData;
    if (!Array.isArray(data.pending) || typeof data.accounts !== 'object' || data.accounts === null) throw new Error('Invalid donation data');
    if (!data.pending.every(receipt => typeof receipt.id === 'string' && Number.isSafeInteger(receipt.value) && receipt.value > 0 && (receipt.accountId === undefined || typeof receipt.accountId === 'string'))) throw new Error('Invalid donation receipt');
    if (!Object.values(data.accounts).every(snapshot => typeof snapshot === 'object' && snapshot !== null && Number.isSafeInteger(snapshot.value) && snapshot.value >= 0 && (snapshot.medal === null || (typeof snapshot.medal === 'object' && snapshot.medal !== null && snapshot.medal.medalCode === 'solidarity' && typeof snapshot.medal.nameFr === 'string' && typeof snapshot.medal.nameEn === 'string' && Number.isFinite(snapshot.medal.earnedAt))))) throw new Error('Invalid donation account');
    return data;
  } catch {
    return { pending: [], accounts: {} };
  }
}

export function writeDonationData(data: DonationData): boolean {
  try {
    localStorage.setItem(DONATION_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
