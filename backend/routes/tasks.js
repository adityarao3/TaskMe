const router       = require('express').Router();
const db           = require('../db');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// Helper: log activity
async function logActivity(projectId, userId, action, details) {
  try {
    await db.query(
      'INSERT INTO activity_log(project_id, user_id, action, details) VALUES($1,$2,$3,$4)',
      [projectId, userId, action, details]
    );
  } catch (e) { console.error('Activity log error:', e.message); }
}

// GET /api/tasks?project_id=...&status=...&assigned_to=...&priority=...&search=...
router.get('/', async (req, res) => {
  const { project_id, status, assigned_to, priority, search } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id is required' });

  const conditions = ['t.project_id = $1'];
  const params = [project_id];
  let i = 2;

  if (status)      { conditions.push(`t.status = $${i++}`);      params.push(status); }
  if (assigned_to) { conditions.push(`t.assigned_to = $${i++}`); params.push(assigned_to); }
  if (priority)    { conditions.push(`t.priority = $${i++}`);     params.push(priority); }
  if (search)      { conditions.push(`t.title ILIKE $${i++}`);   params.push(`%${search}%`); }

  try {
    const { rows } = await db.query(
      `SELECT t.*,
              u.name AS assigned_to_name,
              creator.name AS created_by_name,
              (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id) AS subtask_count,
              (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id AND s.completed = true) AS subtask_done,
              (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) AS comment_count
       FROM tasks t
       LEFT JOIN users u       ON u.id = t.assigned_to
       LEFT JOIN users creator ON creator.id = t.created_by
       WHERE ${conditions.join(' AND ')}
       ORDER BY
         CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         t.due_date ASC NULLS LAST`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks — create a task (any project member)
router.post('/', async (req, res) => {
  const { project_id, title, description, priority, assigned_to, due_date } = req.body;
  if (!project_id || !title) return res.status(400).json({ error: 'project_id and title required' });

  try {
    const { rows } = await db.query(
      `INSERT INTO tasks(project_id, title, description, priority, assigned_to, due_date, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [project_id, title, description || null, priority || 'medium', assigned_to || null, due_date || null, req.user.id]
    );

    // Get names for response
    const task = rows[0];
    if (task.assigned_to) {
      const u = await db.query('SELECT name FROM users WHERE id = $1', [task.assigned_to]);
      task.assigned_to_name = u.rows[0]?.name || null;
    }
    const creator = await db.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    task.created_by_name = creator.rows[0]?.name || null;
    task.subtask_count = '0';
    task.subtask_done = '0';
    task.comment_count = '0';

    await logActivity(project_id, req.user.id, 'task_created', `Created task "${title}"`);

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/tasks/:id/status — update status (assignee or admin)
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['todo', 'in_progress', 'done'];
  if (!valid.includes(status))
    return res.status(400).json({ error: 'Status must be todo, in_progress, or done' });

  try {
    const task = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!task.rows[0]) return res.status(404).json({ error: 'Task not found' });

    const member = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.rows[0].project_id, req.user.id]
    );
    const isAdmin    = member.rows[0]?.role === 'admin';
    const isAssignee = task.rows[0].assigned_to === req.user.id;

    if (!isAdmin && !isAssignee)
      return res.status(403).json({ error: 'Only the assignee or an admin can change status' });

    const oldStatus = task.rows[0].status;
    const { rows } = await db.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    const statusLabels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
    await logActivity(
      task.rows[0].project_id, req.user.id, 'status_changed',
      `Moved "${task.rows[0].title}" from ${statusLabels[oldStatus]} to ${statusLabels[status]}`
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tasks/:id — full update (admin or task creator)
router.put('/:id', async (req, res) => {
  try {
    const task = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!task.rows[0]) return res.status(404).json({ error: 'Task not found' });

    const member = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.rows[0].project_id, req.user.id]
    );
    const isAdmin   = member.rows[0]?.role === 'admin';
    const isCreator = task.rows[0].created_by === req.user.id;
    if (!isAdmin && !isCreator)
      return res.status(403).json({ error: 'Permission denied' });

    const { title, description, priority, assigned_to, due_date, status } = req.body;
    const { rows } = await db.query(
      `UPDATE tasks SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         priority    = COALESCE($3, priority),
         assigned_to = $4,
         due_date    = $5,
         status      = COALESCE($6, status)
       WHERE id = $7 RETURNING *`,
      [title, description, priority, assigned_to || null, due_date || null, status, req.params.id]
    );

    // Get names for response
    if (rows[0].assigned_to) {
      const u = await db.query('SELECT name FROM users WHERE id = $1', [rows[0].assigned_to]);
      rows[0].assigned_to_name = u.rows[0]?.name || null;
    }

    await logActivity(
      task.rows[0].project_id, req.user.id, 'task_updated',
      `Updated task "${rows[0].title}"`
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id — admin only
router.delete('/:id', async (req, res) => {
  try {
    const task = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!task.rows[0]) return res.status(404).json({ error: 'Task not found' });

    const member = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.rows[0].project_id, req.user.id]
    );
    if (member.rows[0]?.role !== 'admin')
      return res.status(403).json({ error: 'Only admins can delete tasks' });

    await logActivity(
      task.rows[0].project_id, req.user.id, 'task_deleted',
      `Deleted task "${task.rows[0].title}"`
    );

    await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
