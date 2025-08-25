const { generateForUser, listForUser } = require('../services/recommendationService');

async function generateRecommendations(req, res, next) {
  try {
    const { userId } = req.params;
    const items = await generateForUser(userId);
    res.json({ recommendations: items });
  } catch (err) {
    next(err);
  }
}

async function getRecommendations(req, res, next) {
  try {
    const { userId } = req.params;
    const items = await listForUser(userId, Number(req.query.limit) || 20);
    res.json({ recommendations: items });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateRecommendations, getRecommendations };
