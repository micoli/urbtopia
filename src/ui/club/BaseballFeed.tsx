import type { BaseballEvent } from '../../core';
import { t } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';

export const baseballEventText = (event: BaseballEvent): string => {
  const base = t(`club.event.${event.type}` as MessageKey);
  if (event.type === 'change') return base.replace('{player}', event.player).replace('{replaced}', event.replaced);
  if (event.type === 'approach') return base.replace('{approach}', t(`club.approach.${event.approach}` as MessageKey));
  return `${base.replace('{player}', event.player)}${event.runs > 0 ? ` (+${event.runs})` : ''}`;
};

export function BaseballFeed({ events }: { events: readonly BaseballEvent[] }) {
  return (
    <ol className="club-feed" aria-live="polite">
      {[...events].reverse().map((event, index) => (
        <li key={`${events.length - index}`} className={`club-feed__event club-feed__event--${event.type === 'homer' ? 'goal' : event.type}${event.side === 1 ? ' club-feed__event--away' : ''}`}>
          <span>{event.inning}{event.half === 0 ? '▲' : '▼'}</span> {baseballEventText(event)}
        </li>
      ))}
    </ol>
  );
}
