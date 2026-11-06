import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CODEX_ENTRIES } from '../../codex/catalog';
import { favoriteKeyOf, favoriteTargetOf } from '../../codex/favorites';
import { CodexFavoritesNav } from './CodexFavoritesNav';

describe('Codex favorites', () => {
  it('round-trips an entry key and ignores unknown keys', () => {
    const id = CODEX_ENTRIES[0]!.id;
    const key = favoriteKeyOf({ kind: 'entry', id });
    expect(favoriteTargetOf(key, [])).toEqual({ kind: 'entry', id });
    expect(favoriteTargetOf('entry:nope', [])).toBeNull();
    expect(favoriteTargetOf('garbage', [])).toBeNull();
  });

  it('renders nothing without favorites and lists them otherwise', () => {
    const none = renderToStaticMarkup(<CodexFavoritesNav idPrefix="x" favorites={[]} expanded onToggle={() => {}} onChoose={() => {}} />);
    expect(none).toBe('');
    const id = CODEX_ENTRIES[0]!.id;
    const html = renderToStaticMarkup(<CodexFavoritesNav idPrefix="x" favorites={[{ target: { kind: 'entry', id }, label: 'Mon favori', current: false }]} expanded onToggle={() => {}} onChoose={() => {}} />);
    expect(html).toContain('Mon favori');
  });
});
