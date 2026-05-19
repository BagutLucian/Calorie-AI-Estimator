import React, { useState, useEffect } from 'react';

function Profile() {
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'MALE',
    activityLevel: 1.2
  });

  const [calculatedGoal, setCalculatedGoal] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    calculateCalories(formData);
  }, [formData]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('jwtToken');
    try {
      const response = await fetch('http://localhost:8080/api/profile/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();

        if (data.age) {
          setFormData({
            age: data.age,
            weight: data.weight,
            height: data.height,
            gender: data.gender || 'MALE',
            activityLevel: data.activityLevel || 1.2
          });
        }
      }
    } catch (error) {
      console.error("Eroare la încărcarea profilului");
    } finally {
      setLoading(false);
    }
  };

  const calculateCalories = (data) => {
    if (!data.weight || !data.height || !data.age) {
      setCalculatedGoal(0);
      return;
    }

    let bmr = (10 * parseFloat(data.weight)) + (6.25 * parseFloat(data.height)) - (5 * parseInt(data.age));

    if (data.gender === 'MALE') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const tdee = bmr * parseFloat(data.activityLevel);
    setCalculatedGoal(Math.round(tdee));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');

    const payload = {
      ...formData,
      dailyCalorieGoal: calculatedGoal
    };

    try {
      const response = await fetch('http://localhost:8080/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSaveMessage('✅ Profil și obiectiv actualizate cu succes!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('❌ Eroare la salvare.');
      }
    } catch (error) {
      setSaveMessage('❌ Eroare de conexiune.');
    }
  };

  if (loading) return <div className="text-center mt-10 font-bold text-gray-500">⏳ Se încarcă...</div>;

  return (
    <div className="w-full max-w-2xl mt-8 animate-fade-in-up">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">

        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center border-b pb-4">
          <span className="mr-3 text-3xl">👤</span> Profilul Meu (Setare Obiectiv)
        </h3>

        <div className="flex flex-col md:flex-row gap-8">

          <form onSubmit={handleSaveProfile} className="flex-1 space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-gray-700 font-bold mb-2">Gen</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white"
                >
                  <option value="MALE">Bărbat</option>
                  <option value="FEMALE">Femeie</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 font-bold mb-2">Vârstă (ani)</label>
                <input
                  type="number" required
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-gray-700 font-bold mb-2">Greutate (kg)</label>
                <input
                  type="number" required
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 font-bold mb-2">Înălțime (cm)</label>
                <input
                  type="number" required
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Nivel de Activitate</label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({...formData, activityLevel: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white"
              >
                <option value={1.2}>Sedentar (munca de birou, fără sport)</option>
                <option value={1.375}>Ușor activ (sport 1-3 zile/săptămână)</option>
                <option value={1.55}>Moderat activ (sport 3-5 zile/săptămână)</option>
                <option value={1.725}>Foarte activ (sport intens 6-7 zile)</option>
              </select>
            </div>

            {saveMessage && (
              <div className={`p-3 rounded-lg font-bold text-center ${saveMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {saveMessage}
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-md mt-2">
              💾 Salvează Profilul
            </button>
          </form>

          <div className="flex-1 bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col justify-center items-center text-center">
            <h4 className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">Necesar Caloric Zilnic</h4>
            {calculatedGoal > 0 ? (
              <>
                <p className="text-5xl font-black text-blue-600 mb-2">{calculatedGoal}</p>
                <p className="text-gray-600 font-medium">kcal / zi pentru a-ți menține greutatea curentă.</p>
              </>
            ) : (
              <p className="text-gray-400 font-medium italic mt-4">Completează datele pentru a afla necesarul caloric.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;
