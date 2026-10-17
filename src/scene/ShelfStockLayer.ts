import * as THREE from 'three';
import { FIXTURES, fixtureFootprint, itemModelOf, stockOf, type GoodId, type VenueFixture } from '../core';
import { modelThumbnail } from '../ui/collect/modelThumbnail';

interface StockBadge {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  texture: THREE.CanvasTexture;
  label: string;
  good?: GoodId;
}

export class ShelfStockLayer {
  readonly root = new THREE.Group();
  private badges = new Map<number, StockBadge>();
  private icons = new Map<GoodId, HTMLImageElement | null>();
  private disposed = false;

  constructor(private onChange: () => void) {}

  sync(fixtures: readonly VenueFixture[]): boolean {
    const shelves = fixtures.filter(fixture => FIXTURES[fixture.type].shelf !== undefined);
    const ids = new Set(shelves.map(shelf => shelf.id));
    let changed = false;
    for (const [id, badge] of this.badges) {
      if (ids.has(id)) continue;
      this.remove(id, badge);
      changed = true;
    }
    for (const shelf of shelves) {
      let badge = this.badges.get(shelf.id);
      if (!badge) {
        badge = this.create();
        if (!badge) continue;
        this.badges.set(shelf.id, badge);
        this.root.add(badge.sprite);
        changed = true;
      }
      const { width, depth } = fixtureFootprint(shelf.type, shelf.rotation);
      const x = shelf.x + width / 2;
      const z = shelf.y + depth / 2;
      if (badge.sprite.position.x !== x || badge.sprite.position.z !== z) changed = true;
      badge.sprite.position.set(x, 1.15, z);
      const label = `${Math.floor(stockOf(shelf))} / ${FIXTURES[shelf.type].shelf}`;
      if (label === badge.label && shelf.good === badge.good) continue;
      badge.label = label;
      badge.good = shelf.good;
      if (shelf.good) this.loadIcon(shelf.good);
      this.paint(badge);
      changed = true;
    }
    return changed;
  }

  dispose(): void {
    this.disposed = true;
    for (const [id, badge] of this.badges) this.remove(id, badge);
    this.icons.clear();
  }

  private paint(badge: StockBadge): void {
    const { context, canvas, good, label } = badge;
    const icon = good ? this.icons.get(good) : null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.shadowColor = 'rgba(0, 0, 0, 0.9)';
    context.shadowBlur = 18;
    if (icon) context.drawImage(icon, (canvas.width - 96) / 2, 16, 96, 96);
    context.fillStyle = '#ffffff';
    context.font = 'bold 44px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(label, canvas.width / 2, good ? 146 : canvas.height / 2);
    badge.texture.needsUpdate = true;
  }

  private loadIcon(good: GoodId): void {
    if (this.icons.has(good)) return;
    this.icons.set(good, null);
    const model = itemModelOf(good);
    if (!model) return;
    void modelThumbnail(model).then(source => {
      if (!source || this.disposed) return;
      const icon = new Image();
      icon.onload = () => {
        if (this.disposed) return;
        this.icons.set(good, icon);
        for (const badge of this.badges.values()) {
          if (badge.good === good) this.paint(badge);
        }
        this.onChange();
      };
      icon.src = source;
    });
  }

  private create(): StockBadge | undefined {
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 192;
    const context = canvas.getContext('2d');
    if (!context) return;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, toneMapped: false }));
    sprite.scale.set(0.8, 0.8 * canvas.height / canvas.width, 1);
    sprite.renderOrder = 13;
    return { sprite, canvas, context, texture, label: '' };
  }

  private remove(id: number, badge: StockBadge): void {
    this.root.remove(badge.sprite);
    badge.texture.dispose();
    badge.sprite.material.dispose();
    this.badges.delete(id);
  }
}
