import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';

interface CodexLinkButtonProps {
  title: string;
  onOpen: () => void;
}

// One line whatever the title: the name is cut with an ellipsis and stays readable in the tooltip and the accessible name.
export function CodexLinkButton({ title, onOpen }: CodexLinkButtonProps) {
  return (
    <ActionButton className="flex min-w-0 max-w-full flex-auto items-center justify-center gap-2" aria-label={t('codex.about').replace('{name}', title)} title={title} onClick={onOpen}>
      <Icon name="info" />
      <span className="truncate">{title}</span>
    </ActionButton>
  );
}
