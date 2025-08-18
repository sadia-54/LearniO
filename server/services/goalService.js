const prisma = require('../db');

async function createGoal(goalData) {
  const newGoal = await prisma.studyGoals.create({
    data: {
      title: goalData.title,
      description: goalData.description,
      difficulty_level: goalData.difficulty_level.toLowerCase(),
      start_date: new Date(goalData.start_date),
      end_date: new Date(goalData.end_date),
      user: { connect: { user_id: goalData.user_id } },
    },
  });
  return newGoal;
}

async function getGoalsByUserId(userId) {
  const goals = await prisma.studyGoals.findMany({
    where: {
      user_id: userId,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return goals;
}

async function updateGoal(goalId, updateData) {
  const updatedGoal = await prisma.studyGoals.update({
    where: { goal_id: goalId },
    data: {
      title: updateData.title,
      description: updateData.description,
      difficulty_level: updateData.difficulty_level?.toLowerCase(),
      start_date: updateData.start_date ? new Date(updateData.start_date) : undefined,
      end_date: updateData.end_date ? new Date(updateData.end_date) : undefined,
    },
  });
  return updatedGoal;
}

async function deleteGoal(goalId) {
  // Delete dependent records in a transaction to satisfy FK constraints
  await prisma.$transaction(async (tx) => {
    // Gather all task IDs under this goal via related plans
    const tasks = await tx.tasks.findMany({
      where: { plan: { goal: { goal_id: goalId } } },
      select: { task_id: true },
    });
    const taskIds = tasks.map(t => t.task_id);

    if (taskIds.length > 0) {
      // Answers -> Questions -> Quizzes linked to these tasks
      await tx.answers.deleteMany({ where: { question: { quiz: { task_id: { in: taskIds } } } } });
      await tx.questions.deleteMany({ where: { quiz: { task_id: { in: taskIds } } } });
      await tx.quizzes.deleteMany({ where: { task_id: { in: taskIds } } });
      // Notifications and AIRecommendations that reference these tasks
      await tx.notifications.deleteMany({ where: { task_id: { in: taskIds } } });
      await tx.aIRecommendations.deleteMany({ where: { task_id: { in: taskIds } } });
      // Finally, delete the tasks
      await tx.tasks.deleteMany({ where: { task_id: { in: taskIds } } });
    }

    // Delete plans for this goal
    await tx.dailyPlans.deleteMany({ where: { goal_id: goalId } });

    // Delete the goal itself
    await tx.studyGoals.delete({ where: { goal_id: goalId } });
  });

  return { success: true };
}

module.exports = { createGoal, getGoalsByUserId, updateGoal, deleteGoal };
