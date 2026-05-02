const router       = require('express').Router();
const db           = require('../db');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  const uid = req.user.id;

  try {
    // All tasks across projects the user belongs to
    const { rows: tasks } = await db.query(
      `SELECT t.status, t.due_date
       FROM tasks t
       JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1`,
      [uid]
    );

    const totalTasks = tasks.length;
    const completed  = tasks.filter(t => t.status === 'done').length;
    const overdue    = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;
    const byStatus   = { todo: 0, in_progress: 0, done: 0 };
    tasks.forEach(t => byStatus[t.status]++);

    // Full overdue task details for the table
    const { rows: overdueTasks } = await db.query(
      `SELECT t.id, t.title, t.due_date, t.priority,
              p.name AS project_name,
              u.name AS assigned_to_name
       FROM tasks t
       JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.due_date < NOW() AND t.status != 'done'
       ORDER BY t.due_date ASC`,
      [uid]
    );

    // My tasks (assigned to the logged-in user)
    const { rows: myTasks } = await db.query(
      `SELECT t.*, p.name AS project_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.assigned_to = $1 AND t.status != 'done'
       ORDER BY t.due_date ASC NULLS LAST
       LIMIT 10`,
      [uid]
    );

    // Tasks per user — breakdown of task counts by team member
    const { rows: tasksByUser } = await db.query(
      `SELECT u.id, u.name,
              COUNT(t.id) AS total,
              COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS done,
              COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) AS in_progress,
              COUNT(CASE WHEN t.status = 'todo' THEN 1 END) AS todo
       FROM users u
       JOIN project_members pm ON pm.user_id = u.id
       JOIN project_members pm2 ON pm2.project_id = pm.project_id AND pm2.user_id = $1
       LEFT JOIN tasks t ON t.assigned_to = u.id AND t.project_id = pm.project_id
       GROUP BY u.id, u.name
       HAVING COUNT(t.id) > 0
       ORDER BY COUNT(t.id) DESC
       LIMIT 10`,
      [uid]
    );

    res.json({ totalTasks, completed, overdue, byStatus, overdueTasks, myTasks, tasksByUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
