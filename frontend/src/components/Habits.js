import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function Habits({ password }) {
  const [habits, setHabits] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState({ week: 0, month: 0 });

  useEffect(() => {
    loadHabits();
    loadStats();
  }, [currentMonth]);

  const loadHabits = async () => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const res = await fetch(
      `${API_URL}/habits?start_date=${start.toISOString().split('T')[0]}&end_date=${end.toISOString().split('T')[0]}`,
      { headers: { password } }
    );
    
    const data = await res.json();
    const habitsMap = {};
    data.forEach(h => {
      habitsMap[h.date] = h.completed;
    });
    setHabits(habitsMap);
  };

  const loadStats = async () => {
    const [weekRes, monthRes] = await Promise.all([
      fetch(`${API_URL}/habits/stats?period=week`, { headers: { password } }),
      fetch(`${API_URL}/habits/stats?period=month`, { headers: { password } })
    ]);
    
    const weekData = await weekRes.json();
    const monthData = await monthRes.json();
    
    setStats({ week: weekData.total, month: monthData.total });
  };

  const toggleHabit = async (date) => {
    const completed = !habits[date];
    
    await fetch(`${API_URL}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', password },
      body: JSON.stringify({ date, completed, notes: '' })
    });
    
    setHabits({ ...habits, [date]: completed });
    loadStats();
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Adicionar dias vazios
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }
    
    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  return (
    <div>
      <div className="stats">
        <div className="stat-card">
          <div>Últimos 7 dias</div>
          <div className="stat-value">{stats.week}</div>
          <small>dias de exercício</small>
        </div>
        <div className="stat-card">
          <div>Últimos 30 dias</div>
          <div className="stat-value">{stats.month}</div>
          <small>dias de exercício</small>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <button className="btn btn-secondary" onClick={() => changeMonth(-1)}>
            ← Anterior
          </button>
          <h3>
            {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <button className="btn btn-secondary" onClick={() => changeMonth(1)}>
            Próximo →
          </button>
        </div>

        <div className="calendar">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: '10px' }}>
              {day}
            </div>
          ))}
          
          {getDaysInMonth().map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} />;
            }
            
            const dateStr = formatDate(date);
            const completed = habits[dateStr];
            
            return (
              <div
                key={dateStr}
                className={`calendar-day ${completed ? 'completed' : ''} ${isToday(date) ? 'today' : ''}`}
                onClick={() => toggleHabit(dateStr)}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Habits;