import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import StudyFocus from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudyFocus />
  </StrictMode>,
)
