import React, { useState, useEffect } from 'react';

function History() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userGoal, setUserGoal] = useState(2000);

  // --- LOGICA CALENDAR ---
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState(getTodayString());

  // --- STARE MODAL & FORMULAR ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); 
  const [formData, setFormData] = useState({
    id: null,
    foodName: '',
    caloriesPer100g: '',
    weightInGrams: '',
    protein: '',
    carbs: '',
    fats: ''
  });

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    const token = localStorage.getItem('jwtToken');
    setLoading(true);
    try {
      // 1. Fetch Istoric pentru data selectată
      const historyRes = await fetch(`http://localhost:8080/api/meals/my-history?date=${currentDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setMeals(historyData);
      }

      // 2. Fetch Profil pentru obiectivul de calorii
      const profileRes = await fetch('http://localhost:8080/api/profile/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.dailyCalorieGoal) setUserGoal(profileData.dailyCalorieGoal);
      }
    } catch (err) {
      setError('❌ Eroare de conexiune cu serverul.');
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (daysToAdd) => {
    const dateObj = new Date(currentDate);
    dateObj.setDate(dateObj.getDate() + daysToAdd);
    setCurrentDate(dateObj.toISOString().split('T')[0]);
  };

  const displayDate = () => {
    if (currentDate === getTodayString()) return "Astăzi";
    const dateObj = new Date(currentDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (currentDate === yesterday.toISOString().split('T')[0]) return "Ieri";
    return dateObj.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Ești sigur că vrei să ștergi această masă?")) return;
    const token = localStorage.getItem('jwtToken');
    try {
      const response = await fetch(`http://localhost:8080/api/meals/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) loadData();
    } catch (err) { alert("Eroare de conexiune."); }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: null, foodName: '', caloriesPer100g: '', weightInGrams: '', protein: '', carbs: '', fats: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (meal) => {
    setModalMode('edit');
    setFormData({
      id: meal.id,
      foodName: meal.foodName,
      caloriesPer100g: meal.caloriesPer100g,
      weightInGrams: meal.weightInGrams,
      protein: meal.protein || '',
      carbs: meal.carbs || '',
      fats: meal.fats || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');
    
    // --- MEAL PAYLOAD COMPLET ---
    const mealPayload = {
      foodName: formData.foodName,
      caloriesPer100g: parseFloat(formData.caloriesPer100g),
      weightInGrams: parseFloat(formData.weightInGrams),
      protein: parseFloat(formData.protein) || 0,
      carbs: parseFloat(formData.carbs) || 0,
      fats: parseFloat(formData.fats) || 0,
      date: currentDate 
    };

    const url = modalMode === 'add' ? 'http://localhost:8080/api/meals/save' : `http://localhost:8080/api/meals/edit/${formData.id}`;
    const method = modalMode === 'add' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(mealPayload)
      });
      if (response.ok) {
        setIsModalOpen(false);
        loadData(); 
      }
    } catch (err) { alert("Eroare de conexiune."); }
  };

  // Calcule Totale
  const totalCalories = meals.reduce((acc, m) => acc + m.totalCalories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const totalFats = meals.reduce((acc, m) => acc + (m.fats || 0), 0);

  const percentage = Math.min((totalCalories / userGoal) * 100, 100);

  if (loading && meals.length === 0) return <div className="text-center mt-10 font-bold text-gray-500 text-xl animate-pulse">⏳ Se încarcă jurnalul...</div>;

  return (
    <div className="w-full max-w-2xl mt-8 animate-fade-in-up">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
        
        {/* NAVIGATOR CALENDAR */}
        <div className="flex justify-between items-center mb-6 bg-blue-50 p-3 rounded-2xl border border-blue-100">
          <button onClick={() => changeDate(-1)} className="p-2 bg-white rounded-xl shadow-sm hover:bg-blue-100 transition text-xl px-4">◀</button>
          <h3 className="text-xl font-black text-blue-900 flex items-center capitalize">📅 {displayDate()}</h3>
          <button onClick={() => changeDate(1)} disabled={currentDate === getTodayString()} className={`p-2 rounded-xl text-xl px-4 transition ${currentDate === getTodayString() ? 'text-gray-300' : 'bg-white shadow-sm hover:bg-blue-100'}`}>▶</button>
        </div>

        <button onClick={openAddModal} className="w-full mb-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-2xl transition shadow-md">+ Adaugă Masă Manual</button>

        {/* BARA DE PROGRES CALORII */}
        <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase">Energie Zilnică</p>
              <p className="text-3xl font-black text-gray-800">{Math.round(totalCalories)} <span className="text-lg text-gray-400 font-medium">/ {userGoal} kcal</span></p>
            </div>
            <div className={`font-bold text-lg ${totalCalories > userGoal ? 'text-red-500' : 'text-blue-500'}`}>{((totalCalories / userGoal) * 100).toFixed(1)}%</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div className={`h-4 rounded-full transition-all duration-1000 ${totalCalories > userGoal ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${percentage}%` }}></div>
          </div>

          {/* SUMAR MACROS */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Proteine</p>
              <p className="font-black text-red-500">{totalProtein.toFixed(1)}g</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Carbo</p>
              <p className="font-black text-blue-500">{totalCarbs.toFixed(1)}g</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Grăsimi</p>
              <p className="font-black text-yellow-500">{totalFats.toFixed(1)}g</p>
            </div>
          </div>
        </div>
        
        {/* LISTA MESE */}
        <div className="space-y-4">
          {meals.length === 0 ? (
            <p className="text-center text-gray-400 py-10 italic">Nicio masă salvată pentru această zi.</p>
          ) : (
            meals.map((meal) => (
              <div key={meal.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center hover:shadow-md transition group">
                <div className="text-left flex-1">
                  <p className="text-lg font-bold text-gray-800 capitalize">{meal.foodName}</p>
                  <p className="text-xs text-gray-500 font-medium">{meal.weightInGrams}g • P: {meal.protein}g | C: {meal.carbs}g | G: {meal.fats}g</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 text-blue-700 font-black px-3 py-1 rounded-xl text-sm">{Math.round(meal.totalCalories)} kcal</div>
                  <button onClick={() => openEditModal(meal)} className="p-2 text-gray-400 hover:text-yellow-600 transition">✏️</button>
                  <button onClick={() => handleDelete(meal.id)} className="p-2 text-gray-400 hover:text-red-600 transition">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL ADĂUGARE / EDITARE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-fade-in">
            <h3 className="text-2xl font-black text-gray-800 mb-6 text-center">{modalMode === 'add' ? '🍏 Masă Nouă' : '✏️ Editează Masa'}</h3>
            <form onSubmit={handleSubmitModal} className="space-y-4 text-left">
              <div>
                <label className="block text-gray-600 font-bold mb-1 ml-1 text-sm">Nume Aliment</label>
                <input type="text" required value={formData.foodName} onChange={(e) => setFormData({...formData, foodName: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-bold mb-1 ml-1 text-sm">Kcal / 100g</label>
                  <input type="number" required value={formData.caloriesPer100g} onChange={(e) => setFormData({...formData, caloriesPer100g: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1 ml-1 text-sm">Gramaj (g)</label>
                  <input type="number" required value={formData.weightInGrams} onChange={(e) => setFormData({...formData, weightInGrams: e.target.value})} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition" />
                </div>
              </div>

              {/* MACRONUTRIENȚI IN MODAL */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-red-600 font-bold mb-1 text-[10px] uppercase text-center">Proteine</label>
                  <input type="number" step="0.1" value={formData.protein} onChange={(e) => setFormData({...formData, protein: e.target.value})} className="w-full border-2 border-red-50 border-red-100 rounded-xl px-2 py-2 text-center focus:border-red-400 outline-none" placeholder="g" />
                </div>
                <div>
                  <label className="block text-blue-600 font-bold mb-1 text-[10px] uppercase text-center">Carbo</label>
                  <input type="number" step="0.1" value={formData.carbs} onChange={(e) => setFormData({...formData, carbs: e.target.value})} className="w-full border-2 border-blue-50 border-blue-100 rounded-xl px-2 py-2 text-center focus:border-blue-400 outline-none" placeholder="g" />
                </div>
                <div>
                  <label className="block text-yellow-600 font-bold mb-1 text-[10px] uppercase text-center">Grăsimi</label>
                  <input type="number" step="0.1" value={formData.fats} onChange={(e) => setFormData({...formData, fats: e.target.value})} className="w-full border-2 border-yellow-50 border-yellow-100 rounded-xl px-2 py-2 text-center focus:border-yellow-400 outline-none" placeholder="g" />
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 font-bold py-3 rounded-xl hover:bg-gray-200 transition">Închide</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg">Salvează</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;