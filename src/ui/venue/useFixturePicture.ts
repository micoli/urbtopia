import { useEffect, useState } from 'react';
import type { FixtureId } from '../../core';
import { fixturePicture } from './fixturePreview';

export function useFixturePicture(id: FixtureId): string | undefined {
  const [picture, setPicture] = useState<string | undefined>();
  useEffect(() => {
    let current = true;
    void fixturePicture(id).then(url => {
      if (current) setPicture(url);
    });
    return () => {
      current = false;
    };
  }, [id]);
  return picture;
}
