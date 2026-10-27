import { Fragment, lazy, Suspense, useEffect } from 'react';
import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { LayoutBottomMenu } from './LayoutBottomMenu.tsx';
import { LayoutRadial } from './LayoutRadial.tsx';
import { LayoutLeftMenu } from './LayoutLeftMenu.tsx';
import { Overlays } from './Overlays';
import { useUndoKeys } from '../build/useUndoKeys';
import { SceneCanvas } from './SceneCanvas';
import { isDevelopmentHost } from '../../devtools/isDevelopmentHost';
import { uiStore } from '../../store/uiStore';
import { StreetViewHud } from './StreetViewHud';

const DevTools = import.meta.env.DEV ? lazy(() => import('../../devtools/DevTools')) : null;

export function App() {
  useUndoKeys();
  const language = useStore(prefsStore, (store) => store.language);
  const layout = useStore(prefsStore, (store) => store.layout);
  const streetView = useStore(uiStore, (store) => store.streetView);
  const analytics = useStore(uiStore, (store) => store.analyticsLayer !== null);

  useEffect(() => {
    document.documentElement.dataset.layout = layout;
    document.documentElement.lang = language;
  }, [layout, language]);
  return (
    <>
      <SceneCanvas />
      {DevTools && isDevelopmentHost(window.location.hostname) ? <Suspense fallback={null}><DevTools /></Suspense> : null}
      <Fragment key={language}>
        <Overlays />
        {streetView ? <StreetViewHud /> : analytics ? null : layout === 'A' ? <LayoutBottomMenu /> : layout === 'B' ? <LayoutRadial /> : <LayoutLeftMenu />}
      </Fragment>
    </>
  );
}
