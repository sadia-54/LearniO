const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');

// GET user settings
router.get('/users/:userId/settings', getSettings);

// PUT update user settings
router.put('/users/:userId/settings', updateSettings);

module.exports = router;
