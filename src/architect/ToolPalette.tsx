import { Dropdown, type DropdownOption } from '../ui/common/Dropdown.tsx';
import { UrbsAmount } from '../ui/common/UrbsAmount.tsx';
import { BRICK_PRICE, CHIMNEY_PRICE, DORMER_PRICE } from '../core/architect/housePlan.ts';
import { tierOfBrick } from '../core/architect/architectTiers.ts';
import { useStudioTier } from './studioTier.ts';
import { BRICK_COLOR, type RoofTool } from './editorConstants.ts';
import { isRoofTool, type FacadeTool } from './facadeTools.ts';
import { t } from '../i18n/t';
import { BRICK_LABEL } from './labels.ts';

const ROOF_TOOL_PRICE: Record<RoofTool, number> = { dormer: DORMER_PRICE, chimney: CHIMNEY_PRICE };

interface ToolPaletteProps {
  tool: FacadeTool;
  available: FacadeTool[];
  onPick: (tool: FacadeTool) => void;
}

export function ToolPalette({ tool, available, onPick }: ToolPaletteProps) {
  const studioTier = useStudioTier();
  const entry = (value: FacadeTool, name: string, price: number, color?: string): DropdownOption<FacadeTool> => ({
    value,
    disabled: !isRoofTool(value) && tierOfBrick(value) > studioTier,
    label: (
      <>
        {color && <i className="studio-swatch" style={{ background: color }} />}
        {name} · <UrbsAmount value={price} />
        {!isRoofTool(value) && tierOfBrick(value) > studioTier && ` · ${t('architect.tierNeeded')} ${tierOfBrick(value)}`}
      </>
    ),
  });
  const options = available.map((value) =>
    isRoofTool(value) ? entry(value, t(`architect.tool.${value}`), ROOF_TOOL_PRICE[value]) : entry(value, BRICK_LABEL[value], BRICK_PRICE[value], BRICK_COLOR[value]),
  );
  return (
    <div className="studio-colour">
      <span>{t('architect.bricks')}</span>
      <Dropdown label={t('architect.bricks')} className="dropdown--fill" options={options} value={tool} onChange={onPick} />
    </div>
  );
}
