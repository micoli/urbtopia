import type { ImageChoice } from '../../bugReports/buildSubmission';
import { t } from '../../i18n/t';
import { Note } from '../common/Note';
import { RadioChipGroup } from '../common/RadioChipGroup';

interface BugReportImageChoiceProps {
  choice: ImageChoice;
  onChange: (choice: ImageChoice) => void;
  map: string | null;
  screen: string | null;
}

export function BugReportImageChoice({ choice, onChange, map, screen }: BugReportImageChoiceProps) {
  const preview = choice === 'map' ? map : choice === 'screen' ? screen : null;
  return (
    <div className="bug-report-image">
      <RadioChipGroup
        label={t('bugReport.image.label')}
        className="bug-report-image__choices"
        chipClassName="bug-report-chip"
        value={choice}
        onChange={onChange}
        options={[
          { value: 'map', label: t('bugReport.image.map'), disabled: map === null },
          { value: 'screen', label: t('bugReport.image.screen'), disabled: screen === null },
          { value: 'none', label: t('bugReport.image.none') },
        ]}
      />
      {map === null && screen === null ? <Note tone="muted">{t('bugReport.image.unavailable')}</Note> : null}
      {choice === 'screen' ? <Note>{t('bugReport.image.warning')}</Note> : null}
      {preview ? <img className="bug-report-image__preview" src={preview} alt={t('bugReport.image.preview')} /> : null}
    </div>
  );
}
