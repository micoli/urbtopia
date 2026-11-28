import { MUSIC_CREDIT } from '../credits.ts';
import { leaveInterior, openInteriorBuild, placeFixture } from '../interior.ts';
import { scenario, scene, type Language } from '../types.ts';

const TEXT = {
  en: {
    tagline: 'Build it. Grow it. Make it breathe.',
    open: 'The Workshop has an interior to fit out',
    openLine: 'Every workshop has an interior, ready to be fitted out.',
    machines: 'Machines extract the Materials',
    machinesLine: 'Machines extract the raw materials.',
    power: 'Water and power make them work',
    powerLine: 'Water and power make them work.',
    wood: 'The extractor is set to Wood',
    woodLine: 'Pick the item to extract: wood.',
    restocker: 'A Restocker carries the Wood to the Storehouse',
    restockerLine: 'A restocker carries the wood to the storehouse, all by itself.',
    linked: 'Machine linked',
    time: 'Time flies: the Workshop produces',
    timeLine: 'Let time fly.',
    holds: 'The Storehouse holds it',
    holdsLine: 'The storehouse fills up with wood, without a single click.',
    stocked: 'Stocked by itself',
    stat: 'Wood stored',
  },
  fr: {
    tagline: 'Construis-la. Fais-la grandir. Fais-la respirer.',
    open: 'L’atelier a un intérieur à aménager',
    openLine: 'Chaque atelier possède un intérieur, prêt à être aménagé.',
    machines: 'Des machines extraient les matières',
    machinesLine: 'Des machines extraient les matières premières.',
    power: 'L’eau et l’électricité les font tourner',
    powerLine: 'L’eau et l’électricité les font fonctionner.',
    wood: 'L’extracteur est réglé sur le bois',
    woodLine: 'On choisit l’objet à extraire : le bois.',
    restocker: 'Un employé de réassort porte le bois à l’entrepôt',
    restockerLine: 'Un employé de réassort porte le bois jusqu’à l’entrepôt, tout seul.',
    linked: 'Machine reliée',
    time: 'Le temps file : l’atelier produit',
    timeLine: 'Laissons filer le temps.',
    holds: 'L’entrepôt le conserve',
    holdsLine: 'L’entrepôt se remplit de bois, sans un seul clic.',
    stocked: 'Stocké automatiquement',
    stat: 'Bois stocké',
  },
} as const;

export default scenario('workshop', (language: Language) => {
  const text = TEXT[language];
  return [
    scene('interior', { state: 'scripts/promo/states/early-city.json', ui: ['hud'], hideTaxBadges: true }, async (stage) => {
      const ratesOf = () => stage.page.locator('.dock-stat--rates').first().innerText();
      const floating = async (key: string) => stage.page.locator('.building-floating-bar').getByRole('button', { name: await stage.label(key) });

      await stage.title('Urbtopia', { subtitle: text.tagline });
      await stage.caption(text.open);
      await stage.say(text.openLine, { wait: false });
      await stage.focusTile(55, 57, 70, 2);
      await stage.clickTile(54, 56);
      await stage.ui('hud', 'selection');
      await stage.wait(800);
      await stage.click(await floating('panel.interior'));
      await stage.ui('hud', 'build');
      await stage.wait(1500);
      if (stage.portrait) await stage.shiftRoom(120, -170);
      await openInteriorBuild(stage);
      await stage.endOfSpeech();
      await stage.hideCaption();

      await stage.caption(text.machines);
      await stage.say(text.machinesLine, { wait: false });
      await placeFixture(stage, { section: 'machines', fixture: 'workshopExtractorRight', cell: { x: 0, y: 0 } });
      await placeFixture(stage, { section: 'machines', fixture: 'workshopBin', cell: { x: 0, y: 1 } });
      await stage.hideCaption();

      await stage.caption(text.power);
      await stage.say(text.powerLine, { wait: false });
      await placeFixture(stage, { section: 'plumbing', fixture: 'workshopPump', cell: { x: 1, y: 0 }, rotations: 1 });
      await placeFixture(stage, { section: 'plumbing', fixture: 'workshopTank', cell: { x: 2, y: 0 }, rotations: 1 });
      await placeFixture(stage, { section: 'power', fixture: 'workshopMotor', cell: { x: 1, y: 1 }, rotations: 2 });
      await stage.hideCaption();

      // The item of an extractor is chosen in its panel: the floating toolbar has no such control.
      await stage.caption(text.wood);
      await stage.say(text.woodLine, { wait: false });
      await stage.clickTile(0, 0);
      await stage.ui('hud', 'selection', 'panel');
      await stage.wait(800);
      await stage.click(stage.page.getByRole('combobox'));
      await stage.click(stage.page.getByRole('option').nth(1));
      await stage.wait(1200);
      await stage.endOfSpeech();
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
      await stage.caption(text.restocker);
      await stage.say(text.restockerLine, { wait: false });
      await stage.cinematic(async () => {
        await stage.callout(stage.page.locator('.dock-stat--rates').first(), text.linked);
        await stage.wait(2200);
        await stage.clearCallout();
      });
      await stage.endOfSpeech();
      await stage.hideCaption();

      await leaveInterior(stage);
      await stage.wait(1200);
      const woodOf = () => stage.page.evaluate(() => window.__gameStore!.getState().state.storage.materials.wood ?? 0);
      const woodBefore = await woodOf();
      await stage.caption(text.time);
      await stage.say(text.timeLine, { wait: false });
      await stage.focusTile(55, 57, 90, 1.5);
      await stage.timelapse({ hours: 3, seconds: 8 });
      await stage.hideCaption();
      await stage.check('the Storehouse received Wood by itself', async () => (await woodOf()) > woodBefore);

      // The stock of the Storehouse is read in its panel: the floating bar only acts.
      await stage.caption(text.holds);
      await stage.say(text.holdsLine, { wait: false });
      await stage.ui('hud');
      await stage.focusTile(58, 57, 70, 1.8);
      await stage.clickTile(57, 56);
      await stage.ui('hud', 'panel');
      await stage.cinematic(async () => {
        await stage.callout(stage.page.locator('.side-panel').getByText(/\d+\s*\/\s*\d+/).first(), text.stocked);
        await stage.wait(2500);
        await stage.clearCallout();
      });
      await stage.endOfSpeech();
      await stage.hideCaption();
      await stage.cinematic(async () => {
        await stage.ui('hud');
        await stage.focusTile(57, 57, 36, 2.5);
        await stage.stat(text.stat, 20);
        await stage.title('Urbtopia', { subtitle: text.tagline, note: MUSIC_CREDIT[language], seconds: 3.5 });
      });
    }),
  ];
}, { transition: 'fade' });
