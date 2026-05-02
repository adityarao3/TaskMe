const router       = require('express').Router();
const db           = require('../db');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// GET /api/comments?task_id=...
router.get('/', async (req, res) => {
  const { task_id } = req.query;
  if (!task_id) return res.status(400).json({ error: 'task_id is required' });

  try {
    const { rows } = await db.query(
      `SELECT c.*, u.name AS user_name
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [task_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/comments
router.post('/', async (req, res) => {
  const { task_id, content } = req.body;
  if (!task_id || !content) return res.status(400).json({ error: 'task_id and content required' });

  try {
    // Get project_id from task for activity log
    const task = await db.query('SELECT project_id, title FROM tasks WHERE id = $1', [task_id]);
    if (!task.rows[0]) return res.status(404).json({ error: 'Task not found' });

    const { rows } = await db.query(
      `INSERT INTO comments(task_id, user_id, content) VALUES($1, $2, $3) RETURNING *`,
      [task_id, req.user.id, content]
    );

    // Get user name
    const user = await db.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    rows[0].user_name = user.rows[0].name;

    // Log activity
    await db.query(
      `INSERT INTO activity_log(project_id, user_id, action, details) VALUES($1, $2, $3, $4)`,
      [task.rows[0].project_id, req.user.id, 'comment_added', `Commented on "${task.rows[0].title}"`]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', async (req, res) => {
  try {
    const comment = await db.query('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (!comment.rows[0]) return res.status(404).json({ error: 'Comment not found' });

    // Only comment author or project admin can delete
    if (comment.rows[0].user_id !== req.user.id) {
      const task = await db.query('SELECT project_id FROM tasks WHERE id = $1', [comment.rows[0].task_id]);
      const member = await db.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [task.rows[0].project_id, req.user.id]
      );
      if (member.rows[0]?.role !== 'admin')
        return res.status(403).json({ error: 'Permission denied' });
    }

    await db.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
