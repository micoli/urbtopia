import { useEffect, useState } from 'react';
import type { MatchDecision } from '../../core';
import { gameStore } from '../../store/gameStore';

// The clock and the decisions of a Match played on the management page: a step is a minute at football, an inning at baseball.
export function useLiveMatch(buildingId: number, lastStep: number, tickMs: number) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [decisions, setDecisions] = useState<MatchDecision[]>([]);
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setStep(current => Math.min(lastStep, current + 1)), tickMs);
    return () => clearInterval(timer);
  }, [playing, lastStep, tickMs]);

  useEffect(() => {
    if (step >= lastStep) setPlaying(false);
  }, [step, lastStep]);

  return {
    step,
    playing,
    decisions,
    recorded,
    finished: step >= lastStep,
    toggle: () => setPlaying(!playing),
    skip: () => setStep(lastStep),
    decide: (decision: MatchDecision) => {
      setRecorded(false);
      setDecisions([...decisions, decision]);
    },
    record: () => {
      gameStore.getState().send({ type: 'PlayMatch', buildingId, decisions });
      setRecorded(true);
    },
  };
}
