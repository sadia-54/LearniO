const dailyPlanService = require('../services/dailyPlanService');

exports.getDailyPlansByGoalId = async (req, res) => {
  try {
    const { goalId } = req.params;
    const dailyPlans = await dailyPlanService.getDailyPlansByGoalId(goalId);
    res.status(200).json({ plans: dailyPlans });
  } catch (error) {
    console.error('Error fetching daily plans:', error);
    res.status(500).json({ error: 'Failed to fetch daily plans' });
  }
};

exports.getUserPlansByDate = async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query; // YYYY-MM-DD optional, defaults to today
    const plans = await dailyPlanService.getUserPlansByDate(userId, date);
    res.status(200).json({ plans });
  } catch (error) {
    console.error('Error fetching user plans by date:', error);
    res.status(500).json({ error: 'Failed to fetch user plans for date' });
  }
};

exports.generateDailyPlan = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { user_id } = req.body; // Get user_id from request body
    const { date } = req.query; // optional target date YYYY-MM-DD
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const generatedPlan = await dailyPlanService.generateAndSaveDailyPlan(goalId, user_id, date);
    res.status(201).json({ 
      message: 'Daily plan generated successfully',
      plan: generatedPlan 
    });
  } catch (error) {
    console.error('Error generating daily plan:', error);
    res.status(500).json({ error: 'Failed to generate daily plan' });
  }
};

exports.generateRange = async (req, res) => {
  try {
    const { goalId } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    const summary = await dailyPlanService.generatePlansForGoalRange(goalId, user_id);
    res.status(201).json({ message: 'Range generation complete', summary });
  } catch (error) {
    console.error('Error generating range:', error);
    res.status(500).json({ error: 'Failed to generate plans for range' });
  }
};

exports.getTodayPlan = async (req, res) => {
  try {
    const { goalId } = req.params;
    const todayPlan = await dailyPlanService.getTodayPlan(goalId);
    
    if (!todayPlan) {
      return res.status(404).json({ message: 'No plan found for today' });
    }
    
    res.status(200).json({ plan: todayPlan });
  } catch (error) {
    console.error('Error fetching today\'s plan:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s plan' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    
    if (!status || !['incomplete', 'complete', 'skipped'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' });
    }
    
    const updatedTask = await dailyPlanService.updateTaskStatus(taskId, status);
    res.status(200).json({ task: updatedTask });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
};

exports.createDailyPlan = async (req, res) => {
  try {
    const planData = req.body;
    const newPlan = await dailyPlanService.createDailyPlan(planData);
    res.status(201).json({ plan: newPlan });
  } catch (error) {
    console.error('Error creating daily plan:', error);
    res.status(500).json({ error: 'Failed to create daily plan' });
  }
};

exports.getTasksByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query; // optional: incomplete|complete|skipped
    const tasks = await dailyPlanService.getTasksByUser(userId, status);
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};
