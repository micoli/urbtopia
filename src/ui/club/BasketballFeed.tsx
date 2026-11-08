import type { BasketballEvent } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';

export const basketballEventText = (event: BasketballEvent): string => {
  const base = t(`club.event.${event.type}` as MessageKey);
  if (event.type === 'substitution') return base.replace('{player}', event.player).replace('{replaced}', event.replaced);
  if (event.type === 'tactic') return base.replace('{tactic}', t(`club.tactic.${event.tactic}` as MessageKey));
  if (event.type === 'freeThrows') return base.replace('{player}', event.player).replace('{points}', `${event.points}`);
  return base.replace('{player}', event.player);
};

export function BasketballFeed({ events }: { events: readonly BasketballEvent[] }) {
  return (
    <ol className="club-feed" aria-live="polite">
      {[...events].reverse().map((event, index) => (
        <li key={`${events.length - index}`} className={`club-feed__event club-feed__event--${event.type === 'three' ? 'goal' : event.type}${event.side === 1 ? ' club-feed__event--away' : ''}`}>
          <span>{event.minute}′</span> {basketballEventText(event)}
        </li>
      ))}
    </ol>
  );
}
