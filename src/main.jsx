import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// app-params.js (importado via App.jsx → api/base44Client.js) já intercepta tokens
// na URL, salva no localStorage e faz window.location.reload() automaticamente.
// Não é necessário bloquear a renderização aqui — isso causava tela em branco.
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);