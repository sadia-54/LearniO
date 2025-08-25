const prisma = require('../db');

function toISODate(d) {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return dt.toISOString().slice(0, 10);
}

async function computeCurrentStreak(userId) {
  // Build a set of dates (YYYY-MM-DD) where the user completed at least one task
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 60); // look back up to 60 days to compute a realistic streak
  const tasks = await prisma.tasks.findMany({
    where: {
      status: 'complete',
      completed_at: { gte: start, lte: end },
      plan: { goal: { user_id: userId } },
    },
    select: { completed_at: true, plan: { select: { date: true } } },
  });

  const daySet = new Set(
    tasks.map((t) => toISODate(new Date(t.completed_at || t.plan?.date || new Date())))
  );

  // Count contiguous days backwards from today
  let streak = 0;
  let cursor = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
  while (streak < 365) { // hard cap
    const key = toISODate(cursor);
    if (daySet.has(key)) {
      streak += 1;
      cursor = new Date(Date.UTC(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1));
    } else {
      break;
    }
  }

  // lastActive is the latest date in the set (if any)
  let lastActiveDate = null;
  for (const k of daySet.values()) {
    const d = new Date(k);
    if (!lastActiveDate || d > lastActiveDate) lastActiveDate = d;
  }

  return { currentStreak: streak, lastActiveDate };
}

async function upsertFromUserTasks(userId) {
  // Aggregate totals from current tasks
  const [completedAgg, skippedAgg] = await Promise.all([
    prisma.tasks.aggregate({
      _sum: { estimated_duration: true },
      _count: { _all: true },
      where: { status: 'complete', plan: { goal: { user_id: userId } } },
    }),
    prisma.tasks.aggregate({
      _count: { _all: true },
      where: { status: 'skipped', plan: { goal: { user_id: userId } } },
    }),
  ]);

  const totalTasksCompleted = completedAgg._count?._all || 0;
  const totalTimeSpent = completedAgg._sum?.estimated_duration || 0;
  const totalTasksSkipped = skippedAgg._count?._all || 0;

  const { currentStreak, lastActiveDate } = await computeCurrentStreak(userId);

  // Upsert Progress row
  const existing = await prisma.progress.findUnique({ where: { user_id: userId } });
  if (existing) {
    await prisma.progress.update({
      where: { user_id: userId },
      data: {
        total_tasks_completed: totalTasksCompleted,
        total_tasks_skipped: totalTasksSkipped,
        total_time_spent: totalTimeSpent,
        current_streak: currentStreak,
        last_active_date: lastActiveDate,
      },
    });
  } else {
    await prisma.progress.create({
      data: {
        user_id: userId,
        total_tasks_completed: totalTasksCompleted,
        total_tasks_skipped: totalTasksSkipped,
        total_time_spent: totalTimeSpent,
        current_streak: currentStreak,
        last_active_date: lastActiveDate,
      },
    });
  }

  return { totalTasksCompleted, totalTasksSkipped, totalTimeSpent, currentStreak, lastActiveDate };
}

module.exports = {
  upsertFromUserTasks,
  computeCurrentStreak,
};
