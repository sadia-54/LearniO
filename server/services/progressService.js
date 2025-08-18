const prisma = require('../db');

function toISODate(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return dt.toISOString().slice(0, 10);
}

async function getOverview(userId) {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  const [totalTasksCompleted, activeGoals, weeklySum] = await Promise.all([
    prisma.tasks.count({
      where: { status: 'complete', plan: { goal: { user_id: userId } } },
    }),
    prisma.studyGoals.count({
      where: {
        user_id: userId,
        start_date: { lte: today },
        end_date: { gte: today },
      },
    }),
    prisma.tasks.aggregate({
      _sum: { estimated_duration: true },
      where: {
        status: 'complete',
        completed_at: { gte: weekAgo },
        plan: { goal: { user_id: userId } },
      },
    }),
  ]);

  const weeklyMinutes = weeklySum._sum.estimated_duration || 0;
  return {
    totalTasksCompleted,
    activeGoals,
    weeklyStudyHours: Math.round((weeklyMinutes / 60) * 10) / 10,
  };
}

async function getMonthlyTaskCompletion(userId, months = 6) {
  const end = new Date();
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (months - 1), 1));
  const tasks = await prisma.tasks.findMany({
    where: {
      status: { in: ['complete', 'skipped'] },
      plan: {
        goal: { user_id: userId },
        date: { gte: start, lte: end },
      },
    },
    select: { status: true, plan: { select: { date: true } } },
  });

  const series = new Map();
  // Seed months to zero
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    series.set(key, { month: key, completed: 0, skipped: 0 });
  }

  for (const t of tasks) {
    const d = t.plan?.date ? new Date(t.plan.date) : new Date();
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const rec = series.get(key);
    if (!rec) continue;
    if (t.status === 'complete') rec.completed += 1;
    if (t.status === 'skipped') rec.skipped += 1;
  }

  return Array.from(series.values());
}

async function getDailyStudyTime(userId, days = 7) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const answers = await prisma.tasks.findMany({
    where: {
      status: 'complete',
      completed_at: { gte: start, lte: end },
      plan: { goal: { user_id: userId } },
    },
    select: { estimated_duration: true, completed_at: true, plan: { select: { date: true } } },
  });

  const byDay = new Map();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(end.getDate() - (days - 1 - i));
    byDay.set(toISODate(d), 0);
  }

  for (const t of answers) {
    const when = t.completed_at || t.plan?.date || new Date();
    const key = toISODate(new Date(when));
    byDay.set(key, (byDay.get(key) || 0) + (t.estimated_duration || 0));
  }

  return Array.from(byDay.entries()).map(([date, minutes]) => ({ date, minutes }));
}

async function getQuizPerformance(userId, limit = 5) {
  // Fetch user's answers and group by quiz
  const answers = await prisma.answers.findMany({
    where: { user_id: userId },
    include: {
      question: { include: { quiz: true } },
    },
  });

  const byQuiz = new Map();
  for (const a of answers) {
    const quiz = a.question.quiz;
    const qid = quiz.quiz_id;
    const rec = byQuiz.get(qid) || { quizId: qid, title: quiz.title, total: 0, correct: 0, lastDate: a.answered_at };
    rec.total += 1;
    if (a.is_correct) rec.correct += 1;
    if (!rec.lastDate || new Date(a.answered_at) > new Date(rec.lastDate)) rec.lastDate = a.answered_at;
    byQuiz.set(qid, rec);
  }

  const items = Array.from(byQuiz.values())
    .sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate))
    .slice(0, limit)
    .map((r) => ({
      quiz_id: r.quizId,
      title: r.title,
      accuracy: r.total ? Math.round((r.correct / r.total) * 100) : 0,
      date: r.lastDate,
    }));

  return items;
}

async function getStudyStreak(userId, days = 14) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  const tasks = await prisma.tasks.findMany({
    where: {
      status: 'complete',
      completed_at: { gte: start, lte: end },
      plan: { goal: { user_id: userId } },
    },
    select: { completed_at: true, plan: { select: { date: true } } },
  });

  const doneDays = new Set(tasks.map(t => toISODate(new Date(t.completed_at || t.plan?.date || new Date()))));
  const daysArr = [];
  let currentStreak = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(end.getDate() - (days - 1 - i));
    const key = toISODate(d);
    const hasStudy = doneDays.has(key);
    daysArr.push({ date: key, hasStudy });
  }
  // Calculate streak up to today
  for (let i = daysArr.length - 1; i >= 0; i--) {
    if (daysArr[i].hasStudy) currentStreak++;
    else break;
  }
  return { days: daysArr, currentStreak };
}

async function getSummary(userId) {
  const [overview, monthlyTaskCompletion, dailyStudyTime, quizPerformance, streak] = await Promise.all([
    getOverview(userId),
    getMonthlyTaskCompletion(userId, 6),
    getDailyStudyTime(userId, 7),
    getQuizPerformance(userId, 5),
    getStudyStreak(userId, 14),
  ]);
  return { overview, monthlyTaskCompletion, dailyStudyTime, quizPerformance, streak };
}

module.exports = {
  getOverview,
  getMonthlyTaskCompletion,
  getDailyStudyTime,
  getQuizPerformance,
  getStudyStreak,
  getSummary,
};
