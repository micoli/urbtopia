// PROTOTYPE — "Cabinet d'architecture": plan editor with a per-floor footprint, facade bricks
// and editable roof sections. Throwaway code.
import {
  AXES,
  AXIS_LABEL,
  BRICKS,
  BRICK_LABEL,
  BRICK_PRICE,
  CHIMNEY_PRICE,
  DEFAULT_ROOF,
  DORMER_PRICE,
  DIR_NAMES,
  GRID,
  MAX_FLOORS,
  PITCHES,
  PITCH_LABEL,
  ROOFS,
  ROOF_LABEL,
  SHAPES,
  SHAPE_LABEL,
  SPLIT_LABEL,
  addFloor,
  applyShape,
  canToggle,
  emptyPlan,
  dormerAllowed,
  exteriorEdges,
  getBrick,
  hasChimney,
  hasDormer,
  isOccupied,
  mansardCluster,
  parsePlan,
  rectAt,
  removeFloor,
  roofRects,
  roofStyle,
  setAllRoofs,
  setBrick,
  stats,
  toggleCell,
  toggleChimney,
  toggleDormer,
  type Brick,
  type Dir,
  type Edge,
  type Plan,
  type Rect,
  type RoofStyle,
  type Split,
} from './model.ts';
import { Viewer } from './render.ts';

const BRICK_COLOR: Record<Brick, string> = {
  wall: '#d8c9a3',
  window: '#8fc8e8',
  bay: '#3f9ad0',
  door: '#6b4226',
  balcony: '#4a4a52',
};
const BRICK_SHORT: Record<Brick, string> = { wall: '', window: '▫', bay: '▭', door: '▮', balcony: '⌸' };
const SECTION_COLORS = ['#e9b8a6', '#b9d7a8', '#a9c4e8', '#e8d9a0', '#d3b3e3', '#a8e0d6', '#f0c0d8', '#c8c8c8'];

type Mode = 'footprint' | 'facade' | 'roof';
const MODES: Mode[] = ['footprint', 'facade', 'roof'];
const MODE_LABEL: Record<Mode, string> = { footprint: 'Emprise', facade: 'Façades', roof: 'Toits' };

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { class?: string } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  const { class: cls, ...rest } = props;
  if (cls) node.className = cls;
  Object.assign(node, rest);
  node.append(...children);
  return node;
}

interface Session {
  plan: Plan;
  viewer: Viewer;
  mode: Mode;
  brick: Brick;
  floor: number;
  roofLevel: boolean;
  roofKey?: string;
  highlight?: Edge & { roof?: boolean };
  selected?: Edge;
  refresh: () => void;
  history: string[];
  cursor: number;
}

function mount(): void {
  const panel = document.getElementById('panel')!;
  const view = document.getElementById('view')!;
  const s: Session = { plan: emptyPlan(), viewer: new Viewer(view), mode: 'footprint', brick: 'window', floor: 0, roofLevel: false, refresh: () => undefined, history: [], cursor: -1 };

  const shapeBox = h('section', { class: 'shape' });
  const editor = h('section', { class: 'editor' });
  const colorsBox = h('section', {});
  const statsBox = h('section', { class: 'stats' });
  const historyBox = h('div', { class: 'save-row' });

  s.refresh = () => {
    recordHistory(s);
    s.floor = Math.min(s.floor, s.plan.floors.length - 1);
    if (s.roofKey && !roofRects(s.plan).some((r) => r.key === s.roofKey)) s.roofKey = undefined;
    if (s.selected && !exteriorEdges(s.plan).some((e) => sameEdge(e, s.selected!))) s.selected = undefined;
    showPlan(s);
    s.viewer.onPick = (hit) => (hit.kind === 'roof' ? pickRoof(s, hit.col, hit.row) : pickEdge(s, hit.edge));
    renderShape(s, shapeBox);
    renderEditor(s, editor);
    renderColors(s, colorsBox);
    renderStats(s.plan, statsBox);
    renderHistory(s, historyBox);
  };

  panel.append(h('h1', {}, "Cabinet d'architecture"), historyBox, renderLibrary(s), shapeBox, editor, colorsBox, statsBox);
  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if ((e.metaKey || e.ctrlKey) === false || target.tagName === 'INPUT') return;
    const key = e.key.toLowerCase();
    if (key === 'z') {
      e.preventDefault();
      travel(s, e.shiftKey ? 1 : -1);
    } else if (key === 'y') {
      e.preventDefault();
      travel(s, 1);
    }
  });
  s.refresh();
}

const HISTORY_LIMIT = 100;

// Every refresh follows a change of the plan: keep a snapshot when it differs from the current one.
function recordHistory(s: Session): void {
  const snapshot = JSON.stringify(s.plan);
  if (snapshot === s.history[s.cursor]) return;
  s.history.splice(s.cursor + 1);
  s.history.push(snapshot);
  if (s.history.length > HISTORY_LIMIT) s.history.shift();
  s.cursor = s.history.length - 1;
}

function travel(s: Session, step: -1 | 1): void {
  const next = s.cursor + step;
  if (next < 0 || next >= s.history.length) return;
  s.cursor = next;
  s.plan = JSON.parse(s.history[next]!) as Plan;
  s.roofKey = undefined;
  s.refresh();
}

function renderHistory(s: Session, box: HTMLElement): void {
  box.replaceChildren(
    h('button', { class: 'chip', disabled: s.cursor <= 0, title: 'Ctrl/Cmd+Z', onclick: () => travel(s, -1) }, '↶ Annuler'),
    h('button', { class: 'chip', disabled: s.cursor >= s.history.length - 1, title: 'Ctrl/Cmd+Shift+Z', onclick: () => travel(s, 1) }, 'Rétablir ↷'),
  );
}

const sameEdge = (a: Edge, b: Edge) => a.floor === b.floor && a.c === b.c && a.r === b.r && a.dir === b.dir;

// The hovered slot wins over the selected one for the ghost in the 3D view.
function showPlan(s: Session): void {
  const selected = s.mode === 'facade' && !s.roofLevel ? s.selected : undefined;
  s.viewer.setPlan(s.plan, s.highlight ?? selected, s.mode === 'roof' ? s.roofKey : undefined);
}

function pickEdge(s: Session, edge: Edge): void {
  s.mode = 'facade';
  s.roofLevel = false;
  s.selected = edge;
  s.floor = edge.floor;
  s.refresh();
}

function pickRoof(s: Session, c: number, r: number): void {
  const nearby = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dc, dr] of nearby) {
    const rect = rectAt(s.plan, c + dc!, r + dr!);
    if (!rect) continue;
    s.mode = 'roof';
    s.roofKey = rect.key;
    s.refresh();
    return;
  }
}

function renderShape(s: Session, box: HTMLElement): void {
  const { plan } = s;
  box.replaceChildren(
    h('h2', {}, 'Gabarit'),
    h(
      'div',
      { class: 'chips' },
      ...SHAPES.map((shape) =>
        h('button', { class: 'chip', onclick: () => { applyShape(plan, shape); s.refresh(); } }, SHAPE_LABEL[shape]),
      ),
    ),
    h(
      'div',
      { class: 'stepper' },
      h('span', {}, 'Étages'),
      h('button', { class: 'chip', disabled: plan.floors.length <= 1, onclick: () => { removeFloor(plan); s.refresh(); } }, '−'),
      h('b', {}, String(plan.floors.length)),
      h('button', { class: 'chip', disabled: plan.floors.length >= MAX_FLOORS, onclick: () => { addFloor(plan); s.refresh(); } }, '+'),
    ),
  );
}

function renderColors(s: Session, box: HTMLElement): void {
  const color = (label: string, key: 'wallColor' | 'roofColor') => {
    const input = h('input', { type: 'color', value: s.plan[key] });
    input.addEventListener('input', () => {
      s.plan[key] = input.value;
      showPlan(s);
    });
    input.addEventListener('change', () => s.refresh());
    return h('label', { class: 'row' }, h('span', {}, label), input);
  };
  box.replaceChildren(h('h2', {}, 'Couleurs'), color('Façade', 'wallColor'), color('Toit', 'roofColor'));
}

function renderStats(plan: Plan, box: HTMLElement): void {
  const st = stats(plan);
  box.replaceChildren(
    h('h2', {}, 'Plan'),
    h(
      'div',
      { class: 'kpis' },
      h('div', {}, h('b', {}, `${st.cost} €`), 'coût'),
      h('div', {}, h('b', {}, String(st.citizens)), 'habitants'),
      h('div', {}, h('b', {}, String(st.cells)), 'cases'),
      h('div', {}, h('b', {}, String(st.openings)), 'ouvertures'),
    ),
    ...st.issues.map((i) => h('p', { class: 'issue' }, `⚠ ${i}`)),
    st.issues.length === 0 ? h('p', { class: 'ok' }, '✓ Plan constructible') : '',
  );
}

function chips<T extends string>(values: T[], labels: Record<T, string>, active: T | undefined, onPick: (v: T) => void): HTMLElement {
  return h('div', { class: 'chips' }, ...values.map((v) => h('button', { class: v === active ? 'chip on' : 'chip', onclick: () => onPick(v) }, labels[v])));
}

const floorLabels = (plan: Plan) => plan.floors.map((_, f) => (f === 0 ? 'RDC' : `Étage ${f}`));

function palette(s: Session): HTMLElement {
  return h(
    'div',
    { class: 'palette' },
    ...BRICKS.map((b) =>
      h(
        'button',
        { class: b === s.brick ? 'brick on' : 'brick', onclick: () => { s.brick = b; s.refresh(); } },
        h('i', { style: `background:${BRICK_COLOR[b]}` }),
        `${BRICK_LABEL[b]} · ${BRICK_PRICE[b]}€`,
      ),
    ),
  );
}

function slotButton(s: Session, edge: Edge, onPick: () => void, label: string, color: string, roof = false): HTMLButtonElement {
  const btn = h('button', { class: 'slot', title: `${DIR_NAMES[edge.dir]} · étage ${edge.floor}` }, label);
  btn.style.background = color;
  if (!roof && s.selected && sameEdge(edge, s.selected)) btn.classList.add('picked');
  btn.onclick = () => {
    if (!roof) s.selected = edge;
    onPick();
    s.refresh();
  };
  btn.onmouseenter = () => {
    s.highlight = { ...edge, roof };
    showPlan(s);
  };
  btn.onmouseleave = () => {
    s.highlight = undefined;
    showPlan(s);
  };
  return btn;
}

const cellTracks = Array.from({ length: GRID }, () => '14px 40px').join(' ') + ' 14px';

function gridContainer(): HTMLElement {
  const grid = h('div', { class: 'plan' });
  grid.style.cssText = `grid-template-columns:${cellTracks};grid-template-rows:${cellTracks}`;
  return grid;
}

function placeAt(grid: HTMLElement, node: HTMLElement, col: number, row: number): void {
  node.style.gridColumn = String(col);
  node.style.gridRow = String(row);
  grid.append(node);
}

// Floor plan: cells of the selected floor (editable in footprint mode), with the exterior edges as
// clickable slots around them (facade mode).
function floorGrid(s: Session): HTMLElement {
  const { plan, floor } = s;
  const grid = gridContainer();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const on = isOccupied(plan, floor, c, r);
      const supported = floor === 0 || isOccupied(plan, floor - 1, c, r);
      const btn = h('button', { class: on ? 'cell on' : supported ? 'cell free' : 'cell off' });
      btn.disabled = s.mode !== 'footprint' || !canToggle(plan, floor, c, r);
      btn.onclick = () => {
        toggleCell(plan, floor, c, r);
        s.refresh();
      };
      placeAt(grid, btn, 2 * c + 2, 2 * r + 2);
    }
  }
  if (s.mode !== 'facade') return grid;
  for (const edge of exteriorEdges(plan).filter((e) => e.floor === floor)) {
    const brick = getBrick(plan, edge);
    placeSlot(grid, slotButton(s, edge, () => setBrick(plan, edge, s.brick), BRICK_SHORT[brick], BRICK_COLOR[brick]), edge);
  }
  return grid;
}

function placeSlot(grid: HTMLElement, slot: HTMLElement, edge: Edge): void {
  slot.classList.add(edge.dir % 2 === 0 ? 'h' : 'v');
  placeAt(grid, slot, 2 * edge.c + 2 + (edge.dir === 1 ? 1 : edge.dir === 3 ? -1 : 0), 2 * edge.r + 2 + (edge.dir === 2 ? 1 : edge.dir === 0 ? -1 : 0));
}

// Roof level of the facade mode: columns seen from above (chimneys) and the sides under a mansard (dormers).
function roofLevelGrid(s: Session): HTMLElement {
  const { plan } = s;
  const sections = roofRects(plan);
  const grid = gridContainer();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const rect = rectAt(plan, c, r);
      const btn = h('button', { class: rect ? 'cell on' : 'cell off' }, rect && hasChimney(plan, c, r) ? '▥' : '');
      btn.disabled = !rect;
      if (rect) {
        btn.style.background = SECTION_COLORS[sections.indexOf(rect) % SECTION_COLORS.length]!;
        btn.onclick = () => {
          toggleChimney(plan, c, r);
          s.refresh();
        };
      }
      placeAt(grid, btn, 2 * c + 2, 2 * r + 2);
    }
  }
  for (const edge of exteriorEdges(plan).filter((e) => dormerAllowed(plan, e))) {
    const on = hasDormer(plan, edge);
    placeSlot(grid, slotButton(s, edge, () => toggleDormer(plan, edge), on ? '⌂' : '', on ? '#b5533c' : '#d8c9a3', true), edge);
  }
  return grid;
}

// Roof map: every column seen from above, coloured by roof section.
function roofGrid(s: Session): HTMLElement {
  const { plan } = s;
  const sections = roofRects(plan);
  const grid = gridContainer();
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const rect = rectAt(plan, c, r);
      const btn = h('button', { class: rect ? 'cell on' : 'cell off' }, rect ? String(rect.floor + 1) : '');
      btn.disabled = !rect;
      if (rect) {
        btn.style.background = SECTION_COLORS[sections.indexOf(rect) % SECTION_COLORS.length]!;
        if (rect.key === s.roofKey) btn.classList.add('picked');
        btn.onclick = () => {
          s.roofKey = rect.key;
          s.refresh();
        };
      }
      placeAt(grid, btn, 2 * c + 2, 2 * r + 2);
    }
  }
  return grid;
}

function roofPanel(s: Session): HTMLElement {
  const { plan } = s;
  const selected = roofRects(plan).find((r: Rect) => r.key === s.roofKey);
  const update = (patch: Partial<RoofStyle>) => {
    if (!selected) return;
    const targets = patch.pitch ? mansardCluster(plan, selected) : [selected];
    for (const target of targets) plan.roofStyles[target.key] = { ...roofStyle(plan, target), ...patch };
    s.refresh();
  };
  const box = h(
    'div',
    {},
    h('h2', {}, 'Découpe en ailes'),
    chips<Split>(['rows', 'cols'], SPLIT_LABEL, plan.roofSplit, (split) => { plan.roofSplit = split; s.roofKey = undefined; s.refresh(); }),
    h('h2', {}, 'Tous les toits'),
    chips(ROOFS, ROOF_LABEL, undefined, (type) => { setAllRoofs(plan, type); s.refresh(); }),
  );
  if (!selected) {
    box.append(h('p', { class: 'hint' }, 'Cliquer une aile sur le plan pour régler son toit. Le chiffre est le nombre d’étages.'));
    return box;
  }
  const style = roofStyle(plan, selected);
  const high = style.high ?? 0;
  box.append(
    h('h2', {}, 'Aile sélectionnée'),
    chips(ROOFS, ROOF_LABEL, style.type, (type) => update({ type })),
  );
  if (style.type === 'shed' || style.type === 'saltbox') {
    box.append(
      h('h2', {}, style.type === 'shed' ? 'Face haute' : 'Faîtage côté'),
      h(
        'div',
        { class: 'chips' },
        ...DIR_NAMES.map((n, i) => h('button', { class: i === high ? 'chip on' : 'chip', onclick: () => update({ high: i as Dir }) }, n)),
        h('button', { class: 'chip', title: 'Face suivante', onclick: () => update({ high: ((high + 1) % 4) as Dir }) }, '↻'),
      ),
    );
  } else {
    box.append(h('h2', {}, 'Orientation'), chips(AXES, AXIS_LABEL, style.axis, (axis) => update({ axis })));
  }
  box.append(h('h2', {}, 'Pente'), chips(PITCHES, PITCH_LABEL, style.pitch, (pitch) => update({ pitch })));
  box.append(h('button', { class: 'chip', onclick: () => { delete plan.roofStyles[selected.key]; s.refresh(); } }, `Réinitialiser (${ROOF_LABEL[DEFAULT_ROOF.type]})`));
  return box;
}

const ROOF_LEVEL_HINT = `Niveau Toit : cliquer un côté (sous une mansarde) pour une lucarne · ${DORMER_PRICE}€, cliquer une case pour une cheminée · ${CHIMNEY_PRICE}€.`;

const MODE_HINT: Record<Mode, string> = {
  footprint: "Cliquer une case pour l'ajouter ou la retirer. Un étage ne peut s'étendre que sur les cases de l'étage du dessous.",
  facade: 'Choisir une brique puis cliquer un côté du plan. Nord en haut.',
  roof: 'Cliquer une aile pour régler son toit. Le chiffre est le nombre d’étages.',
};

function renderEditor(s: Session, host: HTMLElement): void {
  const onRoofLevel = s.mode === 'facade' && s.roofLevel;
  const floorTabs = h(
    'div',
    { class: 'chips' },
    ...floorLabels(s.plan).map((l, f) => h('button', { class: f === s.floor && !onRoofLevel ? 'chip on' : 'chip', onclick: () => { s.floor = f; s.roofLevel = false; s.refresh(); } }, l)),
    ...(s.mode === 'facade' ? [h('button', { class: onRoofLevel ? 'chip on' : 'chip', onclick: () => { s.roofLevel = true; s.refresh(); } }, 'Toit')] : []),
  );
  host.replaceChildren(
    h('div', { class: 'modes' }, ...MODES.map((m) => h('button', { class: m === s.mode ? 'mode on' : 'mode', onclick: () => { s.mode = m; s.refresh(); } }, MODE_LABEL[m]))),
    ...(s.mode === 'roof' ? [] : [floorTabs]),
    ...(s.mode === 'facade' && !onRoofLevel ? [palette(s)] : []),
    s.mode === 'roof' ? roofGrid(s) : onRoofLevel ? roofLevelGrid(s) : floorGrid(s),
    h('p', { class: 'hint' }, onRoofLevel ? ROOF_LEVEL_HINT : MODE_HINT[s.mode]),
    ...(s.mode === 'roof' ? [roofPanel(s)] : []),
  );
}

const STORAGE_KEY = 'architect-studio:plans';

function readLibrary(): Record<string, Plan> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, Plan>;
  } catch {
    return {};
  }
}

function writeLibrary(library: Record<string, Plan>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

function renderLibrary(s: Session): HTMLElement {
  const name = h('input', { type: 'text', placeholder: 'Nom du plan', value: '' });
  const list = h('div', { class: 'library' });
  const draw = () => {
    const library = readLibrary();
    const names = Object.keys(library).sort();
    list.replaceChildren(
      ...(names.length ? [] : [h('p', { class: 'hint' }, 'Aucun plan sauvegardé.')]),
      ...names.map((n) =>
        h(
          'div',
          { class: 'saved' },
          h('span', {}, n),
          h('button', { class: 'chip', onclick: () => { s.plan = structuredClone(library[n]!); s.floor = 0; s.roofKey = undefined; name.value = n; s.refresh(); } }, 'Charger'),
          h('button', { class: 'chip', onclick: () => { const next = readLibrary(); delete next[n]; writeLibrary(next); draw(); } }, '✕'),
        ),
      ),
    );
  };
  const save = h('button', {
    class: 'chip',
    onclick: () => {
      const key = name.value.trim();
      if (!key) return;
      writeLibrary({ ...readLibrary(), [key]: structuredClone(s.plan) });
      draw();
    },
  }, 'Sauvegarder');
  const exportJson = h('button', {
    class: 'chip',
    onclick: () => {
      const title = name.value.trim() || 'plan';
      const blob = new Blob([JSON.stringify({ version: 1, name: title, plan: s.plan }, null, 2)], { type: 'application/json' });
      const link = h('a', { href: URL.createObjectURL(blob), download: `${title.replace(/[^\w-]+/g, '-')}.json` });
      link.click();
      URL.revokeObjectURL(link.href);
    },
  }, 'Exporter JSON');
  const message = h('p', { class: 'issue' });
  const picker = h('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  picker.onchange = async () => {
    const file = picker.files?.[0];
    picker.value = '';
    if (!file) return;
    const result = parsePlan(await file.text());
    if ('error' in result) {
      message.textContent = `⚠ ${result.error}`;
      return;
    }
    message.textContent = '';
    s.plan = result.plan;
    s.floor = 0;
    s.roofKey = undefined;
    name.value = result.name ?? file.name.replace(/\.json$/i, '');
    s.refresh();
  };
  const importJson = h('button', { class: 'chip', onclick: () => picker.click() }, 'Importer JSON');
  const fresh = h('button', { class: 'chip', onclick: () => { s.plan = emptyPlan(); s.floor = 0; s.roofKey = undefined; name.value = ''; s.refresh(); } }, 'Nouveau');
  draw();
  return h('section', {}, h('h2', {}, 'Plans'), h('div', { class: 'save-row' }, name, save, fresh), h('div', { class: 'save-row' }, exportJson, importJson, picker), message, list);
}

mount();
