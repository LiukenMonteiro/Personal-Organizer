import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./organizer.db');

const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// Inicializar banco de dados
async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      current_page INTEGER DEFAULT 0,
      total_pages INTEGER,
      type TEXT DEFAULT 'book',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      current_lesson TEXT,
      total_lessons INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      notes TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      exam_type TEXT DEFAULT 'AV1',
      description TEXT,
      completed BOOLEAN DEFAULT 0,
      notified_7days BOOLEAN DEFAULT 0,
      notified_1day BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Banco de dados inicializado com suporte a exam_type e completed');
}

async function fixExamsTable() {
  try {
    await run('ALTER TABLE exams ADD COLUMN exam_type TEXT DEFAULT "AV1"');
    await run('ALTER TABLE exams ADD COLUMN completed INTEGER DEFAULT 0');
    await run('ALTER TABLE exams ADD COLUMN notified_7days INTEGER DEFAULT 0');
    await run('ALTER TABLE exams ADD COLUMN notified_1day INTEGER DEFAULT 0');
    console.log('✅ Colunas de exams corrigidas');
  } catch (error) {
    console.log('⚠️ Colunas já existem ou erro:', error.message);
  }
}

initDatabase();

export { db, run, get, all };
