import type { Stage } from '../stage.ts';
import { scenario, scene } from '../types.ts';

async function chooseBuilding(stage: Stage, name: string): Promise<void> {
  await stage.ui('hud', 'build');
  await stage.click({ role: 'button', name: 'Build' });
  await stage.click(stage.page.getByPlaceholder(/Search a building/));
  await stage.type(name);
  await stage.wait(500);
  await stage.click(stage.page.locator('.flyout-row', { hasText: name }).locator('.flyout-info'));
}

const WIDE = { x: 57, y: 57, zoom: 36 };
const CLOSE = 70;

export default scenario('start', [
  scene('first-buildings', { language: 'en', ui: ['hud'] }, async (stage) => {
    await stage.caption('A new city begins');
    await stage.wait(2000);
    await stage.hideCaption();

    await stage.caption('A Storehouse keeps the Materials');
    await chooseBuilding(stage, 'Storehouse');
    await stage.focusTile(58, 60, CLOSE);
    await stage.clickTile(57, 59);
    await stage.ui('hud');
    await stage.wait(1800);
    await stage.hideCaption();

    await stage.caption('A second Workshop beside the road');
    await stage.focusTile(58, 57, WIDE.zoom, 1.2);
    await chooseBuilding(stage, 'Workshop');
    await stage.focusTile(58, 57, CLOSE);
    await stage.clickTile(57, 56);
    await stage.ui('hud');
    await stage.wait(1800);
    await stage.hideCaption();

    await stage.caption('Each Workshop gets its production Slots');
    await stage.clickTile(57, 56);
    await stage.ui('hud', 'panel');
    await stage.wait(1000);
    await stage.click({ role: 'button', name: /^Wood/ });
    await stage.wait(800);
    await stage.click({ role: 'button', name: /^Stone/ });
    await stage.wait(1200);
    await stage.hideCaption();

    await stage.caption('Time flies: the Materials flow in');
    await stage.focusTile(58, 57, 90, 1.5);
    await stage.timelapse({ hours: 1, seconds: 6 });
    await stage.hideCaption();

    await stage.caption('Collect them into the Storehouse');
    await stage.click(stage.page.getByText('Collect', { exact: true }));
    await stage.wait(1200);
    await stage.hideCaption();

    await stage.caption('The Storehouse holds the production');
    await stage.ui('hud');
    await stage.focusTile(58, 60, CLOSE, 1.8);
    await stage.clickTile(57, 59);
    await stage.ui('hud', 'panel');
    await stage.wait(3500);
    await stage.hideCaption();
    await stage.ui('hud');
    await stage.focusTile(WIDE.x, WIDE.y, WIDE.zoom, 2.5);
    await stage.wait(1500);
  }),
]);
