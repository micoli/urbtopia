import { describe, expect, it } from 'vitest';
import { FakeDonationWorld } from './fakeDonationClient';

describe('account donation progression', () => {
  it('counts retried donations once, combines cities, and evolves a single Medal', async () => {
    const world = new FakeDonationWorld(() => 1234);
    const client = world.client('player');
    const donation = { id: '10000000-0000-4000-8000-000000000001', value: 1000 };
    const first = await client.record([donation]);
    expect(first.value).toBe(1000);
    expect(first.medal?.nameEn).toContain('bronze');
    expect((await client.record([donation])).value).toBe(1000);
    expect((await world.client('player').record([])).value).toBe(1000);
    const silver = await client.record([{ id: '10000000-0000-4000-8000-000000000002', value: 9000 }]);
    expect(silver.value).toBe(10000);
    expect(silver.medal?.nameEn).toContain('silver');
    const gold = await client.record([{ id: '10000000-0000-4000-8000-000000000003', value: 90000 }]);
    expect(gold.value).toBe(100000);
    expect(gold.medal?.medalCode).toBe(first.medal?.medalCode);
    expect(gold.medal?.nameEn).toContain('gold');
  });

  it('isolates accounts and refuses to attribute a receipt twice or change its value', async () => {
    const world = new FakeDonationWorld();
    const donation = { id: '10000000-0000-4000-8000-000000000001', value: 1000 };
    await world.client('first').record([donation]);
    expect((await world.client('second').record([])).value).toBe(0);
    await expect(world.client('second').record([donation])).rejects.toThrow('Donation conflict');
    await expect(world.client('first').record([{ ...donation, value: 10000 }])).rejects.toThrow('Donation conflict');
    expect((await world.client('first').record([])).value).toBe(1000);
  });
});
