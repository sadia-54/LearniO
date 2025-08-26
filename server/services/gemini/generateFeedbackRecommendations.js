const { genAI } = require('./client');

/**
 * Generate AI feedback and recommendations from user performance metrics.
 * Expects a compact JSON metrics object with keys like:
 * { overview, monthlyTaskCompletion, dailyStudyTime, quizPerformance, streak }
 * Returns: { recommendations: [{ title, text, type }] }
 */
async function generateFeedbackRecommendations(metrics) {
  const safe = metrics || {};
  const prompt = `You are an educational coach. Based on the student's recent performance metrics, produce 4-8 short, actionable recommendations.

PERFORMANCE METRICS (JSON):
${JSON.stringify(safe, null, 2)}

Guidelines:
- Keep each recommendation practical and specific to the metrics.
- Balance motivation with realism; avoid judgmental tone.
- Map each item to one of these types: "revise", "advance", "slow_down", "repeat_easy". Choose the best fit.
- Prefer short titles (max ~6 words) and concise text (1-2 sentences).

Output JSON ONLY with this exact shape:
{
  "recommendations": [
    { "title": "...", "text": "...", "type": "revise|advance|slow_down|repeat_easy" }
  ]
}`;

  const tryModel = async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    const response = await result.response;
    let text = '';
    try { text = response.text(); }
    catch { text = response?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''; }
    let data;
    try { data = JSON.parse(text); }
    catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI did not return valid JSON');
      data = JSON.parse(jsonMatch[0]);
    }
    const list = Array.isArray(data.recommendations) ? data.recommendations : [];
    // sanitize and cap length
    const allowed = new Set(['revise', 'advance', 'slow_down', 'repeat_easy']);
    const cleaned = list.slice(0, 8).map((r) => ({
      title: String(r.title || 'Recommendation'),
      text: String(r.text || r.recommendation_text || ''),
      type: allowed.has(String(r.type)) ? String(r.type) : 'revise',
    }));
    return { recommendations: cleaned };
  };

  try {
    try {
      console.log('[Gemini] Generating recommendations (2.0-flash)');
      return await tryModel('gemini-2.0-flash');
    } catch (e) {
      console.warn('[Gemini] 2.0-flash failed, fallback to 1.5-flash:', e?.message || e);
      return await tryModel('gemini-1.5-flash');
    }
  } catch (err) {
    console.error('Error generating recommendations with Gemini:', err?.message || err);
    throw new Error('Failed to generate recommendations');
  }
}

module.exports = { generateFeedbackRecommendations };
