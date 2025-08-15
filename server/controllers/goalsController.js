const goalsService = require('../services/goalService');

exports.createGoal = async (req, res) => {
  try {
    const goalData = req.body;

    // Expect user_id to be sent explicitly by frontend
    if (!goalData.user_id) {
      return res.status(400).json({ error: "User ID required" });
    }

    const newGoal = await goalsService.createGoal(goalData);
    res.status(201).json(newGoal);
  } catch (error) {
    console.error("Failed to create goal:", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
};

exports.getGoalsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const goals = await goalsService.getGoalsByUserId(userId);
    res.status(200).json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const updateData = req.body;
    
    const updatedGoal = await goalsService.updateGoal(goalId, updateData);
    res.status(200).json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    
    await goalsService.deleteGoal(goalId);
    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};


