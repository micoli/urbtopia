import type { Aim, Board, BallEvent, Cell, PlacedPart, SimulationResult, Trajectory } from './types';

// The constants of the run, in cells and seconds. Only `+ - * /` and `Math.sqrt` are used on them, which every engine computes the same way, so that a run gives the same trajectory on every device.
// The puzzle lab changes them live; the game never does.
export const PHYSICS = {
  step: 1 / 60,
  gravity: 14,
  airDrag: 0.15,
  ballRadius: 0.14,
  slideFriction: 0.15,
  wallBounce: 0.5,
  floorBounce: 0.25,
  floorFriction: 3,
  // The cup of a target at the bottom of the board: the height of its rim, how far from its middle a ball is caught, how far its walls stand, and how far above the bottom its floor is.
  cupRim: 0.11,
  cupWidth: 0.35,
  cupHalf: 0.5,
  cupFloor: 0.05,
  // A ball that falls this far under the board is lost.
  lostDepth: 0.6,
  restingSpeed: 0.5,
  beltSpeed: 1.5,
  beltGrip: 6,
  rampBounce: 0.2,
  seesawBounce: 0.2,
  trampolineBounce: 0.93,
  springBounce: 0.5,
  springLaunch: 7.5,
  fanPower: 26,
  fanReach: 3,
  fanFalloff: 0.7,
  enterRadius: 0.45,
  settleSpeed: 0.1,
  settleTime: 0.3,
  afterLandingTime: 3,
  stuckSpeed: 0.3,
  stuckTime: 1,
  maxTime: 20,
  // A new contact is a new bounce only after the ball has been off the Part for this many steps.
  contactGap: 3,
  maxSubsteps: 4,
};

interface Point {
  x: number;
  y: number;
}

interface Surface {
  a: Point;
  b: Point;
  bounce: number;
  launch: number;
  belt: number;
}

const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const keyOf = (cell: Cell) => `${cell.x},${cell.y}`;
const familyOf = (kind: string) => kind.slice(0, kind.lastIndexOf('-'));
const sideOf = (kind: string) => (kind.endsWith('-left') ? -1 : 1);

// A Part kind is `<family>-<side>`; the surfaces below are those of the right-hand Part in the cell (0..1, y down) and the left-hand Part is their mirror.
function surfaceOf(part: PlacedPart, turned: boolean): Surface | undefined {
  const family = familyOf(part.kind);
  let side = sideOf(part.kind);
  if (family === 'seesaw' && turned) side = -side;
  const line = (ax: number, ay: number, bx: number, by: number, extra: Partial<Surface>): Surface => {
    const toBoard = (x: number, y: number): Point => ({ x: part.at.x + (side === 1 ? x : 1 - x), y: part.at.y + y });
    return { a: toBoard(ax, ay), b: toBoard(bx, by), bounce: 0, launch: 0, belt: 0, ...extra };
  };
  if (family === 'ramp') return line(0, 0.5, 1, 0.92, { bounce: PHYSICS.rampBounce });
  if (family === 'seesaw') return line(0.02, 0.55, 0.98, 0.8, { bounce: PHYSICS.seesawBounce });
  if (family === 'trampoline') return line(0.05, 0.58, 0.95, 0.66, { bounce: PHYSICS.trampolineBounce });
  if (family === 'spring') return line(0.1, 0.5, 0.9, 0.8, { bounce: PHYSICS.springBounce, launch: PHYSICS.springLaunch });
  if (family === 'conveyor') return line(0, 0.83, 1, 0.83, { bounce: 0.1, belt: PHYSICS.beltSpeed });
  return undefined;
}

/** Whether `point` is in the jet of `fan`: the cells of the fan and the ones beside it on the side it blows to, and the height of its cell. How strong it blows there falls off with the distance. */
function jetStrength(fan: PlacedPart, point: Point): number {
  if (familyOf(fan.kind) !== 'fan') return 0;
  const side = sideOf(fan.kind);
  const along = (point.x - (fan.at.x + (side === 1 ? 0 : 1))) * side;
  if (along < 0 || along >= PHYSICS.fanReach || point.y < fan.at.y || point.y >= fan.at.y + 1) return 0;
  return side * PHYSICS.fanPower * (1 - (PHYSICS.fanFalloff * along) / PHYSICS.fanReach);
}

function elementCells(aims: Aim[]): Cell[] {
  return aims.flatMap((aim) => (aim.kind === 'light' ? aim.candles : aim.kind === 'flip' ? aim.switches : aim.kind === 'collect' ? aim.stars : []));
}

export function runBall(board: Board, parts: PlacedPart[]): Trajectory {
  const { step, ballRadius: radius } = PHYSICS;
  const surfaces = parts.map((part) => ({ part, key: keyOf(part.at), turned: false, lastContact: -Infinity, inContact: false }));
  const fans = parts.filter((part) => familyOf(part.kind) === 'fan');
  const elements = elementCells(board.aims).map((cell) => ({ cell, inside: false }));
  const cups = board.aims.flatMap((aim) => (aim.kind === 'deliver' ? [aim.target] : aim.kind === 'collect' ? [aim.exit] : []));
  let caught: Cell | undefined;
  let crossing: Trajectory['crossing'];
  const jetting = new Map<string, boolean>();
  const events: BallEvent[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  let x = board.ballStart.x + 0.5;
  let y = board.ballStart.y + 0.5;
  let vx = 0;
  let vy = 0;
  let stepIndex = 0;
  let floorSince = -1;
  let slowSince = -1;
  let landed = false;
  xs.push(x);
  ys.push(y);

  const emit = (kind: BallEvent['kind'], cell: Cell) => events.push({ t: stepIndex * step, kind, cell });

  function collide(entry: (typeof surfaces)[number], surface: Surface, h: number): boolean {
    const dx = surface.b.x - surface.a.x;
    const dy = surface.b.y - surface.a.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    let nx = dy / length;
    let ny = -dx / length;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const along = ((x - surface.a.x) * dx + (y - surface.a.y) * dy) / (length * length);
    const t = along < 0 ? 0 : along > 1 ? 1 : along;
    const px = surface.a.x + t * dx;
    const py = surface.a.y + t * dy;
    const above = (x - surface.a.x) * nx + (y - surface.a.y) * ny;
    const distance = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
    if (above < -radius * 0.6 || distance >= radius) return false;
    let depth = radius - above;
    if (t === 0 || t === 1) {
      if (distance === 0) return false;
      nx = (x - px) / distance;
      ny = (y - py) / distance;
      depth = radius - distance;
    }
    x += nx * depth;
    y += ny * depth;
    const vn = vx * nx + vy * ny;
    if (vn < 0) {
      const bounce = -vn < PHYSICS.restingSpeed ? 0 : surface.bounce;
      let tx = vx - vn * nx;
      let ty = vy - vn * ny;
      const speed = Math.sqrt(tx * tx + ty * ty);
      const reduced = Math.max(0, speed - PHYSICS.slideFriction * (1 + bounce) * -vn);
      if (speed > 0) {
        tx *= reduced / speed;
        ty *= reduced / speed;
      }
      let normal = -vn * bounce;
      if (surface.launch > 0) normal = surface.launch + normal * 0.5;
      vx = tx + normal * nx;
      vy = ty + normal * ny;
    }
    if (surface.belt !== 0) {
      const ux = dx / length;
      const uy = dy / length;
      const tangent = vx * ux + vy * uy;
      const pull = (surface.belt - tangent) * Math.min(1, PHYSICS.beltGrip * h);
      vx += pull * ux;
      vy += pull * uy;
    }
    return true;
  }

  while (stepIndex * step < PHYSICS.maxTime) {
    stepIndex += 1;
    let ax = 0;
    for (const fan of fans) {
      const strength = jetStrength(fan, { x, y });
      ax += strength;
      const inJet = strength !== 0;
      if (inJet !== (jetting.get(keyOf(fan.at)) ?? false)) {
        jetting.set(keyOf(fan.at), inJet);
        emit(inJet ? 'jet' : 'jet-end', fan.at);
      }
    }
    const speed = Math.sqrt(vx * vx + vy * vy);
    const substeps = Math.min(PHYSICS.maxSubsteps, Math.max(1, Math.ceil((speed * step) / (radius * 0.5))));
    const h = step / substeps;
    for (let sub = 0; sub < substeps; sub += 1) {
      vx += ax * h;
      vy += PHYSICS.gravity * h;
      const drag = 1 - PHYSICS.airDrag * h;
      vx *= drag;
      vy *= drag;
      x += vx * h;
      y += vy * h;
      for (const entry of surfaces) {
        const surface = surfaceOf(entry.part, entry.turned);
        if (!surface) continue;
        const touching = collide(entry, surface, h);
        if (!touching) continue;
        if (stepIndex - entry.lastContact > PHYSICS.contactGap) emit(surface.belt !== 0 ? 'belt' : 'hit', entry.part.at);
        entry.inContact = true;
        entry.lastContact = stepIndex;
      }
      if (x < radius || x > board.width - radius) {
        const left = x < radius;
        if (Math.abs(vx) > PHYSICS.restingSpeed) emit('wall', { x: left ? -1 : board.width, y: Math.floor(y) });
        x = left ? radius : board.width - radius;
        vx = -vx * PHYSICS.wallBounce;
      }
      const rim = board.height - PHYSICS.cupRim;
      if (!crossing && y + radius >= rim) crossing = { x, t: stepIndex * step };
      if (!caught && y + radius >= rim) caught = cups.find((cup) => Math.abs(x - (cup.x + 0.5)) <= PHYSICS.cupWidth);
      if (caught) {
        const left = caught.x + 0.5 - PHYSICS.cupHalf + radius;
        const right = caught.x + 0.5 + PHYSICS.cupHalf - radius;
        if (x < left || x > right) {
          x = x < left ? left : right;
          vx = -vx * PHYSICS.wallBounce;
        }
        const floor = board.height - PHYSICS.cupFloor - radius;
        if (y > floor) {
          y = floor;
          vy = vy > PHYSICS.restingSpeed ? -vy * PHYSICS.floorBounce : 0;
          vx *= Math.max(0, 1 - PHYSICS.floorFriction * h);
          if (floorSince < 0) floorSince = stepIndex;
        }
      }
    }
    // A seesaw turns over, and a belt lets go of the ball, once the ball has left the cell of the Part it was on.
    for (const entry of surfaces) {
      if (!entry.inContact || (x >= entry.part.at.x && x <= entry.part.at.x + 1 && y <= entry.part.at.y + 1)) continue;
      entry.inContact = false;
      if (familyOf(entry.part.kind) === 'seesaw') {
        entry.turned = !entry.turned;
        emit('flip', entry.part.at);
      } else if (surfaceOf(entry.part, false)?.belt) emit('belt-end', entry.part.at);
    }
    for (const element of elements) {
      const inside = Math.hypot(x - (element.cell.x + 0.5), y - (element.cell.y + 0.5)) <= PHYSICS.enterRadius;
      if (inside && !element.inside) emit('enter', element.cell);
      element.inside = inside;
    }
    xs.push(x);
    ys.push(y);
    const moving = Math.sqrt(vx * vx + vy * vy);
    const resting = floorSince >= 0 && caught !== undefined;
    if (resting) {
      slowSince = moving < PHYSICS.settleSpeed ? (slowSince < 0 ? stepIndex : slowSince) : -1;
      if ((slowSince >= 0 && (stepIndex - slowSince) * step >= PHYSICS.settleTime) || (stepIndex - floorSince) * step >= PHYSICS.afterLandingTime) {
        landed = true;
        break;
      }
    } else {
      if (!caught && y - radius > board.height + PHYSICS.lostDepth) break;
      slowSince = moving < PHYSICS.stuckSpeed ? (slowSince < 0 ? stepIndex : slowSince) : -1;
      if (slowSince >= 0 && (stepIndex - slowSince) * step >= PHYSICS.stuckTime) break;
    }
  }
  const landing = landed && caught ? { x: caught.x, y: board.height - 1 } : undefined;
  return { step, xs, ys, events, landed, landing, crossing };
}

const entriesIn = (trajectory: Trajectory, cell: Cell) => trajectory.events.filter((event) => event.kind === 'enter' && sameCell(event.cell, cell)).length;

export function isMet(aim: Aim, trajectory: Trajectory): boolean {
  const { landing } = trajectory;
  if (aim.kind === 'deliver') return landing !== undefined && landing.x === aim.target.x && landing.y === aim.target.y;
  if (aim.kind === 'light') return aim.candles.every((candle) => entriesIn(trajectory, candle) > 0);
  if (aim.kind === 'flip') return aim.switches.every((cell) => entriesIn(trajectory, cell) % 2 === 1);
  return landing !== undefined && sameCell(landing, aim.exit) && aim.stars.every((star) => entriesIn(trajectory, star) > 0);
}

export const durationOf = (trajectory: Trajectory): number => (trajectory.xs.length - 1) * trajectory.step;

export function simulate(board: Board, parts: PlacedPart[]): SimulationResult {
  const trajectory = runBall(board, parts);
  return { solved: trajectory.landed && board.aims.every((aim) => isMet(aim, trajectory)), seconds: durationOf(trajectory) };
}

/** Whether `part` is a fan whose jet is on the ball. */
export function fanBlowsAt(part: PlacedPart, x: number, y: number): boolean {
  return jetStrength(part, { x, y }) !== 0;
}
