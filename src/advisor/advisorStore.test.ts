import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { prefsStore } from '../i18n/prefsStore';
import { FakeAdvisorEngine, type FakeAdvisorOptions } from './FakeAdvisorEngine';
import { setAdvisorEngine } from './currentAdvisorEngine';
import { advisorStore } from './advisorStore';

function install(options: FakeAdvisorOptions = {}): FakeAdvisorEngine {
  const engine = new FakeAdvisorEngine(options);
  setAdvisorEngine(engine);
  return engine;
}

describe('advisorStore', () => {
  beforeEach(() => {
    prefsStore.getState().setAdvisor(false);
    advisorStore.setState({ phase: 'idle', progress: 0, error: null });
  });
  afterEach(() => setAdvisorEngine(null));

  it('is off by default and downloads nothing before the Player confirms', () => {
    const engine = install();
    advisorStore.getState().requestEnable();
    expect(advisorStore.getState().phase).toBe('confirming');
    expect(engine.loaded).toBe(false);
    expect(prefsStore.getState().advisor).toBe(false);
  });

  it('stays off when the Player cancels', () => {
    install();
    advisorStore.getState().requestEnable();
    advisorStore.getState().cancelEnable();
    expect(advisorStore.getState().phase).toBe('idle');
    expect(prefsStore.getState().advisor).toBe(false);
  });

  it('turns on after the download', async () => {
    const engine = install();
    advisorStore.getState().requestEnable();
    await advisorStore.getState().confirmEnable();
    expect(advisorStore.getState()).toMatchObject({ phase: 'ready', progress: 1, error: null });
    expect(engine.loaded).toBe(true);
    expect(prefsStore.getState().advisor).toBe(true);
  });

  it('reports a missing WebGPU without asking to download', () => {
    install({ supported: false });
    advisorStore.getState().requestEnable();
    expect(advisorStore.getState()).toMatchObject({ phase: 'idle', error: 'unsupported' });
  });

  it('switches the option off and shows the error when the download fails', async () => {
    install({ loadFailure: 'out-of-memory' });
    advisorStore.getState().requestEnable();
    await advisorStore.getState().confirmEnable();
    expect(advisorStore.getState()).toMatchObject({ phase: 'idle', error: 'out-of-memory' });
    expect(prefsStore.getState().advisor).toBe(false);
  });

  it('loads from the cache when the option was already on', async () => {
    const engine = install();
    prefsStore.getState().setAdvisor(true);
    await advisorStore.getState().ensureLoaded();
    expect(advisorStore.getState().phase).toBe('ready');
    expect(engine.loaded).toBe(true);
  });

  it('does not load when the option is off', async () => {
    const engine = install();
    await advisorStore.getState().ensureLoaded();
    expect(engine.loaded).toBe(false);
  });

  it('deletes the model and switches the option off', async () => {
    const engine = install();
    advisorStore.getState().requestEnable();
    await advisorStore.getState().confirmEnable();
    await advisorStore.getState().deleteModel();
    expect(engine.deleted).toBe(true);
    expect(prefsStore.getState().advisor).toBe(false);
    expect(advisorStore.getState().phase).toBe('idle');
  });
});
