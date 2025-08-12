const express = require('express');
const { upsertUser } = require('../controllers/userController');

const router = express.Router();

// Upsert user from NextAuth callback
router.post('/users', upsertUser);

module.exports = router;
