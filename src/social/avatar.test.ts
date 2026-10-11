import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AVATAR_IDS, avatarOf, defaultAvatarOf, isAvatarId } from './avatar';

describe('avatar', () => {
  it('derives the same default Avatar for the same account', () => {
    expect(defaultAvatarOf('user-1')).toBe(defaultAvatarOf('user-1'));
    expect(isAvatarId(defaultAvatarOf('user-1'))).toBe(true);
  });

  it('spreads default Avatars over the whole set', () => {
    const defaults = new Set(Array.from({ length: 300 }, (_, index) => defaultAvatarOf(`user-${index}`)));
    expect(defaults.size).toBe(AVATAR_IDS.length);
  });

  it('prefers the chosen Avatar and ignores an unknown one', () => {
    expect(avatarOf('user-1', 'character-male-f')).toBe('character-male-f');
    expect(avatarOf('user-1', 'character-unknown')).toBe(defaultAvatarOf('user-1'));
    expect(avatarOf('user-1', null)).toBe(defaultAvatarOf('user-1'));
  });

  it('matches the Avatar list enforced by the database', () => {
    const directory = 'supabase/migrations';
    const migration = readdirSync(directory).filter((name) => name.endsWith('_urb_avatar.sql')).map((name) => readFileSync(`${directory}/${name}`, 'utf8'))[0]!;
    const listed = [...migration.match(/avatar in \(([^)]*)\)/)![1]!.matchAll(/'([^']+)'/g)].map((match) => match[1]);
    expect(listed).toEqual([...AVATAR_IDS]);
  });

  it('has a model for every Avatar', () => {
    for (const id of AVATAR_IDS) expect(() => readFileSync(`public/models/mini-characters/${id}.glb`)).not.toThrow();
  });
});
