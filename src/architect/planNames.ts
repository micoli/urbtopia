export function uniquePlanName(base: string, taken: readonly string[]): string {
  const used = new Set(taken);
  let number = 1;
  while (used.has(`${base} ${number}`)) number++;
  return `${base} ${number}`;
}
