import { ANNUAL_EVENT_ENTRIES, annualEventWindow, forceAnnualEventDay } from '../core';
import { t } from '../i18n/t';

interface AnnualEventDateButtonsProps {
  year: number;
  forcedDay: number | undefined;
}

export function AnnualEventDateButtons({ year, forcedDay }: AnnualEventDateButtonsProps) {
  return (
    <fieldset className="devtools-items">
      <legend>Événements annuels</legend>
      {ANNUAL_EVENT_ENTRIES.map(({ id, anchor }) => {
        const { anchorDay } = annualEventWindow({ anchor }, year);
        return (
          <button key={id} type="button" aria-pressed={forcedDay === anchorDay} onClick={() => forceAnnualEventDay(anchorDay)}>{t(`annualEvent.${id}`)}</button>
        );
      })}
    </fieldset>
  );
}
