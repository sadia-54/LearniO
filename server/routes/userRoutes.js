const express = require('express');
const { upsertUser } = require('../controllers/userController');

const router = express.Router();

// POST /api/auth/users - upsert user (you can also remove this if you upsert inside googleAuth)
router.post('/users', async (req, res) => {
  try {
    const user = await upsertUser(req.body);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
