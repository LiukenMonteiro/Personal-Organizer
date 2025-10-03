import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function Reading({ password }) {
  const [books, setBooks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showBookForm, setShowBookForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', total_pages: '', type: 'book' });
  const [newCourse, setNewCourse] = useState({ title: '', total_lessons: '' });

  useEffect(() => {
    loadBooks();
    loadCourses();
  }, []);

  const loadBooks = async () => {
    const res = await fetch(`${API_URL}/books`, { headers: { password } });
    setBooks(await res.json());
  };

  const loadCourses = async () => {
    const res = await fetch(`${API_URL}/courses`, { headers: { password } });
    setCourses(await res.json());
  };

  const addBook = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', password },
      body: JSON.stringify(newBook)
    });
    setNewBook({ title: '', total_pages: '', type: 'book' });
    setShowBookForm(false);
    loadBooks();
  };

  const addCourse = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', password },
      body: JSON.stringify(newCourse)
    });
    setNewCourse({ title: '', total_lessons: '' });
    setShowCourseForm(false);
    loadCourses();
  };

  const updateBookProgress = async (id, currentPage) => {
    await fetch(`${API_URL}/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', password },
      body: JSON.stringify({ current_page: currentPage })
    });
    loadBooks();
  };

  const updateCourseProgress = async (id, currentLesson) => {
    await fetch(`${API_URL}/courses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', password },
      body: JSON.stringify({ current_lesson: currentLesson })
    });
    loadCourses();
  };

  const deleteBook = async (id) => {
    if (window.confirm('Remover este item?')) {
      await fetch(`${API_URL}/books/${id}`, {
        method: 'DELETE',
        headers: { password }
      });
      loadBooks();
    }
  };

  const deleteCourse = async (id) => {
    if (window.confirm('Remover este curso?')) {
      await fetch(`${API_URL}/courses/${id}`, {
        method: 'DELETE',
        headers: { password }
      });
      loadCourses();
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>📚 Livros e Mangás</h3>
          <button className="btn btn-primary" onClick={() => setShowBookForm(!showBookForm)}>
            + Adicionar
          </button>
        </div>

        {showBookForm && (
          <form onSubmit={addBook} style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Título"
              value={newBook.title}
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              required
            />
            <div className="form-row">
              <input
                type="number"
                placeholder="Total de páginas/capítulos"
                value={newBook.total_pages}
                onChange={(e) => setNewBook({ ...newBook, total_pages: e.target.value })}
                required
              />
              <select 
                value={newBook.type}
                onChange={(e) => setNewBook({ ...newBook, type: e.target.value })}
              >
                <option value="book">Livro</option>
                <option value="manga">Mangá</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </form>
        )}

        <div className="grid">
          {books.map(book => (
            <div key={book.id} className="item">
              <div className="item-header">
                <h4>{book.title}</h4>
                <button className="btn btn-danger" onClick={() => deleteBook(book.id)}>
                  🗑️
                </button>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(book.current_page / book.total_pages) * 100}%` }}
                />
              </div>
              <div style={{ marginTop: '10px' }}>
                <input
                  type="number"
                  value={book.current_page}
                  onChange={(e) => updateBookProgress(book.id, parseInt(e.target.value))}
                  min="0"
                  max={book.total_pages}
                  style={{ width: '80px', marginRight: '5px' }}
                />
                <span>/ {book.total_pages} {book.type === 'manga' ? 'caps' : 'págs'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>🎥 Cursos</h3>
          <button className="btn btn-primary" onClick={() => setShowCourseForm(!showCourseForm)}>
            + Adicionar
          </button>
        </div>

        {showCourseForm && (
          <form onSubmit={addCourse} style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Nome do curso"
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Total de aulas"
              value={newCourse.total_lessons}
              onChange={(e) => setNewCourse({ ...newCourse, total_lessons: e.target.value })}
              required
            />
            <button type="submit" className="btn btn-primary">Salvar</button>
          </form>
        )}

        <div className="grid">
          {courses.map(course => (
            <div key={course.id} className="item">
              <div className="item-header">
                <h4>{course.title}</h4>
                <button className="btn btn-danger" onClick={() => deleteCourse(course.id)}>
                  🗑️
                </button>
              </div>
              <div style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Ex: Aula 5, Módulo 2"
                  value={course.current_lesson || ''}
                  onChange={(e) => updateCourseProgress(course.id, e.target.value)}
                  style={{ marginBottom: '5px' }}
                />
                <small>Total: {course.total_lessons} aulas</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Reading;