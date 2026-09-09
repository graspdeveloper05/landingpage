import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LocaleProvider } from '@/i18n'
import App from './App'
import '@/styles/index.css'

// Marks that JavaScript is running, which is what enables the scroll reveals.
// Without it the content renders plainly rather than invisibly.
document.documentElement.classList.add('js')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>,
)
