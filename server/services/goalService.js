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
  await prisma.studyGoals.delete({
    where: { goal_id: goalId },
  });
  return { success: true };
}

module.exports = { createGoal, getGoalsByUserId, updateGoal, deleteGoal };
