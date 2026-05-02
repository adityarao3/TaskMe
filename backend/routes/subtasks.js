const router       = require('express').Router();
const db           = require('../db');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// GET /api/subtasks?task_id=...
router.get('/', async (req, res) => {
  const { task_id } = req.query;
  if (!task_id) return res.status(400).json({ error: 'task_id is required' });

  try {
    const { rows } = await db.query(
      'SELECT * FROM subtasks WHERE task_id = $1 ORDER BY created_at ASC',
      [task_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/subtasks
router.post('/', async (req, res) => {
  const { task_id, title } = req.body;
  if (!task_id || !title) return res.status(400).json({ error: 'task_id and title required' });

  try {
    const { rows } = await db.query(
      'INSERT INTO subtasks(task_id, title) VALUES($1, $2) RETURNING *',
      [task_id, title]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/subtasks/:id — toggle completed
router.patch('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE subtasks SET completed = NOT completed WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Subtask not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/subtasks/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM subtasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Subtask deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
