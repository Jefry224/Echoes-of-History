import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useGLTF } from '@react-three/drei'
import './index.css'
import App from './App.tsx'

// Point Draco decoder to CDN so compressed .glb models load correctly
useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
