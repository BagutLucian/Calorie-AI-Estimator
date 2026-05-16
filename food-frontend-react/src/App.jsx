import React from 'react';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  // Verificăm dacă există un token salvat în browser
  const token = localStorage.getItem('jwtToken');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      {/* Dacă avem token, afișăm Dashboard. Dacă nu, afișăm Login */}
      {token ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;