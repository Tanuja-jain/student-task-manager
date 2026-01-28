const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// GET all tasks
app.get('/api/tasks', (req, res) => {
  db.all(
    'SELECT * FROM tasks ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ADD task
app.post('/api/tasks', (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) {
    return res.status(400).json({ error: 'Task text required' });
  }

  db.run(
    'INSERT INTO tasks (text) VALUES (?)',
    [text.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.get(
        'SELECT * FROM tasks WHERE id = ?',
        [this.lastID],
        (err, row) => {
          res.status(201).json(row);
        }
      );
    }
  );
});

// EDIT task
app.put('/api/tasks/:id', (req, res) => {
  const { text } = req.body;
  const { id } = req.params;

  db.run(
    'UPDATE tasks SET text = ? WHERE id = ?',
    [text, id],
    function (err) {
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
        res.json(row);
      });
    }
  );
});

// TOGGLE completion
app.put('/api/tasks/:id/toggle', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const newStatus = task.completed ? 0 : 1;

    db.run(
      'UPDATE tasks SET completed = ? WHERE id = ?',
      [newStatus, id],
      () => {
        db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
          res.json(row);
        });
      }
    );
  });
});

// DELETE task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function () {
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Deleted' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
