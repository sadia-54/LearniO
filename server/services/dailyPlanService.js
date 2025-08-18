const prisma = require('../db');
const { generateDailyPlan, generateFullTimelinePlans } = require('./geminiService');

async function getDailyPlansByGoalId(goalId) {
  const dailyPlans = await prisma.dailyPlans.findMany({
    where: {
      goal_id: goalId,
    },
    include: {
      tasks: {
        select: {
          task_id: true,
          title: true,
          description: true,
          type: true,
          estimated_duration: true,
          resource_url: true,
          status: true,
          completed_at: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
  return dailyPlans;
}

async function getUserPlansByDate(userId, targetDate) {
  const dateObj = targetDate ? new Date(targetDate) : new Date();
  const start = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
  const next = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate() + 1));

  const plans = await prisma.dailyPlans.findMany({
    where: {
      date: { gte: start, lt: next },
      goal: { user_id: userId },
    },
    include: {
      tasks: {
        select: {
          task_id: true,
          title: true,
          description: true,
          type: true,
          estimated_duration: true,
          resource_url: true,
          status: true,
          completed_at: true,
        },
      },
      goal: {
        select: { goal_id: true, title: true },
      },
    },
    orderBy: [{ date: 'asc' }, { created_at: 'asc' }],
  });

  return plans;
}

async function generateAndSaveDailyPlan(goalId, userId, targetDate) {
  try {
    // Get the goal details
    const goal = await prisma.studyGoals.findUnique({
      where: { goal_id: goalId },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Get user preferences
    const userSettings = await prisma.settings.findUnique({
      where: { user_id: userId },
    });

    // Determine date to generate
    const dateToGenerate = targetDate ? new Date(targetDate) : new Date();

    // Check if a plan already exists for this date to avoid duplicates
    const existing = await prisma.dailyPlans.findFirst({
      where: {
        goal_id: goalId,
        date: {
          gte: new Date(Date.UTC(dateToGenerate.getUTCFullYear(), dateToGenerate.getUTCMonth(), dateToGenerate.getUTCDate())),
          lt: new Date(Date.UTC(dateToGenerate.getUTCFullYear(), dateToGenerate.getUTCMonth(), dateToGenerate.getUTCDate() + 1)),
        },
      },
    });
    if (existing) {
      // Return existing with tasks included
      const withTasks = await prisma.dailyPlans.findUnique({
        where: { plan_id: existing.plan_id },
        include: { tasks: true },
      });
      return { plan: withTasks, tasks: withTasks?.tasks || [], timeBlocks: [] };
    }

    // Generate daily plan using Gemini AI for a specific date
    const aiGeneratedPlan = await generateDailyPlan(goal, userSettings, dateToGenerate);

    // Create the daily plan in the database
    const dailyPlan = await prisma.dailyPlans.create({
      data: {
        goal_id: goalId,
        date: new Date(aiGeneratedPlan.date),
    status: 'pending',
      },
    });

  // Create tasks for the plan
    // Create tasks for the plan (safe parsing)
    const tasks = [];
    const timeBlocks = Array.isArray(aiGeneratedPlan.timeBlocks) ? aiGeneratedPlan.timeBlocks : [];
    for (const timeBlock of timeBlocks) {
      const blockTasks = Array.isArray(timeBlock.tasks) ? timeBlock.tasks : [];
      for (const taskData of blockTasks) {
        try {
          const rawType = (taskData.type || '').toString().toLowerCase();
          const safeType = ['reading', 'video', 'quiz', 'custom'].includes(rawType) ? rawType : 'custom';
          let duration = taskData.estimated_duration;
          if (typeof duration === 'string') {
            duration = parseInt(duration.replace(/[^0-9]/g, ''), 10);
          }
          if (!Number.isFinite(duration)) duration = 60;
          duration = Math.max(15, Math.min(180, duration));

          const title = (taskData.title || 'Study Task').toString().slice(0, 200);
          const description = taskData.description ? taskData.description.toString() : null;
          const resourceUrl = taskData.resource_url ? taskData.resource_url.toString() : null;

          const task = await prisma.tasks.create({
            data: {
              plan_id: dailyPlan.plan_id,
              title,
              description,
              type: safeType,
              estimated_duration: duration,
              resource_url: resourceUrl,
              status: 'incomplete',
            },
          });
          tasks.push(task);
        } catch (taskErr) {
          console.warn('Skipping invalid task from AI:', taskErr?.message);
        }
      }
    }

  // Recalc and persist plan status after creating tasks
  try { await recalcPlanStatus(dailyPlan.plan_id); } catch {}

  // Return the complete plan with tasks
  return { plan: dailyPlan, tasks: tasks, timeBlocks: aiGeneratedPlan.timeBlocks };
  } catch (error) {
  console.error('Error generating and saving daily plan:', error?.message || error);
    throw error;
  }
}

/**
 * Generate plans for every date in a goal's range (inclusive of both ends).
 * Skips dates with existing plans. Returns summary counts.
 */
async function generatePlansForGoalRange(goalId, userId) {
  const goal = await prisma.studyGoals.findUnique({ where: { goal_id: goalId } });
  if (!goal) throw new Error('Goal not found');

  const start = new Date(goal.start_date);
  const end = new Date(goal.end_date);

  // Normalize to midnight UTC to avoid TZ drift
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  let created = 0;
  let skipped = 0;
  const createdPlanIds = [];

  while (cursor <= endUTC) {
    try {
      const { plan } = await generateAndSaveDailyPlan(goalId, userId, cursor);
      if (plan?.plan_id) {
        created += 1; createdPlanIds.push(plan.plan_id);
      } else {
        skipped += 1;
      }
    } catch (e) {
      // If duplicate or any error for a given day, move on
      skipped += 1;
      console.warn('Skipping day due to error:', cursor.toISOString().slice(0,10), e?.message);
    }
    // next day (UTC)
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1));
  }

  return { created, skipped, createdPlanIds };
}

async function createDailyPlan(planData) {
  const newPlan = await prisma.dailyPlans.create({
    data: {
      goal_id: planData.goal_id,
      date: new Date(planData.date),
      status: planData.status || 'pending',
    },
  });
  return newPlan;
}

async function recalcPlanStatus(planId) {
  // Fetch all tasks for the plan
  const tasks = await prisma.tasks.findMany({
    where: { plan_id: planId },
    select: { status: true },
  });

  let newStatus = 'pending';
  if (tasks.length > 0) {
    const incompleteCount = tasks.filter(t => t.status === 'incomplete').length;
    if (incompleteCount === 0) newStatus = 'done';
    else if (incompleteCount === tasks.length) newStatus = 'pending';
    else newStatus = 'in_progress';
  }

  await prisma.dailyPlans.update({ where: { plan_id: planId }, data: { status: newStatus } });
  return newStatus;
}

async function updateTaskStatus(taskId, status) {
  const updatedTask = await prisma.tasks.update({
    where: { task_id: taskId },
    data: {
      status: status,
      completed_at: status === 'complete' ? new Date() : null,
    },
    select: { task_id: true, plan_id: true, status: true, completed_at: true, title: true, description: true, type: true, estimated_duration: true, resource_url: true },
  });

  // Recalculate parent plan status
  try {
    await recalcPlanStatus(updatedTask.plan_id);
  } catch (e) {
    console.warn('Failed to recalc plan status for plan', updatedTask.plan_id, e?.message || e);
  }

  return updatedTask;
}

async function getTodayPlan(goalId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayPlan = await prisma.dailyPlans.findFirst({
    where: {
      goal_id: goalId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      tasks: {
        select: {
          task_id: true,
          title: true,
          description: true,
          estimated_duration: true,
          resource_url: true,
          status: true,
          completed_at: true,
        },
      },
    },
  });

  return todayPlan;
}

// Fetch all tasks for a user across all goals (optional status filter)
async function getTasksByUser(userId, status) {
  const whereClause = {
    plan: { goal: { user_id: userId } },
    ...(status ? { status } : {}),
  };

  const tasks = await prisma.tasks.findMany({
    where: whereClause,
    include: {
      plan: {
        select: {
          plan_id: true,
          date: true,
          goal: { select: { goal_id: true, title: true } },
        },
      },
    },
    orderBy: [
      { plan: { date: 'desc' } },
      { title: 'asc' },
    ],
  });

  return tasks;
}

module.exports = { 
  getDailyPlansByGoalId, 
  getUserPlansByDate,
  createDailyPlan, 
  generateAndSaveDailyPlan,
  generatePlansForGoalRange,
  updateTaskStatus,
  getTodayPlan,
  getTasksByUser,
};

/**
 * Optional: Generate and persist all daily plans in one AI call.
 * Returns a summary of created/updated counts.
 */
async function generateAndSaveFullTimeline(goalId, userId) {
  const goal = await prisma.studyGoals.findUnique({ where: { goal_id: goalId } });
  if (!goal) throw new Error('Goal not found');
  const userSettings = await prisma.settings.findUnique({ where: { user_id: userId } });

  const ai = await generateFullTimelinePlans(goal, userSettings);
  if (!ai || ai.goal_id !== goalId || !Array.isArray(ai.dailyPlans)) {
    throw new Error('AI did not return expected timeline structure');
  }

  let created = 0, updated = 0, tasksCreated = 0;

  for (const day of ai.dailyPlans) {
    const dateObj = new Date(day.date);
    const start = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
    const next = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate() + 1));

    // upsert plan for the date
    const existing = await prisma.dailyPlans.findFirst({
      where: { goal_id: goalId, date: { gte: start, lt: next } },
    });
    let plan;
    if (existing) {
      plan = existing;
      updated += 1;
      // clear existing tasks to replace with AI tasks
      await prisma.tasks.deleteMany({ where: { plan_id: existing.plan_id } });
    } else {
      plan = await prisma.dailyPlans.create({ data: { goal_id: goalId, date: start, status: 'pending' } });
      created += 1;
    }

    const tasks = Array.isArray(day.tasks) ? day.tasks : [];
    for (const t of tasks) {
      const title = (t.task_title || t.title || 'Study Task').toString().slice(0, 200);
      const description = t.description ? t.description.toString() : null;
      let duration = t.duration;
      if (typeof duration === 'string') duration = parseInt(duration.replace(/[^0-9]/g, ''), 10);
      if (!Number.isFinite(duration)) duration = 60;
      duration = Math.max(30, Math.min(120, duration));
      const resource = t.resource ? t.resource.toString() : null;

      // Map resource to TaskType
      const raw = (t.type || '').toString().toLowerCase();
      let type = 'custom';
      if (/video|lecture/.test(resource || '') || raw === 'video') type = 'video';
      else if (/quiz|test/.test(resource || '') || raw === 'quiz') type = 'quiz';
      else if (/book|text|read/.test(resource || '') || raw === 'reading') type = 'reading';

      await prisma.tasks.create({
        data: {
          plan_id: plan.plan_id,
          title,
          description,
          type,
          estimated_duration: duration,
          resource_url: null,
          status: 'incomplete',
        },
      });
      tasksCreated += 1;
    }

  // Recalc status for this plan after tasks are created
  try { await recalcPlanStatus(plan.plan_id); } catch {}
  }

  return { created, updated, tasksCreated };
}

module.exports.generateAndSaveFullTimeline = generateAndSaveFullTimeline;
