import React, { useState, useEffect } from 'react';

function Stats() {
  const [weeklyData, setWeeklyData] = useState([]);
  const [userGoal, setUserGoal] = useState(2000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('jwtToken');
    setLoading(true);
    try {
      const profileRes = await fetch('http://localhost:8080/api/profile/me', { headers: { 'Authorization': `Bearer ${token}` }});
      let goal = 2000;
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.dailyCalorieGoal) goal = profileData.dailyCalorieGoal;
        setUserGoal(goal);
      }

      const historyRes = await fetch('http://localhost:8080/api/meals/my-history/week', { headers: { 'Authorization': `Bearer ${token}` }});
      if (historyRes.ok) {
        const meals = await historyRes.json();
        processWeeklyData(meals, goal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (meals, goal) => {
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];

      const dayName = d.toLocaleDateString('ro-RO', { weekday: 'short' });

      const caloriesForDay = meals
        .filter(m => m.date === dateString)
        .reduce((sum, m) => sum + m.totalCalories, 0);

      last7Days.push({
        date: dateString,
        day: dayName,
        calories: Math.round(caloriesForDay),
        percentage: Math.min((caloriesForDay / goal) * 100, 100)
      });
    }
    setWeeklyData(last7Days);
  };

  const totalWeeklyCalories = weeklyData.reduce((sum, d) => sum + d.calories, 0);
  const averageCalories = Math.round(totalWeeklyCalories / 7);
  const successfulDays = weeklyData.filter(d => d.calories > 0 && d.calories <= userGoal).length;

  if (loading) return <div className="text-center mt-10 font-bold text-gray-500 text-xl animate-pulse">⏳ Se generează graficele...</div>;

  return (
    <div className="w-full max-w-2xl mt-8 animate-fade-in-up">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">

        <h3 className="text-2xl font-black text-gray-800 mb-6 flex items-center border-b border-gray-100 pb-4">
          <span className="mr-3 text-3xl">📊</span> Evoluția ta (Ultimele 7 Zile)
        </h3>

        <div className="mt-8 bg-gray-50 p-6 rounded-3xl border border-gray-200 shadow-inner relative">

          <div className="absolute top-10 left-6 right-6 border-b-2 border-dashed border-red-300 z-0 flex justify-end">
             <span className="text-xs font-bold text-red-500 bg-gray-50 px-2 -mt-2 rounded-full border border-red-100">Obiectiv: {userGoal}</span>
          </div>

          <div className="flex justify-between items-end h-64 mt-8 relative z-10">
            {weeklyData.map((dayData, index) => (
              <div key={index} className="flex flex-col items-center flex-1 group cursor-pointer">

                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs font-bold py-1 px-2 rounded-lg mb-2 shadow-lg transform group-hover:-translate-y-1">
                  {dayData.calories} kcal
                </div>

                <div className="w-8 sm:w-12 bg-white rounded-t-xl overflow-hidden h-48 flex items-end shadow-sm border border-gray-100">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-1000 ease-out ${
                      dayData.calories > userGoal ? 'bg-red-400' :
                      dayData.calories === 0 ? 'bg-transparent' : 'bg-blue-500'
                    }`}
                    style={{ height: `${dayData.percentage}%` }}
                  ></div>
                </div>

                <p className={`mt-3 text-sm font-bold uppercase tracking-wider ${index === 6 ? 'text-blue-600 bg-blue-50 px-2 rounded-md' : 'text-gray-400'}`}>
                  {index === 6 ? 'Azi' : dayData.day}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition cursor-default">
            <p className="text-xs font-black text-blue-400 uppercase tracking-wider mb-1">Medie Zilnică</p>
            <p className="text-3xl font-black text-blue-700">
              {averageCalories} <span className="text-base font-bold text-blue-500">kcal</span>
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-green-100 bg-green-50 hover:bg-green-100 transition cursor-default">
            <p className="text-xs font-black text-green-400 uppercase tracking-wider mb-1">Zile în grafic</p>
            <p className="text-3xl font-black text-green-700">
              {successfulDays} <span className="text-base font-bold text-green-500">/ 7</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Stats;
