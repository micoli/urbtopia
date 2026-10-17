import { saveNowHandle } from '../persistence/saveNow';
import { cloudStore } from '../store/cloudStore';
import { gameStore } from '../store/gameStore';
import { readOnlyStore } from '../store/readOnlyStore';
import { socialStore } from '../store/socialStore';
import { solidarityStore } from '../store/solidarityStore';
import { DONATION_STORAGE_KEY, readDonationData, writeDonationData } from './donationOutbox';
import { solidarityMedal } from './medal';
import type { DonationClient } from './types';

export function installSolidarity(): () => void {
  let data = readDonationData();
  let client: DonationClient | null = null;
  let disposed = false;
  let syncing = false;
  const accountId = () => cloudStore.getState().account?.userId;
  const publish = () => {
    const id = accountId();
    const snapshot = id ? data.accounts[id] : undefined;
    const pendingValue = data.pending.filter(receipt => receipt.accountId === id || receipt.accountId === undefined).reduce((sum, receipt) => sum + receipt.value, 0);
    const value = (snapshot?.value ?? 0) + pendingValue;
    solidarityStore.setState({ value, pendingValue, medal: solidarityMedal(value, snapshot?.medal?.earnedAt ?? Date.now()) });
  };
  const capture = () => {
    if (readOnlyStore.getState().readOnly) return;
    const known = new Set(data.pending.map(receipt => receipt.id));
    const fresh = (gameStore.getState().state.donations ?? []).filter(receipt => !known.has(receipt.id));
    if (fresh.length) {
      data = { ...data, pending: [...data.pending, ...fresh] };
      if (!writeDonationData(data)) solidarityStore.setState({ failed: true });
    }
    publish();
  };
  const sync = async () => {
    const id = accountId();
    if (disposed || syncing || !client || !id || !cloudStore.getState().account?.email || !socialStore.getState().profile || readOnlyStore.getState().readOnly) return;
    syncing = true;
    let succeeded = false;
    try {
      data = { ...data, pending: data.pending.map(receipt => receipt.accountId === undefined ? { ...receipt, accountId: id } : receipt) };
      if (!writeDonationData(data)) throw new Error('Donation storage unavailable');
      saveNowHandle.current();
      const batch = data.pending.filter(receipt => receipt.accountId === id).slice(0, 100);
      const snapshot = await client.record(batch);
      if (disposed || readOnlyStore.getState().readOnly || accountId() !== id) return;
      const acknowledged = new Set(batch.map(receipt => receipt.id));
      data = { pending: data.pending.filter(receipt => !acknowledged.has(receipt.id)), accounts: { ...data.accounts, [id]: snapshot } };
      if (!writeDonationData(data)) throw new Error('Donation storage unavailable');
      gameStore.getState().send({ type: 'ConfirmDonations', ids: [...acknowledged] });
      saveNowHandle.current();
      solidarityStore.setState({ failed: false });
      publish();
      succeeded = true;
    } catch {
      if (!disposed) solidarityStore.setState({ failed: true });
    } finally {
      syncing = false;
      if (!disposed && succeeded && data.pending.some(receipt => receipt.accountId === accountId())) void sync();
    }
  };
  const update = () => { capture(); void sync(); };
  const stopGame = gameStore.subscribe((current, previous) => {
    if (current.state.donations === previous.state.donations) return;
    update();
  });
  const stopCloud = cloudStore.subscribe((current, previous) => {
    if (current.account?.userId !== previous.account?.userId || current.account?.email !== previous.account?.email) update();
  });
  const stopSocial = socialStore.subscribe((current, previous) => {
    if (!!current.profile !== !!previous.profile) update();
  });
  const onVisible = () => { if (document.visibilityState === 'visible') update(); };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== DONATION_STORAGE_KEY) return;
    data = readDonationData();
    update();
  };
  const stopReadOnly = readOnlyStore.subscribe((current, previous) => {
    if (current.readOnly || !previous.readOnly) return;
    data = readDonationData();
    update();
  });
  window.addEventListener('online', update);
  window.addEventListener('storage', onStorage);
  document.addEventListener('visibilitychange', onVisible);
  const timer = setInterval(() => { if (document.visibilityState === 'visible') void sync(); }, 30_000);
  capture();
  void import('./supabaseDonationClient').then(module => module.loadDonationClient()).then(loaded => {
    if (disposed) return;
    client = loaded;
    void sync();
  }).catch(() => { if (!disposed) solidarityStore.setState({ failed: true }); });
  return () => {
    disposed = true;
    stopGame();
    stopCloud();
    stopSocial();
    stopReadOnly();
    window.removeEventListener('online', update);
    window.removeEventListener('storage', onStorage);
    document.removeEventListener('visibilitychange', onVisible);
    clearInterval(timer);
  };
}
