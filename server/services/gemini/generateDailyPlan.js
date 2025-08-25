const { genAI } = require('./client');

async function generateDailyPlan(goal, userPreferences = {}, targetDate) {
  const dateObj = targetDate ? new Date(targetDate) : new Date();
  const yyyy = dateObj.getUTCFullYear();
  const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getUTCDate()).padStart(2, '0');
  const isoDate = `${yyyy}-${mm}-${dd}`;
  const prefs = userPreferences || {};

  const prompt = `You are an expert study planner... SPECIFIC DATE: ${isoDate}.`;

  const tryModel = async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const response = await result.response;
    let text = '';
    try { text = response.text(); } catch { text = response?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''; }
    let planData;
    try { planData = JSON.parse(text); }
    catch { const m = text.match(/\{[\s\S]*\}/); if (!m) throw new Error('AI did not return valid JSON'); planData = JSON.parse(m[0]); }
    planData.date = isoDate;
    return planData;
  };

  try {
    try { return await tryModel('gemini-2.0-flash'); }
    catch { return await tryModel('gemini-1.5-flash'); }
  } catch (e) {
    console.error('generateDailyPlan error:', e?.message || e);
    throw new Error('Failed to generate daily plan');
  }
}

module.exports = { generateDailyPlan };
