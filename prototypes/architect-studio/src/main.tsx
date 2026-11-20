import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { blockPageZoom } from '../../../src/ui/system/blockPageZoom.ts';
import './styles.css';

blockPageZoom();

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
