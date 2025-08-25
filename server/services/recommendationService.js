const prisma = require('../db');
const { getSummary } = require('./progressService');
const { generateFeedbackRecommendations } = require('./geminiService');

/**
 * Create AI recommendations for a user by summarizing recent performance and asking Gemini.
 * Persists results in AIRecommendations and returns the saved items.
 */
async function generateForUser(userId) {
  // Gather metrics used in progress page
  const metrics = await getSummary(userId);

  // Ask Gemini
  const ai = await generateFeedbackRecommendations(metrics);
  const items = ai.recommendations || [];

  // Persist recommendations
  const created = await Promise.all(
    items.map((r) =>
      prisma.aIRecommendations.create({
        data: {
          user_id: userId,
          recommendation_text: r.text,
          recommendation_type: r.type,
        },
      })
    )
  );
  return created;
}

/** Fetch recent recommendations for a user. */
async function listForUser(userId, limit = 20) {
  return prisma.aIRecommendations.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

module.exports = { generateForUser, listForUser };
