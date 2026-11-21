import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { exteriorEdges, newPlan, type Decor } from '../core/architect/housePlan.ts';
import { FloorPlan } from './FloorPlan.tsx';

const noop = () => {};
const plan = newPlan('rect');
const edgesOnGround = exteriorEdges(plan).filter((edge) => edge.floor === 0).length;
const doors = 1;

const render = (decorTool?: Decor, mode: 'footprint' | 'facade' = 'facade') =>
  renderToStaticMarkup(<FloorPlan plan={plan} floor={0} mode={mode} decorTool={decorTool} onToggleCell={noop} onPickSlot={noop} onSelectSlot={noop} onHover={noop} />);

const buttons = (html: string) => html.match(/<button[^>]*>/g) ?? [];
const slots = (html: string) => buttons(html).filter((button) => button.includes('studio-slot'));

describe('the plan grid of the facade tab', () => {
  it('draws one ring of slots, one per edge of the floor, with a brick tool', () => {
    const ring = slots(render());
    expect(ring).toHaveLength(edgesOnGround);
    expect(ring.some((button) => button.includes('outside'))).toBe(false);
    expect(ring.some((button) => button.includes('dimmed'))).toBe(false);
  });

  it('draws no slot in the footprint tab', () => {
    expect(slots(render(undefined, 'footprint'))).toHaveLength(0);
  });

  it('adds a second ring outside the bricks with a decor tool, and keeps the bricks to select', () => {
    const html = render('doorHood');
    const ring = slots(html);
    expect(ring).toHaveLength(2 * edgesOnGround);
    const outside = ring.filter((button) => button.includes('outside'));
    const bricks = ring.filter((button) => !button.includes('outside'));
    expect(outside).toHaveLength(edgesOnGround);
    expect(bricks.every((button) => button.includes('dimmed') && !button.includes('disabled'))).toBe(true);
    expect(html).toContain('with-decors');
  });

  it('enables a decor slot only where the decor can stand', () => {
    const outside = slots(render('doorHood')).filter((button) => button.includes('outside'));
    expect(outside.filter((button) => !button.includes('disabled'))).toHaveLength(doors);
    const pilasters = slots(render('pilasters')).filter((button) => button.includes('outside'));
    expect(pilasters.every((button) => !button.includes('disabled'))).toBe(true);
  });

  it('gives each slot the side it is on, for the outside ring to move outwards', () => {
    const outside = slots(render('pilasters')).filter((button) => button.includes('outside'));
    expect(new Set(outside.map((button) => button.match(/data-dir="(\d)"/)![1]))).toEqual(new Set(['0', '1', '2', '3']));
  });
});
