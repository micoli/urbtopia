import type { GameState } from '../engine/state';
import type { AchievementTrigger, TriggerContext } from './achievementTypes';
import { counterValue } from './counters';

export function isRaised(trigger: AchievementTrigger, { before, after, events, command }: TriggerContext): boolean {
  switch (trigger.type) {
    case 'created':
      return counterValue(after, trigger.counter) > counterValue(before, trigger.counter);
    case 'threshold':
      return counterValue(after, trigger.counter) >= trigger.atLeast;
    case 'command':
      return command !== undefined && trigger.commands.includes(command.type);
    case 'sim':
      return events.some((event) => event.type === trigger.event);
    case 'signal':
      return command?.type === 'Signal' && command.signal === trigger.signal;
  }
}

// What the state of a City proves about a trigger, without the Command that raised it; a trigger the state cannot prove returns false.
export function isProvenBy(trigger: AchievementTrigger, state: GameState): boolean {
  switch (trigger.type) {
    case 'created':
      return counterValue(state, trigger.counter) > 0;
    case 'threshold':
      return counterValue(state, trigger.counter) >= trigger.atLeast;
    default:
      return false;
  }
}
