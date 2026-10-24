import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { managedModelFile } from './managedModels';
import { PROTOTYPE_ASSETS } from './prototypeAssets';

describe('prototype assets', () => {
  it.each(PROTOTYPE_ASSETS)('$prototype only asks for managed models that exist', ({ managed }) => {
    for (const key of managed) expect(existsSync(managedModelFile(key)), key).toBe(true);
  });
});
