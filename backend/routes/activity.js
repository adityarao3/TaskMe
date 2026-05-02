const router       = require('express').Router();
const db           = require('../db');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// GET /api/activity?project_id=...
router.get('/', async (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id is required' });

  try {
    const { rows } = await db.query(
      `SELECT a.*, u.name AS user_name
       FROM activity_log a
       JOIN users u ON u.id = a.user_id
       WHERE a.project_id = $1
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [project_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
