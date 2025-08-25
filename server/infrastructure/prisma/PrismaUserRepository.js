const prisma = require('../../db');
const { UserRepository } = require('../../application/repositories/UserRepository');

class PrismaUserRepository extends UserRepository {
  async deleteUserDeep(userId) {
    return prisma.$transaction(async (tx) => {
      await tx.aIRecommendations.deleteMany({ where: { user_id: userId } });
      await tx.notifications.deleteMany({ where: { user_id: userId } });
      await tx.answers.deleteMany({ where: { user_id: userId } });
      await tx.progress.deleteMany({ where: { user_id: userId } });
      await tx.settings.deleteMany({ where: { user_id: userId } });
      await tx.achievements.deleteMany({ where: { user_id: userId } });

      const goals = await tx.studyGoals.findMany({ where: { user_id: userId }, select: { goal_id: true } });
      const goalIds = goals.map(g => g.goal_id);
      if (goalIds.length) {
        const plans = await tx.dailyPlans.findMany({ where: { goal_id: { in: goalIds } }, select: { plan_id: true } });
        const planIds = plans.map(p => p.plan_id);
        if (planIds.length) {
          const tasks = await tx.tasks.findMany({ where: { plan_id: { in: planIds } }, select: { task_id: true } });
          const taskIds = tasks.map(t => t.task_id);
          if (taskIds.length) {
            const quizzes = await tx.quizzes.findMany({ where: { task_id: { in: taskIds } }, select: { quiz_id: true } });
            const quizIds = quizzes.map(q => q.quiz_id);
            if (quizIds.length) {
              await tx.questions.deleteMany({ where: { quiz_id: { in: quizIds } } });
              await tx.quizzes.deleteMany({ where: { quiz_id: { in: quizIds } } });
            }
            await tx.notifications.deleteMany({ where: { task_id: { in: taskIds } } });
            await tx.aIRecommendations.deleteMany({ where: { task_id: { in: taskIds } } });
            await tx.tasks.deleteMany({ where: { task_id: { in: taskIds } } });
          }
          await tx.dailyPlans.deleteMany({ where: { plan_id: { in: planIds } } });
        }
        await tx.studyGoals.deleteMany({ where: { goal_id: { in: goalIds } } });
      }

      await tx.users.delete({ where: { user_id: userId } });
      return { ok: true };
    });
  }
}

module.exports = { PrismaUserRepository };
