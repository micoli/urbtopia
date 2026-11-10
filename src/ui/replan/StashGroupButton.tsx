import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { FlyoutItem } from '../layout/FlyoutItem';
import type { StashGroup } from './stashGroups';

interface StashGroupButtonProps {
  group: StashGroup;
  preview: string | undefined;
}

export function StashGroupButton({ group, preview }: StashGroupButtonProps) {
  const chooseTool = useUi((store) => store.chooseTool);
  const armed = useUi((store) => store.tool?.kind === group.tool.kind && JSON.stringify(withoutProgress(store.tool)) === JSON.stringify(withoutProgress(group.tool)));
  return (
    <FlyoutItem
      label={`${t(group.label)}${group.detail ? ` ${group.detail}` : ''}`}
      badge={group.count}
      selected={armed}
      preview={preview}
      icon={preview ? undefined : group.icon}
      onChoose={() => chooseTool(group.tool)}
    />
  );
}

// A tool in use carries its start tile or its brush tiles; the group does not.
function withoutProgress(tool: StashGroup['tool']): unknown {
  return { ...tool, start: undefined, tiles: undefined };
}
