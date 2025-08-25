const prisma = require('../db');
const { upsertFromUserTasks } = require('../services/progressWriteService');

async function recomputeProgress(req, res, next) {
  try {
    const { userId } = req.params;
    const result = await upsertFromUserTasks(userId);
    const row = await prisma.progress.findUnique({ where: { user_id: userId } });
    res.json({ progress: row, aggregates: result });
  } catch (err) {
    next(err);
  }
}

async function getProgressRow(req, res, next) {
  try {
    const { userId } = req.params;
    const row = await prisma.progress.findUnique({ where: { user_id: userId } });
    if (!row) return res.status(404).json({ message: 'No progress row for user' });
    res.json({ progress: row });
  } catch (err) {
    next(err);
  }
}

module.exports = { recomputeProgress, getProgressRow };
