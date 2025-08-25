const express = require('express');
const router = express.Router();
const { sendDailyReminder } = require('../services/reminderService');

// POST /api/users/:userId/reminders/test - sends a one-off reminder email now
router.post('/users/:userId/reminders/test', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const info = await sendDailyReminder(userId);
    res.json({ ok: true, info });
  } catch (err) { next(err); }
});

module.exports = router;
