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


