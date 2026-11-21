import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ArchitectStudio } from '../../../src/architect/ArchitectStudio.tsx';
import { useLocalPlanLibrary } from '../../../src/architect/useLocalPlanLibrary.ts';
import { blockPageZoom } from '../../../src/ui/system/blockPageZoom.ts';
import './styles.css';

blockPageZoom();

function Standalone() {
  return <ArchitectStudio library={useLocalPlanLibrary()} standalone />;
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <Standalone />
  </StrictMode>,
);
