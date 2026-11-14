import { useEffect, useState } from 'react';
import type { FixtureId } from '../../core';

export function useFixturePicture(id: FixtureId): string | undefined {
  const [picture, setPicture] = useState<string | undefined>();
  useEffect(() => {
    let current = true;
    void import('./fixturePreview').then(({ fixturePicture }) => fixturePicture(id)).then(url => {
      if (current) setPicture(url);
    });
    return () => {
      current = false;
    };
  }, [id]);
  return picture;
}
