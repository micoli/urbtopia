import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefsStore } from '../../i18n/prefsStore';
import { CopyJsonButton } from './CopyJsonButton';
import { PanelHeader } from './PanelHeader';

// Static rendering reads the initial state of a store: the test reads the current one.
vi.mock('zustand', async importOriginal => ({
  ...(await importOriginal<typeof import('zustand')>()),
  useStore: (store: { getState: () => unknown }, selector: (state: unknown) => unknown) => selector(store.getState()),
}));

afterEach(() => prefsStore.getState().setDebug(false));

describe('CopyJsonButton', () => {
  it('shows nothing unless the debug preference is on', () => {
    expect(renderToStaticMarkup(<CopyJsonButton node={{ id: 1 }} />)).toBe('');
    prefsStore.getState().setDebug(true);
    expect(renderToStaticMarkup(<CopyJsonButton node={{ id: 1 }} />)).toContain('Copy as JSON');
  });

  it('sits in the header of a panel that gives its node, and only there', () => {
    prefsStore.getState().setDebug(true);
    expect(renderToStaticMarkup(<PanelHeader title="Bakery" onClose={() => {}} debugNode={{ id: 433 }} />)).toContain('Copy as JSON');
    expect(renderToStaticMarkup(<PanelHeader title="Bakery" onClose={() => {}} />)).not.toContain('Copy as JSON');
  });
});
