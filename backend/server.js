import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { run, get, all } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configurar transporte de e-mail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Middleware de autenticação simples
const authenticate = async (req, res, next) => {
  const { password } = req.headers;
  if (!password) return res.status(401).json({ error: 'Senha necessária' });

  const isValid = await bcrypt.compare(password, process.env.PASSWORD_HASH);
  if (!isValid) return res.status(401).json({ error: 'Senha inválida' });

  next();
};

// ================== ROTAS DE LIVROS ==================
app.get('/api/books', authenticate, async (req, res) => {
  try {
    const books = await all('SELECT * FROM books ORDER BY created_at DESC');
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/books', authenticate, async (req, res) => {
  try {
    const { title, current_page, total_pages, type } = req.body;
    const result = await run(
      'INSERT INTO books (title, current_page, total_pages, type) VALUES (?, ?, ?, ?)',
      [title, current_page || 0, total_pages, type || 'book']
    );
    res.json({ id: result.lastID, message: 'Livro adicionado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/books/:id', authenticate, async (req, res) => {
  try {
    const { current_page } = req.body;
    await run('UPDATE books SET current_page = ? WHERE id = ?', [current_page, req.params.id]);
    res.json({ message: 'Progresso atualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/books/:id', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ message: 'Livro removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== ROTAS DE CURSOS ==================
app.get('/api/courses', authenticate, async (req, res) => {
  try {
    const courses = await all('SELECT * FROM courses ORDER BY created_at DESC');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/courses', authenticate, async (req, res) => {
  try {
    const { title, current_lesson, total_lessons } = req.body;
    const result = await run(
      'INSERT INTO courses (title, current_lesson, total_lessons) VALUES (?, ?, ?)',
      [title, current_lesson || '', total_lessons]
    );
    res.json({ id: result.lastID, message: 'Curso adicionado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/courses/:id', authenticate, async (req, res) => {
  try {
    const { current_lesson } = req.body;
    await run('UPDATE courses SET current_lesson = ? WHERE id = ?', [current_lesson, req.params.id]);
    res.json({ message: 'Progresso atualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/courses/:id', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Curso removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== ROTAS DE HÁBITOS ==================
app.get('/api/habits', authenticate, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = 'SELECT * FROM habits';
    const params = [];
    
    if (start_date && end_date) {
      query += ' WHERE date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    query += ' ORDER BY date DESC';
    const habits = await all(query, params);
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/habits', authenticate, async (req, res) => {
  try {
    const { date, completed, notes } = req.body;
    const existing = await get('SELECT * FROM habits WHERE date = ?', [date]);
    
    if (existing) {
      await run('UPDATE habits SET completed = ?, notes = ? WHERE date = ?', [completed, notes, date]);
      res.json({ message: 'Hábito atualizado' });
    } else {
      await run('INSERT INTO habits (date, completed, notes) VALUES (?, ?, ?)', [date, completed, notes]);
      res.json({ message: 'Hábito registrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/habits/stats', authenticate, async (req, res) => {
  try {
    const { period } = req.query;
    const today = new Date();
    let startDate;
    
    if (period === 'week') startDate = new Date(today.setDate(today.getDate() - 7));
    else startDate = new Date(today.setDate(today.getDate() - 30));
    
    const habits = await all(
      'SELECT * FROM habits WHERE date >= ? AND completed = 1',
      [startDate.toISOString().split('T')[0]]
    );
    
    res.json({ total: habits.length, period });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== ROTAS DE PROVAS ==================
app.get('/api/exams', authenticate, async (req, res) => {
  try {
    const exams = await all('SELECT * FROM exams ORDER BY exam_date ASC');
    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/exams', authenticate, async (req, res) => {
  try {
    const { subject, exam_date, description, exam_type } = req.body;
    const result = await run(
      'INSERT INTO exams (subject, exam_date, description, exam_type, completed, notified_7days, notified_1day) VALUES (?, ?, ?, ?, 0, 0, 0)',
      [subject, exam_date, description || '', exam_type || 'AV1']
    );
    res.json({ id: result.lastID, message: 'Prova adicionada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/exams/:id', authenticate, async (req, res) => {
  try {
    const { subject, exam_date, exam_type, description } = req.body;
    await run(
      'UPDATE exams SET subject = ?, exam_date = ?, exam_type = ?, description = ? WHERE id = ?',
      [subject, exam_date, exam_type || 'AV1', description || '', req.params.id]
    );
    res.json({ message: 'Prova atualizada' });
  } catch (error) {
    console.error('Erro PUT /exams/:id', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/exams/:id/complete', authenticate, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { completed } = req.body;

    console.log('PATCH /exams/:id/complete', { id, completed });

    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    if (completed === undefined) return res.status(400).json({ error: 'completed é obrigatório' });

    const comp = completed ? 1 : 0;
    await run('UPDATE exams SET completed = ? WHERE id = ?', [comp, id]);

    res.json({ message: `Prova marcada como ${comp ? 'concluída' : 'pendente'}` });
  } catch (error) {
    console.error('Erro PATCH /exams/:id/complete', error);
    res.status(500).json({ error: error.message });
  }
});



app.delete('/api/exams/:id', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM exams WHERE id = ?', [req.params.id]);
    res.json({ message: 'Prova removida' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== ROTAS DE LINKS ==================
app.get('/api/links', authenticate, async (req, res) => {
  try {
    const { search, tags } = req.query;
    let query = 'SELECT * FROM links';
    const params = [];
    
    if (search) {
      query += ' WHERE title LIKE ? OR url LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (tags) {
      query += search ? ' AND' : ' WHERE';
      query += ' tags LIKE ?';
      params.push(`%${tags}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    const links = await all(query, params);
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/links', authenticate, async (req, res) => {
  try {
    const { title, url, tags } = req.body;
    const result = await run(
      'INSERT INTO links (title, url, tags) VALUES (?, ?, ?)',
      [title, url, tags]
    );
    res.json({ id: result.lastID, message: 'Link salvo' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/links/:id', authenticate, async (req, res) => {
  try {
    await run('DELETE FROM links WHERE id = ?', [req.params.id]);
    res.json({ message: 'Link removido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== EXPORTAR/IMPORTAR ==================
app.get('/api/export', authenticate, async (req, res) => {
  try {
    const data = {
      books: await all('SELECT * FROM books'),
      courses: await all('SELECT * FROM courses'),
      habits: await all('SELECT * FROM habits'),
      exams: await all('SELECT * FROM exams'),
      links: await all('SELECT * FROM links'),
      exported_at: new Date().toISOString()
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/import', authenticate, async (req, res) => {
  try {
    const { data } = req.body;
    for (const book of data.books || []) {
      await run(
        'INSERT INTO books (title, current_page, total_pages, type) VALUES (?, ?, ?, ?)',
        [book.title, book.current_page, book.total_pages, book.type]
      );
    }
    res.json({ message: 'Dados importados com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== CRON JOB ==================
cron.schedule('0 9 * * *', async () => {
  console.log('🔔 Verificando provas próximas...');
  
  try {
    const today = new Date();
    const in7days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const exams = await all('SELECT * FROM exams WHERE exam_date >= ?', [today.toISOString().split('T')[0]]);
    
    for (const exam of exams) {
      const examDate = new Date(exam.exam_date);
      
      if (!exam.notified_7days && examDate <= in7days && examDate > tomorrow) {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.EMAIL_TO,
          subject: `🎓 Prova de ${exam.subject} em 7 dias`,
          text: `Lembrete: Você tem prova de ${exam.subject} no dia ${exam.exam_date}.\n\n${exam.description || ''}`
        });
        await run('UPDATE exams SET notified_7days = 1 WHERE id = ?', [exam.id]);
        console.log(`📧 E-mail enviado para prova de ${exam.subject} (7 dias)`);
      }
      
      if (!exam.notified_1day && examDate <= tomorrow && examDate >= today) {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.EMAIL_TO,
          subject: `🚨 Prova de ${exam.subject} AMANHÃ`,
          text: `Atenção! Sua prova de ${exam.subject} é amanhã (${exam.exam_date}).\n\n${exam.description || ''}`
        });
        await run('UPDATE exams SET notified_1day = 1 WHERE id = ?', [exam.id]);
        console.log(`📧 E-mail enviado para prova de ${exam.subject} (1 dia)`);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao verificar provas:', error);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
