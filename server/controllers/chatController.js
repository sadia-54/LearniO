const { getSummary } = require('../services/progressService');
const { generateChatFromMetrics } = require('../services/geminiService');

async function chatWithAI(req, res, next) {
  try {
    const { userId } = req.params;
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Prompt is required' });
    const metrics = await getSummary(userId);
    const { answer } = await generateChatFromMetrics(prompt, metrics);
    res.json({ answer });
  } catch (err) {
    next(err);
  }
}

module.exports = { chatWithAI };
