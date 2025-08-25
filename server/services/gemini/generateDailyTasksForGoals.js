const { genAI } = require('./client');

async function generateDailyTasksForGoals(goals) {
  const list = Array.isArray(goals) ? goals.filter(Boolean) : [goals].filter(Boolean);
  if (list.length === 0) throw new Error('No goals provided');
  const prompt = `You are an AI assistant that creates actionable daily tasks...\n${list.map((g,i)=>`${i+1}. ${g}`).join('\n')}`;

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
    console.error('generateDailyTasksForGoals error:', e?.message || e);
    throw new Error('Failed to generate daily tasks for goals');
  }
}

module.exports = { generateDailyTasksForGoals };
