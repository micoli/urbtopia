import { useState } from 'react';
import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { FlyoutItem } from '../layout/FlyoutItem';
import { StashGroupMenu } from './StashGroupMenu';
import type { StashGroup } from './stashGroups';
import { useLongPress } from './useLongPress';

interface StashGroupButtonProps {
  group: StashGroup;
  preview: string | undefined;
}

export function StashGroupButton({ group, preview }: StashGroupButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const chooseTool = useUi((store) => store.chooseTool);
  const armed = useUi((store) => store.tool?.kind === group.tool.kind && JSON.stringify(withoutProgress(store.tool)) === JSON.stringify(withoutProgress(group.tool)));
  const press = useLongPress(() => setMenuOpen(true));
  return (
    <div className="stash-item" {...press}>
      <FlyoutItem
        label={`${t(group.label)}${group.detail ? ` ${group.detail}` : ''}`}
        badge={group.count}
        selected={armed}
        preview={preview}
        icon={preview ? undefined : group.icon}
        onChoose={() => chooseTool(group.tool)}
      />
      {menuOpen ? <StashGroupMenu group={group} onClose={() => setMenuOpen(false)} /> : null}
    </div>
  );
}

// A tool in use carries its start tile or its brush tiles; the group does not.
function withoutProgress(tool: StashGroup['tool']): unknown {
  return { ...tool, start: undefined, tiles: undefined };
}
