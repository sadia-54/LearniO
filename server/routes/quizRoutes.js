const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

router.get('/quizzes/from-task/:taskId', quizController.generateFromTask);
router.post('/quizzes/:quizId/submit', quizController.submitQuiz);

module.exports = router;
