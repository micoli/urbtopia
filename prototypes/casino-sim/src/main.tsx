import { createRoot } from 'react-dom/client';
import '../../../src/styles.css';
import './sim.css';
import { Sim } from './Sim';

createRoot(document.getElementById('app')!).render(<Sim />);
