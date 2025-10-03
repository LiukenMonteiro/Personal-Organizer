import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Reading from './components/Reading';
import Habits from './components/Habits';
import Exams from './components/Exams';
import Links from './components/Links';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Estado inicial do tema (lendo do localStorage)
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme === 'dark';
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/books`, {
        headers: { password }
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('appPassword', password);
      } else {
        alert('Senha incorreta!');
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor');
    }
  };

  // Aplica o tema sempre que o darkMode mudar
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('appTheme', newTheme ? 'dark' : 'light');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    localStorage.removeItem('appPassword');
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_URL}/export`, {
        headers: { password }
      });
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      alert('Erro ao exportar dados');
    }
  };

  // Verifica senha salva
  useEffect(() => {
    const savedPassword = localStorage.getItem('appPassword');
    if (savedPassword) {
      setPassword(savedPassword);
      fetch(`${API_URL}/books`, { headers: { password: savedPassword } })
        .then(res => res.ok && setIsAuthenticated(true));
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>🔒 Organizador Pessoal</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>📚 Organizador Pessoal</h1>
          <div className="header-actions">
            <button onClick={toggleDarkMode} className="btn btn-secondary">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={handleExport} className="btn btn-secondary">
              💾 Exportar
            </button>
            <button onClick={handleLogout} className="btn btn-danger">
              🚪 Sair
            </button>
          </div>
        </div>

        <div className="nav">
          <button 
            className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            🏠 Dashboard
          </button>
          <button 
            className={`nav-button ${activeTab === 'reading' ? 'active' : ''}`}
            onClick={() => setActiveTab('reading')}
          >
            📖 Leituras
          </button>
          <button 
            className={`nav-button ${activeTab === 'habits' ? 'active' : ''}`}
            onClick={() => setActiveTab('habits')}
          >
            💪 Hábitos
          </button>
          <button 
            className={`nav-button ${activeTab === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveTab('exams')}
          >
            🎓 Provas
          </button>
          <button 
            className={`nav-button ${activeTab === 'links' ? 'active' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            🔗 Links
          </button>
        </div>

        {activeTab === 'dashboard' && <Dashboard password={password} />}
        {activeTab === 'reading' && <Reading password={password} />}
        {activeTab === 'habits' && <Habits password={password} />}
        {activeTab === 'exams' && <Exams password={password} />}
        {activeTab === 'links' && <Links password={password} />}
      </div>
    </div>
  );
}

export default App;
