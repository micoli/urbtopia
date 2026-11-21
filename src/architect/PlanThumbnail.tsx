import { useEffect, useState } from 'react';
import type { Plan } from '../core/architect/housePlan.ts';
import { planThumbnail } from './planThumbnail.ts';

export function PlanThumbnail({ plan }: { plan: Plan }) {
  const [source, setSource] = useState<string>();
  useEffect(() => {
    let current = true;
    void planThumbnail(plan).then((url) => {
      if (current) setSource(url);
    });
    return () => {
      current = false;
    };
  }, [plan]);
  if (!source) return <div className="studio-thumb" aria-hidden="true" />;
  return <img className="studio-thumb" src={source} alt="" />;
}
