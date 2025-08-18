import { generateDailyPlan } from "../services/aiService.js";
import { prisma } from "../database/index.js";

export async function createDailyPlans(req, res) {
  const { goal_id } = req.params;

  // Fetch goal info
  const goal = await prisma.studyGoals.findUnique({ where: { goal_id: goal_id } });
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  // Call Gemini AI
  const aiPlan = await generateDailyPlan(goal.title, goal.difficulty_level, goal.start_date.toISOString(), goal.end_date.toISOString());

  // Create DailyPlans and Tasks
  for (let i = 0; i < aiPlan.length; i++) {
    const date = new Date(goal.start_date);
    date.setDate(date.getDate() + i);

    const dailyPlan = await prisma.dailyPlans.create({
      data: {
        goal_id: goal.goal_id,
        date,
        status: "pending",
      }
    });

    for (let task of aiPlan[i].tasks) {
      await prisma.tasks.create({
        data: {
          plan_id: dailyPlan.plan_id,
          type: task.type,
          title: task.title,
          description: task.description,
          estimated_duration: task.estimated_duration
        }
      });
    }
  }

  res.json({ message: "Daily plans and tasks created successfully." });
}
