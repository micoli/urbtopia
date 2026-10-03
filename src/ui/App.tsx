import { Fragment, useEffect } from 'react';
import { useStore } from 'zustand';
import { prefsStore } from '../i18n/prefsStore';
import { LayoutA } from './LayoutA';
import { LayoutB } from './LayoutB';
import { LayoutC } from './LayoutC';
import { Overlays } from './Overlays';
import { useUndoKeys } from './useUndoKeys';
import { SceneCanvas } from './SceneCanvas';

export function App() {
  useUndoKeys();
  const language = useStore(prefsStore, (store) => store.language);
  const layout = useStore(prefsStore, (store) => store.layout);

  useEffect(() => {
    document.documentElement.dataset.layout = layout;
    document.documentElement.lang = language;
  }, [layout, language]);

  return (
    <>
      <SceneCanvas />
      <Fragment key={language}>
        <Overlays />
        {layout === 'A' ? <LayoutA /> : layout === 'B' ? <LayoutB /> : <LayoutC />}
      </Fragment>
    </>
  );
}
