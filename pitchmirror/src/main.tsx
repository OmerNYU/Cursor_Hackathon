import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { VisionHarness } from './app/VisionHarness'
// import { SimpleCameraTest } from './app/SimpleCameraTest'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VisionHarness />
  </StrictMode>,
)
