const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/chatController');

// POST /api/users/:userId/chat
router.post('/users/:userId/chat', chatWithAI);

module.exports = router;
