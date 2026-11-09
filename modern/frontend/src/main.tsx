import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './portal.css'

const root = document.getElementById('root')
if (!root) throw new Error('React root not found')
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>)
