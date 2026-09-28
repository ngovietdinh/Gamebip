import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HorrorApp } from './ui/App'
import './ui/horror.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HorrorApp />
  </StrictMode>,
)
