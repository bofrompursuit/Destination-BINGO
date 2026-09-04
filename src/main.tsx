import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import LandingPage from './LandingPage'
import './index.css'

function Root() {
  const [showLanding] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return !params.has('board') && !params.has('payment')
  })
  const [entered, setEntered] = useState(false)

  if (showLanding && !entered) {
    return <LandingPage onEnter={() => setEntered(true)} />
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
