import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./movies.db');

db.run(`
  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_input TEXT,
    recommended_movies TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function saveData(input, movies) {
  db.run(
    `INSERT INTO recommendations (user_input, recommended_movies)
     VALUES (?, ?)`,
    [input, movies]
  );
}
