import { useRef, useState } from 'react';
import { emptyPlan, parsePlan, type Plan } from './model.ts';

const STORAGE_KEY = 'architect-studio:plans';

function readLibrary(): Record<string, Plan> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, Plan>;
  } catch {
    return {};
  }
}

function writeLibrary(library: Record<string, Plan>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

interface LibraryProps {
  plan: Plan;
  onLoad: (plan: Plan) => void;
}

export function Library({ plan, onLoad }: LibraryProps) {
  const [name, setName] = useState('');
  const [library, setLibrary] = useState(readLibrary);
  const [message, setMessage] = useState('');
  const picker = useRef<HTMLInputElement>(null);

  const save = () => {
    const key = name.trim();
    if (!key) return;
    const next = { ...readLibrary(), [key]: structuredClone(plan) };
    writeLibrary(next);
    setLibrary(next);
  };

  const remove = (key: string) => {
    const next = readLibrary();
    delete next[key];
    writeLibrary(next);
    setLibrary(next);
  };

  const exportJson = () => {
    const title = name.trim() || 'plan';
    const blob = new Blob([JSON.stringify({ version: 1, name: title, plan }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^\w-]+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    const result = parsePlan(await file.text());
    if ('error' in result) {
      setMessage(`⚠ ${result.error}`);
      return;
    }
    setMessage('');
    setName(result.name ?? file.name.replace(/\.json$/i, ''));
    onLoad(result.plan);
  };

  const names = Object.keys(library).sort();
  return (
    <section>
      <h2>Plans</h2>
      <div className="save-row">
        <input type="text" placeholder="Nom du plan" value={name} onChange={(event) => setName(event.target.value)} />
        <button className="chip" onClick={save}>
          Sauvegarder
        </button>
        <button
          className="chip"
          onClick={() => {
            setName('');
            onLoad(emptyPlan());
          }}
        >
          Nouveau
        </button>
      </div>
      <div className="save-row">
        <button className="chip" onClick={exportJson}>
          Exporter JSON
        </button>
        <button className="chip" onClick={() => picker.current?.click()}>
          Importer JSON
        </button>
        <input
          ref={picker}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            void importJson(file);
          }}
        />
      </div>
      {message && <p className="issue">{message}</p>}
      <div className="library">
        {names.length === 0 && <p className="hint">Aucun plan sauvegardé.</p>}
        {names.map((key) => (
          <div key={key} className="saved">
            <span>{key}</span>
            <button
              className="chip"
              onClick={() => {
                setName(key);
                onLoad(structuredClone(library[key]!));
              }}
            >
              Charger
            </button>
            <button className="chip" onClick={() => remove(key)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
