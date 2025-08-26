const { genAI } = require('./client');

/**
 * Generate a conversational response for the user given their performance metrics and a user prompt.
 * Returns: { answer: string }
 */
async function generateChatFromMetrics(userPrompt, metrics) {
  const safePrompt = String(userPrompt || '').slice(0, 4000);
  const safeMetrics = metrics || {};
  const prompt = `You are a supportive study coach and data analyst.
Use the student's performance metrics to answer their request below. Be concise, specific, and actionable.

STUDENT METRICS (JSON):
${JSON.stringify(safeMetrics, null, 2)}

USER REQUEST:
"""
${safePrompt}
"""

Guidelines:
- Personalize advice using concrete numbers where possible (e.g., completion rate, avg minutes/day).
- Offer 3-5 bullet recommendations or a brief report section when appropriate.
- Keep tone encouraging and non-judgmental.
- If metrics are missing, give general best practices and invite them to complete tasks/quizzes.

Return plain text or simple Markdown only.`;

  const tryModel = async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'text/plain' }
    });
    const response = await result.response;
    let text = '';
    try { text = response.text(); }
    catch { text = response?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''; }
    return { answer: text || 'Sorry, I could not generate a response.' };
  };

  try {
    try {
      console.log('[Gemini] Chat (2.0-flash)');
      return await tryModel('gemini-2.0-flash');
    } catch (e) {
      console.warn('[Gemini] Chat fallback 1.5-flash:', e?.message || e);
      return await tryModel('gemini-1.5-flash');
    }
  } catch (err) {
    console.error('Error generating chat with Gemini:', err?.message || err);
    throw new Error('Failed to generate chat response');
  }
}

module.exports = { generateChatFromMetrics };
