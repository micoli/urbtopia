import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import { startTheme } from './store/themeStore'
import './styles.css'

startTheme()

createRoot(document.getElementById('root')!).render(<App />)
