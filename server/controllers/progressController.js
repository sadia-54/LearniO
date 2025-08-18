const { getSummary } = require('../services/progressService');

async function getUserProgressSummary(req, res, next) {
  try {
    const { userId } = req.params;
    const data = await getSummary(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getUserProgressSummary };
