const { genAI } = require('./client');

async function generateChatFromMetrics(userPrompt, metrics) {
  const safePrompt = String(userPrompt || '').slice(0, 4000);
  const safeMetrics = metrics || {};
  const prompt = `You are a supportive study coach and data analyst...`;

  const tryModel = async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'text/plain' } });
    const response = await result.response;
    let text = '';
    try { text = response.text(); } catch { text = response?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''; }
    return { answer: text || 'Sorry, I could not generate a response.' };
  };

  try {
    try { return await tryModel('gemini-2.0-flash'); }
    catch { return await tryModel('gemini-1.5-flash'); }
  } catch (e) {
    console.error('generateChatFromMetrics error:', e?.message || e);
    throw new Error('Failed to generate chat response');
  }
}

module.exports = { generateChatFromMetrics };
