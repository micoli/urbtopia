import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { useUi } from '../common/hooks';
import type { StashGroup } from './stashGroups';

export function StashGroupButton({ group }: { group: StashGroup }) {
  const chooseTool = useUi((store) => store.chooseTool);
  const armed = useUi((store) => store.tool?.kind === group.tool.kind && JSON.stringify(withoutProgress(store.tool)) === JSON.stringify(withoutProgress(group.tool)));
  return (
    <li>
      <ActionButton size="sm" variant={armed ? 'primary' : 'default'} aria-pressed={armed} onClick={() => chooseTool(group.tool)}>
        <span className="stash-group-label">{t(group.label)}{group.detail ? ` ${group.detail}` : ''}</span>
        <span className="stash-group-count">{group.count}</span>
      </ActionButton>
    </li>
  );
}

// A tool in use carries its start tile or its brush tiles; the group does not.
function withoutProgress(tool: StashGroup['tool']): unknown {
  return { ...tool, start: undefined, tiles: undefined };
}
