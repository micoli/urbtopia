import { createServer } from 'vite';
import type { Demonstration } from '../src/core/demonstrations/scenario';

const selected = process.argv[2];
const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null, ws: false }, appType: 'custom', logLevel: 'error' });
try {
  const { DEMONSTRATIONS } = await server.ssrLoadModule('/src/core/demonstrations/catalog.ts') as { DEMONSTRATIONS: readonly Demonstration[] };
  const { compileDemonstration } = await server.ssrLoadModule('/src/core/demonstrations/scenario.ts');
  const scenarios = selected ? DEMONSTRATIONS.filter(scenario => scenario.id === selected) : DEMONSTRATIONS;
  if (scenarios.length === 0) throw new Error(`Unknown demonstration: ${selected ?? '(empty catalogue)'}`);
  for (const scenario of scenarios) {
    const checkpoints = compileDemonstration(scenario);
    console.log(`✓ ${scenario.id}: ${checkpoints.length} steps verified`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await server.close();
}
