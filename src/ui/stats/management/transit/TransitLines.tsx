import { useEffect, useRef, useState } from 'react';
import type { transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { useUi } from '../../../common/hooks.ts';
import { LineEditor } from './LineEditor.tsx';
import { LineList, type LineSelection } from './LineList.tsx';

export function TransitLines({ transport }: { transport: ReturnType<typeof transportStats> }) {
  const lineToEdit = useUi(store => store.lineToEdit);
  const clearLineToEdit = useUi(store => store.clearLineToEdit);
  const [selection, setSelection] = useState<LineSelection>(lineToEdit);
  const root = useRef<HTMLDivElement>(null);
  const lineId = typeof selection === 'number' ? selection : undefined;
  useEffect(() => {
    if (lineToEdit === null) return;
    root.current?.scrollIntoView({ block: 'start' });
    clearLineToEdit();
  }, [lineToEdit, clearLineToEdit]);
  return <div className="transit-lines" ref={root}>
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
