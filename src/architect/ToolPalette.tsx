import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/common/Icon.tsx';
import { AccordionSection } from '../ui/common/AccordionSection.tsx';
import { UrbsAmount } from '../ui/common/UrbsAmount.tsx';
import { BRICK_PRICE, CHIMNEY_PRICE, DECOR_PRICE, DORMER_PRICE, ROUND_DORMER_PRICE, type Brick, type Decor } from '../core/architect/housePlan.ts';
import { tierOfBrick, tierOfDecor } from '../core/architect/architectTiers.ts';
import { useStudioTier } from './studioTier.ts';
import { BRICK_COLOR, DECOR_COLOR, type RoofTool } from './editorConstants.ts';
import { isDecorTool, isRoofTool, type FacadeTool } from './facadeTools.ts';
import { toolTree } from './toolTree.ts';
import { ToolLeaf } from './ToolLeaf.tsx';
import { t } from '../i18n/t';
import type { ArchitectMessageKey } from '../i18n/architect';
import { BRICK_LABEL, DECOR_LABEL } from './labels.ts';

const ROOF_TOOL_PRICE: Record<RoofTool, number> = { dormer: DORMER_PRICE, roundDormer: ROUND_DORMER_PRICE, chimney: CHIMNEY_PRICE };

const labelOf = (tool: FacadeTool): string => (isRoofTool(tool) ? t(`architect.tool.${tool}`) : isDecorTool(tool) ? DECOR_LABEL[tool] : BRICK_LABEL[tool]);
const priceOf = (tool: FacadeTool): number => (isRoofTool(tool) ? ROOF_TOOL_PRICE[tool] : isDecorTool(tool) ? DECOR_PRICE[tool] : BRICK_PRICE[tool]);
const colorOf = (tool: FacadeTool): string | undefined => (isRoofTool(tool) ? undefined : isDecorTool(tool) ? DECOR_COLOR[tool as Decor] : BRICK_COLOR[tool as Brick]);
const tierOf = (tool: FacadeTool): number => (isRoofTool(tool) ? 0 : isDecorTool(tool) ? tierOfDecor(tool) : tierOfBrick(tool));

interface ToolPaletteProps {
  tool: FacadeTool;
  available: FacadeTool[];
  onPick: (tool: FacadeTool) => void;
}

// The tools by type, in a popup like a combo box: the trigger shows the tool picked, a type opens on its styles and follows the tool picked
// until the player opens another one.
export function ToolPalette({ tool, available, onPick }: ToolPaletteProps) {
  const studioTier = useStudioTier();
  const groups = toolTree(available);
  const root = useRef<HTMLDivElement>(null);
  const [popup, setPopup] = useState(false);
  const [opened, setOpened] = useState<string>();
  const open = opened ?? groups.find((group) => group.tools.includes(tool))?.id;

  useEffect(() => {
    if (!popup) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setPopup(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, [popup]);

  const content = (value: FacadeTool) => (
    <>
      {labelOf(value)} · <UrbsAmount value={priceOf(value)} />
    </>
  );
  const leaf = (value: FacadeTool) => {
    const locked = tierOf(value) > studioTier;
    return (
      <ToolLeaf
        key={value}
        selected={value === tool}
        disabled={locked}
        color={colorOf(value)}
        onPick={() => {
          onPick(value);
          setPopup(false);
        }}
      >
        {content(value)}
        {locked && ` · ${t('architect.tierNeeded')} ${tierOf(value)}`}
      </ToolLeaf>
    );
  };
  return (
    <div className="studio-colour">
      <span>{t('architect.bricks')}</span>
      <div
        className="dropdown dropdown--fill"
        ref={root}
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || !popup) return;
          event.stopPropagation();
          setPopup(false);
        }}
      >
        <button type="button" className="dropdown-trigger" aria-haspopup="tree" aria-expanded={popup} aria-label={t('architect.bricks')} onClick={() => setPopup(!popup)}>
          <span>
            {colorOf(tool) && <i className="studio-swatch" style={{ background: colorOf(tool) }} />}
            {content(tool)}
          </span>
          <Icon name="chevronDown" />
        </button>
        {popup && (
          <div className="dropdown-list studio-tree" role="tree" aria-label={t('architect.bricks')}>
            {groups.map((group) =>
              group.tools.length === 1 ? (
                leaf(group.tools[0]!)
              ) : (
                <AccordionSection
                  key={group.id}
                  id={`studio-tools-${group.id}`}
                  title={t(`architect.group.${group.id}` as ArchitectMessageKey)}
                  expanded={open === group.id}
                  onToggle={() => setOpened(open === group.id ? '' : group.id)}
                  chevron
                  nested
                  className="studio-accordion"
                  toggleClassName="studio-accordion__toggle"
                  contentClassName="studio-accordion__content"
                >
                  {group.tools.map(leaf)}
                </AccordionSection>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
