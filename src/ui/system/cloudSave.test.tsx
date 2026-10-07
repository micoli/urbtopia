import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../i18n/messages';
import { t } from '../../i18n/t';
import type { SaveConflict } from '../../persistence/cloud/cloudSync';
import { CloudSavePanel } from './CloudSavePanel';
import { CloudStatusLine } from './CloudStatusLine';
import { CloudVersionList } from './CloudVersionList';
import { SaveConflictDialog } from './SaveConflictDialog';
import { cloudStatusMessageKey } from './cloudStatusMessage';

const noop = () => {};
const T0 = 1_700_000_000_000;

describe('cloud status', () => {
  it.each([
    [{ kind: 'idle' }, 'cloud.status.idle'],
    [{ kind: 'syncing' }, 'cloud.status.syncing'],
    [{ kind: 'pending' }, 'cloud.status.pending'],
    [{ kind: 'synced', at: T0 }, 'cloud.status.synced'],
    [{ kind: 'offline' }, 'cloud.status.offline'],
    [{ kind: 'error', reason: 'newer-version' }, 'cloud.error.newer-version'],
    [{ kind: 'error', reason: 'unknown' }, 'cloud.error.unknown'],
  ] as const)('maps %j to a catalog message', (status, key) => {
    expect(cloudStatusMessageKey(status)).toBe(key);
    expect(MESSAGES[key]).toBeDefined();
  });

  it('shows the last sync time once synced, and not otherwise', () => {
    expect(renderToStaticMarkup(<CloudStatusLine status={{ kind: 'synced', at: T0 }} />)).toContain(t('cloud.lastSync'));
    expect(renderToStaticMarkup(<CloudStatusLine status={{ kind: 'offline' }} />)).not.toContain(t('cloud.lastSync'));
  });
});

describe('cloud save panel', () => {
  const panel = (props: Partial<Parameters<typeof CloudSavePanel>[0]> = {}) =>
    renderToStaticMarkup(<CloudSavePanel status={{ kind: 'pending' }} versions={null} onSaveNow={noop} onShowVersions={noop} onRestore={noop} onDelete={noop} {...props} />);

  it('offers saving now, previous versions and deleting the cloud data', () => {
    const html = panel();
    expect(html).toContain(t('cloud.saveNow'));
    expect(html).toContain(t('cloud.versions.show'));
    expect(html).toContain(t('cloud.delete'));
  });

  it('disables saving now while syncing', () => {
    expect(panel({ status: { kind: 'syncing' } })).toMatch(/<button[^>]*disabled[^>]*>[^<]*Save now/i);
  });

  it('lists previous versions with a restore button, except the current one', () => {
    const versions = [
      { revision: 3, clientSavedAt: T0, createdAt: T0 },
      { revision: 2, clientSavedAt: T0 - 1000, createdAt: T0 - 1000 },
    ];
    const html = renderToStaticMarkup(<CloudVersionList versions={versions} onRestore={noop} />);
    expect(html.match(new RegExp(t('cloud.versions.restore'), 'g'))).toHaveLength(1);
    expect(html).toContain(t('cloud.versions.current'));
  });

  it('says so when there is no previous version', () => {
    expect(renderToStaticMarkup(<CloudVersionList versions={[]} onRestore={noop} />)).toContain(t('cloud.versions.none'));
  });
});

describe('save conflict dialog', () => {
  const conflict: SaveConflict = {
    local: { savedAt: T0, citizens: 42 },
    cloud: { savedAt: T0 + 5000, citizens: 77, revision: 4 },
  };

  it('shows both cities with their citizens and a choice for each', () => {
    const html = renderToStaticMarkup(<SaveConflictDialog conflict={conflict} onChoose={noop} />);
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('42');
    expect(html).toContain('77');
    expect(html).toContain(t('cloud.conflict.keepLocal'));
    expect(html).toContain(t('cloud.conflict.keepCloud'));
  });
});
