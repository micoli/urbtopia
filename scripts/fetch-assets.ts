import { POLY_PIZZA_DIR, POLY_PIZZA_LIST_ID } from './assetPacks.ts';
import { fetchPolyPizzaList } from './polyPizza.ts';

try {
  const polyPizzaCount = await fetchPolyPizzaList(POLY_PIZZA_LIST_ID, POLY_PIZZA_DIR);
  console.log(`${polyPizzaCount} Poly Pizza assets refreshed in ${POLY_PIZZA_DIR} (credits in each license.txt).`);
} catch (error) {
  console.error(`\nDownload failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
