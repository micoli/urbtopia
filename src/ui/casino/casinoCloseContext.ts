import { createContext } from 'react';

export const CasinoCloseContext = createContext<(() => void) | null>(null);
