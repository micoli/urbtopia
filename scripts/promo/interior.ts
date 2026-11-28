import type { Stage } from './stage.ts';

interface FixturePlacement {
  // The id of the category of the build menu: `machines`, `plumbing`, `power`, `line`...
  section: string;
  fixture: string;
  cell: { x: number; y: number };
  rotations?: number;
}

const BUILD_MENU = '.venue-build';
const INTERIOR = '[role="dialog"]';

// The first button of the dock of the interior is its Build menu (the city has a dock of its own under the dialog).
export function openInteriorBuild(stage: Stage): Promise<void> {
  return stage.click(stage.page.locator(`${INTERIOR} .dock-button`).first());
}

// The bottom button of the dock of the interior brings back to the city.
export function leaveInterior(stage: Stage): Promise<void> {
  return stage.click(stage.page.locator(`${INTERIOR} .dock__bottom button`).first());
}

// Fits one Fixture out in the open interior: opens its section, picks its row, drops it on a floor cell, then turns it with the floating toolbar of the Fixture.
export async function placeFixture(stage: Stage, { section, fixture, cell, rotations = 0 }: FixturePlacement): Promise<void> {
  const toggle = stage.page.locator(`${BUILD_MENU} [id$="-${section}-toggle"]`);
  if (!(await toggle.isVisible())) await openInteriorBuild(stage);
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await stage.click(toggle);
  await stage.click(stage.page.locator(`${BUILD_MENU} [data-choice="${fixture}"] .flyout-info`));
  await stage.clickTile(cell.x, cell.y);
  if (rotations === 0) return;
  await stage.clickTile(cell.x, cell.y);
  await stage.ui('hud', 'build', 'selection');
  const rotate = stage.page.locator('.venue-fixture-toolbar').getByRole('button', { name: await stage.label('venue.rotate'), exact: true });
  for (let turn = 0; turn < rotations; turn++) await stage.click(rotate);
  await stage.ui('hud', 'build');
}
