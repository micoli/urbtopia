import { openInteriorBuild, placeFixture } from '../interior.ts';
import { scenario, scene } from '../types.ts';

export default scenario('workshop', [
  scene('interior', { language: 'en', state: 'scripts/promo/states/early-city.json', ui: ['hud'], hideTaxBadges: true }, async (stage) => {
    const ratesOf = () => stage.page.locator('.dock-stat--rates').first().innerText();

    await stage.title('Urbtopia', { subtitle: 'Build your city' });
    await stage.caption('The Workshop has an interior to fit out', undefined, 'words');
    await stage.say('Every Workshop has an interior, ready to be fitted out.', { wait: false });
    await stage.focusTile(55, 57, 70, 2);
    await stage.clickTile(54, 56);
    await stage.ui('hud', 'panel');
    await stage.wait(1000);
    await stage.click({ role: 'button', name: 'Open the Workshop interior' });
    await stage.ui('hud', 'build');
    await stage.wait(1500);
    await openInteriorBuild(stage);
    await stage.hideCaption();

    await stage.caption('Machines extract the Materials');
    await stage.say('Machines extract the raw materials.', { wait: false });
    await placeFixture(stage, { section: 'Machines', fixture: 'workshopExtractorRight', cell: { x: 0, y: 0 } });
    await placeFixture(stage, { section: 'Machines', fixture: 'workshopBin', cell: { x: 0, y: 1 } });
    await stage.hideCaption();

    await stage.caption('Water and power make them work');
    await stage.say('Water and power make them work.', { wait: false });
    await placeFixture(stage, { section: 'Plumbing', fixture: 'workshopPump', cell: { x: 1, y: 0 }, rotations: 1 });
    await placeFixture(stage, { section: 'Plumbing', fixture: 'workshopTank', cell: { x: 2, y: 0 }, rotations: 1 });
    await placeFixture(stage, { section: 'Power', fixture: 'workshopMotor', cell: { x: 1, y: 1 }, rotations: 2 });
    await stage.hideCaption();

    await stage.caption('The extractor is set to Wood');
    await stage.say('Pick the item to extract: wood.', { wait: false });
    await stage.clickTile(0, 0);
    await stage.ui('hud', 'panel');
    await stage.wait(800);
    await stage.click(stage.page.getByRole('combobox', { name: 'Item extracted' }));
    await stage.click(stage.page.getByRole('option', { name: /^Wood/ }));
    await stage.wait(1200);
    await stage.hideCaption();

    await stage.page.evaluate(() => {
      const store = window.__gameStore!.getState();
      const workshop = store.state.buildings.find((building) => building.type === 'workshop')!;
      const bin = workshop.interior!.fixtures.find((fixture) => fixture.type === 'workshopBin')!;
      store.send({ type: 'HireInteriorStaff', buildingId: workshop.id, role: 'restocker' } as never);
      store.send({ type: 'AssignInteriorStaff', buildingId: workshop.id, fixtureId: bin.id } as never);
    });
    await stage.ui('hud');
    await stage.wait(1500);
    await stage.check('the machine is linked', async () => (await ratesOf()).includes('1 / 1'));
    await stage.check('a restocker serves the bin', () => stage.page.evaluate(() => {
      const workshop = window.__gameStore!.getState().state.buildings.find((building) => building.type === 'workshop')!;
      return JSON.stringify(workshop.interior).includes('restocker');
    }));
    await stage.caption('A restocker carries the Wood to the Storehouse');
    await stage.say('A restocker carries the wood to the storehouse, all by itself.', { wait: false });
    await stage.cinematic(async () => {
      await stage.callout(stage.page.locator('.dock-stat--rates').first(), 'Machine linked');
      await stage.wait(2200);
      await stage.clearCallout();
    });
    await stage.endOfSpeech();
    await stage.hideCaption();

    await stage.click(stage.page.getByRole('dialog').getByRole('button', { name: 'City', exact: true }));
    await stage.wait(1200);
    const woodOf = () => stage.page.evaluate(() => window.__gameStore!.getState().state.storage.materials.wood ?? 0);
    const woodBefore = await woodOf();
    await stage.caption('Time flies: the Workshop produces');
    await stage.say('Let time fly.', { wait: false });
    await stage.focusTile(55, 57, 90, 1.5);
    await stage.timelapse({ hours: 3, seconds: 8 });
    await stage.hideCaption();
    await stage.check('the Storehouse received Wood by itself', async () => (await woodOf()) > woodBefore);

    await stage.caption('The Storehouse holds it');
    await stage.say('The storehouse fills up with wood, without a single click.', { wait: false });
    await stage.ui('hud');
    await stage.focusTile(58, 57, 70, 1.8);
    await stage.clickTile(57, 56);
    await stage.ui('hud', 'panel');
    await stage.cinematic(async () => {
      await stage.callout(stage.page.getByText(/^Materials:/), 'Stocked by itself');
      await stage.wait(2500);
      await stage.clearCallout();
    });
    await stage.endOfSpeech();
    await stage.hideCaption();
    await stage.cinematic(async () => {
      await stage.ui('hud');
      await stage.focusTile(57, 57, 36, 2.5);
      await stage.stat('Wood stored', 20);
      await stage.title('Urbtopia', { subtitle: 'Build your city', seconds: 3 });
    });
  }),
], { transition: 'fade' });
