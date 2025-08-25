const { genAI } = require('./client');

async function generateFullTimelinePlans(goal, userPreferences = {}) {
  const dateToISO = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  const prefs = userPreferences || {};
  const startISO = dateToISO(new Date(goal.start_date));
  const endISO = dateToISO(new Date(goal.end_date));
  const prompt = `You are an AI study planner generator inside a full-stack web app...`;

  const tryModel = async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } });
    const response = await result.response;
    let text = '';
    try { text = response.text(); } catch { text = response?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''; }
    try { return JSON.parse(text); }
    catch { const m = text.match(/\{[\s\S]*\}/); if (!m) throw new Error('AI did not return valid JSON'); return JSON.parse(m[0]); }
  };

  try {
    try { return await tryModel('gemini-2.0-flash'); }
    catch { return await tryModel('gemini-1.5-flash'); }
  } catch (e) {
    console.error('generateFullTimelinePlans error:', e?.message || e);
    throw new Error('Failed to generate full timeline plan');
  }
}

module.exports = { generateFullTimelinePlans };
