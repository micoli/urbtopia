import { t } from '../../i18n/t';

// The kinds of Line a Dairy can run, from the Milk vat to a Display counter.
export function InteriorDairyLines() {
  return (
    <>
      <h3>{t('dairy.lines')}</h3>
      <ul>
        <li className="note">{t('dairy.lines.cream')}</li>
        <li className="note">{t('dairy.lines.cheese')}</li>
        <li className="note">{t('dairy.lines.both')}</li>
      </ul>
    </>
  );
}
