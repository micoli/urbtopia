import type { DayCycleHour } from '../../codex/dayCycleFigures';
import { t } from '../../i18n/t';

const percent = (share: number) => `${Math.round(share * 100)}%`;

interface DayCycleHoursTableProps {
  hours: readonly DayCycleHour[];
  current: number;
}

export function DayCycleHoursTable({ hours, current }: DayCycleHoursTableProps) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.dayCycle.hour')}</th>
            <th scope="col">{t('codex.dayCycle.phase')}</th>
            <th scope="col">{t('codex.dayCycle.solar')}</th>
            <th scope="col">{t('codex.dayCycle.hydro')}</th>
          </tr>
        </thead>
        <tbody>
          {hours.map(({ hour, phase, solar, hydro }) => (
            <tr key={hour} aria-current={hour === current ? 'true' : undefined}>
              <th scope="row">{String(hour).padStart(2, '0')}:00</th>
              <td>{t(`codex.dayCycle.phase.${phase}`)}</td>
              <td>{percent(solar)}</td>
              <td>{percent(hydro)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
