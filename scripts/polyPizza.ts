import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://poly.pizza';
const STATIC = 'https://static.poly.pizza';
// poly.pizza serves its data only to browser-like clients.
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36' };

interface ListModel {
  title: string;
  publicID: string;
  licence: string;
  creator: { username: string };
}

export interface PolyPizzaAsset {
  slug: string;
  title: string;
  publicID: string;
  licence: string;
  author: string;
  resourceId: string;
}

const LICENCE_URLS: Record<string, string> = {
  'CC-BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
};

export const slugify = (title: string): string => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'asset';

export function licenseText(asset: Pick<PolyPizzaAsset, 'title' | 'author' | 'publicID' | 'licence'>): string {
  const lines = [`"${asset.title}" by ${asset.author}`, `Source: ${SITE}/m/${asset.publicID}`, `License: ${asset.licence}`];
  const url = LICENCE_URLS[asset.licence];
  if (url) lines.push(url);
  return `${lines.join('\n')}\n`;
}

export function uniqueSlugs(models: Pick<ListModel, 'title' | 'publicID'>[]): string[] {
  const counts = new Map<string, number>();
  for (const { title } of models) counts.set(slugify(title), (counts.get(slugify(title)) ?? 0) + 1);
  return models.map(({ title, publicID }) => (counts.get(slugify(title)) === 1 ? slugify(title) : `${slugify(title)}-${publicID.toLowerCase().replace(/[^a-z0-9]/g, '')}`));
}

async function get(url: string): Promise<Response> {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response;
}

async function resourceIdOf(publicID: string): Promise<string> {
  const html = await (await get(`${SITE}/m/${publicID}`)).text();
  const resourceId = html.match(/"ResourceID":"([^"]+)"/)?.[1];
  if (!resourceId) throw new Error(`No ResourceID found on ${SITE}/m/${publicID}`);
  return resourceId;
}

export async function listAssets(listId: string): Promise<PolyPizzaAsset[]> {
  const list = (await (await get(`${SITE}/api/list/${listId}`)).json()) as { Models: ListModel[] };
  const slugs = uniqueSlugs(list.Models);
  return Promise.all(
    list.Models.map(async (model, index) => ({
      slug: slugs[index]!,
      title: model.title,
      publicID: model.publicID,
      licence: model.licence,
      author: model.creator.username,
      resourceId: await resourceIdOf(model.publicID),
    })),
  );
}

export async function fetchPolyPizzaList(listId: string, targetDir: string): Promise<number> {
  const assets = await listAssets(listId);
  for (const asset of assets) {
    console.log(`↓ ${asset.slug}`);
    const model = new Uint8Array(await (await get(`${STATIC}/${asset.resourceId}.glb`)).arrayBuffer());
    const dir = join(targetDir, asset.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${asset.slug}.glb`), model);
    writeFileSync(join(dir, 'license.txt'), licenseText(asset));
  }
  return assets.length;
}

export const publicIdOf = (input: string): string => {
  const id = input.trim().match(/poly\.pizza\/m\/([A-Za-z0-9_-]+)/)?.[1] ?? input.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error(`Not a Poly Pizza URL or id: ${input}`);
  return id;
};

export interface PolyPizzaModel {
  slug: string;
  title: string;
  author: string;
  url: string;
  glb: Uint8Array;
}

// The model page does not expose its licence in static HTML, so the caller supplies it.
export async function fetchPolyPizzaModel(input: string, download: (url: string) => Promise<Response> = get): Promise<PolyPizzaModel> {
  const publicID = publicIdOf(input);
  const html = await (await download(`${SITE}/m/${publicID}`)).text();
  const resourceId = html.match(/"ResourceID":"([^"]+)"/)?.[1] ?? html.match(/static\.poly\.pizza\/([0-9a-f-]{36})\.glb/)?.[1];
  if (!resourceId) throw new Error(`No model file found on ${SITE}/m/${publicID}`);
  const [, title = publicID, author = 'unknown'] = html.match(/og:title" content="(.+?) - Free (?:3D )?Model By (.+?)"/) ?? [];
  const glb = new Uint8Array(await (await download(`${STATIC}/${resourceId}.glb`)).arrayBuffer());
  return { slug: slugify(title), title, author, url: `${SITE}/m/${publicID}`, glb };
}
