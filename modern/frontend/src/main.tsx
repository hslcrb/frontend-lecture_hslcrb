import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './tokens.css'
import './original-css/reset.css'
import './original-css/tokens.css'
import './original-css/base.css'
import './original-css/layout.css'
import './original-css/components.css'
import './original-css/quiz.css'
import './original-css/demos.css'
import './original-css/quiz-unified.css'
import './original-css/ai-learning.css'
import './original-css/gestalt-common.css'
import './original-css/gestalt-theory-demos.css'
import './original-css/gestalt-quiz-demos.css'
import './portal.css'

const root = document.getElementById('root')
if (!root) throw new Error('React root not found')
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>)
