import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Se há um token OAuth chegando pela URL, o app-params.js vai salvar e recarregar.
// Não renderiza nada ainda para evitar que chunks JS sejam baixados sem autenticação.
const urlParams = new URLSearchParams(window.location.search);
const incomingToken = urlParams.get('access_token') || urlParams.get('_b44_token');
if (!incomingToken) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  );
}