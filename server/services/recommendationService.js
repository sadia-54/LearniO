const prisma = require('../db');
const { generateFeedbackRecommendations } = require('./geminiService');

function startEndOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * Create AI recommendations for a user by summarizing recent performance and asking Gemini.
 * Persists results in AIRecommendations and returns the saved items.
 */
async function generateForUser(userId) {
  // Build TODAY-ONLY metrics
  const { start, end } = startEndOfToday();

  const [tasksToday, completedTodayAgg, answersToday, activeGoals] = await Promise.all([
    prisma.tasks.findMany({
      where: {
        AND: [
          { status: { in: ['complete', 'skipped'] } },
          { plan: { goal: { user_id: userId } } },
          { OR: [ { completed_at: { gte: start, lte: end } }, { plan: { date: { gte: start, lte: end } } } ] }
        ]
      },
      select: { status: true, estimated_duration: true, completed_at: true, plan: { select: { date: true } } }
    }),
    prisma.tasks.aggregate({
      _sum: { estimated_duration: true },
      where: {
        status: 'complete',
        completed_at: { gte: start, lte: end },
        plan: { goal: { user_id: userId } },
      },
    }),
    prisma.answers.findMany({
      where: { user_id: userId, answered_at: { gte: start, lte: end } },
      select: { is_correct: true }
    }),
    prisma.studyGoals.count({
      where: { user_id: userId, start_date: { lte: end }, end_date: { gte: start } }
    })
  ]);

  const completedCount = tasksToday.filter(t => t.status === 'complete').length;
  const skippedCount = tasksToday.filter(t => t.status === 'skipped').length;
  const minutesToday = completedTodayAgg._sum.estimated_duration || 0;
  const quizAttempts = answersToday.length;
  const quizCorrect = answersToday.filter(a => a.is_correct).length;
  const quizAccuracy = quizAttempts ? Math.round((quizCorrect / quizAttempts) * 100) : 0;

  const todayMetrics = {
    date: new Date().toISOString().slice(0, 10),
    overview: {
      activeGoals,
      todayTasksCompleted: completedCount,
      todayTasksSkipped: skippedCount,
      todayStudyMinutes: minutesToday,
    },
    quizzesToday: { attempts: quizAttempts, correct: quizCorrect, accuracy: quizAccuracy },
  };

  // Ask Gemini with TODAY metrics only
  const ai = await generateFeedbackRecommendations(todayMetrics);
  const items = ai.recommendations || [];

  // Persist recommendations
  const created = await Promise.all(
    items.map((r) =>
      prisma.aIRecommendations.create({
        data: {
          user_id: userId,
          recommendation_text: r.text,
          recommendation_type: r.type,
        },
      })
    )
  );
  return created;
}

/** Fetch recent recommendations for a user. */
async function listForUser(userId, limit = 20) {
  return prisma.aIRecommendations.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

module.exports = { generateForUser, listForUser };
