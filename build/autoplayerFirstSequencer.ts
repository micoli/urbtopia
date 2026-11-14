import { BaseSequencer, type TestSpecification } from 'vitest/node';

const FIRST = 'src/sim/autoplayer.test.ts';

const isFirst = (specification: TestSpecification): boolean => specification.moduleId.replaceAll('\\', '/').endsWith(FIRST);

// The autoplayer test is the longest one: it starts first so that it runs beside the others instead of after them.
export const autoplayerFirst = <Specification extends TestSpecification>(specifications: readonly Specification[]): Specification[] => [
  ...specifications.filter(isFirst),
  ...specifications.filter(specification => !isFirst(specification)),
];

export class AutoplayerFirstSequencer extends BaseSequencer {
  override async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    return autoplayerFirst(await super.sort(files));
  }
}
