import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function Dashboard({ password }) {
  const [books, setBooks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [weekHabits, setWeekHabits] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const headers = { password };
      
      const [booksRes, coursesRes, examsRes, habitsRes] = await Promise.all([
        fetch(`${API_URL}/books`, { headers }),
        fetch(`${API_URL}/courses`, { headers }),
        fetch(`${API_URL}/exams`, { headers }),
        fetch(`${API_URL}/habits/stats?period=week`, { headers })
      ]);

      setBooks(await booksRes.json());
      setCourses(await coursesRes.json());
      setExams(await examsRes.json());
      const habitsData = await habitsRes.json();
      setWeekHabits(habitsData.total);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const upcomingExams = exams
    .filter(exam => new Date(exam.exam_date) >= new Date())
    .slice(0, 3);

  const inProgressBooks = books.filter(book => 
    book.current_page > 0 && book.current_page < book.total_pages
  );

  return (
    <div>
      <div className="stats">
        <div className="stat-card">
          <div>📚 Livros em Progresso</div>
          <div className="stat-value">{inProgressBooks.length}</div>
        </div>
        <div className="stat-card">
          <div>🎓 Próximas Provas</div>
          <div className="stat-value">{upcomingExams.length}</div>
        </div>
        <div className="stat-card">
          <div>💪 Exercícios (7 dias)</div>
          <div className="stat-value">{weekHabits}</div>
        </div>
      </div>

      <div className="card">
        <h3>📖 Leituras Recentes</h3>
        {inProgressBooks.length === 0 ? (
          <p>Nenhum livro em progresso</p>
        ) : (
          <div className="grid">
            {inProgressBooks.slice(0, 3).map(book => (
              <div key={book.id} className="item">
                <h4>{book.title}</h4>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(book.current_page / book.total_pages) * 100}%` }}
                  />
                </div>
                <small>{book.current_page} / {book.total_pages} {book.type === 'manga' ? 'caps' : 'págs'}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>🎓 Próximas Provas</h3>
        {upcomingExams.length === 0 ? (
          <p>Nenhuma prova agendada</p>
        ) : (
          <div>
            {upcomingExams.map(exam => (
              <div key={exam.id} className="item" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h4>{exam.subject}</h4>
                    <small>{new Date(exam.exam_date).toLocaleDateString('pt-BR')}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;