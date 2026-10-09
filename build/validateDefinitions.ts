import type { Plugin } from 'vite';
import { buildingsProblems, readBuildings } from '../scripts/buildingsFile.ts';
import { shippedModelCatalog } from '../scripts/modelReferences.ts';
import { modelsProblems } from '../scripts/modelsFile.ts';

const WATCHED = ['assets/defs/', 'assets/models.json'];

export function definitionProblems(): string[] {
  const catalog = shippedModelCatalog();
  return [...modelsProblems(catalog.models), ...buildingsProblems(readBuildings(), catalog)];
}

const report = (problems: string[]) => `Invalid game object definitions:\n${problems.join('\n')}`;

// Production ships data checked here and never parses it: a build fails on an invalid file, the dev server reports it at start and on each change.
export function validateDefinitions(): Plugin {
  let building = false;
  return {
    name: 'validate-definitions',
    configResolved(config) {
      building = config.command === 'build';
    },
    buildStart() {
      const problems = definitionProblems();
      if (!problems.length) return;
      if (building) this.error(report(problems));
      this.warn(report(problems));
    },
    configureServer(server) {
      server.watcher.on('all', (_event, file) => {
        if (!WATCHED.some(path => file.includes(path))) return;
        const problems = definitionProblems();
        if (!problems.length) return;
        server.config.logger.error(report(problems));
        server.ws.send({ type: 'error', err: { message: report(problems), stack: '' } });
      });
    },
  };
}
