import { useState } from 'react';
import type { transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { LineEditor } from './LineEditor.tsx';
import { LineList, type LineSelection } from './LineList.tsx';

export function TransitLines({ transport }: { transport: ReturnType<typeof transportStats> }) {
  const [selection, setSelection] = useState<LineSelection>(null);
  const lineId = typeof selection === 'number' ? selection : undefined;
  return <div className="transit-lines">
    <LineList lines={transport.lines} selection={selection} onSelect={setSelection} />
    <div className="transit-editor">
      {selection === null
        ? <p>{t('transit.noLineSelected')}</p>
        : <LineEditor
          key={selection}
          lineId={lineId}
          summary={transport.lines.find(line => line.id === lineId)}
          onSaved={setSelection}
          onDeleted={() => setSelection(null)}
          onCancel={() => setSelection(null)}
        />}
    </div>
  </div>;
}
