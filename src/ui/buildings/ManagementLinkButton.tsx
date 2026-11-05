import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';
import { MANAGEMENT_SECTIONS, type ManagementSectionId } from '../stats/management/managementSections';

interface ManagementLinkButtonProps {
  section: ManagementSectionId;
  onOpen: () => void;
}

// One line whatever the title, like the Codex links: the name is cut with an ellipsis and stays readable in the tooltip.
export function ManagementLinkButton({ section, onOpen }: ManagementLinkButtonProps) {
  const { icon, label } = MANAGEMENT_SECTIONS[section];
  const title = t(label);
  return (
    <ActionButton variant="info" className="flex min-w-0 max-w-full flex-auto items-center justify-center gap-2" aria-label={t('panel.management').replace('{name}', title)} title={title} onClick={onOpen}>
      <Icon name={icon} />
      <span className="truncate">{title}</span>
    </ActionButton>
  );
}
