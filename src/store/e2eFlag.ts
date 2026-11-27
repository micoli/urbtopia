// `?promo` (a recorded demonstration video) behaves as `?e2e`: no banners, no prompts, no tutorial.
export function isPromoRequested(search: string): boolean {
  return new URLSearchParams(search).has('promo');
}

export function isE2eRequested(search: string): boolean {
  return new URLSearchParams(search).has('e2e') || isPromoRequested(search);
}
