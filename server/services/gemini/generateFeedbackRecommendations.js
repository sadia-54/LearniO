const { genAI } = require('./client');

async function generateFeedbackRecommendations(metrics) {
  const safe = metrics || {};
  const prompt = `You are an educational coach...`;

  const tryModel = async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } });
    const response = await result.response;
    let text = '';
    try { text = response.text(); } catch { text = response?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''; }
    let data;
    try { data = JSON.parse(text); }
    catch { const m = text.match(/\{[\s\S]*\}/); if (!m) throw new Error('AI did not return valid JSON'); data = JSON.parse(m[0]); }
    const list = Array.isArray(data.recommendations) ? data.recommendations : [];
    const allowed = new Set(['revise','advance','slow_down','repeat_easy']);
    const cleaned = list.slice(0,8).map(r => ({
      title: String(r.title || 'Recommendation'),
      text: String(r.text || r.recommendation_text || ''),
      type: allowed.has(String(r.type)) ? String(r.type) : 'revise',
    }));
    return { recommendations: cleaned };
  };

  try {
    try { return await tryModel('gemini-2.0-flash'); }
    catch { return await tryModel('gemini-1.5-flash'); }
  } catch (e) {
    console.error('generateFeedbackRecommendations error:', e?.message || e);
    throw new Error('Failed to generate recommendations');
  }
}

module.exports = { generateFeedbackRecommendations };
