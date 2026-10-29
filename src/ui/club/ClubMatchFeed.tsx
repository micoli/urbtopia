import type { MatchEvent } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';

export const eventText = (event: MatchEvent): string => {
  const base = t(`club.event.${event.type}` as MessageKey);
  if (event.type === 'substitution') return base.replace('{player}', event.player).replace('{replaced}', event.replaced);
  if (event.type === 'tactic') return base.replace('{tactic}', t(`club.tactic.${event.tactic}` as MessageKey));
  return base.replace('{player}', event.player);
};

export function ClubMatchFeed({ events }: { events: readonly MatchEvent[] }) {
  return (
    <ol className="club-feed" aria-live="polite">
      {[...events].reverse().map((event, index) => (
        <li key={`${events.length - index}`} className={`club-feed__event club-feed__event--${event.type}${event.side === 1 ? ' club-feed__event--away' : ''}`}>
          <span>{event.minute}′</span> {eventText(event)}
        </li>
      ))}
    </ol>
  );
}
