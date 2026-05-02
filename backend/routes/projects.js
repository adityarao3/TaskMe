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

// Helper: check if user is an admin of a project
async function requireAdmin(projectId, userId, res) {
  const { rows } = await db.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (!rows[0] || rows[0].role !== 'admin') {
    res.status(403).json({ error: 'Only project admins can do this' });
    return false;
  }
  return true;
}

// Helper: check if user is a member of a project (any role)
async function requireMember(projectId, userId, res) {
  const { rows } = await db.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (!rows[0]) {
    res.status(403).json({ error: 'You are not a member of this project' });
    return null;
  }
  return rows[0].role;
}

// GET /api/projects — list all projects the user belongs to
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, pm.role AS my_role,
              COUNT(DISTINCT pm2.user_id) AS member_count,
              COUNT(DISTINCT t.id) AS task_count
       FROM projects p
       JOIN project_members pm  ON pm.project_id = p.id AND pm.user_id = $1
       JOIN project_members pm2 ON pm2.project_id = p.id
       LEFT JOIN tasks t ON t.project_id = p.id
       GROUP BY p.id, pm.role
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects — create a new project
router.post('/', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'INSERT INTO projects(name, description, owner_id) VALUES($1, $2, $3) RETURNING *',
      [name, description || null, req.user.id]
    );
    const project = rows[0];

    await client.query(
      'INSERT INTO project_members(project_id, user_id, role) VALUES($1, $2, $3)',
      [project.id, req.user.id, 'admin']
    );

    await client.query('COMMIT');

    await logActivity(project.id, req.user.id, 'project_created', `Created project "${name}"`);

    res.status(201).json(project);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  } finally {
    client.release();
  }
});

// GET /api/projects/:id — project detail with members
router.get('/:id', async (req, res) => {
  try {
    const role = await requireMember(req.params.id, req.user.id, res);
    if (!role) return;

    const project = await db.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    const members = await db.query(
      `SELECT u.id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.role DESC, u.name`,
      [req.params.id]
    );

    res.json({ ...project.rows[0], my_role: role, members: members.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id — update project (admin only)
router.put('/:id', async (req, res) => {
  try {
    if (!(await requireAdmin(req.params.id, req.user.id, res))) return;
    const { name, description } = req.body;
    const { rows } = await db.query(
      'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
      [name, description, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id — delete project (admin only)
router.delete('/:id', async (req, res) => {
  try {
    if (!(await requireAdmin(req.params.id, req.user.id, res))) return;
    const project = await db.query('SELECT name FROM projects WHERE id = $1', [req.params.id]);
    await db.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id/export — CSV export (any member)
router.get('/:id/export', async (req, res) => {
  try {
    const role = await requireMember(req.params.id, req.user.id, res);
    if (!role) return;

    const project = await db.query('SELECT name FROM projects WHERE id = $1', [req.params.id]);
    const { rows } = await db.query(
      `SELECT t.title, t.description, t.status, t.priority, t.due_date, t.created_at,
              u.name AS assigned_to, creator.name AS created_by
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       LEFT JOIN users creator ON creator.id = t.created_by
       WHERE t.project_id = $1
       ORDER BY t.created_at ASC`,
      [req.params.id]
    );

    // Build CSV
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assigned To', 'Created By', 'Created At'];
    const csvRows = [headers.join(',')];
    for (const r of rows) {
      csvRows.push([
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        r.status,
        r.priority,
        r.due_date ? new Date(r.due_date).toISOString().split('T')[0] : '',
        `"${r.assigned_to || 'Unassigned'}"`,
        `"${r.created_by || ''}"`,
        new Date(r.created_at).toISOString().split('T')[0],
      ].join(','));
    }

    const projectName = (project.rows[0]?.name || 'export').replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${projectName}_tasks.csv"`);
    res.send(csvRows.join('\n'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/members — invite by email (admin only)
router.post('/:id/members', async (req, res) => {
  try {
    if (!(await requireAdmin(req.params.id, req.user.id, res))) return;
    const { email, role } = req.body;

    const user = await db.query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (!user.rows[0]) return res.status(404).json({ error: 'No user with that email' });

    await db.query(
      'INSERT INTO project_members(project_id, user_id, role) VALUES($1, $2, $3) ON CONFLICT DO NOTHING',
      [req.params.id, user.rows[0].id, role || 'member']
    );

    await logActivity(
      req.params.id, req.user.id, 'member_invited',
      `Invited ${user.rows[0].name} as ${role || 'member'}`
    );

    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:uid — remove member (admin only)
router.delete('/:id/members/:uid', async (req, res) => {
  try {
    if (!(await requireAdmin(req.params.id, req.user.id, res))) return;
    // Can't remove yourself
    if (req.params.uid === req.user.id)
      return res.status(400).json({ error: 'Cannot remove yourself' });

    await db.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.params.uid]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/projects/:id/members/:uid/role — change role (admin only)
router.patch('/:id/members/:uid/role', async (req, res) => {
  try {
    if (!(await requireAdmin(req.params.id, req.user.id, res))) return;
    const { role } = req.body;
    if (!['admin', 'member'].includes(role))
      return res.status(400).json({ error: 'Role must be admin or member' });

    await db.query(
      'UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3',
      [role, req.params.id, req.params.uid]
    );
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
