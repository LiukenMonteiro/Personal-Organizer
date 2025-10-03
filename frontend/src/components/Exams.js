import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function Exams({ password }) {
  const [exams, setExams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [newExam, setNewExam] = useState({ 
    subject: '', 
    dates: [{ date: '', type: 'AV1', description: '' }]
  });

  useEffect(() => {
    if (password) loadExams();
  }, [password]);

  const loadExams = async () => {
    try {
      const res = await fetch(`${API_URL}/exams`, {
        headers: { 'password': password }
      });
      const data = await res.json();
      console.log('Exams carregados:', data);
      setExams(data);
    } catch (error) {
      console.error('Erro ao carregar exames:', error);
    }
  };

  const addDateField = () => {
    setNewExam({
      ...newExam,
      dates: [...newExam.dates, { date: '', type: 'AV2', description: '' }]
    });
  };

  const removeDateField = (index) => {
    const newDates = newExam.dates.filter((_, i) => i !== index);
    setNewExam({ ...newExam, dates: newDates });
  };

  const updateDateField = (index, field, value) => {
    const newDates = [...newExam.dates];
    newDates[index][field] = value;
    setNewExam({ ...newExam, dates: newDates });
  };

  const addExam = async (e) => {
    e.preventDefault();

    for (const dateInfo of newExam.dates) {
      if (!dateInfo.date) continue;

      try {
        const response = await fetch(`${API_URL}/exams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'password': password },
          body: JSON.stringify({
            subject: newExam.subject,
            exam_date: dateInfo.date,
            exam_type: dateInfo.type,
            description: dateInfo.description
          })
        });
        const result = await response.json();
        console.log('Prova salva:', result);
      } catch (error) {
        console.error('Erro ao salvar prova:', error);
      }
    }

    setNewExam({ subject: '', dates: [{ date: '', type: 'AV1', description: '' }] });
    setShowForm(false);
    loadExams();
  };

  const startEdit = (exam) => {
    setEditingExam({
      id: exam.id,
      subject: exam.subject,
      exam_date: exam.exam_date,
      exam_type: exam.exam_type || 'AV1',
      description: exam.description || ''
    });
  };

  const cancelEdit = () => setEditingExam(null);

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/exams/${editingExam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'password': password },
        body: JSON.stringify(editingExam)
      });
      setEditingExam(null);
      loadExams();
    } catch (error) {
      console.error('Erro ao atualizar prova:', error);
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    const completed = currentStatus ? 0 : 1;
    try {
      const res = await fetch(`${API_URL}/exams/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', password },
        body: JSON.stringify({ completed })
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Erro ao marcar prova:', err);
      } else {
        await loadExams();
      }
    } catch (error) {
      console.error('Erro de rede:', error);
    }
  };

  const deleteExam = async (id, subject, type) => {
    if (!window.confirm(`Remover ${type} de ${subject}?`)) return;
    try {
      await fetch(`${API_URL}/exams/${id}`, { method: 'DELETE', headers: { 'password': password } });
      loadExams();
    } catch (error) {
      console.error('Erro ao deletar prova:', error);
    }
  };

  const getDaysUntil = (dateStr) => {
    const today = new Date();
    const examDate = new Date(dateStr);
    const diffTime = examDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Agrupar exames por matéria
  const groupedExams = exams.reduce((acc, exam) => {
    if (!acc[exam.subject]) acc[exam.subject] = [];
    acc[exam.subject].push(exam);
    return acc;
  }, {});

  // Ordenar dentro de cada matéria
  Object.keys(groupedExams).forEach(subject => {
    const notCompleted = groupedExams[subject]
      .filter(e => !e.completed)
      .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

    const completed = groupedExams[subject]
      .filter(e => e.completed)
      .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));

    groupedExams[subject] = [...notCompleted, ...completed];
  });

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>🎓 Próximas Provas</h3>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            + Adicionar Matéria
          </button>
        </div>

        {showForm && (
          <form onSubmit={addExam} style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Nome da Matéria"
              value={newExam.subject}
              onChange={e => setNewExam({ ...newExam, subject: e.target.value })}
              required
            />
            <div style={{ marginTop: '10px', marginBottom: '15px' }}>
              <strong>Datas de Avaliação:</strong>
            </div>
            {newExam.dates.map((dateInfo, index) => (
              <div key={index} style={{ background: 'var(--bg-primary)', padding: '15px', borderRadius: '8px', marginBottom: '10px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>Avaliação {index + 1}</strong>
                  {newExam.dates.length > 1 && (
                    <button type="button" className="btn btn-danger" onClick={() => removeDateField(index)} style={{ padding: '6px 12px', fontSize: '12px' }}>✕ Remover</button>
                  )}
                </div>
                <div className="form-row">
                  <select value={dateInfo.type} onChange={e => updateDateField(index, 'type', e.target.value)} style={{ flex: '0 0 120px' }}>
                    <option value="AV1">AV1</option>
                    <option value="AV2">AV2</option>
                    <option value="AV3">AV3</option>
                    <option value="Trabalho">Trabalho</option>
                    <option value="Projeto">Projeto</option>
                    <option value="Apresentação">Apresentação</option>
                    <option value="Outro">Outro</option>
                  </select>
                  <input type="date" value={dateInfo.date} onChange={e => updateDateField(index, 'date', e.target.value)} required />
                </div>
                <textarea placeholder="Descrição (opcional)" value={dateInfo.description} onChange={e => updateDateField(index, 'description', e.target.value)} rows="2" />
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addDateField} style={{ marginBottom: '15px', width: '100%' }}>
              + Adicionar Outra Data
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar Matéria</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancelar</button>
            </div>
          </form>
        )}

        {Object.keys(groupedExams).length === 0 ? <p>Nenhuma prova agendada</p> : (
          Object.keys(groupedExams).map(subject => (
            <div key={subject} className="item" style={{ marginBottom: '15px' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--accent)' }}>{subject}</h4>
              {groupedExams[subject].map(exam => {
                const daysUntil = getDaysUntil(exam.exam_date);
                if (editingExam && editingExam.id === exam.id) {
                  return (
                    <form key={exam.id} onSubmit={saveEdit} style={{ padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '10px', border: '2px solid var(--accent)' }}>
                      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: 'var(--accent)' }}>✏️ Editando Prova</div>
                      <input type="text" value={editingExam.subject} onChange={e => setEditingExam({...editingExam, subject: e.target.value})} placeholder="Nome da matéria" required />
                      <div className="form-row">
                        <select value={editingExam.exam_type} onChange={e => setEditingExam({...editingExam, exam_type: e.target.value})}>
                          <option value="AV1">AV1</option>
                          <option value="AV2">AV2</option>
                          <option value="AV3">AV3</option>
                          <option value="Trabalho">Trabalho</option>
                          <option value="Projeto">Projeto</option>
                          <option value="Apresentação">Apresentação</option>
                          <option value="Outro">Outro</option>
                        </select>
                        <input type="date" value={editingExam.exam_date} onChange={e => setEditingExam({...editingExam, exam_date: e.target.value})} required />
                      </div>
                      <textarea value={editingExam.description} onChange={e => setEditingExam({...editingExam, description: e.target.value})} placeholder="Descrição" rows="2" />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>💾 Salvar</button>
                        <button type="button" className="btn btn-secondary" onClick={cancelEdit} style={{ flex: 1 }}>✕ Cancelar</button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div key={exam.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px', background: exam.completed ? 'var(--success)' : 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '10px', gap: '10px', opacity: exam.completed ? 0.6 : 1 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                          <input type="checkbox" checked={exam.completed || false} onChange={() => toggleComplete(exam.id, exam.completed)} style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }} />
                          <span style={{ fontSize: '14px', color: exam.completed ? 'white' : 'var(--text-primary)' }}>{exam.completed ? 'Concluída' : 'Pendente'}</span>
                        </label>
                        <span style={{ padding: '4px 10px', background: exam.completed ? 'rgba(255,255,255,0.3)' : 'var(--accent)', color: 'white', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>{exam.exam_type || 'AV1'}</span>
                        <span style={{ fontWeight: '500', color: exam.completed ? 'white' : 'var(--text-primary)', textDecoration: exam.completed ? 'line-through' : 'none' }}>📅 {new Date(exam.exam_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {!exam.completed && (
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          {daysUntil === 0 && '🔴 HOJE!'}
                          {daysUntil === 1 && '🟠 AMANHÃ!'}
                          {daysUntil > 1 && `⏰ em ${daysUntil} dias`}
                          {daysUntil < 0 && `⚠️ Atrasada (${Math.abs(daysUntil)} dias)`}
                        </div>
                      )}
                      {exam.description && <small style={{ display: 'block', marginTop: '6px', color: exam.completed ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>{exam.description}</small>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                      <button className="btn btn-secondary" onClick={() => startEdit(exam)} style={{ padding: '8px 12px', fontSize: '14px', minHeight: '36px' }}>✏️</button>
                      <button className="btn btn-danger" onClick={() => deleteExam(exam.id, exam.subject, exam.exam_type)} style={{ minHeight: '36px' }}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Exams;
