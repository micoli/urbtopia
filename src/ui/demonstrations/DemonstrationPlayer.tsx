import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { advance, FIXTURES, interiorFixturesOf } from '../../core';
import { compileDemonstration, type Demonstration, type DemonstrationCheckpoint, type DemonstrationStep, type DemonstrationText } from '../../core/demonstrations/scenario';
import { prefsStore } from '../../i18n/prefsStore';
import { demonstrationPreferencesStore } from '../../store/demonstrationPreferencesStore';
import { t } from '../../i18n/t';
import type { VenueScene } from '../../scene/VenueScene';
import { ActionButton } from '../common/ActionButton';
import { SwitchField } from '../common/SwitchField';
import { Icon } from '../common/Icon';
import type { IconName } from '../common/iconRegistry';
import { ProductionIndicators } from '../factory/ProductionIndicators';
import { DemonstrationCanvas } from './DemonstrationCanvas';
import { DEMONSTRATION_SPEEDS, useDemonstrationSpeed } from './useDemonstrationSpeed';

const NO_HIGHLIGHTS: readonly { x: number; y: number }[] = [];
export function demonstrationText(text: DemonstrationText): string {
  return text[prefsStore.getState().language === 'fr' ? 1 : 0];
}

function IconButton({ icon, label, variant, onClick, disabled }: { icon: IconName; label: string; variant?: 'primary'; onClick: () => void; disabled?: boolean }) {
  return <ActionButton className="demonstration-icon-button" variant={variant} onClick={onClick} disabled={disabled} aria-label={label} title={label}><Icon name={icon} size="1.25em" /></ActionButton>;
}

const PHASES = ['objective', 'action', 'explanation', 'result'] as const;
const PHASE_LABELS = { objective: 'demo.objective', action: 'demo.action', explanation: 'demo.why', result: 'demo.result' } as const;

const END_OF_STEP_PAUSE = 2_000;

function phaseDurationsOf(step: DemonstrationStep): number[] {
  return PHASES.map(phase => Math.max(2_500, demonstrationText(step[phase]).split(/\s+/).length / 3 * 1000));
}

function readingTimeOf(step: DemonstrationStep): number {
  return phaseDurationsOf(step).reduce((total, duration) => total + duration, END_OF_STEP_PAUSE);
}

function phaseAt(durations: number[], elapsed: number): number {
  let end = 0;
  const found = durations.findIndex(duration => elapsed < (end += duration));
  return found === -1 ? durations.length - 1 : found;
}

function Step({ scenario, checkpoint, playing, speed, onSpeedChange, subtitles, onSubtitlesChange, ready, onReady, onProgress, onAdvance, sceneRef }: {
  scenario: Demonstration;
  checkpoint: DemonstrationCheckpoint;
  playing: boolean;
  speed: number;
  onSpeedChange: (speed: number) => void;
  subtitles: boolean;
  onSubtitlesChange: (subtitles: boolean) => void;
  ready: boolean;
  onReady: () => void;
  onProgress: (fraction: number) => void;
  onAdvance: () => void;
  sceneRef: React.RefObject<VenueScene | null>;
}) {
  const [state, setState] = useState(() => structuredClone(checkpoint.state));
  const elapsed = useRef(0);
  const [phase, setPhase] = useState(0);
  const text = demonstrationText;
  const step = checkpoint.step;
  // The scene outlives the steps that chain automatically, so its camera keeps moving from one piece to the next.
  const [initial] = useState(() => checkpoint.state.buildings.find(building => building.id === scenario.buildingId)!);
  const [shown, setShown] = useState(checkpoint);
  if (shown !== checkpoint) {
    setShown(checkpoint);
    setState(structuredClone(checkpoint.state));
    setPhase(0);
  }
  useEffect(() => { elapsed.current = 0; }, [checkpoint]);
  const building = state.buildings.find(building => building.id === scenario.buildingId)!;
  const readingTime = readingTimeOf(step);
  useEffect(() => {
    if (!playing || !ready) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(250, Math.max(0, now - previous)) * speed;
      previous = now;
      if (document.hidden) return;
      elapsed.current += delta;
      setPhase(phaseAt(phaseDurationsOf(step), elapsed.current));
      onProgress(Math.min(1, elapsed.current / readingTime));
      setState(current => advance(current, current.lastSeen + delta).state);
      if (elapsed.current >= readingTime) {
        elapsed.current = 0;
        onAdvance();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [playing, ready, speed, readingTime, step, onProgress, onAdvance]);
  const showNextPhase = () => {
    const durations = phaseDurationsOf(step);
    const next = (phase + 1) % PHASES.length;
    elapsed.current = durations.slice(0, next).reduce((total, duration) => total + duration, 0);
    setPhase(next);
    onProgress(elapsed.current / readingTime);
  };
  const currentPhase = PHASES[phase]!;
  const purchase = interiorFixturesOf(building).reduce((total, fixture) => total + FIXTURES[fixture.type].price, 0);
  return <>
    <div className="demonstration-view">
      <div className="demonstration-stage">
        <DemonstrationCanvas initial={initial} building={building} highlight={step.highlight ?? NO_HIGHLIGHTS} camera={step.camera} playing={playing && ready} sceneRef={sceneRef} onReady={onReady} />
        {!ready ? <p className="demonstration-loading" role="status">{t('demo.loading')}</p> : null}
      {subtitles ? <>
        <button type="button" className="demonstration-badge" onClick={showNextPhase}>{t(PHASE_LABELS[currentPhase])}</button>
        <p className="demonstration-subtitle" role="status" aria-live="polite">{text(step[currentPhase])}</p>
      </> : null}
      </div>
      <div className="demonstration-controls">
        <IconButton icon="rotateLeft" label={t('demo.rotateLeft')} onClick={() => sceneRef.current?.rotate(-1)} />
        <IconButton icon="rotateRight" label={t('demo.rotateRight')} onClick={() => sceneRef.current?.rotate(1)} />
        <IconButton icon="recenter" label={t('demo.recenter')} onClick={() => sceneRef.current?.recenter(step.camera?.x, step.camera?.y, step.camera?.zoom)} />
        <select className="demonstration-speed" aria-label={t('demo.speed')} value={speed} onChange={event => onSpeedChange(Number(event.target.value))}>
          {DEMONSTRATION_SPEEDS.map(value => <option key={value} value={value}>{value}×</option>)}
        </select>
        <SwitchField label={t('demo.subtitles')} checked={subtitles} onChange={onSubtitlesChange} />
      </div>
    </div>
    <article className="demonstration-explanation" aria-labelledby="demonstration-step-title">
      <h3 id="demonstration-step-title">{text(step.title)}</h3>
      {subtitles ? null : <dl>
        {PHASES.map(phase => <Fragment key={phase}><dt>{t(PHASE_LABELS[phase])}</dt><dd>{text(step[phase])}</dd></Fragment>)}
      </dl>}
      <div className="demonstration-indicators"><ProductionIndicators factory={building} /><p>{t('demo.purchase')} : {purchase.toLocaleString()} Urbs</p></div>
    </article>
  </>;
}

export function DemonstrationPlayer({ scenario }: { scenario: Demonstration }) {
  useStore(prefsStore, store => store.language);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [subtitles, setSubtitles] = useState(true);
  const [speed, setSpeed] = useDemonstrationSpeed();
  const [restart, setRestart] = useState(0);
  const sceneRef = useRef<VenueScene | null>(null);
  const compiled = useMemo(() => {
    try { return { checkpoints: compileDemonstration(scenario) }; }
    catch (error) { console.error(error); return { error }; }
  }, [scenario]);
  const checkpoints = compiled.checkpoints;
  useEffect(() => {
    if (checkpoints) demonstrationPreferencesStore.getState().markSeen(scenario.buildingType);
  }, [checkpoints, scenario.buildingType]);
  const onAdvance = useCallback(() => {
    if (index >= scenario.steps.length - 1) setPlaying(false);
    else setIndex(current => current + 1);
  }, [index, scenario.steps.length]);
  const [progress, setProgress] = useState({ key: '', fraction: 0 });
  const stepKey = `${index}-${restart}`;
  const onProgress = useCallback((fraction: number) => setProgress({ key: stepKey, fraction }), [stepKey]);
  const sceneKey = String(restart);
  const [readyKey, setReadyKey] = useState('');
  const onReady = useCallback(() => setReadyKey(sceneKey), [sceneKey]);
  const go = (next: number) => {
    setPlaying(false);
    setIndex(next);
    setRestart(current => current + 1);
  };
  if (!checkpoints) return <p role="alert">{t('demo.unavailable')}</p>;
  const current = checkpoints[index]!;
  return <>
    <div className="demonstration-controls">
      <IconButton icon="skipBack" label={t('demo.previous')} onClick={() => go(index - 1)} disabled={index === 0} />
      <IconButton icon={playing ? 'pause' : 'play'} label={t(playing ? 'demo.pause' : 'demo.play')} variant="primary" onClick={() => setPlaying(value => !value)} />
      <IconButton icon="skipForward" label={t('demo.next')} onClick={() => go(index + 1)} disabled={index === checkpoints.length - 1} />
      <IconButton icon="restart" label={t('demo.restart')} onClick={() => go(0)} />
      <div className="demonstration-step-select">
        <span className="demonstration-progress" style={{ transform: `scaleX(${progress.key === stepKey ? progress.fraction : 0})` }} />
        <select aria-label={t('demo.steps')} value={index} onChange={event => go(Number(event.target.value))}>
          {checkpoints.map(({ step }, i) => <option key={step.id} value={i}>{i + 1}. {demonstrationText(step.title)}</option>)}
        </select>
      </div>
    </div>
    <p className="demonstration-current" role="status">{index + 1} / {checkpoints.length} — {demonstrationText(current.step.title)}</p>
    <div className="demonstration-content">
      <Step key={sceneKey} scenario={scenario} checkpoint={current} playing={playing} speed={speed} onSpeedChange={setSpeed} subtitles={subtitles} onSubtitlesChange={setSubtitles} ready={readyKey === sceneKey} onReady={onReady} onProgress={onProgress} onAdvance={onAdvance} sceneRef={sceneRef} />
    </div>
    {index === checkpoints.length - 1 ? <p className="note">{t('demo.end')}</p> : null}
  </>;
}
