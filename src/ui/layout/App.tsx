import { Fragment, useEffect } from 'react';
import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { LayoutBottomMenu } from './LayoutBottomMenu.tsx';
import { LayoutRadial } from './LayoutRadial.tsx';
import { LayoutLeftMenu } from './LayoutLeftMenu.tsx';
import { Overlays } from './Overlays';
import { useUndoKeys } from '../build/useUndoKeys';
import { SceneCanvas } from './SceneCanvas';

export function App() {
  useUndoKeys();
  const language = useStore(prefsStore, (store) => store.language);
  const layout = useStore(prefsStore, (store) => store.layout);

  useEffect(() => {
    document.documentElement.dataset.layout = layout;
    document.documentElement.lang = language;
  }, [layout, language]);
    console.log(layout)
  return (
    <>
      <SceneCanvas />
      <Fragment key={language}>
        <Overlays />
        {layout === 'A' ? <LayoutBottomMenu /> : layout === 'B' ? <LayoutRadial /> : <LayoutLeftMenu />}
      </Fragment>
    </>
  );
}
