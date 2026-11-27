import type { Stage } from './stage.ts';

interface FixturePlacement {
  section: string;
  fixture: string;
  cell: { x: number; y: number };
  rotations?: number;
}

const BUILD_MENU = '.venue-build';

// Fits one Fixture out in the open interior: opens its section, picks its row, drops it on a floor cell, then turns it from its panel (the Rotate buttons of the dock turn the view, not the Fixture).
export async function placeFixture(stage: Stage, { section, fixture, cell, rotations = 0 }: FixturePlacement): Promise<void> {
  const toggle = stage.page.locator(`${BUILD_MENU} .build-section-toggle`, { hasText: section });
  if (!(await toggle.isVisible())) await openInteriorBuild(stage);
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await stage.click(toggle);
  await stage.click(stage.page.locator(`${BUILD_MENU} [data-choice="${fixture}"] .flyout-info`));
  await stage.clickTile(cell.x, cell.y);
  if (rotations === 0) return;
  await stage.clickTile(cell.x, cell.y);
  await stage.ui('hud', 'build', 'panel');
  for (let turn = 0; turn < rotations; turn++) await stage.click(stage.page.getByRole('button', { name: 'Rotate', exact: true }).first());
}

// The Build button of the interior: the city has one of its own under the dialog.
export function openInteriorBuild(stage: Stage): Promise<void> {
  return stage.click(stage.page.getByRole('dialog').getByRole('button', { name: 'Build' }));
}
