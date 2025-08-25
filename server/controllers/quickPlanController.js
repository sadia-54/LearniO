const { generateDailyTasksForGoals } = require('../services/gemini/generateDailyTasksForGoals');

async function generateQuickPlans(req, res) {
  try {
    const { goals } = req.body; // string | string[]
    const data = await generateDailyTasksForGoals(goals);

    // Normalize to exact shape { plans: [{ goal, dailyTasks: string[] }] }
    const plans = Array.isArray(data?.plans) ? data.plans : [];
    const normalized = plans.map(p => ({
      goal: (p.goal || '').toString(),
      dailyTasks: Array.isArray(p.dailyTasks) ? p.dailyTasks.map(t => t.toString()) : [],
    })).filter(p => p.goal && p.dailyTasks.length >= 1);

  return res.status(200).json({ plans: normalized });
  } catch (err) {
    console.error('quick plans error:', err?.message || err);
    res.status(500).json({ error: 'Failed to generate quick plans' });
  }
}

module.exports = { generateQuickPlans };
