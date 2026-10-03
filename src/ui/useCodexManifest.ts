import { useEffect, useState } from 'react';
import { validateCodexManifest, type CodexManifest } from '../codex/catalog';

let pending: Promise<CodexManifest> | null = null;

function loadManifest(): Promise<CodexManifest> {
  if (pending) return pending;
  pending = fetch(`${import.meta.env.BASE_URL}codex/manifest.json`)
    .then(response => {
      if (!response.ok) throw new Error(`Codex manifest: ${response.status}`);
      return response.json() as Promise<CodexManifest>;
    })
    .then(manifest => { validateCodexManifest(manifest); return manifest; })
    .catch(error => { pending = null; throw error; });
  return pending;
}

export function useCodexManifest() {
  const [manifest, setManifest] = useState<CodexManifest | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void loadManifest().then(data => { if (active) setManifest(data); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);
  const retry = () => { setFailed(false); setAttempt(value => value + 1); };
  return { manifest, failed, retry };
}
