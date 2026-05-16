import React from 'react';
import { AuthProvider } from './lib/AuthContext';
import Ajuda from './Ajuda';

function App() {
  return (
    <AuthProvider>
      <Ajuda />
    </AuthProvider>
  );
}

export default App;
