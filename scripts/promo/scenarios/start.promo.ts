import { MUSIC_CREDIT } from '../credits.ts';
import type { Stage } from '../stage.ts';
import { scenario, scene, type Language } from '../types.ts';

const TEXT = {
  en: {
    tagline: 'Build it. Grow it. Make it breathe.',
    town: 'A small town to grow',
    townLine: 'Three homes, a workshop, a factory. Every city starts small.',
    homes: 'Homes line the street',
    homesLine: 'Homes rise along the road, and the first citizens move in.',
    utilities: 'Water and power keep up',
    utilitiesLine: 'More citizens need water and power.',
    shops: 'Shops and a school',
    shopsLine: 'Shops open, and a school teaches the youngest.',
    growth: 'Homes grow taller',
    growthLine: 'Planks and bricks make the homes grow.',
    district: 'A new district, new styles',
    districtLine: 'A new district in new styles, and four hundred citizens.',
    services: 'Public services arrive',
    servicesLine: 'A hospital, police and firefighters watch over the city.',
    offices: 'Offices bring jobs',
    officesLine: 'Offices open, and the city has an economy.',
    green: 'Parks and trees',
    greenLine: 'Trees and parks make the city a place to live.',
    manage: 'Run the city',
    manageLine: 'Keep the citizens’ needs met, and watch over the planet: emissions, temperature, green spaces.',
    traffic: 'The first traffic jams appear',
    trafficLine: 'The first traffic jams are already here. Running the city well is up to you.',
    shouts: { needs: 'Needs pyramid', ecology: 'Ecology matters', nature: 'Green spaces', rail: 'Train station', metro: 'Metro line', brt: 'Bus rapid transit', townHall: 'Town hall', highSchool: 'High school', university: 'University', hotel: 'Hotel', largeGeothermalPlant: 'Geothermal power', recyclingPlant: 'Recycling plant', supermarket: 'Supermarket', footballStadium: 'Football stadium', concertHall: 'Concert hall', waterTower: 'Water and power grid' },
    factory: 'Automate the factory',
    factoryLine: 'A factory fits out in seconds: pipes for the water, motors, gears and bevel gears for the drive, and every machine it can hold. Linked, it produces faster and yields more, with nobody to run it.',
    bonus: 'Production bonus',
    storehouse: 'Automate the storehouse',
    storehouseLine: 'The same goes for a storehouse, at any scale: lines of conveyors carry the goods from the docks to the racks, and one stocker keeps it all running, so the city holds more.',
    capacity: 'Storage capacity',
    stepLines: {
      schools: 'Schools go up first: without one in reach, homes cannot grow past their third tier.',
      services: 'The services follow: a high school and a town hall, then shops, a hotel and a church.',
      brt: 'A bus rapid transit line serves the west of the city, from the north to the south.',
      rail: 'A train line runs along the east edge, with a station in each district.',
      metro: 'And a metro, underground, on levels of its own.',
    },
    live: 'Shows and matches',
    liveLine: 'A stadium and a concert hall in the middle of the city: the crowds come.',
    liveLineFounded: 'The club is founded, and a concert is booked.',
    liveLineHeld: 'Time flies: the crowds fill the stands, the match is played and the concert is held.',
    sprawl: 'A megalopolis',
    sprawlLine: 'Every free tile fills up, until five thousand citizens live here.',
    grow: 'Two thousand citizens',
    growLine: 'And the city never stops: schools, a town hall, bus rapid transit, trains and a metro.',
    citizens: 'Citizens',
  },
  fr: {
    tagline: 'Construis-la. Fais-la grandir. Fais-la respirer.',
    town: 'Une petite ville à faire grandir',
    townLine: 'Trois logements, un atelier, une usine. Toute ville commence petite.',
    homes: 'Des logements bordent la rue',
    homesLine: 'Les logements bordent la route, et les premiers habitants s’installent.',
    utilities: 'L’eau et l’électricité suivent',
    utilitiesLine: 'Plus d’habitants, plus d’eau et d’électricité.',
    shops: 'Des commerces et une école',
    shopsLine: 'Des commerces ouvrent, et une école instruit les plus jeunes.',
    growth: 'Les logements s’agrandissent',
    growthLine: 'Planches et briques font grandir les logements.',
    district: 'Un nouveau quartier, d’autres styles',
    districtLine: 'Un nouveau quartier aux styles différents, et quatre cents habitants.',
    services: 'Les services publics arrivent',
    servicesLine: 'Hôpital, police et pompiers veillent sur la ville.',
    offices: 'Les bureaux créent des emplois',
    officesLine: 'Les bureaux ouvrent, et la ville a une économie.',
    green: 'Des parcs et des arbres',
    greenLine: 'Arbres et parcs font de la ville un endroit où il fait bon vivre.',
    manage: 'Gérer la ville',
    manageLine: 'Répondez aux besoins des habitants, et veillez à la planète : émissions, température, espaces verts.',
    traffic: 'Les premiers bouchons apparaissent',
    trafficLine: 'Les premiers bouchons sont déjà là. C’est au joueur de bien gérer sa ville.',
    shouts: { needs: 'Pyramide des besoins', ecology: 'L’écologie compte', nature: 'Espaces verts', rail: 'Gare et trains', metro: 'Ligne de métro', brt: 'BHNS', townHall: 'Mairie', highSchool: 'Lycée', university: 'Université', hotel: 'Hôtel', largeGeothermalPlant: 'Géothermie', recyclingPlant: 'Recyclage', supermarket: 'Supermarché', footballStadium: 'Stade de foot', concertHall: 'Salle de concert', waterTower: 'Eau et électricité' },
    factory: 'Automatiser l’usine',
    factoryLine: 'Une usine s’aménage en quelques secondes : des tuyaux pour l’eau, des moteurs, des engrenages et des renvois d’angle pour l’entraînement, et toutes les machines qu’elle peut accueillir. Reliée, elle produit plus vite et plus, sans personne pour la conduire.',
    bonus: 'Bonus de production',
    storehouse: 'Automatiser l’entrepôt',
    storehouseLine: 'Il en va de même pour un entrepôt, à toute échelle : des lignes de convoyeurs portent les marchandises des quais aux étagères, et un seul magasinier fait tout tourner, donc la ville stocke plus.',
    capacity: 'Capacité de stockage',
    stepLines: {
      schools: 'Les écoles d’abord : sans l’une d’elles à portée, les logements ne dépassent pas leur troisième niveau.',
      services: 'Les services suivent : un lycée et une mairie, puis des commerces, un hôtel et une église.',
      brt: 'Une ligne de BHNS dessert l’ouest de la ville, du nord au sud.',
      rail: 'Une ligne de train longe l’est, avec une gare dans chaque quartier.',
      metro: 'Et un métro, sous terre, sur ses propres niveaux.',
    },
    live: 'Spectacles et matchs',
    liveLine: 'Un stade et une salle de concert au milieu de la ville : la foule accourt.',
    liveLineFounded: 'Le club est fondé, et un concert est programmé.',
    liveLineHeld: 'Le temps file : la foule remplit les tribunes, le match se joue et le concert a lieu.',
    sprawl: 'Une mégalopole',
    sprawlLine: 'Chaque terrain libre se remplit, jusqu’à cinq mille habitants.',
    grow: 'Deux mille habitants',
    growLine: 'Et la ville ne s’arrête plus : écoles, mairie, BHNS, trains et métro.',
    citizens: 'Habitants',
  },
} as const;

// A Home grows over the tile on its left: the Homes are two tiles apart so that each one can grow.
// A district groups Homes of one style: four styles in all, shared by the districts that follow.
const STYLE_OF_ROW: Record<number, string> = { 59: 'home', 61: 'home', 63: 'home-tudor', 65: 'home-tudor', 67: 'home-tudor' };
const COLUMNS = [53, 55, 57, 59, 61];
// Two framings only: the first streets, then the whole city. The camera moves between chapters, never from one building to the next.
const FIRST_STREETS = { x: 60, y: 60, zoom: 46 };
const WHOLE_CITY = { x: 61, y: 65, zoom: 40 };
// The first buildings of a batch are shown one by one, the others follow in a quick run.
const SHOWN = 3;

async function command(stage: Stage, what: string, commands: Record<string, unknown>[]): Promise<void> {
  const failure = await stage.page.evaluate((list) => {
    const store = window.__gameStore!.getState();
    for (const entry of list) {
      store.send(entry as never);
      const error = window.__gameStore!.getState().lastError;
      if (error) return `${JSON.stringify(entry)} ${JSON.stringify(error)}`;
    }
    return null;
  }, commands);
  await stage.check(`${what}: ${failure}`, async () => !failure);
}

const build = (stage: Stage, buildingType: string, x: number, y: number, rotation?: number) =>
  command(stage, `${buildingType} at ${x},${y}`, [{ type: 'PlaceBuilding', buildingType, x, y, ...(rotation === undefined ? {} : { rotation }) }]);

const road = (stage: Stage, from: [number, number], to: [number, number]) =>
  command(stage, `road ${from} to ${to}`, [{ type: 'BuildRoad', from: { x: from[0], y: from[1] }, to: { x: to[0], y: to[1] } }]);

async function upgradeHome(stage: Stage, x: number, y: number, times = 1): Promise<void> {
  for (let step = 0; step < times; step++) {
    const failure = await stage.page.evaluate(([tx, ty]) => {
      const home = window.__gameStore!.getState().state.buildings.find((building) => building.type.startsWith('home') && building.y === ty && (building.x === tx || building.x === tx - 1));
      if (!home) return 'no home';
      window.__gameStore!.getState().send({ type: 'UpgradeBuilding', buildingId: home.id } as never);
      return JSON.stringify(window.__gameStore!.getState().lastError);
    }, [x, y] as const);
    await stage.check(`home at ${x},${y} grows: ${failure}`, async () => failure === 'null');
  }
}

async function upgradeAll(stage: Stage, buildingType: string): Promise<void> {
  const failure = await stage.page.evaluate((type) => {
    const store = window.__gameStore!;
    for (const building of store.getState().state.buildings.filter((candidate) => candidate.type === type)) {
      store.getState().send({ type: 'UpgradeBuilding', buildingId: building.id } as never);
      const error = store.getState().lastError;
      if (error && error.key !== 'error.maxTier') return JSON.stringify(error);
    }
    return null;
  }, buildingType);
  await stage.check(`${buildingType} upgraded: ${failure}`, async () => !failure);
}

type Item = [type: string, x: number, y: number, rotation?: number];

interface Step {
  target: number;
  // The land bought for the step, the streets laid out, the buildings and the transit network it brings.
  parcels?: [number, number][];
  roads?: [[number, number], [number, number]][];
  items?: Item[];
  transit?: 'brt' | 'rail' | 'metro';
  // The buildings of these types go up a tier: a School teaches more Citizens.
  upgrades?: string[];
  // How many buildings and Homes of the step are shown one by one before the run; default 3 and 5.
  shown?: number;
  // What the voice says as the step starts: a key of `stepLines`.
  line?: string;
  // The camera goes there before the step: a new district.
  frame?: { x: number; y: number; zoom: number };
  // The two new Homes of the step, in the style of their district.
  homes?: { style: string; slots: [number, number][] };
}

// The city fills the land it already owns: a strip of small Homes in the north, in blocks of fifteen Homes of one style, with Schools among them; services in the south; a water and power yard in the east.
// The Homes are the 1×1 styles, which keep their footprint as they grow, so a block can be as dense as the street allows.
const STRIP_STYLES = ['home-colonial-1x1', 'home-dutch-1x1', 'home-mansard-1x1', 'home-quincha-1x1', 'home-swahili-1x1', 'home-valparaiso-1x1'];
const BLOCK_SIZE = 15;
const STRIP_SCHOOLS: Item[] = [['school', 56, 48, 2], ['school', 63, 48, 2], ['school', 70, 48, 2]];
const SCHOOL_TILES = new Set(['56,49', '57,49', '63,49', '64,49', '70,49', '71,49']);
const STRIP_SLOTS = Array.from({ length: 27 }, (_, index) => 50 + index).flatMap((x): [number, number][] => [49, 51, 53, 55].map((y): [number, number] => [x, y])).filter(([x, y]) => !SCHOOL_TILES.has(`${x},${y}`));
const blockOf = (index: number): Step['homes'] => ({ style: STRIP_STYLES[index]!, slots: STRIP_SLOTS.slice(index * BLOCK_SIZE, (index + 1) * BLOCK_SIZE) });
const YARD: Item[] = [
  ...Array.from({ length: 6 }, (_, index): Item => ['waterTower', 70 + index, 56]),
  ...Array.from({ length: 6 }, (_, index): Item => ['waterTower', 70 + index, 57]),
  ...Array.from({ length: 6 }, (_, index): Item => ['powerPlant', 70 + index, 59]),
  ...Array.from({ length: 6 }, (_, index): Item => ['powerPlant', 70 + index, 60]),
];
const YARD_EAST: Item[] = [
  ...Array.from({ length: 6 }, (_, index): Item => ['waterTower', 70 + index, 64]),
  ...Array.from({ length: 6 }, (_, index): Item => ['waterTower', 70 + index, 65]),
  ...Array.from({ length: 6 }, (_, index): Item => ['powerPlant', 70 + index, 66]),
];
// A tower or a plant goes up two tiers: three times its capacity.
const GRID_UPGRADES = ['waterTower', 'waterTower', 'powerPlant', 'powerPlant'];
const STEPS: Step[] = [
  { target: 600, line: 'schools', frame: { x: 64, y: 62, zoom: 22 }, roads: [[[77, 50], [77, 78]], [[69, 70], [77, 70]], [[50, 50], [77, 50]], [[50, 54], [77, 54]]], items: [...STRIP_SCHOOLS, ...YARD], upgrades: GRID_UPGRADES, homes: blockOf(0) },
  { target: 700, line: 'services', roads: [[[50, 75], [61, 75]], [[61, 70], [61, 75]]], items: [['highSchool', 50, 76, 0], ['townHall', 53, 76, 0]] },
  { target: 800, upgrades: ['school'], items: [['supermarket', 50, 73, 2], ['arcade', 52, 73, 2]] },
  { target: 900, line: 'brt', transit: 'brt' },
  { target: 1000, items: [['hotel', 56, 76, 0], ['catholicChurch', 59, 76, 0]] },
  { target: 1100, upgrades: ['school'], homes: blockOf(1) },
  { target: 1250, line: 'rail', transit: 'rail' },
  { target: 1400, items: [['fireStation', 61, 76, 0], ['bakery', 54, 73, 2]] },
  { target: 1550, upgrades: ['school'], homes: blockOf(2) },
  { target: 1700, line: 'metro', transit: 'metro' },
  { target: 1850, upgrades: ['school'], items: [['synagogue', 56, 73, 2], ['buddhistTemple', 58, 73, 2]], homes: blockOf(3) },
  { target: 2000 },
];

// The last stretch is short: two steps, the first building and Home of each shown and the rest in a run.
const SPRAWL: Step[] = [
  { target: 3000, shown: 1, items: YARD_EAST, upgrades: [...GRID_UPGRADES, 'school', 'school', 'school'], homes: blockOf(4) },
  { target: 5000, shown: 1, items: [['largeGeothermalPlant', 70, 62]], upgrades: ['school', 'school', 'school'], homes: blockOf(5) },
];

const TRANSIT_SETS = {
  brt: { stop: 'brtStation', vehicle: 'brtElectric', peak: 6, offPeak: 12 },
  rail: { stop: 'railStation', vehicle: 'trainElectric', peak: 8, offPeak: 15 },
  metro: { stop: 'metroStation', vehicle: 'metroTrain', peak: 8, offPeak: 15 },
} as const;

// A transit network that works: the tracks, two stations, a line between them and a vehicle on it.
async function buildTransit(stage: Stage, mode: keyof typeof TRANSIT_SETS): Promise<void> {
  const set = TRANSIT_SETS[mode];
  const plan = {
    brt: { network: [[48, 50], [48, 78]], stations: [[49, 52, 1], [49, 62, 1], [49, 72, 1]] },
    rail: { network: [[79, 50], [79, 78]], stations: [[78, 52, 3], [78, 58, 3], [78, 66, 3], [78, 74, 3]] },
    metro: { network: [[76, 50], [76, 78]], stations: [[76, 52, 3], [76, 64, 3], [76, 76, 3]] },
  }[mode];
  await command(stage, `${mode} network`, [{ type: 'BuildTransit', mode, from: { x: plan.network[0]![0], y: plan.network[0]![1] }, to: { x: plan.network[1]![0], y: plan.network[1]![1] } }]);
  await command(stage, `${mode} stations`, plan.stations.map(([x, y, rotation]) => ({ type: 'PlaceBuilding', buildingType: set.stop, x, y, rotation })));
  const failure = await stage.page.evaluate(([stop, kind, transitMode, peak, offPeak]) => {
    const game = window.__gameStore!.getState();
    const stops = game.state.buildings.filter((building) => building.type === stop).map((building) => building.id);
    game.send({ type: 'SetTransitLine', mode: transitMode, stops, peakHeadway: peak, offPeakHeadway: offPeak } as never);
    game.send({ type: 'BuyTransitVehicle', kind } as never);
    const after = window.__gameStore!.getState();
    const lineId = after.state.transitLines?.find((line) => line.mode === transitMode)?.id;
    const vehicleId = after.state.transitFleet?.at(-1)?.id;
    after.send({ type: 'AssignTransitVehicle', id: vehicleId, lineId } as never);
    return JSON.stringify(window.__gameStore!.getState().lastError);
  }, [set.stop, set.vehicle, mode, set.peak, set.offPeak] as const);
  await stage.check(`the ${mode} line runs: ${failure}`, async () => failure === 'null');
  // The metro runs under the city, on its own levels: the map goes down to the second one, where the trains run, then comes back to the surface.
  if (mode === 'metro') {
    await stage.level(-2);
    // Time flies for three seconds down there, seen from two angles: the metro trains of the line run along their tunnel from the north to the south.
    await stage.timelapse({ hours: 1, seconds: 1.5 });
    await stage.rotateView(1);
    await stage.wait(700);
    await stage.timelapse({ hours: 1, seconds: 1.5 });
    await stage.rotateView(-1);
    await stage.wait(700);
    await stage.level(0);
    await stage.wait(500);
  }
}

// Upgrades the new Homes, tier by tier, until the city reaches the target: the figure climbs with each Home.
async function climbTo(stage: Stage, target: number, homeIds: number[]): Promise<void> {
  const failure = await stage.page.evaluate(([goal, ids]) => {
    const perTier = [6, 15, 32, 60, 100, 160, 250, 400];
    const store = window.__gameStore!;
    const homes = () => store.getState().state.buildings.filter((building) => building.type.startsWith('home'));
    const total = () => homes().reduce((sum, building) => sum + perTier[building.tier - 1]!, 0);
    while (total() < goal) {
      const home = homes().filter((building) => ids.includes(building.id) && building.tier < 4).sort((a, b) => a.tier - b.tier || a.id - b.id)[0];
      if (!home) return `no new Home left at ${total()}`;
      store.getState().send({ type: 'UpgradeBuilding', buildingId: home.id } as never);
      const error = store.getState().lastError;
      if (error) return `${JSON.stringify(error)} at ${total()}`;
    }
    return null;
  }, [target, homeIds] as const);
  await stage.check(`the city reaches ${target}: ${failure}`, async () => !failure);
}

// The figure the game shows: its own count of the Citizens of every Home.
const citizensOf = (stage: Stage) => stage.page.evaluate(async () => {
  const cityModule = '/src/core/buildings/city.ts';
  const { totalCitizens } = await import(/* @vite-ignore */ cityModule) as typeof import('../../../src/core/buildings/city.ts');
  return totalCitizens(window.__gameStore!.getState().state);
});

type Text = (typeof TEXT)[Language];
type View = { x: number; y: number; zoom: number };

// The video of the start of a city, one sequence per private method: `play` lists them in the order they are filmed, so reordering them is moving a line.
// Some sequences lean on the ones before them (the city they find, the Homes already placed); the comments say which.
class StartFilm {
  private readonly stage: Stage;
  private readonly language: Language;
  private readonly text: Text;

  constructor(stage: Stage, language: Language, text: Text) {
    this.stage = stage;
    this.language = language;
    this.text = text;
  }

  // Films some sequences of the film, in the order given.
  async perform(names: Sequence[]): Promise<void> {
    for (const name of names) await this[name]();
  }

  // The start of a scene that goes on from the previous one: the camera where the previous one left it, and, when the scene shows City management, that window loaded behind the scenes, cut from the film.
  async begin(view: View, { management = false } = {}): Promise<void> {
    const { stage } = this;
    await stage.cursor(false);
    await this.frame(view, 0.1);
    if (management) {
      await stage.management('eco-needs', true);
      await stage.page.waitForSelector('#eco-needs', { state: 'attached', timeout: 30_000 });
      await stage.management(null);
    }
    stage.begin();
  }

  // -- Sequences ------------------------------------------------------------------------------

  // The title card and the small town the film starts from.
  private async intro(): Promise<void> {
    const { stage, text } = this;
    // Nothing is clicked in this film: the fake cursor stays hidden.
    await stage.cursor(false);
    await this.frame({ x: 58, y: 58, zoom: 34 }, 0.1);
    await stage.title('Urbtopia', { subtitle: text.tagline });
    await this.chapter(text.town, text.townLine);
    await this.frame({ x: 58, y: 59, zoom: 58 }, 1.8);
    await stage.wait(720);
    await this.counter(0);
    await this.endChapter();
  }

  // Quick: one framing, the first Homes shown one by one, the rest and the trees in a run.
  private async firstHomes(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.homes, text.homesLine);
    await this.frame(FIRST_STREETS, 1.2);
    await this.run([[STYLE_OF_ROW[59]!, 59, 59], [STYLE_OF_ROW[59]!, 61, 59]], 1);
    await road(stage, [63, 58], [63, 62]);
    await road(stage, [53, 62], [63, 62]);
    await this.run(this.rowOf(61), 1);
    await this.run([['tree', 54, 60], ['tree', 56, 60], ['nature-flower-redA', 58, 60], ['tree', 60, 60], ['nature-flower-yellowA', 62, 60]], 0);
    await stage.timelapse({ hours: 3, seconds: 2.5 });
    await stage.check('ten homes house sixty citizens', async () => (await citizensOf(stage)) === 60);
    await this.counter(18);
    await this.endChapter();
  }

  private async utilities(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.utilities, text.utilitiesLine);
    await this.frame({ x: 66, y: 57, zoom: 80 }, 1.0);
    await this.run([['waterTower', 65, 56], ['powerPlant', 66, 58], ['waterTower', 66, 56], ['powerPlant', 67, 59], ['powerPlant', 68, 58]]);
    await upgradeAll(stage, 'waterTower');
    await upgradeAll(stage, 'powerPlant');
    await this.frame(FIRST_STREETS, 1.0);
    await stage.wait(360);
    await stage.timelapse({ hours: 2, seconds: 2 });
    await this.endChapter();
  }

  private async shops(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.shops, text.shopsLine);
    await road(stage, [63, 62], [63, 70]);
    await road(stage, [53, 70], [63, 70]);
    await this.run([['shop', 64, 59], ['shopConstruction', 64, 60], ['shopFood', 64, 61], ['school', 64, 64], ['library', 56, 71]]);
    await this.run([['tree', 65, 59], ['holiday-bench', 65, 60], ['nature-flower-purpleA', 65, 61], ['tree', 65, 62]]);
    await stage.timelapse({ hours: 2, seconds: 2 });
    await this.endChapter();
  }

  // Leans on the School of `shops`: Tier 3 needs one in reach, so the two Homes farthest from it stay at Tier 2.
  private async homesGrow(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.growth, text.growthLine);
    await this.growRow(59, (x) => (x >= 57 ? 2 : 1));
    await this.growRow(61, (x) => (x >= 57 ? 2 : 1));
    await stage.timelapse({ hours: 3, seconds: 3 });
    await this.endChapter();
  }

  private async firstDistrict(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.district, text.districtLine);
    await this.frame(WHOLE_CITY, 1.8);
    await road(stage, [53, 66], [63, 66]);
    // The five first Homes of the district go in one by one, the others follow in a run.
    await this.run([63, 65, 67].flatMap((y) => this.rowOf(y)), 5);
    await this.run([['tree', 54, 64], ['tree', 56, 64], ['nature-flower-redA', 58, 64], ['tree', 60, 64], ['tree', 62, 64], ['tree', 54, 68], ['nature-flower-yellowA', 56, 68], ['tree', 58, 68], ['tree', 60, 68]]);
    await this.growRow(63, (x) => (x >= 59 ? 2 : 1));
    await stage.timelapse({ hours: 3, seconds: 3 });
    const four = await this.counter(200);
    await stage.check(`the city passes four hundred citizens (${four})`, async () => four >= 400);
    await this.endChapter();
  }

  private async publicServices(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.services, text.servicesLine);
    await this.frame({ x: 63, y: 69, zoom: 62 }, 1.0);
    await this.run([['hospital', 64, 67], ['policeStation', 59, 71], ['shopEquipment', 64, 62], ['shopLuxury', 64, 63], ['park', 66, 62], ['hedge', 68, 61], ['holiday-bench', 66, 64]]);
    await this.frame(WHOLE_CITY, 1.0);
    await stage.timelapse({ hours: 3, seconds: 2 });
    await this.endChapter();
  }

  private async offices(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.offices, text.officesLine);
    await this.growRow(65, () => 1);
    await this.growRow(67, () => 1);
    await stage.check('the city has five hundred citizens', async () => (await citizensOf(stage)) >= 500);
    await road(stage, [63, 70], [69, 70]);
    await this.frame({ x: 66, y: 71, zoom: 70 }, 1.0);
    await this.run([['office', 68, 68, 2], ['tree', 53, 71], ['tree', 54, 71], ['nature-flower-redA', 58, 71]]);
    await this.frame(WHOLE_CITY, 1.0);
    await this.run([['park', 66, 65], ['park', 68, 62], ['tree', 67, 67], ['nature-flower-purpleA', 67, 68]]);
    await stage.timelapse({ hours: 4, seconds: 3 });
    await this.endChapter();
  }

  // The Cars layer is opened by code: the loaded roads show.
  private async traffic(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.traffic, text.trafficLine);
    await stage.analytics('movement.cars');
    await stage.wait(2100);
    await stage.timelapse({ hours: 2, seconds: 2 });
    await this.endChapter();
    await stage.analytics(null);
    await stage.wait(500);
  }

  // A factory fitted out in a few seconds, with no mouse and no floating bar: a working set-up goes in, a Restocker is assigned to its vat, and the bonus shows what the automation is for.
  private async factoryAutomation(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.factory, text.factoryLine);
    const factoryId = await stage.page.evaluate(() => window.__gameStore!.getState().state.buildings.find((building) => building.type === 'factory')!.id);
    // The room is large enough for the whole set-up from the fifth Tier, and a Restocker is hired from the third.
    await command(stage, 'the factory goes up four tiers', Array.from({ length: 4 }, () => ({ type: 'UpgradeBuilding', buildingId: factoryId })));
    await this.frame({ x: 61, y: 57, zoom: 80 }, 1.2);
    await stage.cursor(false);
    await stage.ui('hud', 'build');
    await stage.interior('factory');
    await stage.wait(1200);
    if (stage.portrait) await stage.shiftRoom(120, -170);
    // Fixtures: [type, x, y, rotation]; rotation 0 faces the front of the room, 1 the left, 2 the back wall, 3 the right.
    const set: [string, number, number, number][] = [
      // Plumbing: a tank, a pump and a motor, a pipe, and a tee that feeds two mixing vats.
      ['factoryTank', 1, 0, 0], ['factoryPump', 1, 1, 0], ['factoryMotor', 2, 1, 1], ['factoryPipe', 1, 2, 0], ['factoryPipeTee', 1, 3, 2], ['factoryMixingVat', 0, 3, 3], ['factoryMixingVat', 2, 3, 1],
      // A motor line with a bevel tee: one motor drives two presses at an angle.
      ['factoryMotor', 4, 0, 0], ['factoryShaft', 4, 1, 0], ['factoryBevelTee', 4, 2, 2], ['factoryPress', 3, 2, 3], ['factoryPress', 5, 2, 1],
      // A bevel elbow turns the drive of a motor towards a third press.
      ['factoryMotor', 3, 4, 0], ['factoryBevel', 3, 5, 3], ['factoryPress', 4, 5, 1],
      // A gear turns a lathe one way, two meshed gears turn the other lathe the other way.
      ['factoryMotor', 6, 0, 0], ['factoryGear', 6, 1, 1], ['factoryLatheCw', 6, 2, 2],
      ['factoryMotor', 0, 5, 0], ['factoryGear', 0, 6, 1], ['factoryGear', 1, 6, 1], ['factoryLatheCcw', 1, 7, 2],
      // The boiler takes both: drive from the back, water from the front.
      ['factoryMotor', 7, 0, 0], ['factoryShaft', 7, 1, 0], ['factoryShaft', 7, 2, 0], ['factoryBoiler', 7, 3, 0], ['factoryPipe', 7, 4, 0], ['factoryPipe', 7, 5, 0], ['factoryPump', 7, 6, 2], ['factoryTank', 7, 7, 2], ['factoryMotor', 6, 6, 3],
    ];
    for (const [fixture, x, y, rotation] of set) {
      await command(stage, `${fixture} in the factory`, [{ type: 'PlaceInteriorFixture', buildingId: factoryId, fixture, x, y, rotation }]);
      await stage.wait(110);
    }
    await stage.wait(500);
    const vatId = await stage.page.evaluate((id) => window.__gameStore!.getState().state.buildings.find((building) => building.id === id)!.interior!.fixtures.find((fixture) => fixture.type === 'factoryMixingVat')!.id, factoryId);
    await command(stage, 'the vat is set to Planks', [{ type: 'SetExitRestock', buildingId: factoryId, fixtureId: vatId, good: 'planks' }]);
    await stage.wait(500);
    await command(stage, 'a Restocker is hired and assigned', [{ type: 'HireInteriorRestocker', buildingId: factoryId }, { type: 'AssignInteriorRestocker', buildingId: factoryId, fixtureId: vatId }]);
    await stage.wait(900);
    const planksBefore = await stage.page.evaluate(() => window.__gameStore!.getState().state.storage.goods.planks ?? 0);
    await stage.timelapse({ hours: 3, seconds: 3 });
    await stage.check('the Restocker keeps the factory producing by itself', () => stage.page.evaluate(([id, before]) => {
      const state = window.__gameStore!.getState().state;
      const factory = state.buildings.find((building) => building.id === id)!;
      return JSON.stringify(factory.queue).includes('planks') || JSON.stringify(factory.stacks).includes('planks') || (state.storage.goods.planks ?? 0) > before;
    }, [factoryId, planksBefore] as const));
    const bonus = await stage.page.evaluate(async () => {
      const bonusModule = '/src/core/factory/interiorBonus.ts';
      const { interiorBonusOfBuilding } = await import(/* @vite-ignore */ bonusModule) as typeof import('../../../src/core/factory/interiorBonus.ts');
      const result = interiorBonusOfBuilding(window.__gameStore!.getState().state.buildings.find((building) => building.type === 'factory')!);
      return result.speed + result.yield;
    });
    await stage.check(`the machines are linked: bonus ${bonus}`, async () => bonus > 0);
    await stage.cinematic(() => stage.stat(text.bonus, Math.round(bonus * 100), { seconds: 1.2, suffix: ' %' }));
    await stage.wait(900);
    await stage.interior(null);
    await this.endChapter();
    await stage.wait(500);
  }

  // A storehouse automated at a larger scale: two long lines, each from a loading dock through a hoist and conveyors to a rack, and one stocker for both. Its storage capacity shows what it is for.
  private async storehouseAutomation(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.storehouse, text.storehouseLine);
    const storehouseId = await stage.page.evaluate(() => window.__gameStore!.getState().state.buildings.find((building) => building.type === 'storehouse')!.id);
    // The room is large enough for two lines from the fifth Tier.
    await command(stage, 'the storehouse goes up four tiers', Array.from({ length: 4 }, () => ({ type: 'UpgradeBuilding', buildingId: storehouseId })));
    const capacityOf = () => stage.page.evaluate(async () => {
      const coreModule = '/src/core/index.ts';
      const { storageCapacity } = await import(/* @vite-ignore */ coreModule) as typeof import('../../../src/core/index.ts');
      const capacity = storageCapacity(window.__gameStore!.getState().state);
      return capacity.goods + capacity.materials;
    });
    const before = await capacityOf();
    await this.frame({ x: 58, y: 57, zoom: 80 }, 1.2);
    await stage.cursor(false);
    await stage.ui('hud', 'build');
    await stage.interior('storehouse');
    await stage.wait(1200);
    if (stage.portrait) await stage.shiftRoom(120, -170);
    // A loading dock and a hoist take their Drive on the right; the line ends in a rack on the front edge of the room.
    const line = (x: number): [string, number, number, number][] => [
      ['storehouseDock', x, 0, 0], ['storehouseShaft', x + 1, 0, 1], ['storehouseMotor', x + 2, 0, 1], ['storehouseConveyor', x, 1, 0], ['storehouseHoist', x, 2, 0],
      ['storehouseShaft', x + 1, 2, 1], ['storehouseMotor', x + 2, 2, 1], ['storehouseConveyor', x, 3, 0], ['storehouseConveyor', x, 4, 0], ['storehouseConveyor', x, 5, 0],
      ['storehouseConveyor', x, 6, 0], ['storehouseRack', x, 7, 2],
    ];
    for (const [fixture, x, y, rotation] of [...line(4), ...line(0)]) {
      await command(stage, `${fixture} in the storehouse`, [{ type: 'PlaceInteriorFixture', buildingId: storehouseId, fixture, x, y, rotation }]);
      await stage.wait(110);
    }
    await stage.wait(500);
    await command(stage, 'a stocker is hired', [{ type: 'HireInteriorStaff', buildingId: storehouseId, role: 'stocker' }]);
    await stage.wait(900);
    const after = await capacityOf();
    await stage.check(`the lines hold more: ${before} to ${after}`, async () => after > before);
    await stage.cinematic(() => stage.stat(text.capacity, after - before, { seconds: 1.2, suffix: ' +' }));
    await stage.wait(900);
    await stage.interior(null);
    await this.endChapter();
    await stage.wait(500);
  }

  // City management: the Needs pyramid, then the ecology of the city.
  private async cityManagement(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.manage, text.manageLine);
    await this.shout('needs');
    await stage.management('eco-needs');
    await stage.page.waitForSelector('#eco-needs');
    await stage.wait(5000);
    await this.shout('ecology');
    await stage.management('eco-emissions');
    await stage.wait(3500);
    await stage.management('eco-temperature');
    await stage.wait(2500);
    await this.shout('nature');
    await stage.management('eco-nature');
    await stage.wait(3000);
    await stage.management(null);
    await this.endChapter();
    await stage.wait(500);
  }

  // Steps of a hundred Citizens up to two thousand: services, the three transit networks and blocks of Homes on the land the city owns.
  private async twoThousandCitizens(): Promise<void> {
    await this.chapter(this.text.grow, this.text.growLine);
    await this.advance(STEPS);
    await this.endChapter();
  }

  // A stadium and a concert hall in the middle of the city: the Club is founded, a Show is booked, and time flies until both are held. Needs 1500 Citizens.
  private async liveEvents(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.live, text.liveLine);
    await this.frame({ x: 71, y: 72, zoom: 36 }, 3);
    await this.run([['footballStadium', 64, 71, 0], ['concertHall', 72, 67, 2]], 2);
    await stage.say(text.liveLineFounded, { wait: false });
    const booked = await stage.page.evaluate(async () => {
      const artistsModule = '/src/core/tourism/artists.ts';
      const { artistOffer } = await import(/* @vite-ignore */ artistsModule) as typeof import('../../../src/core/tourism/artists.ts');
      const game = window.__gameStore!.getState();
      const stadium = game.state.buildings.find((building) => building.type === 'footballStadium')!;
      const hall = game.state.buildings.find((building) => building.type === 'concertHall')!;
      game.send({ type: 'FoundClub', buildingId: stadium.id } as never);
      const clubError = window.__gameStore!.getState().lastError;
      const artist = artistOffer(window.__gameStore!.getState().state, hall)[0]!;
      window.__gameStore!.getState().send({ type: 'ScheduleShow', buildingId: hall.id, startsInHours: 1, artistId: artist.id } as never);
      return JSON.stringify([clubError, window.__gameStore!.getState().lastError]);
    });
    await stage.check(`the club is founded and the show booked: ${booked}`, async () => booked === '[null,null]');
    await stage.wait(1500);
    await stage.say(text.liveLineHeld, { wait: false });
    await stage.timelapse({ hours: 8, seconds: 8 });
    await stage.check('the concert and the match were held', () => stage.page.evaluate(() => {
      const buildings = window.__gameStore!.getState().state.buildings;
      const show = buildings.find((building) => building.type === 'concertHall')?.attraction?.lastGathering;
      const match = buildings.find((building) => building.type === 'footballStadium')?.club?.championship?.fixtures[0]?.result;
      return show !== undefined && match !== undefined;
    }));
    await this.endChapter();
  }

  // Leans on `twoThousandCitizens`: the blocks of Homes go on from the step it ended at, and the Homes it placed count.
  private async megalopolis(): Promise<void> {
    const { stage, text } = this;
    await this.chapter(text.sprawl, text.sprawlLine);
    await this.frame({ x: 64, y: 62, zoom: 22 }, 2);
    await this.advance(SPRAWL);
    const total = await citizensOf(stage);
    await stage.check(`the city counts five thousand citizens (${total})`, async () => total >= 5000);
    await this.frame({ x: 64, y: 64, zoom: 18 }, 2.5);
    await stage.wait(1000);
    await this.endChapter();
  }

  private async outro(): Promise<void> {
    const { stage, text, language } = this;
    const last = await citizensOf(stage);
    await stage.cinematic(async () => {
      await stage.stat(text.citizens, last, { from: 2000, seconds: 1.8 });
      // The film ends on its tagline, said with assurance: unhurried, over the closing card.
      await stage.say(text.tagline, { wait: false, speed: 0.9 });
      await stage.title('Urbtopia', { subtitle: text.tagline, note: MUSIC_CREDIT[language], seconds: 3.5 });
    });
    await stage.endOfSpeech();
  }

  // -- Helpers --------------------------------------------------------------------------------

  private frame(view: View, seconds = 2): Promise<void> {
    return this.stage.focusTile(view.x, view.y, view.zoom, seconds);
  }

  // A notable building or a kind of transport is named on screen in a few viral words.
  private async shout(key: string): Promise<void> {
    const shouts: Record<string, string> = this.text.shouts;
    if (shouts[key]) await this.stage.caption(shouts[key], undefined, 'viral', 200);
  }

  private async chapter(title: string, line: string): Promise<void> {
    await this.stage.caption(title, undefined, 'viral', 260);
    await this.stage.say(line, { wait: false });
  }

  private async endChapter(): Promise<void> {
    await this.stage.endOfSpeech();
    await this.stage.hideCaption();
  }

  private async counter(from: number): Promise<number> {
    const total = await citizensOf(this.stage);
    await this.stage.cinematic(() => this.stage.stat(this.text.citizens, total, { from, seconds: 1.5 }));
    await this.stage.wait(500);
    return total;
  }

  // One step of a batch: the first ones take their time, the rest go by.
  private pace(index: number, shown: number): Promise<void> {
    return this.stage.wait(index < shown ? 380 : 60);
  }

  private async run(items: Item[], shown = SHOWN): Promise<void> {
    for (const [index, [buildingType, x, y, rotation]] of items.entries()) {
      await this.shout(buildingType);
      await build(this.stage, buildingType, x, y, rotation);
      await this.pace(index, shown);
    }
  }

  private rowOf(y: number): Item[] {
    return COLUMNS.map((x): Item => [STYLE_OF_ROW[y]!, x, y]);
  }

  private async growRow(y: number, tiers: (x: number) => number): Promise<void> {
    for (const [index, x] of COLUMNS.entries()) {
      await upgradeHome(this.stage, x, y, tiers(x));
      await this.pace(index, SHOWN);
    }
  }

  // The Homes of the blocks that climb, read from the game: a scene that goes on from a previous one finds them there.
  private stripHomeIds(): Promise<number[]> {
    return this.stage.page.evaluate((styles) => window.__gameStore!.getState().state.buildings.filter((building) => styles.includes(building.type)).map((building) => building.id), STRIP_STYLES);
  }

  // The steps of a climb: land, streets, buildings, transit, upgrades and Homes, then the Homes go up until the city reaches the figure of the step.
  private async advance(steps: Step[]): Promise<void> {
    const { stage, text } = this;
    let reached = await citizensOf(stage);
    for (const step of steps) {
      const lines: Record<string, string> = text.stepLines;
      if (step.line) await stage.say(lines[step.line]!, { wait: false });
      for (const [x, y] of step.parcels ?? []) await command(stage, `land ${x},${y}`, [{ type: 'BuyParcel', x, y }]);
      if (step.frame) await this.frame(step.frame, 3);
      for (const [from, to] of step.roads ?? []) await road(stage, from, to);
      if (step.items) await this.run(step.items, step.shown ?? 3);
      if (step.transit) {
        await this.shout(step.transit);
        await buildTransit(stage, step.transit);
      }
      for (const type of step.upgrades ?? []) await upgradeAll(stage, type);
      const slots = step.homes?.slots ?? [];
      await this.run(slots.map(([x, y]): Item => [step.homes!.style, x, y]), step.shown ?? 5);
      await stage.wait(300);
      await climbTo(stage, step.target, await this.stripHomeIds());
      const now = await citizensOf(stage);
      await stage.cinematic(() => stage.stat(text.citizens, now, { from: reached, seconds: 0.7 }));
      reached = now;
      await stage.wait(500);
    }
  }
}

// The film is cut into scenes, each filmed on its own and cached: a scene goes on from the state the previous one ended in, so a change films that scene and the ones after it again, not the ones before.
// The sequences of a scene are named in the order they are filmed; moving a name moves the sequence (the ones that lean on others say so in their comment).
type Sequence = 'intro' | 'firstHomes' | 'utilities' | 'shops' | 'homesGrow' | 'firstDistrict' | 'publicServices' | 'offices' | 'traffic' | 'factoryAutomation' | 'storehouseAutomation' | 'cityManagement' | 'twoThousandCitizens' | 'liveEvents' | 'megalopolis' | 'outro';

interface SceneSpec {
  name: string;
  // Where the camera is when the scene starts, as the previous scene left it; none for the first scene.
  begin?: View;
  // The scene shows City management: it is loaded behind the scenes.
  management?: boolean;
  sequences: Sequence[];
}

const FILM: SceneSpec[] = [
  { name: 'town', sequences: ['intro', 'firstHomes', 'utilities', 'shops', 'homesGrow', 'firstDistrict'] },
  { name: 'automation', begin: WHOLE_CITY, sequences: ['factoryAutomation', 'storehouseAutomation'] },
  { name: 'city', begin: { x: 58, y: 57, zoom: 80 }, management: true, sequences: ['publicServices', 'offices', 'traffic', 'cityManagement'] },
  { name: 'growth', begin: WHOLE_CITY, sequences: ['twoThousandCitizens', 'liveEvents'] },
  { name: 'megalopolis', begin: { x: 71, y: 72, zoom: 36 }, sequences: ['megalopolis', 'outro'] },
];

// What the cache reads of a scene: the code of its sequences and of the helpers they use, the texts and the data they play from. A text or a table only counts for the scenes whose code names it.
const HELPERS = ['frame', 'shout', 'chapter', 'endChapter', 'counter', 'pace', 'run', 'rowOf', 'growRow', 'advance', 'stripHomeIds', 'begin', 'perform'];
const methodSource = (name: string): string => (StartFilm.prototype as unknown as Record<string, () => unknown>)[name]!.toString();
const functionSources = [build, command, road, upgradeAll, upgradeHome, buildTransit, climbTo, citizensOf].map((helper) => helper.toString());
const TABLES: Record<string, unknown> = { STYLE_OF_ROW, COLUMNS, STEPS, SPRAWL };

function sourcesOf(language: Language, sequences: Sequence[]): string[] {
  const code = [...functionSources, ...HELPERS.map(methodSource), ...sequences.map(methodSource)];
  const joined = code.join('\n');
  const textKeys = new Set([...joined.matchAll(/\btext\.(\w+)/g)].map((match) => match[1]!));
  const texts = Object.fromEntries([...textKeys].map((key) => [key, (TEXT[language] as Record<string, unknown>)[key]]));
  const tables = Object.fromEntries(Object.entries(TABLES).filter(([key]) => new RegExp(`\\b${key}\\b`).test(joined)));
  return [...code, JSON.stringify(texts), JSON.stringify(tables)];
}

export default scenario('start', (language: Language) => FILM.map((spec, index) => scene(
  spec.name,
  {
    ...(index === 0 ? { state: 'scripts/promo/states/small-town.json' } : { from: 'previous' as const }),
    ui: ['hud'],
    hideTaxBadges: true,
    flags: ['clubs'],
    sources: sourcesOf(language, spec.sequences),
  },
  async (stage) => {
    const film = new StartFilm(stage, language, TEXT[language]);
    if (spec.begin) await film.begin(spec.begin, { management: spec.management });
    await film.perform(spec.sequences);
  },
)), { transition: 'fade' });
