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

module.exports = { createGoal };
