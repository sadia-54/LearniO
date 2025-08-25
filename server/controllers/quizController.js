const prisma = require('../db');
const { generateQuizQuestions } = require('../services/geminiService');

// GET /api/quizzes/from-task/:taskId?count=12
exports.generateFromTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const count = Number(req.query.count) || 12;
    const task = await prisma.tasks.findUnique({ where: { task_id: taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const quiz = await generateQuizQuestions(task.title, task.description || '', count);

    // Persist quiz and questions
    const createdQuiz = await prisma.quizzes.create({
      data: { task_id: taskId, title: quiz.title, total_score: 0 },
    });
    const qCreates = quiz.questions.map((q) => ({
      quiz_id: createdQuiz.quiz_id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
    }));
    await prisma.questions.createMany({ data: qCreates });

    // Return quiz with questions
    const withQuestions = await prisma.quizzes.findUnique({
      where: { quiz_id: createdQuiz.quiz_id },
      include: { questions: true },
    });
    res.json(withQuestions);
  } catch (err) {
    next(err);
  }
};

// POST /api/quizzes/:quizId/submit { user_id, answers: [{question_id, selected_option}] }
exports.submitQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { user_id, answers } = req.body;
    if (!user_id || !Array.isArray(answers)) return res.status(400).json({ error: 'Invalid payload' });

    const qs = await prisma.questions.findMany({ where: { quiz_id: quizId } });
    const byId = new Map(qs.map((q) => [q.question_id, q]));
    let correct = 0;
    for (const a of answers) {
      const q = byId.get(a.question_id);
      const is_correct = !!q && String(a.selected_option).toUpperCase() === q.correct_option;
      if (is_correct) correct += 1;
      await prisma.answers.create({
        data: {
          question_id: a.question_id,
          user_id,
          selected_option: String(a.selected_option).toUpperCase(),
          is_correct,
        },
      });
    }

    const score = Math.round((correct / Math.max(1, qs.length)) * 100);
    await prisma.quizzes.update({ where: { quiz_id: quizId }, data: { total_score: score } });
    res.json({ score, total: qs.length, correct });
  } catch (err) {
    next(err);
  }
};
