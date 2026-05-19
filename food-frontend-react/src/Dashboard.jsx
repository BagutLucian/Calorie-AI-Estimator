import React, { useState } from 'react';
import History from './History';
import Profile from './Profile';
import Stats from './Stats';

function Dashboard() {
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedFood, setSelectedFood] = useState(null);
  const [weight, setWeight] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const [currentView, setCurrentView] = useState('upload');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPredictions(null);
      setErrorMessage('');
      setSelectedFood(null);
      setWeight('');
      setSaveMessage('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    window.location.reload();
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMessage('');
    setPredictions(null);

    const token = localStorage.getItem('jwtToken');
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://localhost:8080/api/meals/analyze-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPredictions(data);
      } else {
        setErrorMessage('❌ A apărut o eroare la analiza imaginii.');
      }
    } catch (error) {
      setErrorMessage('❌ Nu mă pot conecta la server. Asigură-te că Java și Python rulează.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!weight || weight <= 0) {
      setSaveMessage('⚠️ Te rog introdu un gramaj valid.');
      return;
    }

    const token = localStorage.getItem('jwtToken');
    const parsedWeight = parseFloat(weight);

    const mealData = {
      foodName: selectedFood.food.replace('_', ' '),
      caloriesPer100g: selectedFood.calories_per_100g,
      weightInGrams: parsedWeight,
      protein: selectedFood.protein_per_100g ? (selectedFood.protein_per_100g * parsedWeight) / 100 : 0,
      carbs: selectedFood.carbs_per_100g ? (selectedFood.carbs_per_100g * parsedWeight) / 100 : 0,
      fats: selectedFood.fats_per_100g ? (selectedFood.fats_per_100g * parsedWeight) / 100 : 0
    };

    try {
      const response = await fetch('http://localhost:8080/api/meals/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(mealData)
      });

      if (response.ok) {
        setSaveMessage('✅ Masa a fost salvată cu succes în istoric!');
        setTimeout(() => {
          setCurrentView('history');
          setSaveMessage('');
          setImagePreview(null);
          setSelectedFile(null);
          setPredictions(null);
        }, 1500);
      } else {
        setSaveMessage('❌ A apărut o eroare la salvare.');
      }
    } catch (error) {
      setSaveMessage('❌ Eroare de conexiune cu serverul.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-start pt-10 min-h-screen pb-10 bg-gray-50">

      <div className="w-full max-w-2xl flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-6 border border-gray-100">
        <h2 className="text-2xl font-black text-blue-900 tracking-tight mb-4 sm:mb-0">Calorie AI 🍏</h2>

        <div className="flex space-x-4 items-center">
          <button
            onClick={() => setCurrentView('upload')}
            className={`font-bold px-4 py-2 rounded-xl transition ${currentView === 'upload' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            📷 Analiză Nouă
          </button>

          <button
            onClick={() => setCurrentView('history')}
            className={`font-bold px-4 py-2 rounded-xl transition ${currentView === 'history' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            📅 Istoric
          </button>

          <button
            onClick={() => setCurrentView('profile')}
            className={`font-bold px-4 py-2 rounded-xl transition ${currentView === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            👤 Profil
          </button>

          <button
            onClick={() => setCurrentView('stats')}
            className={`font-bold px-4 py-2 rounded-xl transition ${currentView === 'stats' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            📊 Statistici
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-bold transition px-2">
            Ieșire
          </button>
        </div>
      </div>

      {currentView === 'upload' && (
        <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-2xl text-center border border-gray-100 animate-fade-in-up">
          <h3 className="text-xl font-semibold text-gray-700 mb-6">Ce ai în farfurie astăzi?</h3>

          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer hover:bg-blue-50 transition overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} alt="Mâncarea ta" className="w-full h-full object-cover" />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <span className="text-5xl mb-3">📸</span>
                <p className="font-medium text-gray-500">Apasă pentru a alege o fotografie</p>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
          </label>

          {selectedFile && !predictions && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`mt-6 w-full text-white font-bold py-4 px-4 rounded-2xl transition shadow-md text-lg ${isAnalyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 hover:-translate-y-1'}`}
            >
              {isAnalyzing ? '⏳ Analizez cu Inteligența Artificială...' : '✨ Analizează Caloriile ✨'}
            </button>
          )}

          {errorMessage && <p className="mt-4 text-red-500 font-semibold">{errorMessage}</p>}

          {predictions && (
            <div className="mt-8 w-full">
              <h4 className="text-lg font-bold text-gray-800 mb-4 text-left flex items-center">
                <span className="mr-2">🤖</span> AI-ul crede că este:
              </h4>

              <div className="flex flex-col space-y-3">
                {predictions.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedFood(item)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                      selectedFood?.food === item.food
                        ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200 ring-offset-1'
                        : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-lg font-bold text-gray-800 capitalize">{item.food.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-medium text-gray-500">{item.calories_per_100g} kcal / 100g</p>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm text-sm font-bold text-blue-600">
                      {item.confidence_percentage}% precizie
                    </div>
                  </div>
                ))}
              </div>

              {selectedFood && (
                <div className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                  <label className="block text-left font-bold text-gray-700 mb-3 text-lg">
                    Câte grame ai mâncat?
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      placeholder="Ex: 250"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold text-xl text-gray-800 transition"
                    />
                    <span className="text-gray-500 font-bold text-lg">grame</span>
                  </div>

                  {saveMessage && (
                    <div className={`mt-4 p-3 rounded-lg font-bold text-center ${saveMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {saveMessage}
                    </div>
                  )}

                  <button
                    onClick={handleSaveMeal}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl transition shadow-md text-lg hover:-translate-y-1"
                  >
                    💾 Salvează Masa în Istoric
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {currentView === 'history' && <History />}

      {currentView === 'profile' && <Profile />}

      {currentView === 'stats' && <Stats />}

    </div>
  );
}

export default Dashboard;
