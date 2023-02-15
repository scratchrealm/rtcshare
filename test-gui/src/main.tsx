import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// import './index.css'

import { setChonkyDefaults } from 'chonky';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';

setChonkyDefaults({ iconComponent: ChonkyIconFA });

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
)
