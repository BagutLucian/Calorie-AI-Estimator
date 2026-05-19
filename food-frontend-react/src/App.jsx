import React from 'react';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {

  const token = localStorage.getItem('jwtToken');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">

      {token ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;
