import React, { useState } from 'react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const token = await response.text();
        localStorage.setItem('jwtToken', token);
        setMessage('✅ Te-ai logat cu succes!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage('❌ Nume sau parolă greșite.');
      }
    } catch (error) {
      setMessage('❌ Eroare de conexiune cu serverul Java.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Autentificare</h2>

      <form onSubmit={handleLogin} className="flex flex-col space-y-4">
        <div>
          <label className="block text-gray-600 font-medium mb-1">Nume utilizator</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-600 font-medium mb-1">Parolă</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white font-bold rounded-lg px-4 py-2 mt-4 hover:bg-blue-700 transition"
        >
          Intră în cont
        </button>
      </form>

      {message && <p className="mt-4 text-center font-semibold text-gray-700">{message}</p>}
    </div>
  );
}

export default Login;
