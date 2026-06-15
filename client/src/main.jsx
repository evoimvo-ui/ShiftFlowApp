import * as Sentry from '@sentry/react';
Sentry.init({ dsn: 'https://2bcbbe47126383c214a163e5fde58af4@o4511571182485504.ingest.de.sentry.io/4511571277185104' });

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'

console.log('--- ShiftForge: Inicijalizacija ---')

try {
  const rootElement = document.getElementById('root')
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    console.log('--- ShiftForge: Render uspješan ---')
  } else {
    console.error('--- ShiftForge: Greška - Root element nije pronađen ---')
  }
} catch (error) {
  console.error('--- ShiftForge: Kritična greška pri pokretanju ---', error)
}
