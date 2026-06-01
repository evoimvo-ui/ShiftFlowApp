import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'

console.log('--- ShiftFlow: Inicijalizacija ---')

try {
  const rootElement = document.getElementById('root')
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    console.log('--- ShiftFlow: Render uspješan ---')
  } else {
    console.error('--- ShiftFlow: Greška - Root element nije pronađen ---')
  }
} catch (error) {
  console.error('--- ShiftFlow: Kritična greška pri pokretanju ---', error)
}
